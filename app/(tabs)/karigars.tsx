import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { KarigarModal } from '@/components/karigar-modal';
import { Screen } from '@/components/screen';
import { Icon } from '@/components/ui/icon';
import { RoyalEmpty } from '@/components/ui/royal-empty';
import { KarigarsSkeleton } from '@/components/ui/screen-skeletons';
import { useToast } from '@/components/toast-provider';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { useFocusApi } from '@/lib/use-focus-api';
import { useTabScrollToTop } from '@/lib/use-tab-scroll-top';

type KarigarListItem = {
  id: number;
  name: string;
  role: string | null;
  phone: string | null;
  orders_count: number;
  active_orders: number;
  completed_orders: number;
  pending_orders: number;
};

export default function KarigarsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(scrollRef);
  const { showToast } = useToast();

  const list = useFocusApi(
    useCallback(
      () => apiRequest<{ karigars: KarigarListItem[] }>('/karigars', { authenticated: true }),
      [],
    ),
  );

  const karigars = list.data?.karigars ?? [];

  const visible = karigars.filter((k) => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return true;
    }
    return (
      k.name.toLowerCase().includes(q) ||
      (k.role ?? '').toLowerCase().includes(q) ||
      (k.phone ?? '').includes(q)
    );
  });

  const submitAdd = async (data: { name: string; role?: string; phone?: string; default_rate: number }) => {
    setSubmitting(true);
    try {
      await apiRequest('/karigars', {
        method: 'POST',
        body: {
          name: data.name,
          role: data.role,
          phone: data.phone,
          default_rate: data.default_rate,
        },
        authenticated: true,
      });
      setShowAdd(false);
      await list.reload();
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('karigars.couldNotAdd'), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const empty = !list.loading && !list.error && karigars.length === 0;

  return (
    <Screen
      scrollRef={scrollRef}
      refreshControl={
        <RefreshControl refreshing={list.loading && !!list.data} onRefresh={list.reload} tintColor={Palette.primary} />
      }>
      {list.loading && !list.data ? (
        <KarigarsSkeleton />
      ) : (
        <>
          {empty ? (
            <RoyalEmpty
              icon="handyman"
              title={t('karigars.emptyTitle')}
              subtitle={t('karigars.emptySubtitle')}
              tagline={t('karigars.emptyTagline')}
              action={
                <Pressable
                  style={({ pressed }) => [styles.emptyAddButton, pressed && styles.pressed]}
                  onPress={() => setShowAdd(true)}>
                  <Icon name="person_add" size={18} color={Palette.onPrimary} />
                  <Text style={styles.emptyAddText}>{t('karigars.addKarigar')}</Text>
                </Pressable>
              }
            />
          ) : (
            <>
              <View style={styles.searchBar}>
                <Icon name="search" size={22} color={Palette.primary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('karigars.searchPlaceholder')}
                  placeholderTextColor={Palette.onSurfaceVariant}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                />
                {query.trim().length > 0 ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <Icon name="remove" size={20} color={Palette.onSurfaceVariant} />
                  </Pressable>
                ) : null}
              </View>
            </>
          )}

          {list.error ? <Text style={styles.emptyText}>{list.error}</Text> : null}

          {!empty ? (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrap}>
                <View style={styles.sectionIcon}>
                  <Icon name="groups" size={15} color={Palette.primary} />
                </View>
                <Text style={styles.sectionTitle}>{t('karigars.teamMembers')}</Text>
              </View>
              <View style={styles.sectionActions}>
                {query.trim().length > 0 ? (
                  <Text style={styles.sectionHint}>{t('karigars.found', { count: visible.length })}</Text>
                ) : null}
                <Pressable
                  style={({ pressed }) => [styles.addSmall, pressed && styles.pressed]}
                  onPress={() => setShowAdd(true)}>
                  <Icon name="add" size={16} color={Palette.onPrimary} />
                  <Text style={styles.addSmallText}>{t('common.add')}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {!empty && visible.length === 0 ? (
            <Text style={styles.emptyText}>{t('karigars.noMatch', { query: query.trim() })}</Text>
          ) : null}

          {!empty && visible.length > 0 ? (
            <View style={styles.list}>
              {visible.map((k) => (
                <Pressable
                  key={k.id}
                  style={({ pressed }) => [styles.rowCard, pressed && styles.rowPressed]}
                  onPress={() =>
                    router.push({ pathname: '/karigar/[id]', params: { id: String(k.id) } })
                  }>
                  <View style={styles.rowAccent} />
                  <View style={styles.avatarWrap}>
                    <Image source={require('@/assets/images/logo.png')} style={styles.avatar} contentFit="cover" />
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.topRow}>
                      <View style={styles.idBlock}>
                        <Text style={styles.rowName} numberOfLines={1}>
                          {k.name}
                        </Text>
                        <View style={styles.rowMetaRow}>
                          <Icon name="handyman" size={13} color={Palette.primary} />
                          <Text style={styles.rowMeta} numberOfLines={1}>
                            {k.role ?? t('karigars.role')}
                          </Text>
                        </View>
                        {k.phone ? (
                          <View style={styles.phoneRow}>
                            <Icon name="phone" size={13} color={Palette.onSurfaceVariant} />
                            <Text style={styles.phoneText} numberOfLines={1}>
                              {k.phone}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.jobPill}>
                        <Text style={styles.jobPillValue}>{k.orders_count}</Text>
                        <Text style={styles.jobPillLabel}>{t('karigars.jobs')}</Text>
                      </View>
                    </View>

                    <View style={styles.statsBar}>
                      <View style={styles.statSegment}>
                        <Text style={[styles.statValue, styles.metricActiveValue]}>
                          {k.active_orders ?? 0}
                        </Text>
                        <Text style={styles.statLabel}>{t('karigars.inProgress')}</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statSegment}>
                        <Text style={[styles.statValue, styles.metricCompletedValue]}>
                          {k.completed_orders ?? 0}
                        </Text>
                        <Text style={styles.statLabel}>{t('karigars.completed')}</Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statSegment}>
                        <Text style={[styles.statValue, styles.metricPendingValue]}>
                          {k.pending_orders ?? 0}
                        </Text>
                        <Text style={styles.statLabel}>{t('karigars.notStarted')}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      )}

      <KarigarModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={submitAdd}
        submitLoading={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: Palette.onSurface,
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
  },
  addCard: {
    borderRadius: Radius.md,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  addGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: Radius.md,
  },
  addIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTextWrap: {
    flex: 1,
    gap: 1,
  },
  addTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    lineHeight: 22,
    color: Palette.onPrimary,
  },
  addSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.9)',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addSmall: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 2,
  },
  addSmallText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(138,109,59,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
  },
  sectionHint: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    fontFamily: 'Poppins_500Medium',
  },
  list: {
    gap: 10,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingRight: 14,
    overflow: 'hidden',
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  rowPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  rowAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: Palette.primary,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Palette.primary,
    backgroundColor: Palette.surfaceContainerLow,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  idBlock: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    ...Type.headlineLgMobile,
    color: Palette.onSurface,
    flexShrink: 1,
  },
  jobPill: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(138,109,59,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(138,109,59,0.25)',
  },
  jobPillValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 20,
    color: Palette.primary,
  },
  jobPillLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 10,
    lineHeight: 12,
    color: Palette.onSurfaceVariant,
    textTransform: 'capitalize',
    marginTop: 1,
  },
  rowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowMeta: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    fontFamily: 'Poppins_500Medium',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  phoneText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: Palette.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
  },
  statSegment: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Palette.outlineVariant,
  },
  statValue: {
    ...Type.labelBold,
    fontSize: 15,
    lineHeight: 18,
  },
  metricActiveValue: {
    color: Palette.primary,
  },
  metricCompletedValue: {
    color: '#3E6B4F',
  },
  metricPendingValue: {
    color: Palette.onSurfaceVariant,
  },
  statLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    lineHeight: 12,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 3,
  },
  emptyText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    paddingVertical: 24,
  },
  emptyAddButton: {
    height: Spacing.touchTarget,
    minWidth: 160,
    paddingHorizontal: 20,
    backgroundColor: Palette.primary,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyAddText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
    fontSize: 15,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.94,
  },
});
