import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';

type ConfirmVariant = 'primary' | 'success' | 'danger';

export function ConfirmModal({
  visible,
  title,
  message,
  icon,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  submitting,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  submitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const colorMap: Record<ConfirmVariant, { bg: string; text: string; accent: string }> = {
    primary: { bg: Palette.primary, text: Palette.onPrimary, accent: 'rgba(138,109,59,0.12)' },
    success: { bg: '#3E6B4F', text: Palette.onPrimary, accent: 'rgba(62,107,79,0.12)' },
    danger: { bg: Palette.error, text: Palette.onPrimary, accent: 'rgba(179,70,62,0.12)' },
  };

  const tone = colorMap[variant];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: tone.accent }]}>
            <Icon name={icon ?? 'check'} size={28} color={tone.bg} />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? (
            <Text style={styles.message} numberOfLines={4}>
              {message}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.cancel,
                pressed && styles.buttonPressed,
              ]}
              onPress={onCancel}
              disabled={submitting}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                { backgroundColor: tone.bg },
                pressed && styles.buttonPressed,
              ]}
              onPress={onConfirm}
              disabled={submitting}>
              <Text style={styles.confirmText}>{submitting ? 'Please wait…' : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28,27,26,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.containerPadding,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 8,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    ...Type.headlineMd,
    color: Palette.onSurface,
    textAlign: 'center',
  },
  message: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    alignSelf: 'stretch',
  },
  cancel: {
    flex: 1,
    height: Spacing.touchTarget,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceContainerLow,
  },
  cancelText: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  confirmButton: {
    flex: 1,
    height: Spacing.touchTarget,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    ...Type.labelBold,
    color: Palette.onPrimary,
  },
  buttonPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
});