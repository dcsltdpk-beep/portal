import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "DCS CRM", description: "Dream Cyber Security - 360 CRM portal" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
