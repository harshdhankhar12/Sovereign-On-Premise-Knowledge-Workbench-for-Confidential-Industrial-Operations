import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sovereign Industrial Workbench | MRPL",
  description: "Confidential Industrial Operations AI & Engineering Workbench for Mangalore Refinery and Petrochemicals Limited",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full pt-10 min-w-8xl bg-slate-50 text-slate-900">
      <body className="min-h-full flex flex-col font-sans antialiased text-slate-800 bg-slate-50 selection:bg-slate-200">
        {children}
      </body>
    </html>
  );
}
