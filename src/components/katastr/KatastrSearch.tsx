'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { KuResult, ParcelInfo } from '@/lib/katastr';

interface Props {
  onResult: (parcel: ParcelInfo) => void;
  onLoading: (loading: boolean) => void;
}

export function KatastrSearch({ onResult, onLoading }: Props) {
  const [kuQuery, setKuQuery] = useState('');
  const [kuResults, setKuResults] = useState<KuResult[]>([]);
  const [selectedKu, setSelectedKu] = useState<KuResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [parcelNumber, setParcelNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced KÚ search
  useEffect(() => {
    if (selectedKu || kuQuery.length < 2) {
      setKuResults([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/katastr/ku-search?q=${encodeURIComponent(kuQuery)}`);
      if (!res.ok) return;
      const data = await res.json();
      setKuResults(data.results ?? []);
      setShowDropdown(true);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [kuQuery, selectedKu]);

  const selectKu = useCallback((ku: KuResult) => {
    setSelectedKu(ku);
    setKuQuery(`${ku.kuName} (${ku.obec})`);
    setShowDropdown(false);
    setError(null);
  }, []);

  const clearKu = useCallback(() => {
    setSelectedKu(null);
    setKuQuery('');
    setKuResults([]);
    setError(null);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!selectedKu) {
      setError('Vyberte katastrální území');
      return;
    }
    if (!parcelNumber.trim()) {
      setError('Zadejte číslo parcely');
      return;
    }

    setError(null);
    onLoading(true);

    const res = await fetch(
      `/api/katastr/parcel-search?ku=${encodeURIComponent(selectedKu.kuCode)}&parcela=${encodeURIComponent(parcelNumber.trim())}`,
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Chyba serveru' }));
      setError(data.error ?? 'Parcela nenalezena');
      onLoading(false);
      return;
    }

    const parcel: ParcelInfo = await res.json();
    if (!parcel.kuName && selectedKu.kuName) {
      parcel.kuName = selectedKu.kuName;
    }
    onResult(parcel);
    onLoading(false);
  }, [selectedKu, parcelNumber, onResult, onLoading]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* KÚ autocomplete */}
      <div className="relative flex-1 min-w-[220px]" ref={dropdownRef}>
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Katastrální území
        </label>
        <input
          type="text"
          value={kuQuery}
          onChange={(e) => {
            setKuQuery(e.target.value);
            if (selectedKu) clearKu();
          }}
          placeholder="Začněte psát název..."
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#7c9a6e] focus:ring-1 focus:ring-[#7c9a6e] outline-none"
        />
        {selectedKu && (
          <button
            onClick={clearKu}
            className="absolute right-2 top-[28px] text-gray-400 hover:text-gray-600 text-xs"
          >
            &times;
          </button>
        )}

        {showDropdown && kuResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-auto">
            {kuResults.map((ku) => (
              <button
                key={ku.kuCode}
                onClick={() => selectKu(ku)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
              >
                <span className="font-medium text-gray-800">{ku.kuName}</span>
                <span className="text-gray-400 ml-1.5">({ku.obec})</span>
                <span className="text-gray-300 text-xs ml-1.5">{ku.kuCode}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Parcel number */}
      <div className="w-[140px]">
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Číslo parcely
        </label>
        <input
          type="text"
          value={parcelNumber}
          onChange={(e) => setParcelNumber(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="např. 123/4"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#7c9a6e] focus:ring-1 focus:ring-[#7c9a6e] outline-none"
        />
      </div>

      {/* Search button */}
      <button
        onClick={handleSearch}
        className="inline-flex items-center gap-1.5 rounded-lg bg-[#7c9a6e] px-4 py-2 text-sm font-medium text-white hover:bg-[#6b8a5e] transition-colors"
      >
        <Search size={15} />
        Hledat
      </button>

      {/* Error */}
      {error && (
        <p className="w-full text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}
