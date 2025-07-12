import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const AuthContext = createContext(null); // Tambahkan 'export' di sini

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState(null);

const fetchAndSetUserProfile = async (supabaseUser) => {
  console.log("剥 fetchAndSetUserProfile CALLED with:", supabaseUser);
  let userRole = 'student'; // Default role if profile fetch fails or not found

  try {
    // Coba ambil role dari app_metadata (lebih disukai)
    // Supabase Auth biasanya menempatkan custom claims di app_metadata
    if (supabaseUser.app_metadata && typeof supabaseUser.app_metadata.role === 'string') {
      userRole = supabaseUser.app_metadata.role;
      console.log("fetchAndSetUserProfile: Role from app_metadata:", userRole);
    }
    // Jika tidak ada di app_metadata, coba dari user_metadata (fallback)
    else if (supabaseUser.user_metadata && typeof supabaseUser.user_metadata.role === 'string') {
      userRole = supabaseUser.user_metadata.role;
      console.log("fetchAndSetUserProfile: Role from user_metadata:", userRole);
    }
    // Jika role masih belum ditemukan di metadata, baru coba fetch dari profiles.
    // Ini adalah titik potensial rekursi RLS.
    else {
      console.log("fetchAndSetUserProfile: Role not in metadata, fetching from profiles...");
      // Add a timeout to this specific fetch as a safeguard
      const profilePromise = supabase
        .from('profiles')
        .select('id, role')
        .eq('id', supabaseUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile role fetch timeout (from profiles table)')), 5000) // 5 seconds timeout
      );

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);

      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows found"
        console.error('fetchAndSetUserProfile: Error fetching role from profiles table (likely RLS recursion or other DB error):', profileError.message);
        // Default to student on error
      } else if (profile) {
        userRole = profile.role;
        console.log('fetchAndSetUserProfile: Role from profiles table (fallback):', userRole);
      } else {
        console.warn('fetchAndSetUserProfile: No role found in profiles table for user. Using default "student".');
      }
    }

  } catch (err) {
    console.error('fetchAndSetUserProfile: UNEXPECTED ERROR during role determination:', err.message);
  } finally {
    const finalUser = { ...supabaseUser, role: userRole };
    console.log('fetchAndSetUserProfile: Setting final user object:', finalUser);
    setUser(finalUser);
    setIsReady(true);
  }
};

  const signInWithOAuth = async (provider) => {
    try {
      console.log('signInWithOAuth: Signing in with provider:', provider);
      // Anda mungkin perlu menambahkan redirectTo jika provider tidak auto-redirect
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
      if (error) throw error;
    } catch (err) {
      console.error('signInWithOAuth error:', err.message);
    }
  };

  useEffect(() => {
    console.log('櫨 useEffect -> Auth state:', { user, loading, isReady, session });
  }, [user, loading, isReady, session]);

  useEffect(() => {
    console.log('AuthProvider mounted.');

    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        console.log('Initial session loaded:', data.session);
        setSession(data.session);

        const sessionUser = data.session?.user;

        if (sessionUser) {
          console.log('getInitialSession: User found, fetching profile (AuthContext)...');
          await fetchAndSetUserProfile(sessionUser);
        } else {
          console.log('getInitialSession: No user found in session');
          setUser(null);
          setIsReady(true);
        }
      } catch (error) {
        console.error('getInitialSession: Failed to get session:', error.message);
        setUser(null);
        setIsReady(true);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession);

        setSession(currentSession);

        if (event === 'INITIAL_SESSION' && !currentSession) {
          setLoading(false);
          setIsReady(true);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out successfully');
          setUser(null);
          setSession(null);
          setIsReady(false);
          setLoading(false);
        } else if (event === 'USER_DELETED') {
          setUser(null);
          setSession(null);
          setIsReady(false);
          setLoading(false);
        } else if (event === 'SIGNED_IN' && currentSession?.user) {
          console.log('櫨 SIGNED_IN event - starting profile fetch (AuthContext)');

          const fetchedUser = currentSession.user;

          // Kita TIDAK akan lagi membuat profil di sini secara manual.
          // Ini adalah tanggung jawab trigger handle_new_user di backend.
          // Cukup fetch dan set user profile.
          await fetchAndSetUserProfile(fetchedUser);

        } else if (event === 'USER_UPDATED') {
          // Jika user metadata di auth.users diupdate, panggil lagi fetchAndSetUserProfile
          console.log('櫨 USER_UPDATED event - refetching profile (AuthContext)');
          await fetchAndSetUserProfile(currentSession.user);
        }
        else {
          // Handle other events
          setLoading(false);
          if (!currentSession?.user) {
            setIsReady(true);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
      console.log('Auth listener unsubscribed.');
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    isReady,
    signInWithPassword: async ({ email, password }) => {
      const result = await supabase.auth.signInWithPassword({ email, password });
      // Setelah signInWithPassword, onAuthStateChange akan terpicu dan memanggil fetchAndSetUserProfile
      return result;
    },
    signUp: async (credentials) => {
      // Pastikan data yang dikirim ke signUp mencakup user_metadata yang diperlukan
      // agar trigger handle_new_user memiliki data first_name/last_name untuk username
      const result = await supabase.auth.signUp(credentials);
      // onAuthStateChange akan terpicu setelah signup dan memanggil fetchAndSetUserProfile
      return result;
    },
    signInWithOAuth,
    signOut: async () => {
      try {
        setUser(null);
        setSession(null);
        setIsReady(false);
        const { error } = await supabase.auth.signOut();
        if (error) return { error };
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error('Unknown sign out error') };
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="h-screen w-full flex justify-center items-center text-gray-700 text-xl">
          Loading...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};