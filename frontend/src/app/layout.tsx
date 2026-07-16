import type { Metadata } from "next";
import "./globals.css";
import React from "react";
import { ClientShellWrapper } from "./ClientShellWrapper";

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

                // Disable Keyboard Shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Cmd+Opt+I)
                document.addEventListener('keydown', (e) => {
                  if (
                    e.key === 'F12' ||
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                    (e.ctrlKey && e.key === 'u') ||
                    (e.metaKey && e.altKey && e.key === 'I')
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
        <ClientShellWrapper>{children}</ClientShellWrapper>
      </body>
    </html>
  );
}
