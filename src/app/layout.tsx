import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IsoTrack — Isotretinoin Treatment Calculator",
  description: "Plan isotretinoin treatment and track cumulative dose progress with clear target estimates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var key='isotrack-theme';var saved=localStorage.getItem(key);var theme=saved==='dark'?'dark':'light';document.documentElement.classList.toggle('dark',theme==='dark');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme}catch(e){document.documentElement.classList.remove('dark');document.documentElement.dataset.theme='light';document.documentElement.style.colorScheme='light'}})();`,
          }}
        />
      </head>
      <body
        className={`${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
