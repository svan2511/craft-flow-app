import { LinearGradient } from 'expo-linear-gradient';
import { createContext, type PropsWithChildren, useContext, useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';

import { Palette } from '@/constants/theme';

const SHIMMER_BASE = '#EDE9E2';
const SHIMMER_HIGHLIGHT = 'rgba(255,255,255,0.75)';

type ShimmerContextValue = SharedValue<number> | null;

const ShimmerContext = createContext<ShimmerContextValue>(null);

function Shimmer({ width = 240 }: { width?: number }) {
  const progress = useContext(ShimmerContext);

  const overlayStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -width + (progress?.value ?? 0) * (width * 2) }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
      <LinearGradient
        colors={['transparent', SHIMMER_HIGHLIGHT, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.overlayGradient, { width }]}
      />
    </Animated.View>
  );
}

export function Skeleton({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, false);
    return () => {
      progress.value = 0;
    };
  }, [progress]);

  return (
    <ShimmerContext.Provider value={progress}>
      <View style={style}>{children}</View>
    </ShimmerContext.Provider>
  );
}

export function SkeletonBlock({
  width,
  height,
  radius = 12,
  style,
}: {
  width?: DimensionValue;
  height: DimensionValue;
  radius?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.block, { width: width ?? '100%', height, borderRadius: radius }, style]}>
      <Shimmer />
    </View>
  );
}

export function SkeletonText({
  width,
  height = 14,
  radius = 6,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  return <SkeletonBlock width={width} height={height} radius={radius} style={style} />;
}

export function SkeletonCircle({ size, style }: { size: number; style?: ViewStyle }) {
  return <SkeletonBlock width={size} height={size} radius={size / 2} style={style} />;
}

export function SkeletonCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <View style={[styles.card, style]}>
      {children}
      <Shimmer />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: SHIMMER_BASE,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Palette.outlineVariant,
    padding: 16,
    overflow: 'hidden',
  },
  overlay: {
    overflow: 'hidden',
  },
  overlayGradient: {
    flex: 1,
  },
});
