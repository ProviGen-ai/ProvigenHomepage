import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/site-env';
import { plain } from '@/components/Html';
import UseCasePage from '@/components/UseCasePage';
import { antibodyDiscovery as page } from '@/content/use-cases';
import '@/app/writings/writings.css';

export const metadata: Metadata = pageMetadata({
  title: plain(page.title),
  description: page.dek,
  path: page.path,
  type: 'article',
  // No share card of its own yet: the site's card (lib/site-env.ts) stands in.
});

export default function AntibodyDiscoveryPage() {
  return <UseCasePage page={page} />;
}
