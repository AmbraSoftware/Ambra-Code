import CanteenDetailsClient from './CanteenDetailsClient';

// Generate static params for dynamic route export
export async function generateStaticParams(): Promise<{ id: string }[]> {
  return [];
}

export default function CanteenDetailsPage() {
  return <CanteenDetailsClient />;
}
