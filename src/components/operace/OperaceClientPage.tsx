'use client';

import { useState, useMemo } from 'react';
import type { Farm, FieldOperation, ParcelRef } from './types';
import { OperaceList } from './OperaceList';
import { OperaceNewForm } from './OperaceNewForm';
import { NBilanceDashboard } from './NBilanceDashboard';
import { Plus, BarChart3 } from 'lucide-react';
import { CsvDownloadButton } from '@/components/ui/CsvDownloadButton';
import { cn } from '@/lib/utils';

type Tab = 'list' | 'n-bilance';

interface Props {
  farms: Farm[];
  operations: FieldOperation[];
  parcels: ParcelRef[];
}

export function OperaceClientPage({ farms, operations: initialOps, parcels }: Props) {
  const [operations, setOperations] = useState<FieldOperation[]>(initialOps);
  const [tab, setTab] = useState<Tab>('list');
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  const filteredOps = useMemo(
    () => (selectedFarmId ? operations.filter((o) => o.farm_id === selectedFarmId) : operations),
    [operations, selectedFarmId],
  );

  const filteredParcels = useMemo(
    () => (selectedFarmId ? parcels.filter((p) => p.farm_id === selectedFarmId) : parcels),
    [parcels, selectedFarmId],
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-0.5">Operace na poli</h1>
          <p className="text-sm text-gray-500">{filteredOps.length} záznamů</p>
        </div>
        <div className="flex items-center gap-2">
          <CsvDownloadButton dataset="operace" farmId={selectedFarmId} year={new Date().getFullYear()} />
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 bg-[#7c9a6e] hover:bg-[#6a8860] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Nová operace
          </button>
        </div>
      </div>

      {/* Farm filter + tab switcher */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Farm chips */}
        {farms.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedFarmId(null)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
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
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
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
              </button>
            ))}
          </div>
        )}

        {/* Tab switcher */}
        <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === 'list'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Seznam
          </button>
          <button
            onClick={() => setTab('n-bilance')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === 'n-bilance'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <BarChart3 size={14} />
            N bilance
          </button>
        </div>
      </div>

      {/* Content */}
      {operations.length === 0 && !showNewForm ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Žádné operace. Přidejte první záznam nebo synchronizujte přes mobilní appku.
        </div>
      ) : tab === 'list' ? (
        <OperaceList operations={filteredOps} parcels={parcels} farms={farms} />
      ) : (
        <NBilanceDashboard
          operations={filteredOps}
          parcels={filteredParcels}
          farms={farms}
        />
      )}

      {/* New operation slide-in */}
      {showNewForm && (
        <OperaceNewForm
          farms={farms}
          parcels={parcels}
          onClose={() => setShowNewForm(false)}
          onSaved={(op) => {
            setOperations((prev) => [op, ...prev]);
            setShowNewForm(false);
          }}
        />
      )}
    </div>
  );
}
