import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Pastikan path ini benar
import { motion, AnimatePresence } from 'framer-motion';


export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  // Destructuring signInWithPassword, signUp, signInWithOAuth, loading, user dari useAuth
  const { signInWithPassword, signUp, signInWithOAuth, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Navigasi setelah autentikasi berhasil dan data user tersedia
    if (!authLoading && user) {
        const role = user.user_metadata?.role;
        if (role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/Dashboard');
        }
    }
  }, [authLoading, user, navigate]);


  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setUsername('');
  };

  const generateUsername = (first, last, emailVal) => {
    const random = Math.floor(Math.random() * 1000);
    const baseFirst = first ? String(first).toLowerCase() : emailVal?.split('@')[0] || 'user';
    const baseLast = last ? String(last).toLowerCase() : '';
    return `${baseFirst}${baseLast}${random}`;
  };

  // --- Fungsi handleLogin yang diperbarui ---
  const handleLogin = async () => {
    console.log('Auth.jsx: Attempting manual login for:', email);
    console.log('Auth.jsx: Calling signInWithPassword with credentials:', { email, password });
    console.log('Auth.jsx: signInWithPassword function received from useAuth:', signInWithPassword); // <-- Log tambahan

    // Validasi apakah signInWithPassword adalah fungsi yang valid
    if (typeof signInWithPassword !== 'function') {
        console.error("Auth.jsx: ERROR: signInWithPassword is not a valid function. Check AuthContext export."); // <-- Log error eksplisit
        alert("Login service not ready or misconfigured. Please try again or contact support.");
        return; // Hentikan eksekusi jika tidak valid
    }

    const { error } = await signInWithPassword({ email, password }); // Baris ini adalah Auth.jsx:49:29 Anda yang error

    if (error) {
      alert(error.message);
      console.error('Auth.jsx: Login error:', error.message);
    } else {
      console.log('Auth.jsx: Login request sent, awaiting auth state change in context.');
      // Tidak perlu navigate di sini, useEffect di atas akan menangani navigasi setelah user state diperbarui
    }
  };

  // --- Fungsi handleRegister Anda yang sudah baik ---
  const handleRegister = async () => {
    console.log('Auth.jsx: Attempting manual registration for:', email);

    const registrationPayload = {
        email,
        password,
        options: {
            emailRedirectTo: 'http://localhost:5173/auth',
            data: {
                first_name: firstName,
                last_name: lastName,
                username: username || generateUsername(firstName, lastName, email),
                avatar_url: 'https://cnamicmrjuoiqrdxvdkg.supabase.co/storage/v1/object/public/avatars//WhatsApp%20Image%202025-04-26%20at%2012.34.49_27a03e86.jpg', // URL avatar default
                role: 'student',
            },
        },
    };

    console.log('Auth.jsx: Calling signUp with payload:', JSON.stringify(registrationPayload, null, 2));
    console.log('Auth.jsx: signUp function received from useAuth:', signUp); // <-- Log tambahan

    // Validasi apakah signUp adalah fungsi yang valid
    if (typeof signUp !== 'function') {
        console.error("Auth.jsx: ERROR: signUp is not a valid function. Check AuthContext export.");
        alert("Registration service not ready or misconfigured. Please try again or contact support.");
        return;
    }

    const { error: signUpError } = await signUp(registrationPayload);

    if (signUpError) {
        alert(signUpError.message);
        console.error('Auth.jsx: Registration error:', signUpError.message);
    } else {
        console.log('Auth.jsx: Registration successful, check email for confirmation.');
        alert('Check your email to confirm your account. After confirmation, you can sign in.');
        setIsLogin(true); // Kembali ke mode login setelah registrasi berhasil
    }
  };

  // --- Fungsi handleGoogleLogin yang diperbarui ---
  const handleGoogleLogin = async () => {
    console.log('Auth.jsx: Attempting Google OAuth login.');
    console.log('Auth.jsx: Calling signInWithOAuth with provider: google');
    console.log('Auth.jsx: signInWithOAuth function received from useAuth:', signInWithOAuth); // <-- Log tambahan

    // Validasi apakah signInWithOAuth adalah fungsi yang valid
    if (typeof signInWithOAuth !== 'function') {
        console.error("Auth.jsx: ERROR: signInWithOAuth is not a valid function. Check AuthContext export."); // <-- Log error eksplisit
        alert("Google login service not ready or misconfigured. Please try again or contact support.");
        return; // Hentikan eksekusi jika tidak valid
    }

    const { error } = await signInWithOAuth({ provider: 'google' });

    if (error) {
      alert(error.message);
      console.error('Auth.jsx: Google login error:', error.message);
    } else {
      console.log('Auth.jsx: Google login request sent, awaiting auth state change in context.');
      // Tidak perlu navigate di sini, useEffect di atas akan menangani navigasi setelah user state diperbarui
    }
  };

  const formVariants = {
    login: { x: '0%', opacity: 1 },
    register: { x: '-100%', opacity: 1 },
  };

  const imageVariants = {
    login: { x: '0%', opacity: 1 },
    register: { x: '100%', opacity: 1 },
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-200 px-4 font-poppins">Checking authentication status...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-200 px-4 font-poppins">
      <div className="bg-white justify-center items-center rounded-xl shadow-2xl flex w-full max-w-5xl h-[500px] overflow-hidden relative">

        <motion.div
        key={isLogin ? 'login-form' : 'register-form'} 
          className={`w-full md:w-1/2 h-full absolute top-0 ${isLogin ? 'left-0' : 'right-0'} flex flex-col justify-center items-center p-6`}
          variants={imageVariants}
          initial={isLogin ? "login" : "register"}
          animate={isLogin ? "login" : "register"}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <img
            src={isLogin ? '/bg-login.jpeg' : '/bg-register.jpeg'}
            alt="Auth Background"
            className="absolute inset-0 w-full h-full object-cover z-0 rounded-xl"
            />

          <div className="absolute inset-0 bg-black opacity-50 z-0 rounded-xl"></div>

          <div className="text-white text-center z-10 p-4">
            <h3 className="text-2xl font-bold">Start Your Journey!</h3>
            <p className="text-md mb-2">Explore, learn, and grow with Tech Edify.</p>
            <p className="text-sm mb-2">
              {isLogin ? 'Don\'t have an account?' : 'Already have an account?'}
            </p>
            <button
              className="font-semibold block mx-auto bg-[#071735] text-white border border-white rounded-full py-2 px-6 transition-all duration-300 ease-in-out hover:bg-white hover:text-black hover:border-black focus:outline-none focus:ring-2 focus:ring-opacity-50"
              onClick={toggleMode}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </motion.div>

        <motion.div
          className="w-full md:w-1/2 p-10 flex flex-col justify-center items-center absolute top-0 right-0"
          variants={formVariants}
          initial={isLogin ? "login" : "register"}
          animate={isLogin ? "login" : "register"}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.h2
                key="login-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="mb-6 text-center"
              >
                <span className="block text-xl mt-10 font-normal text-gray-700">Tech Edify</span>
                <span className="block text-4xl font-extrabold text-gray-900 mt-2">Welcome Back!</span>
              </motion.h2>
            ) : (
              <motion.h2
                key="register-text"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="mb-6 text-center"
              >
                <span className="block text-4xl font-extrabold mt-2 text-gray-900">Sign Up</span>
              </motion.h2>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 pl-6 bg-gray-100 rounded-full mb-2" />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 pl-6 bg-gray-100 rounded-full mb-4" />
                <button className="w-full bg-[#071735] text-white p-3 rounded-full mb-2" onClick={handleLogin} disabled={authLoading}>
                  {authLoading ? 'Please wait...' : 'Sign In'}
                </button>
                <button className="w-full bg-white border border-[#071735] text-[#071735]  p-3 rounded-full mb-4 flex items-center justify-center" onClick={handleGoogleLogin}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
                  Continue with Google
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col md:flex-row gap-2 mb-2">
                  <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full md:w-1/2 p-3 pl-6 bg-gray-100 rounded-full" />
                  <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full md:w-1/2 p-3 pl-6 bg-gray-100 rounded-full" />
                </div>
                <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 pl-6 bg-gray-100 rounded-full mb-2" />
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 pl-6 bg-gray-100 rounded-full mb-2" />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 pl-6 bg-gray-100 rounded-full mb-4" />
                <button className="w-full bg-[#071735] text-white p-3 rounded-full mb-2" onClick={handleRegister} disabled={authLoading}>
                  {authLoading ? 'Registering...' : 'Sign Up'}
                </button>
                <button className="w-full bg-white border border-[#071735] text-[#071735]  p-3 rounded-full  mb-4 flex items-center justify-center" onClick={handleGoogleLogin}>
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
                  Continue with Google
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}