import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const { signInWithPassword, signUp, signInWithOAuth, loading: authLoading, user, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    console.log('Auth.jsx useEffect: authLoading:', authLoading, 'user:', user, 'isReady:', isReady);
    if (!authLoading && user && user.role && isReady) {
      const role = user.role;
      console.log('Auth.jsx useEffect: User role for redirection:', role);
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'student') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [authLoading, user, navigate, isReady]);

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

  const handleLogin = async () => {
    console.log('Auth.jsx: Attempting manual login for:', email);
    console.log('Auth.jsx: Calling signInWithPassword with credentials:', { email, password });
    console.log('Auth.jsx: signInWithPassword function received from useAuth:', signInWithPassword);

    if (typeof signInWithPassword !== 'function') {
      console.error("Auth.jsx: ERROR: signInWithPassword is not a valid function. Check AuthContext export.");
      return;
    }

    const { error } = await signInWithPassword({ email, password });

    if (error) {
      console.error('Auth.jsx: Login error:', error.message);
      alert(error.message);
    } else {
      console.log('Auth.jsx: Login request sent, awaiting auth state change in context.');
    }
  };

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
          avatar_url: 'https://cnamicmrjuoiqrdxvdkg.supabase.co/storage/v1/object/public/avatars//WhatsApp%20Image%202025-04-26%20at%2012.34.49_27a03e86.jpg',
          role: 'student',
        },
      },
    };

    console.log('Auth.jsx: Calling signUp with payload:', JSON.stringify(registrationPayload, null, 2));
    console.log('Auth.jsx: signUp function received from useAuth:', signUp);

    if (typeof signUp !== 'function') {
      console.error("Auth.jsx: ERROR: signUp is not a valid function. Check AuthContext export.");
      return;
    }

    const { error: signUpError } = await signUp(registrationPayload);

    if (signUpError) {
      console.error('Auth.jsx: Registration error:', signUpError.message);
      alert(signUpError.message);
    } else {
      console.log('Auth.jsx: Registration successful, check email for confirmation.');
      setIsLogin(true);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Auth.jsx: Attempting Google OAuth login.");
    if (typeof signInWithOAuth !== "function") {
      console.error("Auth.jsx: ERROR: signInWithOAuth is not a valid function. Check AuthContext export.");
      return;
    }

    signInWithOAuth('google');
  };

  const formVariants = {
    login: { x: '0%', opacity: 1 },
    register: { x: '0%', opacity: 1 },
  };

  const imageVariants = {
    login: { x: '0%', opacity: 1 },
    register: { x: '0%', opacity: 1 },
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-200 dark:from-dark-bg-primary dark:to-dark-bg-secondary px-4 font-poppins text-gray-800 dark:text-dark-text-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-blue-200 dark:from-dark-bg-primary dark:to-dark-bg-secondary p-4 font-poppins">
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-5xl overflow-hidden relative">
        
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 z-20 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
          aria-label="Back to home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:bg-gray-300 dark:hover:bg-gray-600"
          aria-label="Toggle theme"
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h1M3 12h1m15.325-3.325l-.707-.707M4.382 4.382l-.707-.707m12.536 12.536l-.707-.707m-.707.707l-.707-.707M12 18a6 6 0 100-12 6 6 0 000 12z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Mobile Layout */}
        <div className="block md:hidden">
          {/* Hero Section for Mobile */}
          <motion.div
            className="relative h-48 sm:h-56 overflow-hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={isLogin ? "/bg-login.jpeg" : "/bg-register.jpeg"}
              alt="Auth Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-4">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Start Your Journey!</h3>
              <p className="text-sm sm:text-base mb-4">Explore, learn, and grow with Tech Edify.</p>
              <p className="text-xs sm:text-sm mb-3">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button
                className="bg-transparent border border-white text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-white hover:text-black transition-all duration-300"
                onClick={toggleMode}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </motion.div>

          {/* Form Section for Mobile */}
          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? 'login' : 'register'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-center mb-6">
                  {isLogin ? (
                    <>
                      <span className="block text-lg font-normal text-gray-700 dark:text-dark-text-medium">Tech Edify</span>
                      <span className="block text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-dark-text-light mt-2">Welcome Back!</span>
                    </>
                  ) : (
                    <span className="block text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-dark-text-light">Sign Up</span>
                  )}
                </h2>

                {/* Login Form */}
                {isLogin ? (
                  <div className="space-y-4">
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                      className="w-full bg-[#071735] text-white p-3 rounded-full hover:bg-[#05102a] transition-colors duration-300 font-semibold"
                      onClick={handleLogin}
                      disabled={authLoading}
                    >
                      {authLoading ? 'Please wait...' : 'Sign In'}
                    </button>
                    <button
                      className="w-full bg-white dark:bg-gray-700 border border-[#071735] dark:border-gray-600 text-[#071735] dark:text-dark-text-light p-3 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300 font-semibold"
                      onClick={handleGoogleLogin}
                    >
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
                      Continue with Google
                    </button>
                  </div>
                ) : (
                  /* Register Form */
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-1/2 p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-1/2 p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <button
                      className="w-full bg-[#071735] text-white p-3 rounded-full hover:bg-[#05102a] transition-colors duration-300 font-semibold"
                      onClick={handleRegister}
                      disabled={authLoading}
                    >
                      {authLoading ? 'Registering...' : 'Sign Up'}
                    </button>
                    <button
                      className="w-full bg-white dark:bg-gray-700 border border-[#071735] dark:border-gray-600 text-[#071735] dark:text-dark-text-light p-3 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300 font-semibold"
                      onClick={handleGoogleLogin}
                    >
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
                      Continue with Google
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:flex min-h-[500px] relative">
          {/* Image Section */}
          <motion.div
            key={isLogin ? 'login-image' : 'register-image'}
            className="w-1/2 relative overflow-hidden"
            variants={imageVariants}
            initial={isLogin ? "login" : "register"}
            animate={isLogin ? "login" : "register"}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <img
              src={isLogin ? "/bg-login.jpeg" : "/bg-register.jpeg"}
              alt="Auth Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-8">
              <h3 className="text-3xl font-bold mb-4">Start Your Journey!</h3>
              <p className="text-lg mb-6">Explore, learn, and grow with Tech Edify.</p>
              <p className="text-sm mb-4">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button
                className="bg-transparent border border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-black transition-all duration-300"
                onClick={toggleMode}
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          </motion.div>

          {/* Form Section */}
          <motion.div
            className="w-1/2 p-10 flex flex-col justify-center items-center bg-white dark:bg-dark-bg-secondary"
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
                  <span className="block text-xl font-normal text-gray-700 dark:text-dark-text-medium">Tech Edify</span>
                  <span className="block text-4xl font-extrabold text-gray-900 dark:text-dark-text-light mt-2">Welcome Back!</span>
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
                  <span className="block text-4xl font-extrabold text-gray-900 dark:text-dark-text-light">Sign Up</span>
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
                  className="w-full"
                >
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full mb-2 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full mb-4 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    className="w-full bg-[#071735] text-white p-3 rounded-full mb-2 hover:bg-[#05102a] transition-colors duration-300"
                    onClick={handleLogin}
                    disabled={authLoading}
                  >
                    {authLoading ? 'Please wait...' : 'Sign In'}
                  </button>
                  <button
                    className="w-full bg-white dark:bg-gray-700 border border-[#071735] dark:border-gray-600 text-[#071735] dark:text-dark-text-light p-3 rounded-full mb-4 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300"
                    onClick={handleGoogleLogin}
                  >
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
                  className="w-full"
                >
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-1/2 p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-1/2 p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full mb-2 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full mb-2 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pl-6 bg-gray-100 dark:bg-gray-700 dark:text-dark-text-light rounded-full mb-4 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    className="w-full bg-[#071735] text-white p-3 rounded-full mb-2 hover:bg-[#05102a] transition-colors duration-300"
                    onClick={handleRegister}
                    disabled={authLoading}
                  >
                    {authLoading ? 'Registering...' : 'Sign Up'}
                  </button>
                  <button
                    className="w-full bg-white dark:bg-gray-700 border border-[#071735] dark:border-gray-600 text-[#071735] dark:text-dark-text-light p-3 rounded-full mb-4 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-300"
                    onClick={handleGoogleLogin}
                  >
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
                    Continue with Google
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}