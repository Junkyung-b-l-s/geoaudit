import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function askClaude(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const block = response.content[0];
  if (block.type === 'text') return block.text;
  return '';
}

export async function askClaudeJson<T>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  const text = await askClaude(
    systemPrompt + '\n\nRespond ONLY with valid JSON, no markdown.',
    userPrompt
  );

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('LLM did not return valid JSON');
  return JSON.parse(jsonMatch[0]);
}
