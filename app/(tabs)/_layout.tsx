import { Redirect, Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/custom-tab-bar';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function TabLayout() {
  const { loaded, phone } = useAuth();

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
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }} />
      <Tabs.Screen name="job-cards" options={{ title: 'Orders', tabBarLabel: 'Orders' }} />
      <Tabs.Screen name="karigars" options={{ title: 'Karigars', tabBarLabel: 'Karigars' }} />
      <Tabs.Screen name="customers" options={{ title: 'Customers', tabBarLabel: 'Customers' }} />
      <Tabs.Screen name="reports" options={{ title: 'Reports', tabBarLabel: 'Reports' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarLabel: 'Profile' }} />
    </Tabs>
  );
}
