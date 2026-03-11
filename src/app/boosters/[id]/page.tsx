'use client';

import { use } from 'react';
import { useLanguage } from '@/lib/i18n';
import BoosterProfileView from '@/components/BoosterProfileView';

export default function BoosterProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BoosterProfileView id={id} />;
}