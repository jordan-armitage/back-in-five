import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ServiceWorker from "@/app/components/ServiceWorker";

export const metadata: Metadata = {
  title: "Store Update",
  description: "Post a scrolling announcement banner for your store.",
  themeColor: "#0f766e"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0f766e" />
        <link rel="manifest" href="./manifest.json" />
        <link rel="icon" href="./icons/icon-192.png" />
        <link rel="apple-touch-icon" href="./icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen">
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
