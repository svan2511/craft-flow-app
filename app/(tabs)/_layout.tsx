import { Redirect, Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CustomTabBar } from '@/components/custom-tab-bar';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function TabLayout() {
  const { loaded, phone } = useAuth();
  const { t } = useTranslation();

  if (!loaded) {
    return null;
  }

  if (!phone) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.primary,
        tabBarInactiveTintColor: '#8A857C',
      }}>
      <Tabs.Screen name="index" options={{ title: t('tabs.dashboard'), tabBarLabel: t('tabs.dashboard') }} />
      <Tabs.Screen name="job-cards" options={{ title: t('tabs.orders'), tabBarLabel: t('tabs.orders') }} />
      <Tabs.Screen name="karigars" options={{ title: t('tabs.karigars'), tabBarLabel: t('tabs.karigars') }} />
      <Tabs.Screen name="customers" options={{ title: t('tabs.customers'), tabBarLabel: t('tabs.customers') }} />
      <Tabs.Screen name="reports" options={{ title: t('tabs.reports'), tabBarLabel: t('tabs.reports') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarLabel: t('tabs.profile') }} />
    </Tabs>
  );
}
