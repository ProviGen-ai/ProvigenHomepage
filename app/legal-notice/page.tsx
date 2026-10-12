import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-env';
import ProseDoc from '@/components/ProseDoc';
import { legalNotice } from '@/content/pages/legal';

export const metadata: Metadata = pageMetadata({
  title: 'Legal Notice',
  description: 'Provider information for the ProviGen website: ProviGenAI Inc., San Francisco.',
  path: '/legal-notice',
});

export default function LegalNoticePage() {
  return (
    <ProseDoc eyebrow="Legal" doc={legalNotice} />
  );
}
