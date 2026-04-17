'use client';

import { ExternalLink } from 'lucide-react';
import type { ParcelInfo } from '@/lib/katastr';
import { buildNahlizenUrl, formatArea } from '@/lib/katastr';

interface Props {
  parcel: ParcelInfo | null;
  loading: boolean;
}

export function KatastrInfoPanel({ parcel, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-2/3 rounded bg-gray-200" />
          <div className="h-3 w-1/2 rounded bg-gray-200" />
          <div className="h-3 w-1/3 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        Klikněte na parcelu v mapě nebo vyhledejte pomocí formuláře.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-gray-800">
          Parcela {parcel.parcelNumber}
        </h3>
        <p className="text-sm text-gray-500">
          {parcel.kuName}{parcel.kuName && parcel.kuCode ? ' — ' : ''}{parcel.kuCode}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-gray-400">Číslo parcely</dt>
        <dd className="text-gray-800 font-medium">{parcel.parcelNumber}</dd>

        <dt className="text-gray-400">Katastrální území</dt>
        <dd className="text-gray-800">{parcel.kuName || parcel.kuCode}</dd>

        <dt className="text-gray-400">Kód KÚ</dt>
        <dd className="text-gray-800 font-mono text-xs">{parcel.kuCode}</dd>

        {parcel.area != null && (
          <>
            <dt className="text-gray-400">Výměra</dt>
            <dd className="text-gray-800 font-medium">{formatArea(parcel.area)}</dd>
          </>
        )}
      </dl>

      <a
        href={buildNahlizenUrl(parcel.kuCode, parcel.parcelNumber)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#7c9a6e] px-4 py-2 text-sm font-medium text-white hover:bg-[#6b8a5e] transition-colors"
      >
        <ExternalLink size={14} />
        Zobrazit v Nahlížení do KN
      </a>
    </div>
  );
}
