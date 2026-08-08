import type { PropsWithChildren, ReactElement, ReactNode, Ref } from 'react';
import { ScrollView, StyleSheet, type RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Palette, Spacing } from '@/constants/theme';

export type ScreenScrollRef = { current: ScrollView | null };

export function Screen({
  children,
  header,
  showHeader = true,
  refreshControl,
  scrollRef,
}: PropsWithChildren<{
  header?: ReactNode;
  showHeader?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  scrollRef?: ScreenScrollRef;
}>) {
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      {header ?? (showHeader ? <AppHeader /> : null)}
      <ScrollView
        ref={scrollRef as Ref<ScrollView>}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.containerPadding,
    paddingBottom: 110,
    gap: Spacing.section,
  },
});
