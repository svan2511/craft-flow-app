import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui/icon';
import { Palette, Radius, Type } from '@/constants/theme';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const BG_GRADIENT = ['#FFF9F1', '#FCF5EC', '#F7EBD8'] as const;

function FormField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  editable = true,
  optional = false,
  multiline = false,
}: {
  icon: string;
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
  editable?: boolean;
  optional?: boolean;
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const { t } = useTranslation();

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label} {optional ? <Text style={styles.optionalMark}>{t('common.optional')}</Text> : null}
      </Text>
      <View
        style={[
          styles.inputShell,
          focused && styles.inputShellFocused,
          !editable && styles.inputShellReadonly,
          multiline && styles.inputShellMultiline,
        ]}>
        <View style={styles.inputIconWrap}>
          <Icon name={icon} size={18} color={focused ? Palette.primary : Palette.onSurfaceVariant} />
        </View>
        <TextInput
          style={[styles.input, !editable && styles.inputReadonlyText, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Palette.outline}
          keyboardType={keyboardType}
          editable={editable}
          autoCapitalize={editable ? 'words' : 'none'}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { phone, saveBusiness } = useAuth();

  const [workshopName, setWorkshopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, cardAnim]);

  const onSave = async () => {
    if (workshopName.trim().length === 0 || ownerName.trim().length === 0 || city.trim().length === 0) {
      setError(t('auth.fillRequired'));
      return;
    }
    setError('');
    setSaving(true);
    try {
      await saveBusiness({
        workshopName: workshopName.trim(),
        ownerName: ownerName.trim(),
        city: city.trim(),
        phone: phone ?? '',
        address: address.trim(),
      });
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('auth.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const headerStyle = {
    opacity: headerAnim,
    transform: [
      {
        translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-18, 0] }),
      },
    ],
  };

  const cardStyle = {
    opacity: cardAnim,
    transform: [
      {
        translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }),
      },
    ],
  };

  return (
    <LinearGradient colors={[...BG_GRADIENT]} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.glowTopRight} />
        <View style={styles.glowBottomLeft} />
        <View style={styles.glowCenter} />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.header, headerStyle]}>
              <View style={styles.badge}>
                <Icon name="workspace_premium" size={14} color={Palette.primary} />
                <Text style={styles.badgeText}>{t('auth.businessSetup')}</Text>
              </View>
              <Text style={styles.subtitle}>
                {t('auth.setupSubtitle')}
              </Text>
            </Animated.View>

            <Animated.View style={[styles.card, cardStyle]}>
              <FormField
                icon="store"
                label={t('auth.workshopName')}
                value={workshopName}
                onChangeText={setWorkshopName}
                placeholder="e.g. Verma Furniture Workshop"
              />
              <FormField
                icon="person"
                label={t('auth.ownerName')}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="e.g. Ramesh Verma"
              />
              <FormField
                icon="place"
                label={t('auth.city')}
                value={city}
                onChangeText={setCity}
                placeholder="e.g. Saharanpur"
              />
              <FormField icon="phone" label={t('auth.mobileNumber')} value={phone ?? ''} editable={false} />
              <FormField
                icon="home"
                label={t('auth.address')}
                value={address}
                onChangeText={setAddress}
                placeholder="e.g. 12, Station Road, Saharanpur"
                multiline
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  pressed && styles.buttonPressed,
                  saving && styles.buttonDisabled,
                ]}
                onPress={onSave}
                disabled={saving}>
                <Text style={styles.saveButtonText}>
                  {saving ? t('common.saving') : t('common.saveMore')}
                </Text>
                <Icon name="arrow_forward" size={18} color={Palette.onSecondary} />
              </Pressable>
            </Animated.View>

            <View style={styles.benefitsRow}>
              {[
                { icon: 'security', label: t('auth.privateSecure') },
                { icon: 'verified_user', label: t('auth.oneTimeSetup') },
                { icon: 'bolt', label: t('auth.instantStart') },
              ].map((item) => (
                <View key={item.label} style={styles.benefitItem}>
                  <Icon name={item.icon} size={16} color={Palette.secondary} />
                  <Text style={styles.benefitText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  glowTopRight: {
    position: 'absolute',
    top: -90,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(138,109,59,0.14)',
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -110,
    left: -110,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(138,109,59,0.10)',
  },
  glowCenter: {
    position: 'absolute',
    top: '42%',
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 32,
    justifyContent: 'center',
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(138,109,59,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(138,109,59,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  badgeText: {
    ...Type.labelBold,
    color: Palette.primary,
    letterSpacing: 1.2,
  },
  subtitle: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    borderRadius: 24,
    padding: 22,
    gap: 15,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    ...Type.labelBold,
    color: Palette.onSurfaceVariant,
  },
  optionalMark: {
    color: Palette.outline,
    textTransform: 'none',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 1.5,
    borderColor: Palette.outlineVariant,
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputShellFocused: {
    borderColor: Palette.primary,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  inputShellReadonly: {
    backgroundColor: Palette.surfaceContainerLow,
    borderColor: Palette.outlineVariant,
  },
  inputShellMultiline: {
    height: 96,
    alignItems: 'flex-start',
    paddingTop: 14,
  },
  inputIconWrap: {
    paddingLeft: 14,
    paddingRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingRight: 14,
    color: Palette.onSurface,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
  },
  inputMultiline: {
    height: '100%',
    paddingTop: 0,
  },
  inputReadonlyText: {
    color: Palette.onSurfaceVariant,
  },
  errorText: {
    ...Type.bodyMd,
    color: Palette.error,
    fontFamily: 'Poppins_500Medium',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButton: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.secondary,
    borderBottomWidth: 4,
    borderBottomColor: Palette.onSecondaryContainer,
    borderRadius: 16,
    marginTop: 2,
    shadowColor: Palette.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  saveButtonText: {
    ...Type.labelBold,
    color: Palette.onSecondary,
    fontSize: 15,
  },
  benefitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    fontSize: 13,
  },
});
