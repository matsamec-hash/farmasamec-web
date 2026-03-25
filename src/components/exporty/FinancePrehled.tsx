'use client';

import { useMemo } from 'react';
import type { FinanceEntry, Farm } from './ExportyClientPage';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_LABELS: Record<string, string> = {
  phm: 'PHM',
  osiva: 'Osiva',
  hnojiva: 'Hnojiva',
  por: 'POR / Pesticidy',
  veterinar: 'Veterinář',
  prace: 'Práce',
  stroje_servis: 'Stroje & Servis',
  pojisteni: 'Pojištění',
  najmy: 'Nájmy & Pachty',
  krmiva: 'Krmiva',
  energie: 'Energie',
  doprava: 'Doprava',
  ostatni: 'Ostatní náklady',
  prodej_obilovin: 'Prodej obilovin',
  prodej_zvirat: 'Prodej zvířat',
  dotace: 'Dotace',
};

const BU_LABELS: Record<string, string> = {
  eko_plodiny: 'EKO plodiny',
  konv_plodiny: 'Konv. plodiny',
  pastva: 'Pastva',
  vykrm: 'Výkrm',
  ovce: 'Ovce',
  general: 'Obecné',
};

interface Props {
  entries: FinanceEntry[];
  farms: Farm[];
  selectedFarmId: string | null;
}

interface CategoryRow {
  category: string;
  amount: number;
}

export function FinancePrehled({ entries }: Props) {
  const totalIncome = useMemo(
    () => entries.filter((e) => e.entry_type === 'income' || e.entry_type === 'subsidy').reduce((s, e) => s + e.amount, 0),
    [entries],
  );
  const totalExpense = useMemo(
    () => entries.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + e.amount, 0),
    [entries],
  );
  const profit = totalIncome - totalExpense;

  // Top expense categories
  const expenseByCategory = useMemo<CategoryRow[]>(() => {
    const map: Record<string, number> = {};
    for (const e of entries) {
      if (e.entry_type !== 'expense') continue;
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [entries]);

  const incomeByCategory = useMemo<CategoryRow[]>(() => {
    const map: Record<string, number> = {};
    for (const e of entries) {
      if (e.entry_type === 'expense') continue;
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [entries]);

  // By business unit
  const byBu = useMemo<Record<string, { income: number; expense: number }>>(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    for (const e of entries) {
      if (!map[e.business_unit]) map[e.business_unit] = { income: 0, expense: 0 };
      if (e.entry_type === 'expense') {
        map[e.business_unit].expense += e.amount;
      } else {
        map[e.business_unit].income += e.amount;
      }
    }
    return map;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center text-sm text-gray-400">
        Žádné finanční záznamy. Data synchronizujte přes mobilní appku.
      </div>
    );
  }

  const maxExpense = Math.max(...expenseByCategory.map((r) => r.amount), 1);
  const maxIncome = Math.max(...incomeByCategory.map((r) => r.amount), 1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={<TrendingUp size={18} className="text-green-500" />}
          label="Příjmy & Dotace"
          value={totalIncome}
          color="green"
        />
        <SummaryCard
          icon={<TrendingDown size={18} className="text-red-500" />}
          label="Výdaje"
          value={totalExpense}
          color="red"
        />
        <SummaryCard
          icon={<Wallet size={18} className={profit >= 0 ? 'text-green-500' : 'text-red-500'} />}
          label="Výsledek hospodaření"
          value={profit}
          color={profit >= 0 ? 'green' : 'red'}
          signed
        />
      </div>

      {/* Business unit breakdown */}
      {Object.keys(byBu).length > 1 && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Hospodářský výsledek dle střediska</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Středisko</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Příjmy</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Výdaje</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Výsledek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {Object.entries(byBu).map(([bu, { income, expense }]) => {
                const result = income - expense;
                return (
                  <tr key={bu} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-800">
                      {BU_LABELS[bu] ?? bu}
                    </td>
                    <td className="px-4 py-2.5 text-right text-green-700 font-mono">
                      {fmtCzk(income)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-red-600 font-mono">
                      {fmtCzk(expense)}
                    </td>
                    <td className={cn('px-4 py-2.5 text-right font-mono font-semibold', result >= 0 ? 'text-green-700' : 'text-red-600')}>
                      {result >= 0 ? '+' : ''}{fmtCzk(result)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Expense & income bar charts side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryChart title="Náklady dle kategorie" rows={expenseByCategory} maxVal={maxExpense} barColor="bg-red-400" />
        <CategoryChart title="Příjmy dle kategorie" rows={incomeByCategory} maxVal={maxIncome} barColor="bg-green-400" />
      </div>

      {/* Recent entries */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Posledních 20 záznamů</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Datum</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Typ</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Kategorie</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Popis</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Částka (Kč)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.slice(0, 20).map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono text-gray-600">{e.date}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      e.entry_type === 'income' ? 'bg-green-100 text-green-700' :
                      e.entry_type === 'subsidy' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700',
                    )}>
                      {e.entry_type === 'income' ? 'Příjem' : e.entry_type === 'subsidy' ? 'Dotace' : 'Výdaj'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700 text-xs">{CATEGORY_LABELS[e.category] ?? e.category}</td>
                  <td className="px-4 py-2.5 text-gray-600 text-xs max-w-xs truncate">{e.description ?? '—'}</td>
                  <td className={cn('px-4 py-2.5 text-right font-mono font-semibold',
                    e.entry_type === 'expense' ? 'text-red-600' : 'text-green-700'
                  )}>
                    {e.entry_type === 'expense' ? '−' : '+'}{fmtCzk(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  icon, label, value, color, signed,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'green' | 'red';
  signed?: boolean;
}) {
  return (
    <div className={cn('rounded-xl border shadow-sm p-4', color === 'green' ? 'bg-white border-gray-100' : 'bg-white border-gray-100')}>
      <div className="mb-1">{icon}</div>
      <p className={cn('text-2xl font-bold font-mono', color === 'green' ? 'text-green-700' : 'text-red-600')}>
        {signed && value >= 0 ? '+' : ''}{fmtCzk(value)}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function CategoryChart({
  title, rows, maxVal, barColor,
}: {
  title: string;
  rows: { category: string; amount: number }[];
  maxVal: number;
  barColor: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        {rows.slice(0, 8).map(({ category, amount }) => (
          <div key={category}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-700">{CATEGORY_LABELS[category] ?? category}</span>
              <span className="text-xs font-mono text-gray-600">{fmtCzk(amount)}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', barColor)}
                style={{ width: `${(amount / maxVal) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="text-xs text-gray-400 py-2">Žádné záznamy</p>
        )}
      </div>
    </div>
  );
}

function fmtCzk(n: number): string {
  return Math.abs(n).toLocaleString('cs-CZ', { maximumFractionDigits: 0 }) + ' Kč';
}
