import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { useToast } from '@/components/toast-provider';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';
import { apiRequest } from '@/lib/api';

const TYPES: { key: string; label: string }[] = [
  { key: 'order_advance', label: 'Advance' },
  { key: 'order_milestone', label: 'Milestone' },
  { key: 'order_balance', label: 'Balance' },
];

const MODES: { key: string; label: string }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'online', label: 'Online' },
  { key: 'upi', label: 'UPI' },
  { key: 'cheque', label: 'Cheque' },
];

export function PaymentModal({
  visible,
  orderId,
  suggestedAmount,
  onClose,
  onSaved,
}: {
  visible: boolean;
  orderId: number;
  suggestedAmount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(suggestedAmount > 0 ? String(suggestedAmount) : '');
  const [type, setType] = useState('order_advance');
  const [mode, setMode] = useState('cash');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const close = () => {
    setAmount(suggestedAmount > 0 ? String(suggestedAmount) : '');
    setType('order_advance');
    setMode('cash');
    setNote('');
    onClose();
  };

  const submit = async () => {
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      showToast('Please enter a valid amount greater than zero.', { variant: 'error' });
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
      showToast('Payment recorded.', { variant: 'success' });
      onSaved();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Could not record payment.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <Icon name="payments" size={22} color={Palette.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Record Payment</Text>
              <Text style={styles.subtitle}>Order #{orderId}</Text>
            </View>
          </View>

          <View>
            <Text style={styles.label}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ''))}
              placeholder="0"
              placeholderTextColor={Palette.outline}
              keyboardType="decimal-pad"
              autoFocus
            />
          </View>

          <View>
            <Text style={styles.label}>Payment Type</Text>
            <View style={styles.segmentRow}>
              {TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  onPress={() => setType(t.key)}
                  style={[styles.segmentChip, type === t.key && styles.segmentChipActive]}>
                  <Text
                    style={[
                      styles.segmentText,
                      { color: type === t.key ? Palette.onPrimary : Palette.onSurfaceVariant },
                    ]}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.label}>Mode</Text>
            <View style={styles.segmentRow}>
              {MODES.map((m) => (
                <Pressable
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  style={[styles.segmentChip, mode === m.key && styles.segmentChipActive]}>
                  <Text
                    style={[
                      styles.segmentText,
                      { color: mode === m.key ? Palette.onPrimary : Palette.onSurfaceVariant },
                    ]}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.label}>Note (optional)</Text>
            <TextInput
              style={styles.input}
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Cash advance"
              placeholderTextColor={Palette.outline}
            />
          </View>

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={close} disabled={submitting}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, submitting && styles.buttonDisabled]}
              onPress={submit}
              disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Saving…' : 'Save Payment'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
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
