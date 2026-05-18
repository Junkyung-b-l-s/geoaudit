import { getAudit } from '@/lib/audit-store';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ auditId: string }> }
) {
  const { auditId } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let lastStage = '';
      let lastProgress = -1;

      for (let i = 0; i < 600; i++) { // Max 10 minutes (600 × 1s)
        const audit = getAudit(auditId);

        if (!audit) {
          send({ error: 'Audit not found' });
          controller.close();
          return;
        }

        if (audit.stage !== lastStage || audit.progress !== lastProgress) {
          send({
            stage: audit.stage,
            progress: audit.progress,
            message: audit.message,
          });
          lastStage = audit.stage;
          lastProgress = audit.progress;
        }

        if (audit.stage === 'done') {
          send({ stage: 'done', progress: 100, message: '완료', reportReady: true });
          controller.close();
          return;
        }

        if (audit.stage === 'error') {
          send({ stage: 'error', error: audit.error });
          controller.close();
          return;
        }

        await new Promise((r) => setTimeout(r, 1000));
      }

      send({ error: 'Timeout' });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
