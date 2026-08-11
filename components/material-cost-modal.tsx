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

export function MaterialCostModal({
  visible,
  initial,
  submitLoading,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initial: number | null;
  submitLoading: boolean;
  onClose: () => void;
  onSubmit: (cost: number | null) => void;
}) {
  const { t } = useTranslation();
  const [cost, setCost] = useState('');

  useEffect(() => {
    if (visible) {
      setCost(initial != null ? String(initial) : '');
    }
  }, [visible, initial]);

  const canSubmit = cost.trim() === '' || (Number.isFinite(parseFloat(cost)) && parseFloat(cost) >= 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
                <Icon name="inventory_2" size={22} color={Palette.primary} />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title}>{t('materialCost.title')}</Text>
              </View>
            </View>

            <View>
              <Text style={styles.label}>{t('materialCost.materialCostLabel')}</Text>
              <TextInput
                style={styles.input}
                value={cost}
                onChangeText={(t) => setCost(t.replace(/[^\d.]/g, ''))}
                placeholder="0"
                placeholderTextColor={Palette.outline}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <View style={styles.buttonRow}>
              <Pressable style={styles.cancelButton} onPress={onClose} disabled={submitLoading}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.submitButton, (!canSubmit || submitLoading) && styles.buttonDisabled]}
                onPress={() =>
                  onSubmit(cost.trim() === '' ? null : parseFloat(cost))
                }
                disabled={!canSubmit || submitLoading}>
                <Text style={styles.submitText}>{submitLoading ? t('common.saving') : t('common.save')}</Text>
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
    maxWidth: 400,
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: Radius.lg,
    padding: 20,
    gap: 14,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
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
