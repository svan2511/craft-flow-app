import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/components/app-header';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/toast-provider';
import { Palette, Radius, Type } from '@/constants/theme';
import { SUPPORTED_LANGUAGES, currentLanguage, setAppLanguage, type AppLanguage } from '@/lib/i18n';

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

function LanguageSheet({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: AppLanguage;
  onSelect: (lang: AppLanguage) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  if (!visible) {
    return null;
  }
  return (
    <Pressable style={styles.languageSheetBackdrop} onPress={onClose}>
      <Pressable style={styles.languageSheet} onPress={(e) => e.stopPropagation()}>
        <Text style={styles.languageSheetTitle}>{t('settings.languageSelection')}</Text>
        {(Object.keys(SUPPORTED_LANGUAGES) as AppLanguage[]).map((lang) => {
          const selected = lang === current;
          return (
            <Pressable
              key={lang}
              style={({ pressed }) => [styles.languageRow, pressed && styles.rowPressed]}
              onPress={() => onSelect(lang)}>
              <View style={styles.languageRowIconWrap}>
                <Icon name="language" size={20} color={selected ? Palette.primary : Palette.outline} />
              </View>
              <Text style={[styles.rowTitle, selected && { color: Palette.primary }]}>
                {SUPPORTED_LANGUAGES[lang]}
              </Text>
              {selected ? <Icon name="check_circle" size={20} color={Palette.primary} /> : null}
            </Pressable>
          );
        })}
        <Pressable style={({ pressed }) => [styles.languageClose, pressed && styles.rowPressed]} onPress={onClose}>
          <Text style={styles.languageCloseText}>{t('common.cancel')}</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [languagePicker, setLanguagePicker] = useState(false);
  const [language, setLanguage] = useState<AppLanguage>(currentLanguage());

  const switchLanguage = async (lang: AppLanguage) => {
    setLanguage(lang);
    await setAppLanguage(lang);
    setLanguagePicker(false);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <AppHeader title={t('settings.title')} showLogo={false} onBack={() => router.back()} right={<View style={{ width: 48 }} />} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('settings.app')}</Text>
        </View>
        <View style={styles.card}>
          <SettingRow
            icon="language"
            title={t('settings.language')}
            subtitle={SUPPORTED_LANGUAGES[language]}
            onPress={() => setLanguagePicker(true)}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
        </View>
        <View style={styles.card}>
          <SettingRow
            icon="help_outline"
            title={t('settings.helpSupport')}
            subtitle={t('settings.helpSubtitle')}
            onPress={() => router.push('/help')}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="info"
            title={t('settings.about')}
            subtitle={t('settings.aboutSubtitle')}
            onPress={() => router.push('/about')}
          />
        </View>

        <Text style={styles.footerText}>{t('settings.version')}</Text>
      </ScrollView>

      <LanguageSheet
        visible={languagePicker}
        current={language}
        onSelect={(lang) => void switchLanguage(lang)}
        onClose={() => setLanguagePicker(false)}
      />
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
  languageSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28,27,26,0.45)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  languageSheet: {
    alignSelf: 'stretch',
    backgroundColor: Palette.surfaceContainerLowest,
    borderTopLeftRadius: Radius.xl * 2,
    borderTopRightRadius: Radius.xl * 2,
    padding: 16,
    paddingBottom: 32,
    gap: 4,
  },
  languageSheetTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
    paddingVertical: 12,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: Radius.lg,
  },
  languageRowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(138,109,59,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageClose: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceContainerLow,
    alignItems: 'center',
  },
  languageCloseText: {
    ...Type.labelBold,
    color: Palette.primary,
  },
});