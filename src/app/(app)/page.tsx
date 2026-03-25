import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Load farms for this user
  const { data: memberships } = await supabase
    .from('farm_memberships')
    .select('farm_id, role')
    .eq('user_id', user!.id);

  const farmIds = memberships?.map((m) => m.farm_id) ?? [];

  const [farmsResult, parcelsCountResult] = await Promise.all([
    farmIds.length
      ? supabase.from('farms').select('*').in('id', farmIds)
      : { data: [] },
    farmIds.length
      ? supabase.from('parcels').select('id, vymera', { count: 'exact' }).in('farm_id', farmIds)
      : { data: [], count: 0 },
  ]);

  const farms = farmsResult.data;
  const parcelCount = parcelsCountResult.count ?? 0;
  const totalHa = (parcelsCountResult.data ?? []).reduce(
    (sum: number, p: { vymera: number | null }) => sum + (p.vymera ?? 0),
    0,
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Přehled</h1>
      <p className="text-sm text-gray-500 mb-6">Vítejte zpět, {user?.email}</p>

      {/* Farms */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Vaše farmy
        </h2>
        {!farms?.length ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
            Žádné farmy nenalezeny. Data synchronizujte přes mobilní appku.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms.map((farm: Record<string, unknown>) => (
              <div
                key={farm.id as string}
                className="rounded-xl bg-white border border-gray-100 shadow-sm p-4 flex items-center gap-3"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${farm.color as string}22` }}
                >
                  🌾
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {farm.name as string}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {farm.is_eco ? (
                      <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200 px-1.5 py-0">
                        EKO
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] bg-gray-100 text-gray-600 border-gray-200 px-1.5 py-0">
                        Konvenční
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick stats placeholder */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Rychlý přehled
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Parcely', value: parcelCount > 0 ? `${parcelCount}` : '—', icon: '🗺️', sub: parcelCount > 0 ? `${totalHa.toFixed(1)} ha` : undefined },
            { label: 'Zvířata', value: '—', icon: '🐄', sub: undefined },
            { label: 'Stroje', value: '—', icon: '🚜', sub: undefined },
            { label: 'Úkoly', value: '—', icon: '📋', sub: undefined },
          ].map(({ label, value, icon, sub }) => (
            <div
              key={label}
              className="rounded-xl bg-white border border-gray-100 shadow-sm p-4"
            >
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-xl font-bold text-gray-800">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
              {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
