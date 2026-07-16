import type { Metadata } from "next";
import "./globals.css";
import { SecureDataProvider } from "@/context/SecureDataContext";
import React from "react";

export const metadata: Metadata = {
  title: "ReadyNest Analytics Engine",
  description: "Secure Zero-Trust Multi-Tenant Analytics Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress common inspect and development options for Client Shielding
              if (typeof window !== 'undefined') {
                // Disable Right-Click Context Menu
                document.addEventListener('contextmenu', (e) => {
                  e.preventDefault();
                });

                // Disable Keyboard Shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U)
                document.addEventListener('keydown', (e) => {
                  if (
                    e.key === 'F12' ||
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                    (e.ctrlKey && e.key === 'u')
                  ) {
                    e.preventDefault();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <SecureDataProvider>
          {children}
        </SecureDataProvider>
      </body>
    </html>
  );
}
