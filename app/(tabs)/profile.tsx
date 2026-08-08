import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmModal } from '@/components/ui/confirm-modal';
import { Icon } from '@/components/ui/icon';
import { ProfileSkeleton } from '@/components/ui/screen-skeletons';
import { Palette, Type } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/api';
import { useFocusApi } from '@/lib/use-focus-api';
import { useTabScrollToTop } from '@/lib/use-tab-scroll-top';

const BG_GRADIENT = ['#F8F6F3', '#F5F2EC', '#F8F6F3'] as const;
const HERO_GRADIENT = ['#FFFFFF', '#F3ECDD'] as const;

type ProfileWorkshop = {
  id: number;
  name: string;
  owner_name: string | null;
  city: string | null;
  phone: string | null;
  address: string | null;
};

function DetailRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: string;
  label: string;
  value: string;
  last?: boolean;
}) {
  const hasValue = value.length > 0;
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <View style={styles.detailIcon}>
        <Icon name={icon} size={20} color={Palette.primary} />
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, !hasValue && styles.detailValueEmpty]}>
          {hasValue ? value : 'Not added yet'}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { phone, business, logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  useTabScrollToTop(scrollRef);

  const profile = useFocusApi(
    useCallback(
      () =>
        apiRequest<{ user: { phone: string; has_workshop: boolean }; workshop: ProfileWorkshop | null }>(
          '/auth/me',
          { authenticated: true },
        ),
      [],
    ),
  );

  const workshop = profile.data?.workshop ?? null;
  const workshopName = workshop?.name ?? business?.workshopName ?? 'Craft Flow';
  const verifiedNumber = workshop?.phone ?? business?.phone ?? phone ?? '';
  const ownerName = workshop?.owner_name ?? business?.ownerName ?? '';
  const businessCity = workshop?.city ?? business?.city ?? '';
  const businessAddress = workshop?.address ?? business?.address ?? '';
  const verifiedHouse = workshop?.phone ?? business?.phone ?? phone ?? '';
  const initials = workshopName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    return raw || '—';
  };

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirming(false);
    }
  };

  return (
    <LinearGradient colors={[...BG_GRADIENT]} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={profile.loading && !!profile.data}
              onRefresh={profile.reload}
              tintColor={Palette.primary}
            />
          }>
          {profile.loading && !profile.data ? (
            <ProfileSkeleton />
          ) : (
            <>
          <LinearGradient colors={[...HERO_GRADIENT]} style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.heroInitWrap}>
                <Text style={styles.heroInitials}>{initials || 'CF'}</Text>
              </View>
              <View style={styles.heroIdentity}>
                <Text style={styles.heroEyebrow}>WORKSHOP PROFILE</Text>
                <Text style={styles.heroTitle} numberOfLines={1}>
                  {workshopName}
                </Text>
              </View>
            </View>
            <View style={styles.heroVerified}>
              <View style={styles.heroVerifiedIconWrap}>
                <Icon name="verified_user" size={20} color="#3E6B4F" />
              </View>
              <View style={styles.heroVerifiedText}>
                <Text style={styles.heroVerifiedLabel}>Verified Mobile Number</Text>
                <Text style={styles.heroVerifiedNumber}>{formatPhone(verifiedNumber)}</Text>
              </View>
              <View style={styles.heroVerifiedTag}>
                <Icon name="check" size={13} color={Palette.onPrimary} />
                <Text style={styles.heroVerifiedTagText}>Verified</Text>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.sectionCard}>
            <View style={[styles.sectionHeaderBar, { backgroundColor: 'rgba(138,109,59,0.10)' }]}>
              <Text style={styles.sectionTitle}>Business Details</Text>
            </View>
            <View style={styles.details}>
              <DetailRow icon="local_shipping" label="Workshop Name" value={workshopName} />
              <DetailRow icon="person" label="Owner Name" value={ownerName} last />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={[styles.sectionHeaderBar, { backgroundColor: 'rgba(62,107,79,0.10)' }]}>
              <Text style={[styles.sectionTitle, { color: '#3E6B4F' }]}>Contact Information</Text>
            </View>
            <View style={styles.details}>
              <DetailRow icon="phone" label="Phone" value={verifiedHouse} />
              <DetailRow icon="place" label="City" value={businessCity} />
              <DetailRow icon="home" label="Address" value={businessAddress} last />
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}
            onPress={() => setConfirming(true)}>
            <Icon name="logout" size={20} color={Palette.error} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>

          <Text style={styles.versionText}>Craft Flow · v1.0.0</Text>
          </>
          )}
        </ScrollView>
      </SafeAreaView>

      <ConfirmModal
        visible={confirming}
        icon="logout"
        title="Log out of Craft Flow?"
        message="You will need to verify your number again to sign back in. Your business data stays safe."
        confirmLabel="Log out"
        variant="danger"
        submitting={loggingOut}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void onLogout()}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    gap: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroInitWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.primary,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
  heroInitials: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: Palette.onPrimary,
  },
  heroIdentity: {
    flex: 1,
    gap: 3,
  },
  heroEyebrow: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.4,
    color: Palette.onSurfaceVariant,
  },
  heroTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 21,
    lineHeight: 27,
    color: Palette.onSurface,
  },
  heroVerified: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(62,107,79,0.25)',
    backgroundColor: 'rgba(62,107,79,0.07)',
    marginTop: 4,
  },
  heroVerifiedIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'rgba(62,107,79,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroVerifiedText: {
    flex: 1,
    gap: 1,
  },
  heroVerifiedLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.4,
    color: Palette.onSurfaceVariant,
  },
  heroVerifiedNumber: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    lineHeight: 22,
    color: Palette.onSurface,
  },
  heroVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#3E6B4F',
  },
  heroVerifiedTagText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
    color: Palette.onPrimary,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Palette.outlineVariant,
  },
  heroFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroFootText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: Palette.onSurfaceVariant,
  },
  sectionCard: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    overflow: 'hidden',
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  sectionHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Palette.outlineVariant,
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
  sectionIconGreen: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(62,107,79,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
    letterSpacing: 0.2,
  },
  details: {
    padding: 16,
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Palette.outlineVariant,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(138,109,59,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
    gap: 1,
  },
  detailLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    lineHeight: 16,
    color: Palette.onSurfaceVariant,
  },
  detailValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: Palette.onSurface,
  },
  detailValueEmpty: {
    fontFamily: 'Poppins_500Medium',
    color: Palette.outline,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    marginTop: 4,
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: 'rgba(179,70,62,0.35)',
    shadowColor: Palette.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 2,
  },
  logoutPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  logoutText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: Palette.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: Palette.outline,
    marginTop: 4,
  },
});