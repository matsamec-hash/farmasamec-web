'use client';

import { useState, useMemo } from 'react';
import { FinancePrehled } from './FinancePrehled';
import { ExportPanel } from './ExportPanel';
import { cn } from '@/lib/utils';
import { BarChart3, Download } from 'lucide-react';

type Tab = 'finance' | 'exporty';

export interface Farm {
  id: string;
  name: string;
  color: string;
  is_eco: boolean;
}

export interface FinanceEntry {
  id: string;
  farm_id: string;
  entry_type: 'expense' | 'income' | 'subsidy';
  category: string;
  amount: number;
  date: string;
  business_unit: string;
  description: string | null;
}

interface Props {
  farms: Farm[];
  financeEntries: FinanceEntry[];
  pendingEphCount: number;
  pendingIzrCount: number;
  currentYear: number;
}

export function ExportyClientPage({
  farms,
  financeEntries,
  pendingEphCount,
  pendingIzrCount,
  currentYear,
}: Props) {
  const [tab, setTab] = useState<Tab>('finance');
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  const filteredEntries = useMemo(
    () => (selectedFarmId ? financeEntries.filter((e) => e.farm_id === selectedFarmId) : financeEntries),
    [financeEntries, selectedFarmId],
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-0.5">Finance & Exporty</h1>
          <p className="text-sm text-gray-500">Rok {currentYear}</p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab('finance')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === 'finance' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <BarChart3 size={14} />
            Finance
          </button>
          <button
            onClick={() => setTab('exporty')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === 'exporty' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <Download size={14} />
            Exporty
            {(pendingEphCount > 0 || pendingIzrCount > 0) && (
              <span className="bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 py-0 min-w-[18px] text-center">
                {pendingEphCount + pendingIzrCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Farm filter */}
      {farms.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
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
              style={selectedFarmId === farm.id ? { backgroundColor: farm.color, borderColor: farm.color } : {}}
            >
              {farm.name}
            </button>
          ))}
        </div>
      )}

      {tab === 'finance' ? (
        <FinancePrehled entries={filteredEntries} farms={farms} selectedFarmId={selectedFarmId} />
      ) : (
        <ExportPanel
          farms={farms}
          selectedFarmId={selectedFarmId}
          pendingEphCount={pendingEphCount}
          pendingIzrCount={pendingIzrCount}
          currentYear={currentYear}
        />
      )}
    </div>
  );
}
