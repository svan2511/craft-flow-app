import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/toast-provider';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { apiRequest } from '@/lib/api';
import { formatRupees } from '@/lib/format';

const TYPES: { key: string; labelKey: string }[] = [
  { key: 'order_advance', labelKey: 'payments.advance' },
  { key: 'order_milestone', labelKey: 'payments.milestone' },
  { key: 'order_balance', labelKey: 'payments.balance' },
];

const MODES: { key: string; labelKey: string }[] = [
  { key: 'cash', labelKey: 'payments.cash' },
  { key: 'online', labelKey: 'payments.online' },
  { key: 'upi', labelKey: 'payments.upi' },
  { key: 'cheque', labelKey: 'payments.cheque' },
];

const DEFAULT_ADVANCE_PAID = false;
const DEFAULT_TYPE_ADVANCE = 'order_advance';
const DEFAULT_TYPE_AFTER_ADVANCE = 'order_milestone';

/**
 * A customer order can only ever receive ONE advance. Once an `order_advance`
 * payment exists (set when the order is created or recorded later), the
 * "Advance" chip is disabled and only Milestone / Balance remain selectable.
 */
export function PaymentModal({
  visible,
  orderId,
  suggestedAmount,
  maxAmount,
  advancePaid,
  onClose,
  onSaved,
}: {
  visible: boolean;
  orderId: number;
  suggestedAmount: number;
  maxAmount: number;
  advancePaid?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const hasAdvance = advancePaid ?? DEFAULT_ADVANCE_PAID;
  const initialType = hasAdvance ? DEFAULT_TYPE_AFTER_ADVANCE : DEFAULT_TYPE_ADVANCE;

  const [amount, setAmount] = useState(suggestedAmount > 0 ? String(suggestedAmount) : '');
  const [type, setType] = useState(initialType);
  const [mode, setMode] = useState('cash');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      setAmount(suggestedAmount > 0 ? String(suggestedAmount) : '');
      setType(hasAdvance ? DEFAULT_TYPE_AFTER_ADVANCE : DEFAULT_TYPE_ADVANCE);
      setMode('cash');
      setNote('');
    }
  }, [visible, suggestedAmount, hasAdvance]);

  const clampAmount = (text: string) => {
    const clean = text.replace(/[^\d.]/g, '');
    const value = parseFloat(clean);
    if (Number.isFinite(value) && maxAmount > 0 && value > maxAmount) {
      return String(maxAmount);
    }
    return clean;
  };

  const close = () => {
    setAmount(suggestedAmount > 0 ? String(suggestedAmount) : '');
    setType(initialType);
    setMode('cash');
    setNote('');
    onClose();
  };

  const submit = async () => {
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      showToast(t('payments.invalidAmount'), { variant: 'error' });
      return;
    }
    if (maxAmount > 0 && value > maxAmount) {
      showToast(
        t('payments.exceedsDue', { amount: formatRupees(maxAmount) }),
        { variant: 'error' },
      );
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest('/payments/receive', {
        method: 'POST',
        body: {
          order_id: orderId,
          amount: value,
          type,
          mode,
          note: note.trim() || undefined,
        },
        authenticated: true,
      });
      close();
      showToast(t('payments.recorded'), { variant: 'success' });
      onSaved();
    } catch (e) {
      showToast(e instanceof Error ? e.message : t('payments.couldNotRecord'), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.backdropInner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.headerRow}>
              <View style={styles.iconWrap}>
                <Icon name="payments" size={22} color={Palette.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{t('payments.recordPayment')}</Text>
                <Text style={styles.subtitle}>{t('payments.orderTitle', { id: orderId })}</Text>
              </View>
            </View>

            <View>
              <Text style={styles.label}>{t('payments.amount')}</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={(mv) => setAmount(clampAmount(mv))}
                placeholder="0"
                placeholderTextColor={Palette.outline}
                keyboardType="decimal-pad"
                autoFocus
              />
              {maxAmount > 0 ? (
                <Text style={styles.amountHint}>
                  {t('payments.remainingDue', { amount: formatRupees(maxAmount) })}
                </Text>
              ) : null}
            </View>

            <View>
              <Text style={styles.label}>{t('payments.paymentType')}</Text>
              <View style={styles.segmentRow}>
                {TYPES.map((tk) => {
                  const disabledAdvance = tk.key === 'order_advance' && hasAdvance;
                  const active = type === tk.key;
                  return (
                    <Pressable
                      key={tk.key}
                      onPress={() => setType(tk.key)}
                      disabled={disabledAdvance}
                      style={[
                        styles.segmentChip,
                        active && styles.segmentChipActive,
                        disabledAdvance && styles.segmentChipDisabled,
                      ]}>
                      <Text
                        style={[
                          styles.segmentText,
                          {
                            color: disabledAdvance
                              ? Palette.outline
                              : active
                                ? Palette.onPrimary
                                : Palette.onSurfaceVariant,
                          },
                        ]}>
                        {t(tk.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {hasAdvance ? (
                <Text style={styles.advanceHint}>
                  {t('payments.advanceAlready')}
                </Text>
              ) : null}
            </View>

            <View>
              <Text style={styles.label}>{t('payments.mode')}</Text>
              <View style={styles.segmentRow}>
                {MODES.map((md) => (
                  <Pressable
                    key={md.key}
                    onPress={() => setMode(md.key)}
                    style={[styles.segmentChip, mode === md.key && styles.segmentChipActive]}>
                    <Text
                      style={[
                        styles.segmentText,
                        { color: mode === md.key ? Palette.onPrimary : Palette.onSurfaceVariant },
                      ]}>
                      {t(md.labelKey)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text style={styles.label}>{t('payments.noteOptional')}</Text>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder={t('payments.notePlaceholder')}
                placeholderTextColor={Palette.outline}
              />
            </View>

            <View style={styles.buttonRow}>
              <Pressable style={styles.cancelButton} onPress={close} disabled={submitting}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, submitting && styles.buttonDisabled]}
                onPress={submit}
                disabled={submitting}>
                <Text style={styles.submitText}>{submitting ? t('common.saving') : t('payments.savePayment')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdropInner: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 14,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    width: '100%',
    maxWidth: 420,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Type.headlineMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  label: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
    marginBottom: 6,
  },
  amountHint: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
    marginTop: 6,
    fontFamily: 'Poppins_500Medium',
  },
  input: {
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceContainerLowest,
    color: Palette.onSurface,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  segmentChip: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
  },
  segmentChipDisabled: {
    opacity: 0.4,
    borderColor: Palette.outlineVariant,
    borderStyle: 'dashed',
  },
  advanceHint: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
    marginTop: 6,
    fontFamily: 'Poppins_500Medium',
  },
  segmentText: {
    ...Type.labelBold,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    height: Spacing.touchTarget,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  submitButton: {
    flex: 1,
    height: Spacing.touchTarget,
    backgroundColor: Palette.secondary,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    ...Type.labelBold,
    color: Palette.onSecondary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
