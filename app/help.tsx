import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/toast-provider';
import { Palette, Radius, Type } from '@/constants/theme';

const HELP_ITEMS = [
  {
    icon: 'person_add',
    title: 'Add a new order',
    body: 'Tap the + button on the Orders tab and fill in the customer name, item, and total amount. You can attach up to 3 design photos and set a delivery date.',
  },
  {
    icon: 'payments',
    title: 'Recording payment',
    body: 'Open an order and tap the payment button to record advance, milestone, or balance payments in cash, UPI, online, or cheque.',
  },
  {
    icon: 'handyman',
    title: 'Managing karigars',
    body: 'Add karigars from the Karigars tab. Track advances and weekly settlements, and assign them to orders to keep the ledger clear.',
  },
  {
    icon: 'analytics',
    title: 'Reading reports',
    body: 'The Reports tab shows money in, money out, profit, and pending balances for today, this week, this month, or this year. Use the Download button to save a PDF.',
  },
];

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

  const contact = () => {
    showToast('Contact support: support@craftflow.app', { variant: 'info' });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <AppHeader title="Help & Support" showLogo={false} onBack={() => router.back()} right={<View style={{ width: 48 }} />} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Icon name="help_outline" size={32} color={Palette.onPrimary} />
          </View>
          <Text style={styles.heroTitle}>Help & Support</Text>
          <Text style={styles.heroBody}>
            A quick guide to the most common tasks in Craft Flow. If you need more help, reach
            out to us any time.
          </Text>
        </View>

        {HELP_ITEMS.map((item) => (
          <HelpRow key={item.title} icon={item.icon} title={item.title} body={item.body} />
        ))}

        <Pressable
          style={({ pressed }) => [styles.contactButton, pressed && styles.pressed]}
          onPress={contact}>
          <Icon name="chat" size={20} color={Palette.onPrimary} />
          <Text style={styles.contactText}>Contact Support</Text>
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