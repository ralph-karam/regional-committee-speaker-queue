import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Regional Committee Speaker Queue",
  description: "Conference speaker queue management for Regional Committee meetings"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
