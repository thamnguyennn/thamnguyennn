import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = { title: 'Khởi Phúc Việt Movia – Hồ sơ bệnh án', icons: { icon: '/logo.jpg' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body>{children}</body></html>;
}
