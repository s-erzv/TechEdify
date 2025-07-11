import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/Dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-sky-100 to-blue-200 text-center font-poppins px-4">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Welcome to Tech Edify</h1>
      <p className="text-gray-700 mb-6">Level up your coding skills with interactive lessons.</p>
      <button
        className="bg-[#071735] text-white px-6 py-3 rounded-full hover:bg-white hover:text-black transition duration-300"
        onClick={() => navigate('/Auth')}
      >
        Get Started
      </button>
    </div>
  );
};

export default LandingPage;