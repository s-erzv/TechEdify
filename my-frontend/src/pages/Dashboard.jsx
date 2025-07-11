import React, { useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChevronDownIcon, MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { signOut, user, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user && !session) {
      console.log('No user or session detected. Redirecting to /Auth...');
      navigate('/Auth');
    }
  }, [user, session, navigate]);

  const handleSignOut = async () => {
    try {
      console.log('Dashboard: Attempting sign out...');
      console.log('Dashboard: Current user state:', user);
      console.log('Dashboard: Current session state:', session);
      
      const result = await signOut();
      
      console.log('Dashboard: Sign out result:', result);
      
      if (result.error) {
        console.error('Dashboard: Sign out error:', result.error);
        // Still try to navigate even if there's an error
        navigate('/Auth');
        return;
      }
      
      console.log('Dashboard: Sign out successful, redirecting...');
      navigate('/Auth');
    } catch (error) {
      console.error('Dashboard: Sign out failed:', {
        error: error.message,
        stack: error.stack,
        userState: user,
        sessionState: session,
        time: new Date().toISOString()
      });
      
      // Force navigation to auth page even if sign out fails
      navigate('/Auth');
    }
  };

  // If no user, show loading or redirect (handled by useEffect)
  if (!user) {
    return (
      <div className="h-screen w-full flex justify-center items-center text-gray-700 text-xl">
        Redirecting...
      </div>
    );
  }

  const userName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'User';

  // Sample data for charts
  const chartData = [
    { month: 'Jan', study: 45, exams: 20 },
    { month: 'Feb', study: 30, exams: 25 },
    { month: 'Mar', study: 65, exams: 35 },
    { month: 'Apr', study: 55, exams: 15 },
    { month: 'May', study: 25, exams: 30 }
  ];

  const progressData = [
    { subject: 'Computer Science', progress: 85 },
    { subject: 'Computer Science', progress: 70 },
    { subject: 'Computer Science', progress: 95 },
    { subject: 'Computer Science', progress: 60 },
    { subject: 'Computer Science', progress: 80 }
  ];

  return (
    <MainLayout>
      <div className="bg-[#F9F9FB] flex-grow p-6 rounded-xl"> 
        <header className="flex justify-between items-center mb-6 p-4 "> 
          <h1 className="text-2xl font-semibold text-gray-800">Hi, {userName}!</h1>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="py-2 pl-10 pr-4 w-64 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="relative">
              <BellIcon className="h-6 w-6 text-gray-600 cursor-pointer" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors shadow-md disabled:opacity-50"
              disabled={!user} // Disable if no user
            >
              Logout
            </button>

            <div className="flex items-center space-x-2">
              <img
                src={user?.user_metadata?.avatar_url || '/default-avatar.jpg'}
                alt="User Avatar"
                className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
              />
              <ChevronDownIcon className="h-4 w-4 text-gray-600 cursor-pointer" />
            </div>
          </div>
        </header>

        <div className=" bg-[#D9CBFE]  text-[#4A1A34] p-8 rounded-2xl shadow-lg relative overflow-hidden mb-6">
          <div className="relative z-10">
            <div className='p-6'>
                <h2 className="text-3xl font-bold mb-2">Informatics Learning Portal</h2>
                <p className="text-[#4D4D4D] mb-2 text-lg">
                One Step Closer to Becoming Tech-Savvy!
                </p>
                <button className="bg-white text-[#4A1A34] font-semibold py-2 px-6 rounded-full hover:bg-gray-100 transition-colors shadow-md">
                Start Now
                </button>
            </div>
          </div>
            <img
                src="/banner-img.svg"
                alt="Banner Illustration"
                className="absolute right-0 top-0 h-full  object-contain pointer-events-none"
            />
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Achievements */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Achievements</h3>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">🏆</span>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-2xl font-bold text-gray-900">Your Achievements</p>
              <p className="text-sm text-gray-500">You're collecting rewards and leveling up your skills. Keep up the good work!</p>
            </div>
          </div>

          {/* Completed Materials */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Completed Materials</h3>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 font-bold">📚</span>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-2xl font-bold text-gray-900">n Materials Completed</p>
              <p className="text-sm text-gray-500">You've completed materials. Keep going!</p>
            </div>
          </div>

          {/* Learning Streak */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Learning Streak</h3>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold">🔥</span>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-2xl font-bold text-gray-900">n Current Streak</p>
              <p className="text-sm text-gray-500">Maintain your consistency!</p>
            </div>
          </div>
        </div>

        {/* Hours Spent Chart & Progress - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hours Spent Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Hours Spent</h2>
              <div className="flex space-x-2">
                <button className="py-2 px-4 rounded-full bg-purple-100 text-purple-700 font-medium text-sm">
                  Study
                </button>
                <button className="py-2 px-4 rounded-full bg-gray-100 text-gray-600 font-medium text-sm">
                  Exams
                </button>
              </div>
            </div>
            
            {/* Simple Bar Chart */}
            <div className="flex items-end justify-between h-48 mb-4">
              {chartData.map((data, index) => (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div className="flex items-end space-x-1">
                    <div 
                      className="w-6 bg-purple-500 rounded-t"
                      style={{ height: `${data.study * 2}px` }}
                    ></div>
                    <div 
                      className="w-6 bg-purple-300 rounded-t"
                      style={{ height: `${data.exams * 2}px` }}
                      ></div>
                  </div>
                  <span className="text-xs text-gray-500">{data.month}</span>
                </div>
              ))}
            </div>
            
            {/* Chart Legend */}
            <div className="flex justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span className="text-gray-600">Study</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-300 rounded"></div>
                <span className="text-gray-600">Exams</span>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Progress</h2>
            
            <div className="space-y-6">
              {progressData.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.subject}</span>
                    <span className="text-sm font-medium text-gray-600">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}