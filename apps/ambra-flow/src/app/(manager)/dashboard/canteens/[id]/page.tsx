import CanteenDetailsClient from './CanteenDetailsClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [{ id: 'placeholder' }];
}

export default function CanteenDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return <CanteenDetailsClient />;
}
