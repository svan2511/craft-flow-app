import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/toast-provider';
import { Palette, Radius, Type } from '@/constants/theme';

function HelpRow({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <View style={styles.card}>
      <View style={styles.rowTop}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={20} color={Palette.primary} />
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const helpItems = [
    {
      icon: 'person_add',
      title: t('help.addOrderTitle'),
      body: t('help.addOrderBody'),
    },
    {
      icon: 'payments',
      title: t('help.recordingPaymentTitle'),
      body: t('help.recordingPaymentBody'),
    },
    {
      icon: 'handyman',
      title: t('help.managingKarigarsTitle'),
      body: t('help.managingKarigarsBody'),
    },
    {
      icon: 'analytics',
      title: t('help.readingReportsTitle'),
      body: t('help.readingReportsBody'),
    },
  ];

  const contact = () => {
    showToast(t('help.contactSupportToast'), { variant: 'info' });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <AppHeader title={t('help.title')} showLogo={false} onBack={() => router.back()} right={<View style={{ width: 48 }} />} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Icon name="help_outline" size={32} color={Palette.onPrimary} />
          </View>
          <Text style={styles.heroTitle}>{t('help.title')}</Text>
          <Text style={styles.heroBody}>
            {t('help.heroBody')}
          </Text>
        </View>

        {helpItems.map((item) => (
          <HelpRow key={item.title} icon={item.icon} title={item.title} body={item.body} />
        ))}

        <Pressable
          style={({ pressed }) => [styles.contactButton, pressed && styles.pressed]}
          onPress={contact}>
          <Icon name="chat" size={20} color={Palette.onPrimary} />
          <Text style={styles.contactText}>{t('help.contactSupport')}</Text>
        </Pressable>
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
    padding: 24,
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    ...Type.headlineLgMobile,
    color: Palette.onPrimary,
    fontFamily: 'Poppins_700Bold',
  },
  heroBody: {
    ...Type.bodyMd,
    color: Palette.onPrimary,
    opacity: 0.9,
    textAlign: 'center',
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
    width: 38,
    height: 38,
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
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: Palette.primary,
    marginTop: 8,
  },
  contactText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});