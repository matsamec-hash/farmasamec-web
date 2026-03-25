'use client';

import { useState, useMemo } from 'react';
import type { Farm, Herd, Animal, ReproEvent, Species } from './types';
import { SPECIES_ICONS, SPECIES_LABELS } from './types';
import { AnimalTable } from './AnimalTable';
import { CalvingCalendar } from './CalvingCalendar';
import { cn } from '@/lib/utils';
import { CalendarDays } from 'lucide-react';

type Tab = 'list' | 'calendar';

interface Props {
  farms: Farm[];
  herds: Herd[];
  animals: Animal[];
  upcomingCalvings: ReproEvent[];
}

export function ZvirataClientPage({ farms, herds, animals, upcomingCalvings }: Props) {
  const [tab, setTab] = useState<Tab>('list');
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [speciesFilter, setSpeciesFilter] = useState<Species | null>(null);

  const filteredAnimals = useMemo(() => {
    let result = animals;
    if (selectedFarmId) result = result.filter((a) => a.farm_id === selectedFarmId);
    if (speciesFilter) result = result.filter((a) => a.species === speciesFilter);
    return result;
  }, [animals, selectedFarmId, speciesFilter]);

  const filteredCalvings = useMemo(() => {
    if (!selectedFarmId) return upcomingCalvings;
    return upcomingCalvings.filter((c) => c.farm_id === selectedFarmId);
  }, [upcomingCalvings, selectedFarmId]);

  const cattleCount = useMemo(
    () => animals.filter((a) => a.species === 'cattle' && (!selectedFarmId || a.farm_id === selectedFarmId)).length,
    [animals, selectedFarmId],
  );
  const sheepCount = useMemo(
    () => animals.filter((a) => a.species === 'sheep' && (!selectedFarmId || a.farm_id === selectedFarmId)).length,
    [animals, selectedFarmId],
  );

  // Calvings in next 30 days
  const urgentCalvings = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return filteredCalvings.filter(
      (c) => c.expected_calving_date && c.expected_calving_date <= cutoffStr,
    ).length;
  }, [filteredCalvings]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-0.5">Zvířata</h1>
          <p className="text-sm text-gray-500">
            {cattleCount > 0 && `${cattleCount} skotu`}
            {cattleCount > 0 && sheepCount > 0 && ' · '}
            {sheepCount > 0 && `${sheepCount} ovcí`}
            {cattleCount === 0 && sheepCount === 0 && 'Žádná aktivní zvířata'}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab('list')}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            Seznam
          </button>
          <button
            onClick={() => setTab('calendar')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === 'calendar' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            <CalendarDays size={14} />
            Reprodukce
            {urgentCalvings > 0 && (
              <span className="bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 py-0 min-w-[18px] text-center">
                {urgentCalvings}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters row */}
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
                style={selectedFarmId === farm.id ? { backgroundColor: farm.color, borderColor: farm.color } : {}}
              >
                {farm.name}
              </button>
            ))}
          </div>
        )}

        {/* Species filter */}
        <div className="flex gap-1.5">
          {(['cattle', 'sheep'] as Species[]).map((s) => (
            <button
              key={s}
              onClick={() => setSpeciesFilter(speciesFilter === s ? null : s)}
              className={cn(
                'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                speciesFilter === s
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
              )}
            >
              {SPECIES_ICONS[s]} {SPECIES_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {animals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
          Žádná aktivní zvířata. Data synchronizujte přes mobilní appku.
        </div>
      ) : tab === 'list' ? (
        <AnimalTable animals={filteredAnimals} herds={herds} farms={farms} />
      ) : (
        <CalvingCalendar upcomingCalvings={filteredCalvings} animals={animals} farms={farms} />
      )}
    </div>
  );
}
