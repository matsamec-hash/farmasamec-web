'use client';

import { useState, useMemo } from 'react';
import type { Animal, Herd, Farm } from './types';
import { SPECIES_ICONS, SEX_LABELS, CATEGORY_LABELS } from './types';
import { cn } from '@/lib/utils';

interface Props {
  animals: Animal[];
  herds: Herd[];
  farms: Farm[];
}

export function AnimalTable({ animals, herds, farms }: Props) {
  const [search, setSearch] = useState('');

  const herdMap = useMemo(() => Object.fromEntries(herds.map((h) => [h.id, h])), [herds]);
  const farmMap = useMemo(() => Object.fromEntries(farms.map((f) => [f.id, f])), [farms]);

  const filtered = useMemo(() => {
    if (!search.trim()) return animals;
    const q = search.toLowerCase();
    return animals.filter(
      (a) =>
        a.ear_tag.toLowerCase().includes(q) ||
        (a.breed?.toLowerCase().includes(q)) ||
        (a.stall?.toLowerCase().includes(q)) ||
        (herdMap[a.herd_id ?? '']?.name.toLowerCase().includes(q)),
    );
  }, [animals, search, herdMap]);

  function calcAge(birthDate: string | null): string {
    if (!birthDate) return '—';
    const birth = new Date(birthDate);
    const now = new Date();
    const months =
      (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 3) return `${Math.max(0, Math.round((now.getTime() - birth.getTime()) / 86400000))} dní`;
    if (months < 24) return `${months} měs.`;
    return `${(months / 12).toFixed(1)} let`;
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Hledat ušní číslo, stáj, stádo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30 focus:border-[#7c9a6e]"
        />
      </div>

      <div className="rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Ušní číslo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Druh / Pohlaví</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Stádo</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Stáj</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Kategorie</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Věk</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Farma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((animal) => {
                const herd = herdMap[animal.herd_id ?? ''];
                const farm = farmMap[animal.farm_id];
                const isEcoAnimal = !!animal.eco_since;

                return (
                  <tr key={animal.id} className="hover:bg-gray-50 transition-colors">
                    {/* Ear tag */}
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-gray-800 text-sm">{animal.ear_tag}</p>
                      {isEcoAnimal && (
                        <span className="text-[10px] text-green-600 font-medium">EKO</span>
                      )}
                    </td>

                    {/* Species / sex */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span>{SPECIES_ICONS[animal.species]}</span>
                        <div>
                          <p className="text-gray-700 text-xs">{SEX_LABELS[animal.sex]}</p>
                          {animal.breed && (
                            <p className="text-xs text-gray-400">{animal.breed}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Herd */}
                    <td className="px-4 py-3 text-gray-700">
                      {herd ? (
                        <span className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5 text-xs">
                          {SPECIES_ICONS[herd.species]} {herd.name}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Stall */}
                    <td className="px-4 py-3 text-gray-600 text-sm">
                      {animal.stall ?? <span className="text-gray-300">—</span>}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {animal.category
                        ? (CATEGORY_LABELS[animal.category] ?? animal.category)
                        : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Age */}
                    <td className="px-4 py-3 text-right text-gray-600 tabular-nums text-sm">
                      {calcAge(animal.birth_date)}
                    </td>

                    {/* Farm */}
                    <td className="px-4 py-3">
                      {farm ? (
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: farm.color }}
                        >
                          {farm.name}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            Žádná zvířata neodpovídají hledání.
          </div>
        )}
      </div>
    </div>
  );
}
