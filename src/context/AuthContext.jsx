// my-frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, recordDailyActivity } from '../lib/supabaseClient'; 

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); 
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false); 
  const [profile, setProfile] = useState(null); 
  
  // Use refs to prevent duplicate processing
  const processingRef = useRef(false);
  const initializedRef = useRef(false);

  const fetchAndSetUserProfile = useCallback(async (supabaseUser) => {
    // Prevent duplicate processing
    if (processingRef.current) {
      console.log("⚠️ fetchAndSetUserProfile already processing, skipping...");
      return;
    }
    
    processingRef.current = true;
    console.log("🔍 fetchAndSetUserProfile START - User ID:", supabaseUser?.id);
    
    let userRole = 'student';
    let fetchedProfileData = null;

    try {
      // 1. Tentukan Role Pengguna
      if (supabaseUser.app_metadata && typeof supabaseUser.app_metadata.role === 'string') {
        userRole = supabaseUser.app_metadata.role;
        console.log("✅ Role from app_metadata:", userRole);
      }
      else if (supabaseUser.user_metadata && typeof supabaseUser.user_metadata.role === 'string') {
        userRole = supabaseUser.user_metadata.role;
        console.log("✅ Role from user_metadata:", userRole);
      }
      else {
        console.log("📍 Role not in metadata, attempting to fetch from profiles table (fallback)...");
        try {
          const { data: profileRoleData, error: profileRoleError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('id', supabaseUser.id)
            .single();

          if (profileRoleError && profileRoleError.code !== 'PGRST116') { 
            console.error('❌ Error fetching role from profiles table:', profileRoleError.message);
          } else if (profileRoleData) {
            userRole = profileRoleData.role;
            console.log('✅ Role from profiles table (fallback):', userRole);
          } else {
            console.warn('⚠️ No role found in profiles table for user. Using default "student".');
          }
        } catch (roleError) {
          console.error('❌ Error in role fetch:', roleError.message);
        }
      }

      // 2. Fetch full profile with timeout
      console.log("📍 Attempting to fetch full profile data from 'profiles' table..."); 
      console.log("DEBUG: Executing supabase.from('profiles').select for user ID:", supabaseUser.id); 
      
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('profiles')
        .select('*') 
        .eq('id', supabaseUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 20000); // 10 second timeout
      });

      const { data: fullProfileData, error: fullProfileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]);

      console.log("DEBUG: Response received from profiles fetch - data:", fullProfileData, "error:", fullProfileError); 

      if (fullProfileError) {
        if (fullProfileError.code !== 'PGRST116') { 
          console.error('❌ Profile fetch error:', fullProfileError.message);
        } else {
          console.warn('⚠️ No profile found in profiles table for user. Setting profile to null.');
        }
        fetchedProfileData = null; 
      } else {
        fetchedProfileData = fullProfileData; 
        console.log('✅ Full Profile Data fetched:', fetchedProfileData);
      }

    } catch (err) { 
      console.error('❌ UNEXPECTED ERROR in fetchAndSetUserProfile:', err.message);
      fetchedProfileData = null; 
    } finally {
      // Set all states together
      const finalUser = { ...supabaseUser, role: userRole };
      
      console.log('✅ Setting final states:', { user: finalUser, profile: fetchedProfileData });
      
      setUser(finalUser);
      setProfile(fetchedProfileData);
      setIsReady(true);
      setLoading(false);
      
      processingRef.current = false;

      // Record daily activity (non-blocking)
      recordDailyActivity(supabaseUser.id, 'login')
        .then((result) => {
          if (result.success) {
            console.log('✅ Daily activity recorded successfully.');
          } else {
            console.warn('⚠️ Daily activity recording failed:', result.error);
          }
        })
        .catch(err => {
          console.error('❌ Daily activity recording error:', err.message);
        });

      console.log("🎉 fetchAndSetUserProfile COMPLETED.");
    }
  }, []);

  const signInWithOAuth = async (provider) => {
    try {
      console.log('signInWithOAuth: Signing in with provider:', provider);
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider, 
        options: { redirectTo: window.location.origin } 
      });
      if (error) throw error;
    } catch (err) {
      console.error('signInWithOAuth error:', err.message);
    }
  };

  useEffect(() => {
    console.log('⚛️ useEffect -> Auth state:', { user, loading, isReady, session });
  }, [user, loading, isReady, session]);

  useEffect(() => {
    // Prevent duplicate initialization
    if (initializedRef.current) {
      console.log("⚠️ AuthProvider already initialized, skipping...");
      return;
    }
    
    initializedRef.current = true;
    console.log('AuthProvider mounted and initializing...');

    const getInitialSession = async () => {
      try {
        console.log('🚀 Getting initial session...');
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        console.log('Initial session loaded:', data.session);
        setSession(data.session);

        const sessionUser = data.session?.user;

        if (sessionUser) {
          console.log('getInitialSession: User found, calling fetchAndSetUserProfile...');
          await fetchAndSetUserProfile(sessionUser); 
        } else {
          console.log('getInitialSession: No user found in session');
          setUser(null);
          setProfile(null);
          setIsReady(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ getInitialSession: Failed to get session:', error.message);
        setUser(null);
        setProfile(null);
        setIsReady(true);
        setLoading(false);
      }
    };

    let authListener;
    
    const setupAuthListener = () => {
      const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        console.log('🔄 Auth state changed:', event, currentSession?.user?.id);

        // Skip initial session as we handle it separately
        if (event === 'INITIAL_SESSION') {
          console.log('⏭️ Skipping INITIAL_SESSION event');
          return;
        }

        setSession(currentSession);

        if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsReady(true);
          setLoading(false);
          processingRef.current = false;
        } else if (event === 'USER_DELETED') {
          console.log('🗑️ User deleted');
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsReady(true);
          setLoading(false);
          processingRef.current = false;
        } else if (event === 'SIGNED_IN' && currentSession?.user) {
          console.log('🚀 SIGNED_IN event - calling fetchAndSetUserProfile...');
          await fetchAndSetUserProfile(currentSession.user);
        } else if (event === 'USER_UPDATED' && currentSession?.user) {
          console.log('🔄 USER_UPDATED event - calling fetchAndSetUserProfile...');
          await fetchAndSetUserProfile(currentSession.user);
        }
      });
      
      authListener = data;
    };

    // Initialize
    getInitialSession();
    setupAuthListener();

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
        console.log('🔌 Auth listener unsubscribed.');
      }
      initializedRef.current = false;
      processingRef.current = false;
    };
  }, [fetchAndSetUserProfile]);

  const value = {
    user,
    session,
    loading,
    isReady,
    profile, 
    setProfile, 
    signInWithPassword: async ({ email, password }) => {
      try {
        setLoading(true);
        const result = await supabase.auth.signInWithPassword({ email, password });
        return result;
      } catch (error) {
        setLoading(false);
        return { error };
      }
    },
    signUp: async (credentials) => {
      try {
        setLoading(true);
        const result = await supabase.auth.signUp(credentials);
        return result;
      } catch (error) {
        setLoading(false);
        return { error };
      }
    },
    signInWithOAuth,
    signOut: async () => {
      try {
        setLoading(true);
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          setLoading(false);
          return { error };
        }
        
        // States will be reset by onAuthStateChange
        return { error: null };
      } catch (err) {
        setLoading(false);
        return { error: err instanceof Error ? err : new Error('Unknown sign out error') };
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="h-screen w-full flex justify-center items-center text-gray-700 text-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            Loading... yg sabar yh
          </div>
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