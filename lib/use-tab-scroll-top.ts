import { useNavigation } from 'expo-router';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ParamListBase } from '@react-navigation/native';
import { useEffect, type RefObject } from 'react';
import { type ScrollView } from 'react-native';

type TabNavigation = BottomTabNavigationProp<ParamListBase>;

/**
 * Scrolls a tab screen's ScrollView to the top whenever that specific tab is
 * pressed — in BOTH directions (switching to it, or re-tapping the active tab).
 * React Navigation targets the `tabPress` event at the pressed route, so this
 * listener only fires for the screen whose tab button was pressed, and it also
 * fires before the screen fully regains focus (the built-in `useScrollToTop`
 * only handles re-tapping the already-focused tab).
 */
export function useTabScrollToTop(scrollRef: RefObject<ScrollView | null>) {
  const navigation = useNavigation<TabNavigation>();

  useEffect(() => {
    return navigation.addListener('tabPress', () => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      });
    });
  }, [navigation, scrollRef]);
}