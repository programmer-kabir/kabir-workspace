import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  ApiClientError,
  fetchCurrentUser,
  getStoredAuthToken,
  issueCsrToken,
  loginAccount,
  registerAccount,
  setStoredAuthToken,
  setStoredCsrToken,
  setStoredDeviceToken,
  verifyAccountEmail,
} from '../services/api';
import type { AuthUser, DeviceLimitChallenge, UsageSummary } from '../types/stock';

interface AuthContextValue {
  user: AuthUser | null;
  usage: UsageSummary | null;
  loadingAuth: boolean;
  pendingDevVerificationCode: string | null;
  deviceChallenge: DeviceLimitChallenge | null;
  refreshSession: () => Promise<void>;
  signIn: (email: string, password: string, deviceLabel?: string, turnstileToken?: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName?: string,
    deviceLabel?: string,
    turnstileToken?: string
  ) => Promise<{ verificationCode?: string }>;
  verifyEmail: (code: string) => Promise<void>;
  completeDeviceReplace: (token: string, deviceToken: string) => Promise<void>;
  clearDeviceChallenge: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [pendingDevVerificationCode, setPendingDevVerificationCode] = useState<string | null>(null);
  const [deviceChallenge, setDeviceChallenge] = useState<DeviceLimitChallenge | null>(null);

  const refreshSession = useCallback(async () => {
    const token = getStoredAuthToken();
    if (!token) {
      setUser(null);
      setUsage(null);
      setLoadingAuth(false);
      return;
    }

    try {
      const me = await fetchCurrentUser();
      setUser(me.user);
      setUsage(me.usage);
    } catch {
      setStoredAuthToken(null);
      setUser(null);
      setUsage(null);
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    issueCsrToken()
      .then((res) => setStoredCsrToken(res.token))
      .catch(() => undefined);
  }, [refreshSession]);

  const signIn = async (
    email: string,
    password: string,
    deviceLabel = navigator.platform || 'Web Browser',
    turnstileToken?: string
  ) => {
    try {
      const res = await loginAccount({ email, password, deviceLabel, turnstileToken });
      setStoredAuthToken(res.token);
      setStoredDeviceToken(res.deviceToken);
      if (res.csrToken) setStoredCsrToken(res.csrToken);
      setPendingDevVerificationCode(res.verificationCode ?? null);
      setDeviceChallenge(null);
      setUser(res.user);
      await refreshSession();
    } catch (err) {
      if (err instanceof ApiClientError && err.code === 'DEVICE_LIMIT_EXCEEDED' && err.details) {
        setDeviceChallenge(err.details as unknown as DeviceLimitChallenge);
      }
      throw err;
    }
  };

  const register = async (
    email: string,
    password: string,
    displayName?: string,
    deviceLabel = navigator.platform || 'Web Browser',
    turnstileToken?: string
  ) => {
    const res = await registerAccount({ email, password, displayName, deviceLabel, turnstileToken });
    setStoredAuthToken(res.token);
    setStoredDeviceToken(res.deviceToken);
    if (res.csrToken) setStoredCsrToken(res.csrToken);
    setPendingDevVerificationCode(res.verificationCode ?? null);
    setDeviceChallenge(null);
    setUser(res.user);
    await refreshSession();
    return { verificationCode: res.verificationCode };
  };

  const verifyEmail = async (code: string) => {
    const res = await verifyAccountEmail(code);
    setUser(res.user);
    setPendingDevVerificationCode(null);
  };

  const completeDeviceReplace = async (token: string, deviceToken: string) => {
    setStoredAuthToken(token);
    setStoredDeviceToken(deviceToken);
    setDeviceChallenge(null);
    await refreshSession();
  };

  const signOut = () => {
    setStoredAuthToken(null);
    setPendingDevVerificationCode(null);
    setDeviceChallenge(null);
    setUser(null);
    setUsage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        usage,
        loadingAuth,
        pendingDevVerificationCode,
        deviceChallenge,
        refreshSession,
        signIn,
        register,
        verifyEmail,
        completeDeviceReplace,
        clearDeviceChallenge: () => setDeviceChallenge(null),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
