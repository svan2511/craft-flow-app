import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { JobCard } from '@/components/job-card';
import { Screen } from '@/components/screen';
import { Icon } from '@/components/ui/icon';
import { RoyalEmpty } from '@/components/ui/royal-empty';
import { JobCardsSkeleton } from '@/components/ui/screen-skeletons';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { formatRupees } from '@/lib/format';
import { orderStatusMeta, type ApiOrder, type ApiOrderStatus } from '@/lib/order-status';
import { useFocusApi } from '@/lib/use-focus-api';
import { useTabScrollToTop } from '@/lib/use-tab-scroll-top';

const FILTERS = (t: (k: string) => string): { label: string; status: ApiOrderStatus | '*' }[] => [
  { label: t('jobCards.all'), status: '*' },
  { label: t('dashboard.new'), status: 'new' },
  { label: t('dashboard.completed'), status: 'ready' },
  { label: t('dashboard.delivered'), status: 'completed' },
];

type OrdersResponse = { orders: ApiOrder[]; count: number };

export default function JobCardsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ApiOrderStatus | '*'>('*');
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(scrollRef);

  const fetcher = useCallback(
    () =>
      apiRequest<OrdersResponse>(
        `/orders${filter === '*' ? '' : `?status=${filter}`}`,
        { authenticated: true },
      ),
    [filter],
  );

  const { data, loading, error, reload } = useFocusApi(fetcher);

  const visibleJobs = (data?.orders ?? []).filter((job) => {
    const matchesQuery =
      query.trim().length === 0 ||
      job.order_no.toLowerCase().includes(query.trim().toLowerCase()) ||
      (job.customer?.name ?? '').toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery;
  });

  const hasNoJobs = !loading && !error && data !== null && filter === '*' && data.orders.length === 0;

  return (
    <Screen
      scrollRef={scrollRef}
      refreshControl={
        <RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={Palette.primary} />
      }>
      {loading && !data ? (
        <JobCardsSkeleton />
      ) : hasNoJobs ? (
        <RoyalEmpty
          icon="workspace_premium"
          title={t('jobCards.noOrdersTitle')}
          subtitle={t('jobCards.noOrdersSubtitle')}
          tagline={t('jobCards.noOrdersTagline')}
        />
      ) : (
        <>
          <View style={styles.searchBar}>
        <Icon name="search" size={22} color={Palette.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('jobCards.search')}
          placeholderTextColor={Palette.onSurfaceVariant}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}>
        {FILTERS(t).map((item) => {
          const active = item.status === filter;
          return (
            <Pressable
              key={item.label}
              onPress={() => setFilter(item.status)}
              style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipIdle]}>
              <Text style={[styles.filterChipText, { color: active ? Palette.onPrimary : Palette.onSurfaceVariant }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? <Text style={styles.emptyText}>{error}</Text> : null}

      <View style={styles.list}>
        {visibleJobs.map((job) => {
          const status = orderStatusMeta(t, job.status);
          return (
            <JobCard
              key={job.id}
              orderId={t('jobCards.orderPrefix', { id: job.order_no })}
              title={job.item_name}
              statusVariant={status.variant}
              customer={job.customer?.name ?? '—'}
              worker={job.karigar?.name ?? t('common.notAssigned')}
              total={formatRupees(job.total_amount)}
              paid={formatRupees(job.advance_paid)}
              due={formatRupees(job.balance_due)}
              stage={job.current_stage ?? null}
              onView={() => router.push({ pathname: '/order/[id]', params: { id: String(job.id) } })}
            />
          );
        })}
        {visibleJobs.length === 0 && !loading && !error ? (
          <Text style={styles.emptyText}>{t('jobCards.noMatch')}</Text>
        ) : null}
      </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    paddingHorizontal: 16,
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: Palette.onSurface,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
  },
  filterRow: {
    gap: 8,
    paddingBottom: 4,
  },
  filterChip: {
    height: Spacing.touchTarget,
    paddingHorizontal: 24,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  filterChipIdle: {
    borderColor: Palette.outlineVariant,
  },
  filterChipText: {
    ...Type.labelBold,
  },
  list: {
    gap: Spacing.cardGap,
  },
  emptyText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
