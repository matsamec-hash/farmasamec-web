'use client';

import { useState, useMemo } from 'react';
import { ParcelsMap } from './ParcelsMap';
import { ParcelsTable } from './ParcelsTable';
import { Badge } from '@/components/ui/badge';
import { Map, Table2, Download } from 'lucide-react';
import { CsvDownloadButton } from '@/components/ui/CsvDownloadButton';
import { cn } from '@/lib/utils';

export interface Farm {
  id: string;
  name: string;
  color: string;
  is_eco: boolean;
}

export interface Parcel {
  id: string;
  farm_id: string;
  field_id: string | null;
  lpis_code: string | null;
  nazev: string | null;
  kultura: string | null;
  vymera: number | null;
  bpej: string | null;
  is_in_nvz: boolean;
  current_crop: string | null;
  geometry_json: string;
  eko: boolean | null;
  erozohro: string | null;
  svazitost: number | null;
  vyska: number | null;
}

type ViewMode = 'table' | 'map';

interface Props {
  farms: Farm[];
  parcels: Parcel[];
}

export function ParcelsClientPage({ farms, parcels }: Props) {
  const [view, setView] = useState<ViewMode>('table');
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<string | null>(null);

  const filteredParcels = useMemo(
    () =>
      selectedFarmId ? parcels.filter((p) => p.farm_id === selectedFarmId) : parcels,
    [parcels, selectedFarmId],
  );

  const totalHa = useMemo(
    () => filteredParcels.reduce((sum, p) => sum + (p.vymera ?? 0), 0),
    [filteredParcels],
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-0.5">Pole & Parcely</h1>
          <p className="text-sm text-gray-500">
            {filteredParcels.length} parcel · {totalHa.toFixed(2)} ha celkem
          </p>
        </div>

        <div className="flex items-center gap-2">
        <CsvDownloadButton dataset="parcely" farmId={selectedFarmId} />
        {/* View toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('table')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              view === 'table'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <Table2 size={15} />
            Tabulka
          </button>
          <button
            onClick={() => setView('map')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              view === 'map'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <Map size={15} />
            Mapa
          </button>
        </div>
        </div>
      </div>

      {/* Farm filter chips */}
      {farms.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedFarmId(null)}
            className={cn(
              'px-3 py-1 rounded-full text-sm font-medium border transition-colors',
              selectedFarmId === null
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
            )}
          >
            Všechny farmy
          </button>
          {farms.map((farm) => (
            <button
              key={farm.id}
              onClick={() => setSelectedFarmId(farm.id === selectedFarmId ? null : farm.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border transition-colors',
                selectedFarmId === farm.id
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
              )}
              style={
                selectedFarmId === farm.id
                  ? { backgroundColor: farm.color, borderColor: farm.color }
                  : {}
              }
            >
              {farm.name}
              {farm.is_eco && (
                <Badge className="text-[10px] bg-green-100 text-green-700 border-0 px-1 py-0 ml-0.5">
                  EKO
                </Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {parcels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Žádné parcely nenalezeny. Importujte LPIS data přes mobilní appku.
        </div>
      ) : view === 'table' ? (
        <ParcelsTable
          parcels={filteredParcels}
          farms={farms}
          selectedParcelId={selectedParcelId}
          onSelectParcel={setSelectedParcelId}
        />
      ) : (
        <ParcelsMap
          parcels={filteredParcels}
          farms={farms}
          selectedParcelId={selectedParcelId}
          onSelectParcel={setSelectedParcelId}
        />
      )}
    </div>
  );
}
