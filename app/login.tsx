import { Image } from 'expo-image';
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

import { Icon } from '@/components/ui/icon';
import { Palette, Radius, Type } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { ApiError } from '@/lib/api';

const BG_GRADIENT = ['#FFF9F1', '#FCF5EC', '#F7EBD8'] as const;

const trustItems = [
  { icon: 'bolt', label: 'Instant OTP' },
  { icon: 'verified_user', label: 'Bank-level Secure' },
  { icon: 'security', label: 'No Password' },
];

function GradientButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}>
      <Text style={styles.buttonText}>{loading ? 'Please wait…' : label}</Text>
    </Pressable>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();

  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendIn, setResendIn] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpInputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cardAnim = useRef(new Animated.Value(0)).current;
  const brandAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(brandAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardAnim, brandAnim]);

  const startResendTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setResendIn(30);
    setCanResend(false);
    timerRef.current = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (step === 'otp') {
      startResendTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [step]);

  const onContinue = async () => {
    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setSending(true);
    try {
      const result = await sendOtp(phone);
      setDevOtp(result.dev_otp ?? '');
      setOtp('');
      setStep('otp');
      setTimeout(focusOtpInput, 150);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send OTP. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const onResend = async () => {
    setOtp('');
    setError('');
    setSending(true);
    try {
      const result = await sendOtp(phone);
      setDevOtp(result.dev_otp ?? '');
      startResendTimer();
      focusOtpInput();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not resend OTP. Please try again.');
      startResendTimer();
    } finally {
      setSending(false);
    }
  };

  const onVerify = async () => {
    if (otp.length !== 4) {
      setError('Enter the 4-digit OTP to continue.');
      return;
    }
    setError('');
    setVerifying(true);
    try {
      const hasWorkshop = await verifyOtp(phone, otp);
      router.replace(hasWorkshop ? '/(tabs)' : '/onboarding');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        triggerShake();
        setOtp('');
        setError('Incorrect OTP. Please try again.');
      } else if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: -12,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 12,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onChangeNumber = () => {
    setStep('phone');
    setError('');
  };

  const focusOtpInput = () => {
    otpInputRef.current?.blur();
    setTimeout(() => otpInputRef.current?.focus(), 80);
  };

  const cardStyle = {
    opacity: cardAnim,
    transform: [
      {
        translateX: shakeAnim,
      },
      {
        translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }),
      },
    ],
  };

  return (
    <LinearGradient colors={[...BG_GRADIENT]} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Decorative glows */}
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
            <Animated.View
              style={[
                styles.brand,
                { opacity: brandAnim, transform: [{ scale: brandAnim }] },
              ]}>
              <View style={styles.logoShell}>
                <View style={styles.logoRing}>
                  <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
                </View>
              </View>
              <Text style={styles.brandName}>Craft Flow</Text>
              <View style={styles.brandTagline}>
                <Text style={styles.brandTaglineText}>One app for orders, karigars & money</Text>
              </View>
            </Animated.View>

            <Animated.View style={[styles.card, cardStyle]}>
              {step === 'phone' ? (
                <>
                  <View style={styles.stepChip}>
                    <Icon name="phone" size={16} color={Palette.primary} />
                    <Text style={styles.stepChipText}>PHONE VERIFICATION</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>
                    Enter your 10-digit mobile number to continue.
                  </Text>

                  <View style={styles.inputShell}>
                    <View style={styles.countryPill}>
                      <Text style={styles.flag}>🇮🇳</Text>
                      <Text style={styles.countryCode}>+91</Text>
                    </View>
                    <View style={styles.inputDivider} />
                    <TextInput
                      style={styles.input}
                      placeholder="98765 43210"
                      placeholderTextColor={Palette.outline}
                      keyboardType="number-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
                    />
                  </View>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <Text style={styles.footerNote}>
                    By continuing you agree to our Terms of Service and Privacy Policy.
                  </Text>

                  <GradientButton label="Continue" onPress={onContinue} loading={sending} />
                </>
              ) : (
                <>
                  <View style={styles.stepChip}>
                    <Icon name="verified_user" size={16} color={Palette.primary} />
                    <Text style={styles.stepChipText}>SECURE OTP CHECK</Text>
                  </View>
                  <View style={styles.otpHeader}>
                    <View style={styles.shieldIconWrap}>
                      <Icon name="security" size={22} color={Palette.primary} />
                    </View>
                    <View style={styles.otpHeaderText}>
                      <Text style={styles.cardTitle}>Enter the 4-digit code</Text>
                      <Text style={styles.cardSubtitle}>
                        Sent to +91 {phone}{' '}
                        <Text style={styles.changeText} onPress={onChangeNumber}>
                          Change
                        </Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.devOtpPill}>
                    <Icon name="lock" size={14} color={Palette.primary} />
                    <Text style={styles.devOtpText}>Dev OTP: {devOtp}</Text>
                  </View>

                  <Pressable style={styles.otpBoxes} onPress={focusOtpInput}>
                    {[0, 1, 2, 3].map((i) => (
                      <View key={i} style={[styles.otpBox, i === otp.length && styles.otpBoxActive]}>
                        <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
                      </View>
                    ))}
                  </Pressable>
                  <TextInput
                    ref={otpInputRef}
                    style={styles.otpHiddenInput}
                    value={otp}
                    onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <Text style={styles.footerNote}>
                    By continuing you agree to our Terms of Service and Privacy Policy.
                  </Text>

                  <GradientButton
                    label="Verify & Continue"
                    onPress={onVerify}
                    loading={verifying}
                  />

                  <Pressable
                    style={styles.resendRow}
                    onPress={onResend}
                    disabled={!canResend}
                    hitSlop={6}>
                    <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
                    <Text style={[styles.resendLink, !canResend && styles.linkDisabled]}>
                      {canResend ? 'Resend OTP' : `Resend in ${resendIn}s`}
                    </Text>
                  </Pressable>
                </>
              )}
            </Animated.View>

            <View style={styles.trustRow}>
              {trustItems.map((item) => (
                <View key={item.label} style={styles.trustItem}>
                  <Icon name={item.icon} size={18} color={Palette.secondary} />
                  <Text style={styles.trustLabel}>{item.label}</Text>
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
    top: '38%',
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
  brand: {
    alignItems: 'center',
    gap: 10,
  },
  logoShell: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  logoRing: {
    width: 116,
    height: 116,
    borderRadius: 30,
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  logo: {
    width: 104,
    height: 104,
  },
  brandName: {
    ...Type.display,
    color: Palette.primary,
  },
  brandTagline: {
    backgroundColor: 'rgba(138,109,59,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(138,109,59,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  brandTaglineText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    borderRadius: 24,
    padding: 24,
    gap: 14,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  stepChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(138,109,59,0.10)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 2,
  },
  stepChipText: {
    ...Type.labelBold,
    color: Palette.primary,
  },
  cardTitle: {
    ...Type.headlineMd,
    color: Palette.onSurface,
    fontFamily: 'Poppins_700Bold',
  },
  cardSubtitle: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: Palette.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 2,
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: '100%',
  },
  flag: {
    fontSize: 16,
  },
  countryCode: {
    ...Type.bodyLg,
    color: Palette.onSurface,
    fontFamily: 'Poppins_600SemiBold',
  },
  inputDivider: {
    width: 1,
    height: 26,
    backgroundColor: Palette.outlineVariant,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    color: Palette.onSurface,
    fontFamily: 'Poppins_500Medium',
    fontSize: 17,
    letterSpacing: 1,
  },
  button: {
    height: 56,
    backgroundColor: Palette.secondary,
    borderBottomWidth: 4,
    borderBottomColor: Palette.onSecondaryContainer,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: Palette.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...Type.labelBold,
    color: Palette.onSecondary,
    fontSize: 15,
  },
  errorText: {
    ...Type.bodyMd,
    color: Palette.error,
    fontFamily: 'Poppins_500Medium',
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shieldIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(138,109,59,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpHeaderText: {
    flex: 1,
    gap: 2,
  },
  changeText: {
    color: Palette.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  devOtpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(138,109,59,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(138,109,59,0.18)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  devOtpText: {
    ...Type.labelBold,
    color: Palette.primary,
    letterSpacing: 1,
  },
  otpBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 2,
  },
  otpBox: {
    flex: 1,
    height: 60,
    borderWidth: 2,
    borderColor: Palette.outlineVariant,
    borderRadius: 14,
    backgroundColor: Palette.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: Palette.primary,
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  otpDigit: {
    ...Type.headlineLg,
    color: Palette.onSurface,
    fontFamily: 'Poppins_700Bold',
  },
  otpHiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  resendText: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
  },
  resendLink: {
    ...Type.bodyMd,
    color: Palette.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  linkDisabled: {
    color: Palette.outline,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustLabel: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    fontSize: 12,
  },
  footerNote: {
    ...Type.bodyMd,
    color: Palette.onSurfaceVariant,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
  },
});
