import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';

import { ApiError, apiRequest, setToken, setUnauthorizedHandler } from '@/lib/api';

export type Business = {
  workshopName: string;
  ownerName: string;
  city: string;
  phone: string;
  address: string;
};

export type SendOtpResult = {
  phone: string;
  retry_in: number;
  expires_in: number;
  dev_otp?: string | null;
};

type AuthState = {
  loaded: boolean;
  phone: string | null;
  business: Business | null;
  sendOtp: (phone: string) => Promise<SendOtpResult>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  saveBusiness: (business: Business) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEYS = {
  phone: 'km.phone',
  business: 'km.business',
  token: 'km.token',
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [loaded, setLoaded] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = loaded;
  }, [loaded]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [storedPhone, storedBusiness] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.phone),
          AsyncStorage.getItem(STORAGE_KEYS.business),
        ]);

        if (!storedPhone) {
          return;
        }

        try {
          const data = await apiRequest<{ user: { phone: string; has_workshop: boolean } }>('/auth/me', {
            authenticated: true,
          });
          setPhone(data.user.phone);
          if (data.user.has_workshop) {
            setBusiness(storedBusiness ? (JSON.parse(storedBusiness) as Business) : null);
          } else {
            setBusiness(null);
            await AsyncStorage.removeItem(STORAGE_KEYS.business);
          }
        } catch (e) {
          if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
            await clearSession();
          } else {
            setPhone(storedPhone);
            setBusiness(storedBusiness ? (JSON.parse(storedBusiness) as Business) : null);
          }
        }
      } catch {
        // ignore storage errors and treat as logged out
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const sendOtp = async (newPhone: string): Promise<SendOtpResult> => {
    const data = await apiRequest<SendOtpResult>('/auth/login-otp', {
      method: 'POST',
      body: { phone: newPhone },
    });
    return data;
  };

  const verifyOtp = async (newPhone: string, otp: string): Promise<boolean> => {
    const data = await apiRequest<{
      token: string;
      user: { phone: string; name: string | null; has_workshop: boolean };
      workshop: {
        id: number;
        name: string;
        owner_name: string | null;
        city: string | null;
        phone: string | null;
        address: string | null;
      } | null;
    }>('/auth/verify-otp', {
      method: 'POST',
      body: { phone: newPhone, otp },
    });

    await setToken(data.token);
    setPhone(newPhone);
    await AsyncStorage.setItem(STORAGE_KEYS.phone, newPhone);

    if (data.workshop) {
      const mapped = businessMap(data.workshop);
      setBusiness(mapped);
      await AsyncStorage.setItem(STORAGE_KEYS.business, JSON.stringify(mapped));
    } else {
      setBusiness(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.business);
    }

    return data.workshop !== null;
  };

  const saveBusiness = async (newBusiness: Business) => {
    const data = await apiRequest<{
      workshop: {
        id: number;
        name: string;
        owner_name: string | null;
        city: string | null;
        phone: string | null;
        address: string | null;
      };
    }>('/workshops', {
      method: 'POST',
      body: {
        workshop_name: newBusiness.workshopName,
        owner_name: newBusiness.ownerName,
        city: newBusiness.city,
        phone: newBusiness.phone,
        address: newBusiness.address,
      },
      authenticated: true,
    });

    const mapped: Business = {
      workshopName: data.workshop.name,
      ownerName: data.workshop.owner_name ?? newBusiness.ownerName,
      city: data.workshop.city ?? newBusiness.city,
      phone: data.workshop.phone ?? newBusiness.phone,
      address: data.workshop.address ?? newBusiness.address,
    };

    setBusiness(mapped);
    await AsyncStorage.setItem(STORAGE_KEYS.business, JSON.stringify(mapped));
  };

  const clearSession = async () => {
    setPhone(null);
    setBusiness(null);
    await setToken(null);
    await AsyncStorage.multiRemove([STORAGE_KEYS.phone, STORAGE_KEYS.business]);
    if (loadedRef.current) {
      router.replace('/login');
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST', authenticated: true });
    } catch {
      // ignore network errors on logout
    }
    await clearSession();
  };

  return (
    <AuthContext.Provider value={{ loaded, phone, business, sendOtp, verifyOtp, saveBusiness, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function businessMap(workshop: {
  id: number;
  name: string;
  owner_name: string | null;
  city: string | null;
  phone: string | null;
  address: string | null;
}): Business {
  return {
    workshopName: workshop.name,
    ownerName: workshop.owner_name ?? '',
    city: workshop.city ?? '',
    phone: workshop.phone ?? '',
    address: workshop.address ?? '',
  };
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
