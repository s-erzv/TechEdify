import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  SparklesIcon, // Contoh ikon untuk fitur
  CubeIcon,     // Contoh ikon untuk fitur
  AdjustmentsVerticalIcon, // Contoh ikon untuk fitur
  DevicePhoneMobileIcon, // Contoh ikon untuk mobile app
  CreditCardIcon, // Contoh ikon untuk kartu
  CheckIcon // Contoh ikon untuk testimonial
} from '@heroicons/react/24/outline'; // Pastikan Heroicons ini diimpor


const LandingPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/Dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-dark-text-light font-poppins transition-colors duration-300">
      {/* Top Navigation */}
      <nav className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="/logo-purple.svg" alt="Kard Logo" className="h-8 dark:invert" /> {/* Placeholder logo */}
          <span className="text-xl font-bold text-gray-900 dark:text-dark-text-light">Tech Edify</span>
        </div>
        <div className="space-x-6 text-sm font-medium hidden md:flex">
          <Link to="/" className="hover:text-purple-600 dark:hover:text-dark-accent-purple">Home</Link>
          <Link to="/material" className="hover:text-purple-600 dark:hover:text-dark-accent-purple">Materials</Link> {/* Changed to Materials */}
          <Link to="/quizzes" className="hover:text-purple-600 dark:hover:text-dark-accent-purple">Quizzes</Link> {/* Changed to Quizzes */}
          <Link to="/leaderboard" className="hover:text-purple-600 dark:hover:text-dark-accent-purple">Leaderboard</Link> {/* Changed to Leaderboard */}
          <Link to="/discussions" className="hover:text-purple-600 dark:hover:text-dark-accent-purple">Discussions</Link> {/* Changed to Discussions */}
        </div>
        <button
          onClick={() => navigate('/Auth')}
          className="bg-purple-600 text-white px-5 py-2 rounded-full font-semibold hover:bg-purple-700 transition-colors dark:bg-dark-accent-purple dark:hover:bg-purple-800"
        >
          Get Started
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-dark-bg-primary dark:to-dark-bg-secondary py-20 md:py-20 overflow-hidden">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4">
          <div className="text-center md:text-left md:w-1/2 mb-10 md:mb-0 z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-dark-text-light leading-tight mb-4">
              Learn Computer Science. <br className="hidden md:block"/> Elevate Your Career.
            </h1>
            <p className="text-lg md:text-xl text-gray-700 dark:text-dark-text-medium mb-8 max-w-lg mx-auto md:mx-0">
              Your ultimate platform for mastering informatics, with interactive lessons, quizzes, and a supportive community.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate('/Auth')}
                className="bg-purple-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg dark:bg-dark-accent-purple dark:hover:bg-purple-800"
              >
                Start Learning Now
              </button>
              <Link to="/material" className="text-purple-600 dark:text-dark-accent-purple font-semibold py-3 px-6 rounded-full hover:bg-purple-50 dark:hover:bg-dark-bg-tertiary transition-colors flex items-center justify-center">
                Explore Courses <span className="ml-2 text-xl">→</span>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center items-center relative z-10">
            <img src="/card-mockup.png" alt="Education Platform Mockup" className="max-w-full h-auto w-96 md:w-[600px]" /> {/* Placeholder for card image */}
            {/* Replace with your actual image, e.g., <img src="/your-hero-image.png" alt="Hero Illustration" /> */}
          </div>
        </div>
      </section>

      {/* Trusted By / Stats Section */}
      <section className="bg-gray-800 dark:bg-gray-900 py-12 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-semibold mb-8 opacity-80">Trusted by aspiring tech professionals worldwide</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
            {/* Placeholder Logos */}
            <img src="https://via.placeholder.com/80x40/555/EEE?text=Company+A" alt="Company A" className="h-10 w-auto" />
            <img src="https://via.placeholder.com/80x40/555/EEE?text=Company+B" alt="Company B" className="h-10 w-auto" />
            <img src="https://via.placeholder.com/80x40/555/EEE?text=Company+C" alt="Company C" className="h-10 w-auto" />
            <img src="https://via.placeholder.com/80x40/555/EEE?text=Company+D" alt="Company D" className="h-10 w-auto" />
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-xl md:text-2xl font-bold border-t border-b border-gray-700 py-8 mx-auto max-w-3xl">
            <div><span className="text-purple-400">10+</span> Years Experience</div>
            <div><span className="text-purple-400">25K+</span> Active Learners</div>
            <div><span className="text-purple-400">50+</span> Expert Instructors</div>
            <div><span className="text-purple-400">100%</span> Learning Satisfaction</div>
          </div>
        </div>
      </section>

      {/* What We Provide Section */}
      <section className="py-20 bg-white dark:bg-dark-bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-text-light mb-12">What We Provide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary p-8 rounded-lg shadow-sm transform hover:scale-105 transition-transform duration-200">
              <div className="bg-purple-100 dark:bg-dark-accent-purple dark:bg-opacity-20 rounded-full p-4 inline-flex mb-6">
                <SparklesIcon className="h-12 w-12 text-purple-600 dark:text-dark-accent-purple" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-light mb-3">Interactive Lessons</h3>
              <p className="text-gray-700 dark:text-dark-text-medium">Engaging and easy-to-understand lessons to simplify complex computer science concepts.</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary p-8 rounded-lg shadow-sm transform hover:scale-105 transition-transform duration-200">
              <div className="bg-green-100 dark:bg-green-700 dark:bg-opacity-20 rounded-full p-4 inline-flex mb-6">
                <CubeIcon className="h-12 w-12 text-green-600 dark:text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-light mb-3">Challenging Quizzes</h3>
              <p className="text-gray-700 dark:text-dark-text-medium">Test your knowledge with carefully crafted quizzes to reinforce learning.</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary p-8 rounded-lg shadow-sm transform hover:scale-105 transition-transform duration-200">
              <div className="bg-blue-100 dark:bg-blue-700 dark:bg-opacity-20 rounded-full p-4 inline-flex mb-6">
                <AdjustmentsVerticalIcon className="h-12 w-12 text-blue-600 dark:text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-light mb-3">Progress Tracking</h3>
              <p className="text-gray-700 dark:text-dark-text-medium">Monitor your learning journey and track your mastery of various topics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-dark-bg-primary dark:to-dark-bg-secondary">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4">
          <div className="md:w-1/2 mb-10 md:mb-0 flex justify-center">
            <img src="/phone-mockup.png" alt="Mobile App UI" className="w-64 md:w-80 h-auto" /> {/* Placeholder for phone app image */}
          </div>
          <div className="text-center md:text-left md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-text-light mb-4">Manage your learning on the go</h2>
            <p className="text-lg text-gray-700 dark:text-dark-text-medium mb-6">
              Access your courses, track progress, and practice quizzes anytime, anywhere with our mobile app.
            </p>
            <div className="flex justify-center md:justify-start space-x-4">
              <img src="/google-play-badge.png" alt="Google Play" className="h-12 cursor-pointer" /> {/* Placeholder badge */}
              <img src="/app-store-badge.png" alt="App Store" className="h-12 cursor-pointer" /> {/* Placeholder badge */}
            </div>
          </div>
        </div>
      </section>

      {/* Create Your Own Card Section (similar to debit card design from image) */}
      <section className="bg-gray-800 dark:bg-dark-bg-tertiary text-white py-20">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between px-4">
          <div className="text-center md:text-left md:w-1/2 mb-10 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 dark:text-dark-text-light">Customize Your Learning Path</h2>
            <p className="text-lg opacity-90 mb-8 dark:text-dark-text-medium">
              Tailor your educational journey to fit your unique goals and interests.
            </p>
            <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/material" className="bg-purple-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg dark:bg-dark-accent-purple dark:hover:bg-purple-800">
                Create My Path
              </Link>
              <Link to="/settings" className="text-purple-300 font-semibold py-3 px-6 rounded-full hover:bg-purple-700/20 transition-colors flex items-center justify-center">
                Learn More <span className="ml-2 text-xl">→</span>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img src="/card-design-mockup.png" alt="Custom Learning Path Illustration" className="max-w-full h-auto w-96 md:w-[500px]" /> {/* Placeholder for custom card design */}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-dark-bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-dark-text-light mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-dark-bg-secondary p-6 rounded-lg shadow-sm">
              <img src="https://ui-avatars.com/api/?name=J.D&background=random&color=fff" alt="Customer 1" className="h-16 w-16 rounded-full mx-auto mb-4" />
              <p className="text-gray-700 dark:text-dark-text-medium mb-3 italic">"This platform transformed my understanding of computer science. Highly recommend!"</p>
              <p className="font-semibold text-gray-900 dark:text-dark-text-light">- Jane Doe</p>
              <p className="text-sm text-gray-500 dark:text-dark-text-dark">Software Engineer</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-bg-secondary p-6 rounded-lg shadow-sm">
              <img src="https://ui-avatars.com/api/?name=J.S&background=random&color=fff" alt="Customer 2" className="h-16 w-16 rounded-full mx-auto mb-4" />
              <p className="text-gray-700 dark:text-dark-text-medium mb-3 italic">"The interactive quizzes made learning so much fun and effective. Best platform out there."</p>
              <p className="font-semibold text-gray-900 dark:text-dark-text-light">- John Smith</p>
              <p className="text-sm text-gray-500 dark:text-dark-text-dark">Data Analyst</p>
            </div>
            <div className="bg-gray-50 dark:bg-dark-bg-secondary p-6 rounded-lg shadow-sm">
              <img src="https://ui-avatars.com/api/?name=A.L&background=random&color=fff" alt="Customer 3" className="h-16 w-16 rounded-full mx-auto mb-4" />
              <p className="text-gray-700 dark:text-dark-text-medium mb-3 italic">"From a beginner to confident coder, Tech Edify guided me every step of the way. Thank you!"</p>
              <p className="font-semibold text-gray-900 dark:text-dark-text-light">- Alice Lee</p>
              <p className="text-sm text-gray-500 dark:text-dark-text-dark">Web Developer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center mb-4 md:mb-0">
              <img src="/logo-white.svg" alt="Tech Edify Logo" className="h-8 mr-2" /> {/* White logo for dark footer */}
              <span className="text-2xl font-bold">Tech Edify</span>
            </div>
            <div className="space-x-6 text-sm font-medium">
              <Link to="/" className="hover:text-purple-400">Home</Link>
              <Link to="/material" className="hover:text-purple-400">Materials</Link>
              <Link to="/quizzes" className="hover:text-purple-400">Quizzes</Link>
              <Link to="/leaderboard" className="hover:text-purple-400">Leaderboard</Link>
              <Link to="/discussions" className="hover:text-purple-400">Discussions</Link>
            </div>
          </div>
          <p className="text-sm opacity-70">&copy; 2025 Tech Edify. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;