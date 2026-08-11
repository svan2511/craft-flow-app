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
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { formatRupees } from '@/lib/format';

export type KarigarMoneyOrder = {
  id: number;
  order_no: string;
  item_name: string;
  pending: number;
};

export function KarigarMoneyModal({
  visible,
  mode,
  title,
  subtitle,
  orders,
  confirmLabel,
  notePlaceholder,
  onClose,
  onSubmit,
  submitLoading = false,
}: {
  visible: boolean;
  mode: 'advance' | 'settle';
  title: string;
  subtitle?: string;
  orders: KarigarMoneyOrder[];
  confirmLabel: string;
  notePlaceholder?: string;
  onClose: () => void;
  onSubmit: (amount: number, note: string, orderId: number | null) => void;
  submitLoading?: boolean;
}) {
  const { t } = useTranslation();
  const [orderId, setOrderId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      const first = orders[0]?.id ?? null;
      setOrderId(first);
      setAmount(first !== null && mode === 'settle' ? String(orders[0].pending) : '');
      setNote('');
      setOpen(false);
    }
  }, [visible, mode, orders]);

  const selected = orders.find((o) => o.id === orderId) ?? null;

  const pickOrder = (id: number | null) => {
    setOrderId(id);
    setOpen(false);
    if (mode === 'settle') {
      const next = orders.find((o) => o.id === id);
      setAmount(next ? String(next.pending) : '');
    }
  };

  const close = () => {
    setOpen(false);
    setAmount('');
    setNote('');
    onClose();
  };

  const submit = () => {
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    onSubmit(value, note.trim(), orderId);
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
                <Icon
                  name={mode === 'settle' ? 'check_circle' : 'payments'}
                  size={22}
                  color={Palette.primary}
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
            </View>

            <View>
              <Text style={styles.label}>{t('karigarMoney.order')}</Text>
              {orders.length === 0 ? (
                <View style={styles.noOrders}>
                  <Text style={styles.noOrdersText}>
                    {t('karigarMoney.noOrders')}
                  </Text>
                </View>
              ) : (
                <View>
                  <Pressable
                    onPress={() => setOpen((o) => !o)}
                    style={[styles.pickerField, open && styles.pickerFieldOpen]}>
                    <View style={styles.pickerIcon}>
                      <Icon name="assignment" size={18} color={Palette.primary} />
                    </View>
                    <View style={styles.pickerInfo}>
                      {selected ? (
                        <>
                          <Text style={styles.pickerName} numberOfLines={1}>
                            #{selected.order_no} · {selected.item_name}
                          </Text>
                          {mode === 'settle' ? (
                            <Text style={[styles.pickerHint, { color: Palette.danger }]}>
                              {t('karigarMoney.pendingAmount', { amount: formatRupees(selected.pending) })}
                            </Text>
                          ) : null}
                        </>
                      ) : (
                        <Text style={styles.pickerPlaceholder}>{t('karigarMoney.selectOrder')}</Text>
                      )}
                    </View>
                    <Icon
                      name="arrow_drop_down"
                      size={22}
                      color={Palette.onSurfaceVariant}
                      style={open && styles.pickerChevronOpen}
                    />
                  </Pressable>

                  {open ? (
                    <View style={styles.pickerMenu}>
                      <ScrollView
                        style={styles.pickerList}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}>
                        {orders.map((order) => {
                          const active = order.id === orderId;
                          return (
                            <Pressable
                              key={order.id}
                              onPress={() => pickOrder(order.id)}
                              style={[styles.pickerOption, active && styles.pickerOptionActive]}>
                              <View style={styles.optionIcon}>
                                <Icon
                                  name={active ? 'check_circle' : 'assignment'}
                                  size={16}
                                  color={active ? Palette.primary : Palette.outline}
                                />
                              </View>
                              <View style={styles.optionInfo}>
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.optionName,
                                    { color: active ? Palette.primary : Palette.onSurface },
                                  ]}>
                                  #{order.order_no} · {order.item_name}
                                </Text>
                                {mode === 'settle' ? (
                                  <Text style={[styles.optionHint, { color: Palette.danger }]}>
                                    {t('karigarMoney.pendingAmount', { amount: formatRupees(order.pending) })}
                                  </Text>
                                ) : null}
                              </View>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
              )}
            </View>

            <View>
              <Text style={styles.label}>{t('karigarMoney.amount')}</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={(mv) => setAmount(mv.replace(/[^\d.]/g, ''))}
                placeholder="0"
                placeholderTextColor={Palette.outline}
                keyboardType="decimal-pad"
              />
            </View>

            <View>
              <Text style={styles.label}>{t('karigarMoney.noteOptional')}</Text>
              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder={notePlaceholder}
                placeholderTextColor={Palette.outline}
              />
            </View>

            <View style={styles.buttonRow}>
              <Pressable style={styles.cancelButton} onPress={close} disabled={submitLoading}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, submitLoading && styles.buttonDisabled]}
                onPress={submit}
                disabled={submitLoading}>
                <Text style={styles.submitText}>{submitLoading ? t('common.saving') : confirmLabel}</Text>
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
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 14,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 12,
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
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceContainerLowest,
  },
  pickerFieldOpen: {
    borderColor: Palette.primary,
  },
  pickerIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: Palette.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerInfo: {
    flex: 1,
    gap: 1,
  },
  pickerName: {
    ...Type.bodyLg,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  pickerPlaceholder: {
    ...Type.bodyLg,
    color: Palette.onSurfaceVariant,
  },
  pickerHint: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  pickerChevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  pickerMenu: {
    marginTop: 6,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceContainerLowest,
    overflow: 'hidden',
  },
  pickerList: {
    maxHeight: 200,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  pickerOptionActive: {
    backgroundColor: Palette.primaryContainer,
  },
  optionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    gap: 1,
  },
  optionName: {
    ...Type.bodyMd,
    fontFamily: 'Poppins_600SemiBold',
  },
  optionHint: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    fontSize: 12,
  },
  noOrders: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.md,
    backgroundColor: Palette.surfaceContainerLow,
  },
  noOrdersText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
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
