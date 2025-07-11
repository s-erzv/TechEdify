import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const fetchAndSetUserProfile = async (supabaseUser) => {
    console.log("🔍 fetchAndSetUserProfile CALLED with:", supabaseUser);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, role')
        .eq('id', supabaseUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('fetchAndSetUserProfile: Error:', profileError.message);
        setUser({ ...supabaseUser, role: 'student' });
      } else if (profile) {
        console.log('fetchAndSetUserProfile: Success:', profile);
        const userWithRole = { ...supabaseUser, role: profile.role };
        console.log('fetchAndSetUserProfile: Setting user with role:', userWithRole);
        setUser(userWithRole);
      } else {
        console.warn('fetchAndSetUserProfile: No profile found. Using default role "student".');
        setUser({ ...supabaseUser, role: 'student' });
      }
    } catch (err) {
      console.error('fetchAndSetUserProfile: Unexpected error:', err.message);
      setUser({ ...supabaseUser, role: 'student' });
    } finally {
      setIsReady(true);
    }
  };

  const signInWithOAuth = async (provider) => {
    try {
      console.log('signInWithOAuth: Signing in with provider:', provider);
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (err) {
      console.error('signInWithOAuth error:', err.message);
    }
  };

  useEffect(() => {
    console.log('🔥 useEffect -> Auth state:', { user, loading, isReady, session });
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
          console.log('getInitialSession: User found, fetching profile...');
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
          console.log('🔥 SIGNED_IN event - starting profile fetch');
          // Set isReady to false while processing
          setIsReady(false);
          setLoading(false);
          
          const fetchedUser = currentSession.user;
          console.log('🔥 Fetched user:', fetchedUser);
          
          const metadata = fetchedUser.user_metadata || {};
          const currentFirstName = metadata.first_name || '';
          const currentLastName = metadata.last_name || '';
          const currentUsername = metadata.username || '';
          const currentAvatarUrl = metadata.avatar_url || '/default-avatar.png';

          const generateUniqueUsername = (first, last) => {
            const baseFirst = first ? String(first).toLowerCase() : 'user';
            const baseLast = last ? String(last).toLowerCase() : '';
            const random = Math.floor(Math.random() * 10000);
            return `${baseFirst}${baseLast}${random}`;
          };

          try {
            console.log('🔥 Fetching profile for user ID:', fetchedUser.id);
            
            // Add timeout to prevent hanging
            const profilePromise = supabase
              .from('profiles')
              .select('*, role')
              .eq('id', fetchedUser.id)
              .single();

            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
            );

            const { data: existingProfile, error: fetchError } = await Promise.race([
              profilePromise,
              timeoutPromise
            ]);

            console.log('🔥 Profile fetch result:', { existingProfile, fetchError });

            let userRole = 'student';

            if (fetchError && fetchError.code === 'PGRST116') {
              console.log('🔥 SIGNED_IN: Profile does not exist, creating new profile.');
              const usernameToUse =
                currentUsername || generateUniqueUsername(currentFirstName, currentLastName);

              const newProfileData = {
                id: fetchedUser.id,
                email: fetchedUser.email,
                first_name: currentFirstName,
                last_name: currentLastName,
                full_name: `${currentFirstName} ${currentLastName}`.trim(),
                username: usernameToUse,
                avatar_url: currentAvatarUrl,
                role: 'student',
              };

              const { error: insertError } = await supabase
                .from('profiles')
                .insert([newProfileData]);

              if (insertError) {
                console.error('🔥 SIGNED_IN: Error creating profile:', insertError.message);
              } else {
                console.log('🔥 SIGNED_IN: Profile created successfully:', newProfileData);
              }
              userRole = 'student';
            } else if (existingProfile) {
              console.log('🔥 SIGNED_IN: Profile already exists:', existingProfile);
              userRole = existingProfile.role;
            } else {
              console.error('🔥 SIGNED_IN: Unexpected error during profile fetch:', fetchError?.message || 'Unknown error');
            }

            const finalUser = { ...fetchedUser, role: userRole };
            console.log('🔥 SIGNED_IN: Final user object after role merge:', finalUser);
            setUser(finalUser);
            setIsReady(true);
          } catch (err) {
            console.error('🔥 SIGNED_IN: Profile creation/update error:', err.message);
            const fallbackUser = { ...fetchedUser, role: 'student' };
            console.log('🔥 SIGNED_IN: Setting fallback user:', fallbackUser);
            setUser(fallbackUser);
            setIsReady(true);
          }
        } else {
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
      return result;
    },
    signUp: async (credentials) => {
      if (!credentials.options?.data) {
        return { error: new Error("'options.data' is missing for signUp.") };
      }
      const result = await supabase.auth.signUp(credentials);
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