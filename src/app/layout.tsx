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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var cookies = document.cookie.split(";");
                  for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i].trim();
                    if (cookie.indexOf("next-auth.session-token") === 0 || cookie.indexOf("__Secure-next-auth.session-token") === 0) {
                      var eqPos = cookie.indexOf("=");
                      var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
                      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;";
                      document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=" + window.location.hostname + ";";
                    }
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`min-h-full flex flex-col ${beVietnamPro.className}`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
