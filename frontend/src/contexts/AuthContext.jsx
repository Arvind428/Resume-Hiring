import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { setAuthToken } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      handleSession(currentSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      handleSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (currentSession) => {
    setSession(currentSession);
    if (currentSession?.access_token) {
      setAuthToken(currentSession.access_token);
      try {
        const { data } = await supabase.from('profiles').select('*').eq('id', currentSession.user.id).single();
        setProfile(data);
      } catch (err) {
        console.error('Failed to load profile auth:', err);
      }
    } else {
      setAuthToken(null);
      setProfile(null);
    }
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
