import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import AppSidebar from "@/components/AppSidebar";
import AppHeader from "@/components/AppHeader";
import { SidebarProvider } from "@/contexts/SidebarContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter-loaded",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair-loaded",
  subsets: ["latin"],
  weight: "700",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Technical GEO Audit",
  description: "AI 인용 최적화를 위한 웹사이트 기술 환경 자동 진단",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="h-full">
        <SidebarProvider>
          <div className="flex w-full h-screen bg-page overflow-hidden">
            <Suspense>
              <AppSidebar />
            </Suspense>
            <div className="flex flex-col flex-1 h-full min-w-0">
              <Suspense>
                <AppHeader />
              </Suspense>
              <main id="main-scroll" className="flex-1 overflow-y-auto overflow-x-auto relative">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
