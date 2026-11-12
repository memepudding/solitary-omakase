import type { Metadata } from 'next';
import './globals.css';
import {headers} from 'next/headers';
import {detectLocale} from '@/lib/locale';
import {LanguageProvider} from '@/components/Language';

async function requestLocale() {
  const h = await headers();
  const preference = h.get('cookie')?.match(/(?:^|;\s*)teepu-lang=(ko|en)(?:;|$)/)?.[1];
  return preference === 'ko' || preference === 'en' ? preference : detectLocale(h.get('x-vercel-ip-country'), h.get('accept-language'));
}
export async function generateMetadata(): Promise<Metadata> {
  const locale = await requestLocale();
  return {
    title: locale === 'ko' ? '고독한 오마카세 — Omakase for One' : 'Solitary Omakase — Omakase for One',
    description: locale === 'ko' ? '오늘의 마음을 한 끼로 내어드려요. 나만을 위한 조용한 밤의 작은 식당.' : 'A little restaurant for a quiet night. A meal inspired by your day.',
    robots: { index: false, follow: false },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await requestLocale();
  return <html lang={locale}><body><LanguageProvider initial={locale}>{children}</LanguageProvider></body></html>;
}
