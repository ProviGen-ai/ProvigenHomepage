import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-env';
import ProseDoc from '@/components/ProseDoc';
import { privacy } from '@/content/pages/legal';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'How ProviGenAI Inc. handles personal data on this website.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <ProseDoc eyebrow="Legal" doc={privacy} />
  );
}
