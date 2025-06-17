import { Toaster } from '@/components/ui/sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import PlausibleProvider from 'next-plausible';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'T3 Chat Cloneathon',
  description:
    'Build an open source clone of T3 Chat and compete for over $10,000 in prizes.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
  height: 'device-height',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var isDark = html.classList.contains('dark');
    meta.setAttribute('content', isDark ? '${DARK_THEME_COLOR}' : '${LIGHT_THEME_COLOR}');
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PlausibleProvider domain="cloneathon.t3.gg">
      <Analytics />

      <html
        lang="en"
        // `next-themes` injects an extra classname to the body element to avoid
        // visual flicker before hydration. Hence the `suppressHydrationWarning`
        // prop is necessary to avoid the React hydration mismatch warning.
        // https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
        suppressHydrationWarning
        className={`${geist.variable} ${geistMono.variable} h-full`}
      >
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: THEME_COLOR_SCRIPT,
            }}
          />
          {/* <Script
          src="//unpkg.com/react-scan/dist/auto.global.js"
          strategy="beforeInteractive"
        /> */}
        </head>
        <body className="antialiased h-full">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Toaster position="top-right" richColors />
            <SessionProvider
              refetchInterval={5 * 60} // Refetch every 5 minutes instead of default
              refetchOnWindowFocus={false} // Don't refetch on window focus
            >
              {children}
            </SessionProvider>
          </ThemeProvider>
        </body>
      </html>
    </PlausibleProvider>
  );
}
