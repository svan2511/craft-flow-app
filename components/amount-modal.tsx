import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';

export function AmountModal({
  visible,
  title,
  subtitle,
  confirmLabel,
  notePlaceholder = 'e.g. Cash advance',
  onClose,
  onSubmit,
  submitLoading = false,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  confirmLabel: string;
  notePlaceholder?: string;
  onClose: () => void;
  onSubmit: (amount: number, note: string) => void;
  submitLoading?: boolean;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const close = () => {
    setAmount('');
    setNote('');
    onClose();
  };

  const submit = () => {
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }
    onSubmit(value, note.trim());
  };

  const contentStyle = (): ViewStyle => ({
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
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={contentStyle()}>
          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <Icon name="payments" size={22} color={Palette.primary} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
            <Text style={styles.label}>Note (optional)</Text>
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
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitButton, submitLoading && styles.buttonDisabled]}
              onPress={submit}
              disabled={submitLoading}>
              <Text style={styles.submitText}>{submitLoading ? 'Saving…' : confirmLabel}</Text>
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
    padding: 20,
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
