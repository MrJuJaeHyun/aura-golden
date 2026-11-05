import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aura Golden - 주식계좌 및 배당금 종합 자산관리 시스템",
  description: "품격 있는 월말 주식계좌 자산 정산과 연간 배당금 관리 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="bg-aura-bg text-slate-100 antialiased selection:bg-aura-gold selection:text-black">
        {children}
      </body>
    </html>
  );
}
