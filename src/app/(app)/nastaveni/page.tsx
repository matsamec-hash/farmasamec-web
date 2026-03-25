import { createClient } from '@/lib/supabase/server';
import { NastaveniClientPage } from '@/components/nastaveni/NastaveniClientPage';

export default async function NastaveniPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('farm_memberships').select('farm_id, role').eq('user_id', user!.id);

  const farmIds = memberships?.map((m) => m.farm_id) ?? [];

  const [farmsResult, leasesResult, paymentsResult, auditsResult, auditItemsResult, deadlinesResult] = await Promise.all([
    farmIds.length ? supabase.from('farms').select('id, name, color, is_eco').in('id', farmIds) : { data: [] },
    farmIds.length
      ? supabase.from('lease_agreements')
          .select('id, farm_id, contract_number, landlord_name, landlord_ico, total_area_ha, start_date, end_date, annual_rent_czk, payment_due_month, payment_due_day, renewal_notice_days, terminated_at, notes')
          .in('farm_id', farmIds).order('end_date')
      : { data: [] },
    farmIds.length
      ? supabase.from('pacht_payments')
          .select('id, farm_id, lease_id, landlord_name, description, amount_czk, due_date, period_label, notes')
          .in('farm_id', farmIds).gte('due_date', new Date().toISOString().slice(0, 10)).order('due_date').limit(50)
      : { data: [] },
    farmIds.length
      ? supabase.from('compliance_audits')
          .select('id, farm_id, audit_date, status, notes').in('farm_id', farmIds).order('audit_date', { ascending: false }).limit(20)
      : { data: [] },
    farmIds.length
      ? supabase.from('compliance_audit_items')
          .select('id, audit_id, farm_id, dzes_standard, answer, note').in('farm_id', farmIds)
      : { data: [] },
    farmIds.length
      ? supabase.from('subsidy_deadlines')
          .select('id, farm_id, label, date, category, description').in('farm_id', farmIds)
          .gte('date', new Date().toISOString().slice(0, 10)).order('date').limit(30)
      : { data: [] },
  ]);

  return (
    <NastaveniClientPage
      farms={farmsResult.data ?? []}
      leases={leasesResult.data ?? []}
      upcomingPayments={paymentsResult.data ?? []}
      audits={auditsResult.data ?? []}
      auditItems={auditItemsResult.data ?? []}
      subsidyDeadlines={deadlinesResult.data ?? []}
    />
  );
}
