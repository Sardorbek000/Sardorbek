import { useEffect } from 'react';
import { useStore, UserProfile } from '../store/useStore';
import { authFetch, getToken, setToken } from '../lib/api';

export function AuthListener({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const user = await authFetch('/api/auth/me');
        setUser(user as UserProfile);
      } catch (err) {
        console.error('Auth error', err);
        setToken('');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
