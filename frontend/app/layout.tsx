import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Fieldnote — AI Meeting Summarizer",
  description: "AI-powered transcription and meeting intelligence for faster, clearer follow-through.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-paper text-ink">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
