import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ReduxProvider from "@/src/components/providers/ReduxProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "insydr - AI-Powered Chatbots for Your Website",
  description: "Create and integrate intelligent AI chatbots into your website in minutes. No coding required.",
  keywords: ["AI chatbot", "website chatbot", "customer support", "AI assistant"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=Shadows+Into+Light&family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
        <Toaster position="top-center" reverseOrder={false} />
      </body>
    </html>
  );
}
