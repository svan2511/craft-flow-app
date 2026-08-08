import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Palette } from '@/constants/theme';

const TAB_ICONS: Record<string, string> = {
  index: 'dashboard',
  'job-cards': 'assignment',
  karigars: 'groups',
  customers: 'person',
  reports: 'analytics',
  profile: 'account',
};

const ROYAL_GOLD = '#B98A2E';
const VISIBLE_TABS = 4;
const CONTAINER_PADDING = 10;

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const routes = state.routes;
  const count = routes.length;
  const barWidth = screenWidth - CONTAINER_PADDING * 2;
  const tabWidth = barWidth / VISIBLE_TABS;

  const indicatorX = useSharedValue(0);

  useEffect(() => {
    const x = tabWidth * state.index + tabWidth / 2 - 4;
    indicatorX.value = withSpring(x, { damping: 18, stiffness: 240, mass: 0.7 });

    const maxOffset = Math.max(count - VISIBLE_TABS, 0);
    const targetTab = Math.min(Math.max(state.index - VISIBLE_TABS / 2, 0), maxOffset);
    scrollRef.current?.scrollTo({ x: targetTab * tabWidth, animated: true });
  }, [state.index, tabWidth, indicatorX, count]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.bar, { width: barWidth }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEnabled={count > VISIBLE_TABS}>
          <View style={[styles.track, { width: tabWidth * count }]}>
            <Animated.View pointerEvents="none" style={[styles.indicator, indicatorStyle]}>
              <View style={styles.indicatorCore} />
            </Animated.View>

            {routes.map((route, index) => {
              const isActive = state.index === index;
              const options = descriptors[route.key].options;
              const label = (options.tabBarLabel as string) ?? route.name;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isActive && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <Pressable key={route.key} onPress={onPress} style={[styles.tab, { width: tabWidth }]} hitSlop={4}>
                  <Icon
                    name={TAB_ICONS[route.name] ?? 'circle'}
                    size={22}
                    color={isActive ? ROYAL_GOLD : Palette.onSurfaceVariant}
                  />
                  <Text style={[styles.label, isActive ? styles.labelActive : styles.labelIdle]} numberOfLines={1}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  bar: {
    backgroundColor: Palette.surfaceContainerLowest,
    borderRadius: 28,
    paddingVertical: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(207,201,191,0.8)',
    shadowColor: '#1C1B1A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  indicatorCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ROYAL_GOLD,
    shadowColor: ROYAL_GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  tab: {
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
  labelActive: {
    fontFamily: 'Poppins_700Bold',
    color: ROYAL_GOLD,
  },
  labelIdle: {
    fontFamily: 'Poppins_500Medium',
    color: Palette.onSurfaceVariant,
  },
});
