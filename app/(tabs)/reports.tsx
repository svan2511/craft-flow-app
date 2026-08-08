import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Icon } from '@/components/ui/icon';
import { ReportsSkeleton } from '@/components/ui/screen-skeletons';
import { useToast } from '@/components/toast-provider';
import { Palette, Radius, Type } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { formatRupees, formatRupeesShort } from '@/lib/format';
import { stageIcon } from '@/lib/order-status';
import { shareReportPdf } from '@/lib/share-report-pdf';
import { useFocusApi } from '@/lib/use-focus-api';
import { useTabScrollToTop } from '@/lib/use-tab-scroll-top';

export type PeriodKey = 'today' | 'this_week' | 'this_month' | 'this_year';

type ModeSlice = { cash: number; online: number; upi: number; cheque: number };

type CollectionSlice = {
  total: number;
  advance: number;
  milestone: number;
  balance: number;
  modes: ModeSlice;
};

type ProfitSlice = {
  revenue: number;
  material: number;
  labor: number;
  net: number;
  margin: number;
};

export type ReportSummary = {
  collections: Record<PeriodKey, CollectionSlice>;
  karigar_outflow: Record<PeriodKey, { total: number; advance: number; settlement: number }>;
  balance_sheet: {
    customer_pending: number;
    pending_orders: number;
    karigar_pending: number;
    net: number;
  };
  orders_by_status: Record<string, number>;
  stage_funnel: {
    name: string;
    pending: number;
    in_progress: number;
    completed: number;
    total: number;
  }[];
  profit: Record<PeriodKey, ProfitSlice>;
  monthly_revenue: { month: string; label: string; revenue: number }[];
  top_customers: { id: number; name: string; pending: number; orders: number }[];
  karigar_payouts: { id: number; name: string; role: string | null; pending: number; due: number; paid: number }[];
};

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'this_year', label: 'This Year' },
];

const STAGE_STATUSES: { key: 'pending' | 'in_progress' | 'completed'; label: string; color: string }[] = [
  { key: 'pending', label: 'Pending', color: Palette.outline },
  { key: 'in_progress', label: 'In Progress', color: Palette.primary },
  { key: 'completed', label: 'Completed', color: Palette.success },
];

const MODES: { key: keyof ModeSlice; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'upi', label: 'UPI' },
  { key: 'online', label: 'Online' },
  { key: 'cheque', label: 'Cheque' },
];

const ZERO_COLLECTION: CollectionSlice = {
  total: 0,
  advance: 0,
  milestone: 0,
  balance: 0,
  modes: { cash: 0, online: 0, upi: 0, cheque: 0 },
};

function SectionHeader({ icon, title, tint }: { icon: string; title: string; tint: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: tint }]}>
        <Icon name={icon} size={16} color={Palette.onPrimary} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function MiniStatBox({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.miniStat}>
      <Text style={styles.miniStatLabel}>{label}</Text>
      <Text style={styles.miniStatValue}>{formatRupees(value)}</Text>
    </View>
  );
}

function BalanceRow({ label, icon, value, valueColor, sub }: {
  label: string;
  icon: string;
  value: number;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <View style={styles.balanceRow}>
      <View style={styles.balanceLeft}>
        <Icon name={icon} size={18} color={Palette.onSurfaceVariant} />
        <View>
          <Text style={styles.balanceLabel}>{label}</Text>
          {sub ? <Text style={styles.balanceSub}>{sub}</Text> : null}
        </View>
      </View>
      <Text style={[styles.balanceValue, valueColor ? { color: valueColor } : null]}>
        {formatRupees(value)}
      </Text>
    </View>
  );
}

function PayoutRow({ name, role, amount, amountColor }: {
  name: string;
  role: string | null;
  amount: number;
  amountColor: string;
}) {
  return (
    <View style={styles.listRow}>
      <View style={styles.listLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.charAt(0)}</Text>
        </View>
        <View>
          <Text style={styles.listTitle}>{name}</Text>
          {role ? <Text style={styles.listSub}>{role}</Text> : null}
        </View>
      </View>
      <Text style={[styles.listAmount, { color: amountColor }]}>{formatRupees(amount)}</Text>
    </View>
  );
}

function StageFunnelRow({ stage }: { stage: ReportSummary['stage_funnel'][number] }) {
  const segments: { key: 'pending' | 'in_progress' | 'completed'; count: number }[] = [
    { key: 'pending', count: stage.pending },
    { key: 'in_progress', count: stage.in_progress },
    { key: 'completed', count: stage.completed },
  ];
  const flexes = segments.reduce((sum, seg) => sum + seg.count, 0) > 0
    ? segments.map((seg) => (seg.count > 0 ? seg.count : 0.25))
    : [1, 1, 1];

  return (
    <View style={styles.funnelRow}>
      <View style={styles.funnelLabelRow}>
        <View style={styles.funnelLabelLeft}>
          <Icon name={stageIcon(stage.name)} size={14} color={Palette.onSurfaceVariant} />
          <Text style={styles.funnelLabel}>{stage.name}</Text>
        </View>
      </View>
      <View style={styles.funnelBarRow}>
        {segments.map((seg, index) => {
          const isEmpty = seg.count === 0;
          const color = isEmpty
            ? Palette.surfaceContainerHigh
            : STAGE_STATUSES.find((s) => s.key === seg.key)!.color;
          return (
            <View
              key={seg.key}
              style={[styles.funnelBarColumn, { flex: flexes[index] }]}>
              <View
                style={[
                  styles.funnelBarSegment,
                  {
                    backgroundColor: color,
                    borderTopLeftRadius: index === 0 ? Radius.pill : 0,
                    borderBottomLeftRadius: index === 0 ? Radius.pill : 0,
                    borderTopRightRadius: index === segments.length - 1 ? Radius.pill : 0,
                    borderBottomRightRadius: index === segments.length - 1 ? Radius.pill : 0,
                  },
                ]}
              />
              {!isEmpty ? <Text style={styles.funnelBarCount}>{seg.count}</Text> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ReportsScreen() {
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [exporting, setExporting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(scrollRef);
  const { business } = useAuth();
  const { showToast } = useToast();

  const { data, loading, error, reload } = useFocusApi(
    useCallback(() => apiRequest<ReportSummary>('/reports/summary', { authenticated: true }), []),
  );

  const report = data;
  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? '';

  const onDownload = async () => {
    if (!report || exporting) {
      return;
    }
    setExporting(true);
    try {
      await shareReportPdf(report, period, {
        name: business?.workshopName ?? 'Craft Flow',
        phone: business?.phone ?? null,
        city: business?.city ?? null,
        address: business?.address ?? null,
      });
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not generate report PDF.', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const collection = report?.collections[period] ?? ZERO_COLLECTION;
  const outflow = report?.karigar_outflow[period] ?? { total: 0, advance: 0, settlement: 0 };
  const profit = report?.profit[period] ?? { revenue: 0, material: 0, labor: 0, net: 0, margin: 0 };

  const insight = (() => {
    const monthly = report?.monthly_revenue ?? [];
    if (monthly.length < 2) return null;
    const current = monthly[monthly.length - 1].revenue;
    const previous = monthly[monthly.length - 2].revenue;
    if (previous <= 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  })();

  return (
    <Screen
      scrollRef={scrollRef}
      refreshControl={
        <RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={Palette.primary} />
      }>
      {loading && !data ? (
        <ReportsSkeleton />
      ) : (
        <>
          <View style={styles.pageHeader}>
            <View style={styles.pageHeaderText}>
              <Text style={styles.pageTitle}>Reports &amp; Analytics</Text>
              <Text style={styles.pageSubtitle}>Financial &amp; production overview for your workshop.</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.downloadButton, (exporting || !report) && styles.downloadDisabled, pressed && styles.downloadPressed]}
              onPress={() => void onDownload()}
              disabled={exporting || !report}
              hitSlop={8}>
              {exporting ? (
                <ActivityIndicator size={20} color={Palette.primary} />
              ) : (
                <Icon name="download" size={24} color={Palette.primary} />
              )}
            </Pressable>
          </View>

          {error ? <Text style={styles.emptyText}>{error}</Text> : null}

          <View style={styles.periodRow}>
            {PERIODS.map((p) => (
              <Pressable
                key={p.key}
                onPress={() => setPeriod(p.key)}
                style={[styles.periodChip, period === p.key && styles.periodChipActive]}>
                <Text style={[styles.periodText, { color: period === p.key ? Palette.onPrimary : Palette.onSurfaceVariant }]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Money In (Collections) */}
          <SectionHeader icon="account_balance_wallet" title="Money In (Collections)" tint={Palette.primary} />
          <View style={styles.card}>
            <Text style={styles.cardHint}>{periodLabel} collected from customers</Text>
            <View style={styles.valueRow}>
              <Text style={styles.financeValue}>{formatRupees(collection.total)}</Text>
            </View>
            <View style={styles.splitRow}>
              <MiniStatBox label="Advance" value={collection.advance} />
              <MiniStatBox label="Milestone" value={collection.milestone} />
              <MiniStatBox label="Balance" value={collection.balance} />
            </View>
            <View style={styles.cardDivider} />
            <Text style={styles.cardHint}>By payment mode</Text>
            <View style={styles.modeRow}>
              {MODES.map((m) => (
                <View key={m.key} style={styles.modeChip}>
                  <Text style={styles.modeLabel}>{m.label}</Text>
                  <Text style={styles.modeValue}>{formatRupees(collection.modes[m.key])}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Money Out (Karigar Payments) */}
          <SectionHeader icon="handyman" title="Money Out (To Karigar)" tint={Palette.secondary} />
          <View style={styles.card}>
            <Text style={styles.cardHint}>{periodLabel} paid to workers</Text>
            <View style={styles.valueRow}>
              <Text style={styles.financeValue}>{formatRupees(outflow.total)}</Text>
              <View style={[styles.outBadge, outflow.total > collection.total && styles.outBadgeWarn]}>
                <Text style={styles.outBadgeText}>
                  {collection.total > 0 ? `${Math.round((outflow.total / collection.total) * 100)}% of collected` : 'No inflow'}
                </Text>
              </View>
            </View>
            <View style={styles.splitRow}>
              <MiniStatBox label="Advances" value={outflow.advance} />
              <MiniStatBox label="Settlements" value={outflow.settlement} />
            </View>
          </View>

          {/* Current Balance Sheet */}
          <SectionHeader icon="account_balance" title="Current Balance Sheet" tint={Palette.tertiary} />
          <View style={styles.card}>
            <BalanceRow
              label="Pending from customers"
              icon="call_received"
              value={report?.balance_sheet.customer_pending ?? 0}
              sub={report?.balance_sheet.pending_orders ? `${report.balance_sheet.pending_orders} order(s) to collect` : undefined}
            />
            <View style={styles.rowDivider} />
            <BalanceRow
              label="Pending to karigar"
              icon="call_made"
              value={report?.balance_sheet.karigar_pending ?? 0}
              valueColor={Palette.warning}
            />
            <View style={styles.rowDivider} />
            <BalanceRow
              label="Workshop position"
              icon="savings"
              value={report?.balance_sheet.net ?? 0}
              valueColor={(report?.balance_sheet.net ?? 0) >= 0 ? Palette.success : Palette.error}
            />
          </View>

          {/* Production Funnel */}
          <SectionHeader icon="auto_graph" title="Production Funnel" tint={Palette.primary} />
          <View style={styles.card}>
            <View style={styles.funnelLegend}>
              {STAGE_STATUSES.map((s) => (
                <View key={s.key} style={styles.funnelLegendItem}>
                  <View style={[styles.funnelLegendDot, { backgroundColor: s.color }]} />
                  <Text style={styles.funnelLegendText}>{s.label}</Text>
                </View>
              ))}
            </View>
            {(report?.stage_funnel ?? []).map((stage) => (
              <StageFunnelRow key={stage.name} stage={stage} />
            ))}
            {!report?.stage_funnel?.length ? (
              <Text style={styles.emptyList}>Assign work stages to orders to see the production funnel.</Text>
            ) : null}
          </View>

          {/* Profit & Cost */}
          <SectionHeader icon="trending_up" title="Profit &amp; Cost" tint={Palette.secondary} />
          <View style={styles.card}>
            <Text style={styles.cardHint}>{periodLabel} order valuation</Text>
            <View style={styles.valueRow}>
              <Text style={styles.financeValue}>{formatRupees(profit.revenue)}</Text>
              <View style={[styles.marginBadge, profit.margin >= 0 ? styles.marginGood : styles.marginBad]}>
                <Text style={styles.marginText}>
                  {profit.margin >= 0 ? '+' : ''}{profit.margin}%
                </Text>
              </View>
            </View>
            <View style={styles.costRow}>
              <BalanceRow label="Material cost" icon="inventory_2" value={profit.material} />
            </View>
            <View style={styles.rowDivider} />
            <BalanceRow label="Labour cost" icon="work" value={profit.labor} />
            <View style={styles.rowDivider} />
            <BalanceRow label="Net profit" icon="savings" value={profit.net} valueColor={(profit.net ?? 0) >= 0 ? Palette.success : Palette.error} />
          </View>

          {/* Monthly Trend */}
          <SectionHeader icon="point_of_sale" title="Revenue Trend" tint={Palette.tertiary} />
          <View style={styles.card}>
            <Text style={styles.chartTitle}>Last 6 months collections</Text>
            <View style={styles.barChart}>
              {(report?.monthly_revenue ?? []).map((item, index) => {
                const max = Math.max(...(report?.monthly_revenue ?? []).map((m) => m.revenue), 1);
                const height = Math.max((item.revenue / max) * 120, 4);
                const isCurrent = index === (report?.monthly_revenue?.length ?? 0) - 1;
                return (
                  <View key={item.month} style={styles.barColumn}>
                    <Text style={[styles.barValue, isCurrent && { color: Palette.primary }]}>
                      {item.revenue > 0 ? formatRupeesShort(item.revenue) : ''}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        { height, backgroundColor: isCurrent ? Palette.primary : Palette.primaryContainer },
                      ]}
                    />
                    <Text style={[styles.barLabel, isCurrent && styles.barLabelActive]}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Top Pending Customers */}
          <SectionHeader icon="support_agent" title="Top Pending Customers" tint={Palette.warning} />
          <View style={styles.card}>
            {(report?.top_customers ?? []).length === 0 ? (
              <Text style={styles.emptyList}>No pending balances. All customers are settled.</Text>
            ) : (
              (report?.top_customers ?? []).map((c, i) => (
                <View key={c.id}>
                  {i > 0 ? <View style={styles.rowDivider} /> : null}
                  <View style={styles.listRow}>
                    <View style={styles.listLeft}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{c.name.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={styles.listTitle}>{c.name}</Text>
                        <Text style={styles.listSub}>{c.orders} active order(s)</Text>
                      </View>
                    </View>
                    <Text style={[styles.listAmount, { color: Palette.warning }]}>{formatRupees(c.pending)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Karigar Payouts */}
          <SectionHeader icon="payments" title="Karigar Payouts Due" tint={Palette.secondary} />
          <View style={styles.card}>
            {(report?.karigar_payouts ?? []).length === 0 ? (
              <Text style={styles.emptyList}>No pending work payments. Karigar ledger is up to date.</Text>
            ) : (
              (report?.karigar_payouts ?? []).map((k, i) => (
                <View key={k.id}>
                  {i > 0 ? <View style={styles.rowDivider} /> : null}
                  <PayoutRow name={k.name} role={k.role} amount={k.pending} amountColor={Palette.warning} />
                </View>
              ))
            )}
          </View>

          {/* Insights */}
          <SectionHeader icon="insights" title="Automated Insights" tint={Palette.primary} />
          <View style={styles.insightsCard}>
            <Icon name="insights" size={48} color={Palette.onPrimary} />
            <Text style={styles.insightsTitle}>Workshop Insights</Text>
            {insight === null ? (
              <Text style={styles.insightsBody}>
                Add more orders and payments to unlock performance insights for your workshop.
              </Text>
            ) : insight > 0 ? (
              <Text style={styles.insightsBody}>
                Collections grew {insight}% this month. Keep following up on {report?.balance_sheet.pending_orders ?? 0} pending
                order(s) to collect {formatRupees(report?.balance_sheet.customer_pending ?? 0)}.
              </Text>
            ) : insight < 0 ? (
              <Text style={styles.insightsBody}>
                Collections dropped {Math.abs(insight)}% this month. Follow up on pending balances and restock popular
                materials to drive more orders.
              </Text>
            ) : (
              <Text style={styles.insightsBody}>
                Collections are steady. Focus on delivering ready orders and collecting pending balances to grow.
              </Text>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pageHeaderText: { flex: 1, gap: 2 },
  pageTitle: {
    ...Type.headlineLgMobile,
    color: Palette.onSurface,
    fontFamily: 'Poppins_700Bold',
  },
  pageSubtitle: { ...Type.bodyMd, color: Palette.onSurfaceVariant, marginTop: 2 },
  emptyText: { ...Type.bodyMd, color: Palette.onSurfaceVariant, textAlign: 'center', paddingVertical: 24 },

  downloadButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: 'rgba(138,109,59,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  downloadDisabled: { opacity: 0.55 },
  downloadPressed: { transform: [{ scale: 0.94 }] },

  periodRow: { flexDirection: 'row', gap: 8 },
  periodChip: {
    flex: 1,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  periodText: { ...Type.labelBold },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_700Bold',
  },

  card: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 12,
  },
  cardHint: { ...Type.labelBold, color: Palette.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardDivider: { height: 1, backgroundColor: Palette.outlineVariant },
  rowDivider: { height: 1, backgroundColor: Palette.surfaceContainerHigh },
  cardSubLabel: { ...Type.labelBold, color: Palette.onSurfaceVariant },

  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  financeValue: { ...Type.display, color: Palette.onSurface },

  splitRow: { flexDirection: 'row', gap: 10 },
  miniStat: {
    flex: 1,
    backgroundColor: Palette.surfaceContainerLow,
    borderRadius: Radius.md,
    padding: 10,
    gap: 2,
  },
  miniStatLabel: { ...Type.bodyMd, color: Palette.onSurfaceVariant },
  miniStatValue: { ...Type.headlineMd, color: Palette.onSurface, fontFamily: 'Poppins_700Bold' },

  modeRow: { flexDirection: 'row', gap: 8 },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: Palette.surfaceContainerLow,
    borderRadius: Radius.md,
    paddingVertical: 8,
  },
  modeLabel: { ...Type.labelBold, color: Palette.onSurfaceVariant },
  modeValue: { ...Type.bodyMd, color: Palette.onSurface, fontFamily: 'Poppins_600SemiBold' },

  outBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primaryContainer,
  },
  outBadgeWarn: { backgroundColor: Palette.errorContainer },
  outBadgeText: { ...Type.labelBold, color: Palette.onPrimaryContainer },

  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  balanceLabel: { ...Type.bodyMd, color: Palette.onSurface, fontFamily: 'Poppins_600SemiBold' },
  balanceSub: { ...Type.bodyMd, color: Palette.onSurfaceVariant },
  balanceValue: { ...Type.headlineMd, color: Palette.onSurface, fontFamily: 'Poppins_700Bold' },
  costRow: { marginTop: 2 },

  funnelLegend: { flexDirection: 'row', gap: 14 },
  funnelLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  funnelLegendDot: { width: 8, height: 8, borderRadius: 4 },
  funnelLegendText: { ...Type.bodyMd, color: Palette.onSurfaceVariant },

  funnelRow: { gap: 3 },
  funnelLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  funnelLabelLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  funnelLabel: { ...Type.bodyMd, color: Palette.onSurface, fontFamily: 'Poppins_600SemiBold' },
  funnelCount: { ...Type.labelBold, color: Palette.onSurface },
  funnelBarRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 0 },
  funnelBarColumn: { alignItems: 'center', gap: 2 },
  funnelBarSegment: { height: 12, width: '100%' },
  funnelBarCount: { ...Type.labelBold, color: Palette.onSurfaceVariant, fontSize: 12 },

  marginGood: { backgroundColor: Palette.success },
  marginBad: { backgroundColor: Palette.error },
  marginBadge: { borderRadius: Radius.pill, overflow: 'hidden' },
  marginText: { ...Type.labelBold, color: Palette.onError, paddingHorizontal: 8, paddingVertical: 4 },

  chartTitle: { ...Type.headlineMd, color: Palette.onSurface, fontFamily: 'Poppins_700Bold' },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 176,
    gap: 8,
  },
  barColumn: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 4 },
  bar: {
    width: '100%',
    maxWidth: 32,
    borderTopLeftRadius: Radius.md,
    borderTopRightRadius: Radius.md,
  },
  barValue: { ...Type.labelBold, color: Palette.onSurfaceVariant, fontSize: 10, lineHeight: 14 },
  barLabel: { ...Type.bodyMd, color: Palette.onSurfaceVariant },
  barLabelActive: { color: Palette.primary, fontFamily: 'Poppins_700Bold' },

  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...Type.headlineMd, color: Palette.onPrimaryContainer, fontFamily: 'Poppins_700Bold' },
  listTitle: { ...Type.bodyMd, color: Palette.onSurface, fontFamily: 'Poppins_600SemiBold' },
  listSub: { ...Type.bodyMd, color: Palette.onSurfaceVariant },
  listAmount: { ...Type.headlineMd, fontFamily: 'Poppins_700Bold' },

  emptyList: { ...Type.bodyMd, color: Palette.onSurfaceVariant, textAlign: 'center', paddingVertical: 16 },

  insightsCard: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    minHeight: 200,
    justifyContent: 'center',
  },
  insightsTitle: {
    ...Type.headlineLgMobile,
    color: Palette.onPrimary,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  insightsBody: { ...Type.bodyMd, color: Palette.onPrimary, opacity: 0.9, textAlign: 'center' },
});