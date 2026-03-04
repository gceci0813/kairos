import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAIROS — Decision Intelligence Platform",
  description: "Know When. Act First. AI-powered geopolitical decision intelligence for elite decision makers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
