'use client';

import { useCallback, useState } from 'react';
import { KatastrSearch } from './KatastrSearch';
import { KatastrMap } from './KatastrMap';
import { KatastrInfoPanel } from './KatastrInfoPanel';
import type { ParcelInfo } from '@/lib/katastr';

export function KatastrClientPage() {
  const [selectedParcel, setSelectedParcel] = useState<ParcelInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearchResult = useCallback((parcel: ParcelInfo) => {
    setSelectedParcel(parcel);
  }, []);

  const handleMapClick = useCallback((parcel: ParcelInfo) => {
    setSelectedParcel(parcel);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-0.5">Katastr nemovitostí</h1>
        <p className="text-sm text-gray-500">
          Vyhledejte parcelu nebo klikněte na mapu
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-4">
        <KatastrSearch onResult={handleSearchResult} onLoading={setLoading} />
      </div>

      {/* Map + Info panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <KatastrMap
            onParcelClick={handleMapClick}
            onLoading={setLoading}
            highlightGeometry={selectedParcel?.geometry ?? null}
          />
        </div>
        <div>
          <KatastrInfoPanel parcel={selectedParcel} loading={loading} />
        </div>
      </div>
    </div>
  );
}
