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
            __html: `(function(){try{var key='isotrack-theme';var saved=localStorage.getItem(key);var theme=saved==='light'||saved==='dark'||saved==='system'?saved:'system';var dark=theme==='dark'||(theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',dark);document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=dark?'dark':'light'}catch(e){document.documentElement.classList.add('dark');document.documentElement.dataset.theme='system';document.documentElement.style.colorScheme='dark'}})();`,
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
