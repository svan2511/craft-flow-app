import { Redirect } from 'expo-router';

import { useAuth } from '@/lib/auth-context';

export default function Index() {
  const { loaded, phone, business } = useAuth();

  if (!loaded) {
    return null;
  }

  if (!phone) {
    return <Redirect href="/login" />;
  }

  if (!business) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
