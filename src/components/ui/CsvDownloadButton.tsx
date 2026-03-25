'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  dataset: 'parcely' | 'operace' | 'zvirata';
  farmId?: string | null;
  year?: string | number;
  label?: string;
  className?: string;
}

export function CsvDownloadButton({ dataset, farmId, year, label, className }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const url = new URL('/api/export/csv', window.location.origin);
      url.searchParams.set('dataset', dataset);
      if (farmId) url.searchParams.set('farmId', farmId);
      if (year) url.searchParams.set('year', String(year));

      const res = await fetch(url.toString());
      if (!res.ok) { alert('Chyba při exportu.'); return; }
      const disposition = res.headers.get('content-disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `${dataset}.csv`;
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert('Chyba při stahování.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-50',
        className,
      )}
    >
      <Download size={14} />
      {loading ? 'Exportuji…' : (label ?? 'CSV')}
    </button>
  );
}
