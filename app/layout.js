import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Riviera Planner — Tanja & Oli',
  description: 'Unser gemeinsamer Lebens- und Gesundheitsplaner',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Riviera Planner" />
        <meta name="theme-color" content="#080F1E" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#080F1E' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
