import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hệ thống Quản lý Trường học",
  description: "School Management System - Quản lý trường học, giáo viên, học sinh",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`h-full antialiased ${beVietnamPro.variable}`}
    >
      <body className={`min-h-full flex flex-col ${beVietnamPro.className}`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
