import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PashuRakshak AI | 911 Animal Emergency CAD Platform",
  description: "Enterprise Emergency Operations & Multimodal AI Dispatch Infrastructure for Animal Welfare across Goa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
