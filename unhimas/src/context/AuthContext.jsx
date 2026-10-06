import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const fetchProfile = async (userId) => {
    setProfile(null);
    setProfileError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      setProfileError(error);
      return null;
    }
    setProfile(data);
    return data;
  };

  const refetchProfile = async () => {
    setLoading(true);
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      setProfile(null);
      setProfileError(error || new Error('No authenticated user'));
      setLoading(false);
      return null;
    }

    try {
      return await fetchProfile(user.id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        await fetchProfile(session.user.id);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setLoading(true);
        Promise.resolve().then(() => fetchProfile(session.user.id)).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setProfileError(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      profile,
      loading,
      profileError,
      signOut,
      refetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
