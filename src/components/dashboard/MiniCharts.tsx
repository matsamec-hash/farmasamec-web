'use client';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface MonthlyBar { month: string; value: number; }

export function NBarChart({ data }: { data: MonthlyBar[] }) {
  if (!data.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        N aplikováno (kg) — posledních 6 měsíců
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(v) => [`${Number(v ?? 0).toFixed(0)} kg`, 'N']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill="#7c9a6e" fillOpacity={0.7 + (i / data.length) * 0.3} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PhmBarChart({ data }: { data: MonthlyBar[] }) {
  if (!data.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        PHM vydáno (l) — posledních 6 měsíců
      </p>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            formatter={(v) => [`${Number(v ?? 0).toFixed(0)} l`, 'PHM']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill="#3b82f6" fillOpacity={0.6 + (i / data.length) * 0.4} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
