import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/toast-provider';
import { Palette, Radius, Type } from '@/constants/theme';

const BG_GRADIENT = '#F8F6F3';

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  trailing?: 'chevron' | 'coming-soon';
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      android_ripple={{ color: 'rgba(138,109,59,0.08)' }}>
      <View style={styles.rowIconWrap}>
        <Icon name={icon} size={22} color={Palette.primary} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing === 'coming-soon' ? (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>Coming soon</Text>
        </View>
      ) : (
        <Icon name="chevron_right" size={22} color={Palette.outline} />
      )}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { showToast } = useToast();

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <AppHeader title="Settings" showLogo={false} onBack={() => router.back()} right={<View style={{ width: 48 }} />} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>App</Text>
        </View>
        <View style={styles.card}>
          <SettingRow
            icon="language"
            title="Language"
            subtitle="English"
            trailing="coming-soon"
            onPress={() => showToast('Language options coming soon.', { variant: 'info' })}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Support</Text>
        </View>
        <View style={styles.card}>
          <SettingRow
            icon="help_outline"
            title="Help & Support"
            subtitle="FAQs and how-to guides"
            onPress={() => router.push('/help')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="info"
            title="About Craft Flow"
            subtitle="Version, credits and legal"
            onPress={() => router.push('/about')}
          />
        </View>

        <Text style={styles.footerText}>Craft Flow · v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_GRADIENT,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 12,
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
    overflow: 'hidden',
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  rowPressed: {
    backgroundColor: 'rgba(138,109,59,0.06)',
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(138,109,59,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    ...Type.bodyMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  rowSubtitle: {
    ...Type.bodyMd,
    fontSize: 12,
    color: Palette.onSurfaceVariant,
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Palette.surfaceContainerHigh,
  },
  comingSoonText: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
    fontSize: 10,
  },
  divider: {
    height: 1,
    backgroundColor: Palette.surfaceContainerHigh,
    marginLeft: 68,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: Palette.outline,
    marginTop: 8,
  },
});