import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Palette, Radius, Type } from '@/constants/theme';

type ToastVariant = 'success' | 'error' | 'info';

type ToastOptions = {
  variant?: ToastVariant;
  duration?: number;
};

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
  opacity: Animated.Value;
};

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

const VARIANT_STYLE: Record<
  ToastVariant,
  { icon: string; tint: string; iconColor: string; label: string }
> = {
  success: { icon: 'check_circle', tint: '#E6F2E9', iconColor: '#3E6B4F', label: 'Success' },
  error: { icon: 'error_outline', tint: '#F7E0DC', iconColor: '#B3463E', label: 'Error' },
  info: { icon: 'info', tint: '#E8E3D9', iconColor: '#7A6A4F', label: 'Info' },
};

const TOAST_ICONS: Record<string, string> = {
  info: 'info',
  warning: 'warning',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => {
      const item = prev.find((t) => t.id === id);
      if (item) {
        Animated.timing(item.opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => {
          setToasts((cur) => cur.filter((t) => t.id !== id));
        });
      }
      return prev;
    });
  }, []);

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = nextId.current++;
      const variant = options?.variant ?? 'info';
      const opacity = new Animated.Value(0);
      setToasts((prev) => [...prev.slice(-2), { id, message, variant, opacity }]);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(options?.duration ?? 2400),
      ]).start(() => dismiss(id));
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View style={styles.host} pointerEvents="box-none">
        {toasts.map((toast) => {
          const meta = VARIANT_STYLE[toast.variant];
          const icon = TOAST_ICONS[toast.variant] ?? meta.icon;
          return (
            <Animated.View
              key={toast.id}
              style={[styles.toast, { backgroundColor: meta.tint, opacity: toast.opacity }]}>
              <Pressable style={styles.toastContent} onPress={() => dismiss(toast.id)}>
                <View style={[styles.iconWrap, { backgroundColor: meta.iconColor }]}>
                  <Icon name={icon} size={18} color={Palette.onPrimary} />
                </View>
                <Text style={styles.message} numberOfLines={3}>
                  {toast.message}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 60,
    zIndex: 1000,
    gap: 8,
  },
  toast: {
    borderRadius: Radius.pill,
    padding: 10,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...Type.bodyMd,
    color: Palette.onSurface,
    flex: 1,
  },
});
