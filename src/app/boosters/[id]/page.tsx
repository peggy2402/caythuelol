import { redirect } from 'next/navigation';

export default async function BoosterProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const clean = decodeURIComponent(id || '').replace(/^@+/, '');
  redirect(clean ? `/b/${clean}` : '/boosters');
}
