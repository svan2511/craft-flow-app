import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/screen';
import { Icon } from '@/components/ui/icon';
import { RoyalEmpty } from '@/components/ui/royal-empty';
import { CustomersSkeleton } from '@/components/ui/screen-skeletons';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { formatRupees } from '@/lib/format';
import { useFocusApi } from '@/lib/use-focus-api';
import { useTabScrollToTop } from '@/lib/use-tab-scroll-top';

type ApiCustomer = {
  id: number;
  name: string;
  phone: string | null;
  total_orders: number;
  completed_orders: number;
  orders_with_pending_balance: number;
  outstanding_balance: number;
  last_order: string | null;
  last_order_date: string | null;
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function CustomersScreen() {
  const [query, setQuery] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(scrollRef);

  useFocusEffect(
    useCallback(() => {
      setOnlyPending(false);
      setQuery('');
    }, []),
  );

  const { data, loading, error, reload } = useFocusApi(
    useCallback(() => apiRequest<{ customers: ApiCustomer[] }>('/customers', { authenticated: true }), []),
  );

  const visible = (data?.customers ?? []).filter((c) => {
    const matchesQuery =
      query.trim().length === 0 ||
      c.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      (c.phone ?? '').includes(query.trim());
    const matchesPending = !onlyPending || c.outstanding_balance > 0;
    return matchesQuery && matchesPending;
  });

  const hasNoCustomers = !loading && !error && data !== null && data.customers.length === 0;

  return (
    <Screen
      scrollRef={scrollRef}
      refreshControl={
        <RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={Palette.primary} />
      }>
      {loading && !data ? (
        <CustomersSkeleton />
      ) : hasNoCustomers ? (
        <RoyalEmpty
          icon="groups"
          title="No Customers Found"
          subtitle="Your customer list is empty."
          tagline="Customers are the heart of any craft workshop."
        />
      ) : (
        <>
          <View style={styles.searchBar}>
        <Icon name="search" size={22} color={Palette.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone"
          placeholderTextColor={Palette.onSurfaceVariant}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setOnlyPending(false)}
          style={[styles.filterChip, !onlyPending && styles.filterChipActive]}>
          <Text style={[styles.filterChipText, { color: !onlyPending ? Palette.onPrimary : Palette.onSurfaceVariant }]}>
            All Customers
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setOnlyPending(true)}
          style={[styles.filterChip, onlyPending && styles.filterChipActive]}>
          <Text style={[styles.filterChipText, { color: onlyPending ? Palette.onPrimary : Palette.onSurfaceVariant }]}>
            With Pending Balance
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.emptyText}>{error}</Text> : null}

      <View style={styles.list}>
        {visible.map((customer) => (
          <View key={customer.id} style={styles.customerCard}>
            <View style={styles.customerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(customer.name)}</Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <View style={styles.phoneRow}>
                  <Icon name="phone" size={14} color={Palette.onSurfaceVariant} />
                  <Text style={styles.customerPhone}>{customer.phone ? `+91 ${customer.phone}` : 'No phone'}</Text>
                </View>
                <Text style={styles.customerOrders}>
                  {customer.completed_orders} orders delivered
                </Text>
                {customer.orders_with_pending_balance > 0 ? (
                  <Text style={[styles.customerOrders, styles.pendingNote]}>
                    {customer.orders_with_pending_balance} order
                    {customer.orders_with_pending_balance === 1 ? '' : 's'} with pending payment
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.balanceBlock}>
              <Text style={styles.balanceLabel}>Outstanding</Text>
              <Text
                style={[
                  styles.balanceValue,
                  { color: customer.outstanding_balance > 0 ? Palette.secondary : Palette.onSurfaceVariant },
                ]}>
                {formatRupees(customer.outstanding_balance)}
              </Text>
            </View>
          </View>
        ))}
        {visible.length === 0 && !loading && !error ? (
          <Text style={styles.emptyText}>No customers found.</Text>
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
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    height: Spacing.touchTarget,
    paddingHorizontal: 20,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  filterChipText: {
    ...Type.labelBold,
  },
  list: {
    gap: Spacing.cardGap,
  },
  customerCard: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.lg,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Palette.surfaceVariant,
    borderWidth: 2,
    borderColor: Palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Type.headlineMd,
    color: Palette.primary,
    fontFamily: 'Poppins_700Bold',
  },
  customerInfo: {
    flexShrink: 1,
  },
  customerName: {
    ...Type.bodyLg,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  customerPhone: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  customerOrders: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    marginTop: 1,
  },
  pendingNote: {
    color: Palette.tertiary,
    fontFamily: 'Poppins_500Medium',
  },
  balanceBlock: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  balanceValue: {
    ...Type.headlineMd,
    fontFamily: 'Poppins_700Bold',
    marginTop: 2,
  },
  emptyText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
