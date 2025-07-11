import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    console.log('AuthProvider mounted.');

    const getInitialSession = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;
            console.log('Initial session loaded:', data.session);
            setSession(data.session);
            setUser(data.session?.user || null);
        } catch (error) {
            console.error('Failed to get session:', error.message);
        } finally {
            setLoading(false);
        }
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession);
        
        // Update session and user state
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        // Handle loading state for different events
        if (event === 'INITIAL_SESSION' && !currentSession) {
             setLoading(false); 
        } else if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_DELETED') {
             setLoading(false); 
        }

        // Handle sign out event specifically
        if (event === 'SIGNED_OUT') {
          console.log('User signed out successfully');
          setUser(null);
          setSession(null);
        }

        if (event === 'SIGNED_IN' && currentSession?.user) {
          const fetchedUser = currentSession.user;
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
            const { data: existingProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', fetchedUser.id)
              .single();

            let updateData = {};
            let profileNeedsUpdate = false;

            if (fetchError && fetchError.code === 'PGRST116') {
              console.log('Profile does not exist, creating new profile.');
              const usernameToUse =
                currentUsername || generateUniqueUsername(currentFirstName, currentLastName);

              updateData = {
                id: fetchedUser.id,
                email: fetchedUser.email,
                first_name: currentFirstName,
                last_name: currentLastName,
                full_name: `${currentFirstName} ${currentLastName}`.trim(),
                username: usernameToUse,
                avatar_url: currentAvatarUrl,
              };

              const { error: insertError } = await supabase
                .from('profiles')
                .insert([updateData]);

              if (insertError) {
                console.error('Error creating profile:', insertError.message);
              } else {
                console.log('Profile created successfully.');
              }
            } else if (existingProfile) { 
              console.log('Profile already exists, checking for updates.');
              if (!existingProfile.first_name && currentFirstName) {
                updateData.first_name = currentFirstName;
                profileNeedsUpdate = true;
              }
              if (!existingProfile.last_name && currentLastName) {
                updateData.last_name = currentLastName;
                profileNeedsUpdate = true;
              }
              if (!existingProfile.username && currentUsername) {
                updateData.username = currentUsername;
                profileNeedsUpdate = true;
              }
              if (!existingProfile.full_name && (currentFirstName || currentLastName)) {
                updateData.full_name = `${currentFirstName} ${currentLastName}`.trim();
                profileNeedsUpdate = true;
              }
              if (!existingProfile.avatar_url && currentAvatarUrl !== '/default-avatar.png') {
                updateData.avatar_url = currentAvatarUrl;
                profileNeedsUpdate = true;
              }

              if (profileNeedsUpdate) {
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update(updateData)
                  .eq('id', fetchedUser.id);

                if (updateError) {
                  console.error('Error updating profile:', updateError.message);
                } else {
                  console.log('Profile updated successfully.');
                }
              } else {
                console.log('No updates needed for existing profile.');
              }
            } else { 
                console.error('Unexpected error during profile fetch:', fetchError?.message || 'Unknown error');
            }
          } catch (err) {
            console.error('Profile creation/update error (general catch):', err.message);
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
    signInWithPassword: async ({ email, password }) => {
        console.log("AuthContext.jsx: Calling supabase.auth.signInWithPassword...");
        const result = await supabase.auth.signInWithPassword({ email, password });
        console.log("AuthContext.jsx: signInWithPassword result:", result);
        return result;
    },
    signUp: async (credentials) => {
      console.log("AuthContext.jsx: signUp received credentials:", JSON.stringify(credentials, null, 2));
      if (!credentials.options?.data) {
        console.error("AuthContext.jsx: ERROR: 'options.data' is missing for signUp.");
        return {
          error: new Error("'options.data' is missing for signUp."),
        };
      }
      const result = await supabase.auth.signUp(credentials);
      console.log("AuthContext.jsx: SignUp result:", result);
      return result;
    },
    signInWithOAuth: async ({ provider }) => {
        console.log("AuthContext.jsx: Calling supabase.auth.signInWithOAuth for provider:", provider);
        const result = await supabase.auth.signInWithOAuth({ provider });
        console.log("AuthContext.jsx: signInWithOAuth result:", result);
        return result;
    },
    signOut: async () => {
        console.log('AuthContext.jsx: Calling supabase.auth.signOut()...');
        try {
            // Force clear the session first
            setUser(null);
            setSession(null);
            
            const { error } = await supabase.auth.signOut();
            console.log('AuthContext.jsx: supabase.auth.signOut() completed. Error:', error);
            
            if (error) {
                console.error('Sign out error:', error);
                return { error };
            }
            
            console.log('AuthContext.jsx: Sign out successful');
            return { error: null };
        } catch (err) {
            console.error('AuthContext.jsx: Error during signOut call:', err);
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