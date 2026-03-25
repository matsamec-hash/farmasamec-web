'use client';

import { useState } from 'react';
import type { Farm } from './ExportyClientPage';
import { Download, FileText, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  farms: Farm[];
  selectedFarmId: string | null;
  pendingEphCount: number;
  pendingIzrCount: number;
  currentYear: number;
}

export function ExportPanel({ farms, selectedFarmId, pendingEphCount, pendingIzrCount, currentYear }: Props) {
  const [ephYear, setEphYear] = useState(currentYear.toString());
  const [ephLoading, setEphLoading] = useState(false);
  const [izrLoading, setIzrLoading] = useState(false);

  function buildUrl(path: string, params: Record<string, string | undefined>) {
    const url = new URL(path, window.location.origin);
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) url.searchParams.set(k, v); });
    return url.toString();
  }

  async function downloadFile(url: string, setLoading: (v: boolean) => void) {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        alert(`Chyba exportu: ${res.statusText}`);
        return;
      }
      const disposition = res.headers.get('content-disposition') ?? '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? 'export';
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert('Chyba při stahování exportu.');
    } finally {
      setLoading(false);
    }
  }

  const farmParam: Record<string, string | undefined> = selectedFarmId ? { farmId: selectedFarmId } : {};

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <p>
          Exporty jsou určeny pro ruční nahrání na{' '}
          <strong>Portal farmáře (eAGRI/SZIF)</strong>. EPH XML pro postřiky/hnojení,
          IZR TXT pro pohyby zvířat do registru ČMSCH.
        </p>
      </div>

      {/* EPH Export */}
      <ExportCard
        icon="🌱"
        title="EPH — Evidence přípravků a hnojiv"
        subtitle="XML soubor pro Portal farmáře / SZIF"
        badge={pendingEphCount > 0 ? `${pendingEphCount} neexportovaných operací` : 'Vše exportováno'}
        badgeColor={pendingEphCount > 0 ? 'amber' : 'green'}
        note="MEDIUM CONFIDENCE: Ověřte XML tagy vůči aktuálnímu formátu Portal farmáře před odevzdáním."
      >
        <div className="flex items-center gap-3 mt-3">
          <select
            value={ephYear}
            onChange={(e) => setEphYear(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7c9a6e]/30"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={() => downloadFile(
              buildUrl('/api/export/eph', { ...farmParam, year: ephYear }),
              setEphLoading,
            )}
            disabled={ephLoading}
            className="flex items-center gap-2 bg-[#7c9a6e] hover:bg-[#6a8860] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {ephLoading ? 'Generuji…' : 'Stáhnout EPH XML'}
          </button>
        </div>
      </ExportCard>

      {/* IZR Export */}
      <ExportCard
        icon="🐄"
        title="IZR — Hlášení pohybů zvířat"
        subtitle="Fixed-width TXT soubor pro ČMSCH / Portal farmáře"
        badge={pendingIzrCount > 0 ? `${pendingIzrCount} nenahlášených pohybů` : 'Vše nahlášeno'}
        badgeColor={pendingIzrCount > 0 ? 'amber' : 'green'}
        note="MEDIUM CONFIDENCE: Ověřte pozice polí vůči ČMSCH metodice (ueskot@cmsch.cz) před odevzdáním."
      >
        <div className="mt-3">
          <button
            onClick={() => downloadFile(
              buildUrl('/api/export/izr', farmParam),
              setIzrLoading,
            )}
            disabled={izrLoading}
            className="flex items-center gap-2 bg-[#7c9a6e] hover:bg-[#6a8860] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            {izrLoading ? 'Generuji…' : 'Stáhnout IZR TXT'}
          </button>
        </div>
      </ExportCard>

      {/* Farm selector reminder */}
      {!selectedFarmId && farms.length > 1 && (
        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          <p>Exportujete data ze všech farem dohromady. Vyberte konkrétní farmu pro oddělené exporty.</p>
        </div>
      )}
    </div>
  );
}

function ExportCard({
  icon, title, subtitle, badge, badgeColor, note, children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: 'amber' | 'green';
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        <span className={cn(
          'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0',
          badgeColor === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700',
        )}>
          {badgeColor === 'green' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
          {badge}
        </span>
      </div>

      {children}

      <div className="flex items-start gap-1.5 mt-3 text-xs text-gray-400 border-t border-gray-100 pt-3">
        <FileText size={12} className="flex-shrink-0 mt-0.5" />
        <p>{note}</p>
      </div>
    </div>
  );
}
