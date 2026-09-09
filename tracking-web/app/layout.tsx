import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Track delivery',
  description: 'Delivery status tracker'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
