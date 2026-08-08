import { LinearGradient } from 'expo-linear-gradient';
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

import { Icon } from '@/components/ui/icon';
import { Palette, Radius, Spacing, Type } from '@/constants/theme';

const HEADER_GRADIENT = [Palette.primary, '#6E552A'] as const;
const GOLD_SOFT = 'rgba(138,109,59,0.14)';
const GOLD_LINE = 'rgba(138,109,59,0.38)';

const ROLE_OPTIONS = [
  { label: 'Carpenter', icon: 'construction' },
  { label: 'Carving Master', icon: 'handyman' },
  { label: 'Turner', icon: 'auto_graph' },
  { label: 'Polisher', icon: 'format_paint' },
  { label: 'Painter', icon: 'brush' },
  { label: 'Designer', icon: 'insights' },
  { label: 'Finisher', icon: 'check_circle' },
  { label: 'Inlay Artist', icon: 'workspace_premium' },
  { label: 'Assistant', icon: 'person' },
  { label: 'Helper', icon: 'work' },
] as const;

function Field({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoFocus,
  required,
  gold,
  error,
}: {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad';
  autoFocus?: boolean;
  required?: boolean;
  gold?: boolean;
  error?: string;
}) {
  return (
    <View>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {required ? <Text style={styles.fieldRequired}>Required</Text> : null}
      </View>
      <View style={[styles.inputShell, gold && styles.inputShellGold, error && styles.inputShellError]}>
        <View style={[styles.inputIconWrap, gold && styles.inputIconWrapGold]}>
          <Icon name={icon} size={20} color={error ? Palette.error : Palette.primary} />
        </View>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Palette.outline}
          keyboardType={keyboardType}
          autoCorrect={false}
          autoFocus={autoFocus}
        />
      </View>
      {error ? (
        <View style={styles.fieldErrorRow}>
          <Icon name="error_outline" size={14} color={Palette.error} />
          <Text style={styles.fieldErrorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function KarigarModal({
  visible,
  onClose,
  onSubmit,
  submitLoading = false,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; role?: string; phone?: string; default_rate: number }) => void;
  submitLoading?: boolean;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Carpenter');
  const [defaultRate, setDefaultRate] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    default_rate?: string;
    phone?: string;
  }>({});

  useEffect(() => {
    if (visible) {
      setName('');
      setRole('Carpenter');
      setDefaultRate('');
      setPhone('');
      setErrors({});
    }
  }, [visible]);

  const clearError = (key: keyof typeof errors) => {
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const close = () => {
    setName('');
    setRole('Carpenter');
    setDefaultRate('');
    setPhone('');
    setErrors({});
    onClose();
  };

  const submit = () => {
    const next: typeof errors = {};

    if (name.trim().length === 0) {
      next.name = 'Karigar name is required.';
    }

    const rate = parseFloat(defaultRate);
    if (defaultRate.trim() === '' || !Number.isFinite(rate) || rate < 0) {
      next.default_rate = 'Enter the rate this karigar works at.';
    }

    if (phone.trim() !== '' && phone.trim().length !== 10) {
      next.phone = 'Phone must be a 10-digit number.';
    }

    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }

    onSubmit({
      name: name.trim(),
      role: role.trim() === '' ? undefined : role.trim(),
      default_rate: rate,
      phone: phone.trim() === '' ? undefined : phone.trim(),
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.card}>
          <LinearGradient
            colors={[...HEADER_GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}>
            <View style={styles.medallionOuter}>
              <View style={styles.medallion}>
                <Icon name="workspace_premium" size={18} color={Palette.primary} />
              </View>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>Add Karigar</Text>
            </View>
            <Pressable onPress={close} style={styles.closeButton} hitSlop={8}>
              <Icon name="remove" size={20} color={Palette.onPrimary} />
            </Pressable>
            <View style={styles.headerOrnament}>
              <View style={styles.ornamentLine} />
              <View style={styles.ornamentDiamond} />
              <View style={styles.ornamentLine} />
            </View>
          </LinearGradient>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.fields}>
              <Field
                icon="person"
                label="Full Name"
                placeholder="e.g. Suresh Kumar"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  clearError('name');
                }}
                autoFocus
                required
                error={errors.name}
              />

              <View>
                <Text style={styles.fieldLabel}>Select Role</Text>
                <View style={styles.roleGrid}>
                  {ROLE_OPTIONS.map((opt) => {
                    const active = role === opt.label;
                    return (
                      <Pressable
                        key={opt.label}
                        onPress={() => setRole(active ? '' : opt.label)}
                        style={[
                          styles.roleChip,
                          active && styles.roleChipActive,
                        ]}>
                        <Icon
                          name={opt.icon}
                          size={17}
                          color={active ? Palette.onPrimary : Palette.primary}
                        />
                        <Text
                          style={[
                            styles.roleChipText,
                            { color: active ? Palette.onPrimary : Palette.onSurfaceVariant },
                          ]}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Field
                icon="payments"
                label="Default Rate (₹)"
                placeholder="e.g. 1500"
                value={defaultRate}
                onChangeText={(t) => {
                  setDefaultRate(t.replace(/[^\d.]/g, ''));
                  clearError('default_rate');
                }}
                keyboardType="decimal-pad"
                required
                gold
                error={errors.default_rate}
              />

              <Field
                icon="phone"
                label="Phone (Optional)"
                placeholder="10-digit mobile number"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t.replace(/[^\d]/g, '').slice(0, 10));
                  clearError('phone');
                }}
                keyboardType="number-pad"
                error={errors.phone}
              />
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelButton} onPress={close} disabled={submitLoading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <LinearGradient
              colors={[...HEADER_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}>
              <View style={styles.submitSheen} pointerEvents="none" />
              <Pressable
                style={[styles.submitButton, submitLoading && styles.buttonDisabled]}
                onPress={submit}
                disabled={submitLoading}>
                <Icon name="workspace_premium" size={20} color={Palette.onPrimary} />
                <Text style={styles.submitText}>
                  {submitLoading ? 'Saving…' : 'Add Karigar'}
                </Text>
              </Pressable>
            </LinearGradient>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,27,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: Radius.xl,
    gap: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: GOLD_LINE,
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 18,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  medallionOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.10)',
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  medallion: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: Palette.onPrimary,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOrnament: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    alignSelf: 'stretch',
    paddingHorizontal: 28,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  ornamentDiamond: {
    width: 7,
    height: 7,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  fields: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    ...Type.labelBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: Palette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  fieldRequired: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Palette.primary,
    backgroundColor: GOLD_SOFT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    borderRadius: Radius.lg,
    backgroundColor: Palette.surfaceContainerLowest,
    overflow: 'hidden',
  },
  inputShellGold: {
    borderColor: GOLD_LINE,
    backgroundColor: '#FFFDF8',
  },
  inputShellError: {
    borderColor: Palette.error,
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  fieldErrorText: {
    ...Type.bodyMd,
    fontSize: 12,
    color: Palette.error,
    fontFamily: 'Poppins_500Medium',
    flexShrink: 1,
  },
  inputIconWrap: {
    width: 50,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_SOFT,
    borderRightWidth: 1,
    borderRightColor: GOLD_LINE,
  },
  inputIconWrapGold: {
    backgroundColor: Palette.primaryContainer,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    color: Palette.onSurface,
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: GOLD_LINE,
    backgroundColor: Palette.surfaceContainerLowest,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  roleChipActive: {
    backgroundColor: Palette.primary,
    borderColor: Palette.primary,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  roleChipText: {
    ...Type.labelBold,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    height: Spacing.touchTarget,
    borderWidth: 1,
    borderColor: GOLD_LINE,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.surfaceContainerLow,
  },
  cancelText: {
    ...Type.labelBold,
    letterSpacing: 1,
    color: Palette.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  submitGradient: {
    flex: 1.4,
    borderRadius: Radius.lg,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
    overflow: 'hidden',
  },
  submitSheen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
  },
  submitButton: {
    flex: 1,
    height: Spacing.touchTarget,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitText: {
    ...Type.labelBold,
    letterSpacing: 1,
    color: Palette.onPrimary,
    textTransform: 'uppercase',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
