import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "../lib/context/language-context";

export const metadata: Metadata = {
  title: "StoryScale - AI-Powered Content Studio",
  description: "Professional content in under 15 seconds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
