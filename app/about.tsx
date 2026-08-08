import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Icon } from '@/components/ui/icon';
import { Palette, Radius, Type } from '@/constants/theme';

const LEGAL = [
  {
    title: 'Data stays yours',
    body: 'All workshop, customer, karigar, and payment data is stored on your secure account and can be exported from reports at any time.',
  },
  {
    title: 'Sign-in & security',
    body: 'Craft Flow uses OTP verification on your mobile number. No password is stored anywhere.',
  },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <AppHeader title="About Craft Flow" showLogo={false} onBack={() => router.back()} right={<View style={{ width: 48 }} />} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Icon name="handyman" size={40} color={Palette.onPrimary} />
          </View>
          <Text style={styles.appName}>Craft Flow</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.tagline}>
            A complete workshop management assistant — orders, karigars, payments, and reports in
            one place.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>How your data is handled</Text>
        </View>
        {LEGAL.map((item) => (
          <View key={item.title} style={styles.card}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <Icon name="verified_user" size={18} color={Palette.primary} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>
            <Text style={styles.cardBody}>{item.body}</Text>
          </View>
        ))}

        <Text style={styles.footerText}>Built with care for workshops.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 12,
  },
  hero: {
    backgroundColor: Palette.primary,
    borderRadius: Radius.lg,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  appName: {
    ...Type.headlineLgMobile,
    color: Palette.onPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  appVersion: {
    ...Type.labelBold,
    color: Palette.onPrimary,
    opacity: 0.85,
  },
  tagline: {
    ...Type.bodyMd,
    color: Palette.onPrimary,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 6,
  },
  sectionHeader: {
    paddingLeft: 4,
    marginTop: 8,
  },
  sectionTitle: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 12,
  },
  card: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: Radius.lg,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    padding: 16,
    gap: 10,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(138,109,59,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  cardBody: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    lineHeight: 21,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: Palette.outline,
    marginTop: 8,
  },
});