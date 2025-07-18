import React, { useEffect, useState, useContext } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserCircleIcon as UserCircleOutlineIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { supabase, updateUserBonusPoints } from '../lib/supabaseClient';
import { SidebarContext } from '../components/mainLayout';

export default function Dashboard() {
  const { signOut, user, session, profile } = useAuth();
  const navigate = useNavigate();
  const { toggleSidebar } = useContext(SidebarContext);

  const [completedMaterialsCount, setCompletedMaterialsCount] = useState(0);
  const [learningStreak, setLearningStreak] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [progressData, setProgressData] = useState([]);

  const achievementTiers = [
    { minPoints: 0, title: "Novice Learner", description: "Just starting out on your learning journey. Keep going!", icon: "🌱" },
    { minPoints: 10, title: "Apprentice Scholar", description: "You're building a solid foundation. Great work!", icon: "📚" },
    { minPoints: 50, title: "Knowledge Seeker", description: "A true quest for knowledge. The path is clear!", icon: "✨" },
    { minPoints: 100, title: "Master Mind", description: "Unlocking advanced insights. Your expertise shines!", icon: "🧠" },
    { minPoints: 250, title: "Grand Sage", description: "A pillar of wisdom and inspiration. Truly remarkable!", icon: "🦉" },
    { minPoints: 500, title: "Tech Luminary", description: "You are a beacon in the world of technology. Outstanding!", icon: "💡" },
    { minPoints: 1000, title: "Code Alchemist", description: "You transmute ideas into digital gold!", icon: "⚗️" },
    { minPoints: 2000, title: "Digital Architect", description: "Building the future, one elegant solution at a time.", icon: "🏗️" },
    { minPoints: 5000, title: "Master of Tech", description: "A true virtuoso in the realm of technology. Unparalleled!", icon: "👑" },
  ];

  useEffect(() => {
    if (!user && !session) {
      console.log('No user or session detected. Redirecting to /Auth...');
      navigate('/Auth');
    }
  }, [user, session, navigate]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;

      setLoadingStats(true);
      setStatsError(null);

      try {
        const { count: lessonsCount, error: lessonsCompletionError } = await supabase
          .from('user_lessons_completion')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);

        if (lessonsCompletionError) throw lessonsCompletionError;
        setCompletedMaterialsCount(lessonsCount);

        const { data: dailyActivitiesForStreak, error: dailyActivityStreakError } = await supabase
            .from('user_daily_activity')
            .select('activity_date')
            .eq('user_id', user.id)
            .order('activity_date', { ascending: true });

        if (dailyActivityStreakError) throw dailyActivityStreakError;

        let currentStreak = 0;
        if (dailyActivitiesForStreak && dailyActivitiesForStreak.length > 0) {
            const uniqueSortedDates = [...new Set(dailyActivitiesForStreak.map(a => new Date(a.activity_date).toISOString().slice(0, 10)))].sort();

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const hasActivityToday = uniqueSortedDates.includes(today.toISOString().slice(0, 10));

            if (hasActivityToday) {
                currentStreak = 1;
                for (let i = 1; i < uniqueSortedDates.length; i++) {
                    const dateToCheck = new Date(today);
                    dateToCheck.setDate(today.getDate() - i);
                    const dateToCheckString = dateToCheck.toISOString().slice(0, 10);

                    if (uniqueSortedDates.includes(dateToCheckString)) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            } else {
                currentStreak = 0;
            }
        }
        
        // Logika pemberian poin untuk streak 10+ hari (Sisi Klien)
        // PERINGATAN: Ini adalah implementasi sisi klien. Untuk produksi,
        // Anda perlu melacak ini di database (misalnya, di kolom 'profiles.last_streak_rewarded_level')
        // untuk mencegah user mendapatkan poin berulang kali dan demi keamanan.
        const LAST_AWARDED_STREAK_KEY = `last_streak_rewarded_${user.id}`;
        const lastAwardedStreakLevel = parseInt(localStorage.getItem(LAST_AWARDED_STREAK_KEY) || '0', 10);

        if (currentStreak >= 10 && lastAwardedStreakLevel < 10) {
            console.log(`User ${user.id} achieved a streak of ${currentStreak}. Awarding 30 points.`);
            await updateUserBonusPoints(user.id, 30);
            localStorage.setItem(LAST_AWARDED_STREAK_KEY, '10'); // Tandai bahwa poin 10-hari streak sudah diberikan
            // Di sini, Anda mungkin perlu memicu refresh data profil user di AuthContext
            // (misalnya, panggil fungsi fetchProfile dari AuthContext jika ada)
        }
        // Anda bisa menambahkan tier streak lainnya di sini (misal: 30 hari, 90 hari)

        setLearningStreak(currentStreak);


        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const { data: dailyDurations, error: dailyDurationsError } = await supabase
          .from('user_daily_activity')
          .select('activity_date, duration_minutes')
          .eq('user_id', user.id)
          .gte('activity_date', sevenDaysAgo.toISOString().slice(0, 10))
          .order('activity_date', { ascending: true });

        if (dailyDurationsError) throw dailyDurationsError;

        const dailyChartDataMap = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(sevenDaysAgo);
            date.setDate(sevenDaysAgo.getDate() + i);
            const dayName = date.toLocaleString('en-US', { weekday: 'short' });
            const dateString = date.toISOString().slice(0, 10);
            dailyChartDataMap[dateString] = { label: dayName, date: dateString, value: 0 };
        }

        dailyDurations.forEach(activity => {
          const date = new Date(activity.activity_date);
          const dateString = date.toISOString().slice(0, 10);
          if (dailyChartDataMap[dateString]) {
            dailyChartDataMap[dateString].value += activity.duration_minutes || 0;
          }
        });
        setChartData(Object.values(dailyChartDataMap));

        const { data: userCourseProgresses, error: courseProgressError } = await supabase
          .from('user_course_progress')
          .select(`
            course_id,
            progress_percentage,
            courses ( title )
          `)
          .eq('user_id', user.id)
          .order('last_accessed_at', { ascending: false });

        if (courseProgressError) throw courseProgressError;

        const formattedProgressData = userCourseProgresses.map(progress => ({
          subject: progress.courses?.title || 'Unknown Course',
          progress: progress.progress_percentage
        }));
        setProgressData(formattedProgressData);

      } catch (err) {
        console.error('Error fetching dashboard stats:', err.message);
        setStatsError('Failed to load dashboard stats: ' + err.message);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardStats();
  }, [user, profile]); // Tambahkan profile ke dependency array agar refresh saat poin berubah
 
  const handleSignOut = async () => {
    try {
      console.log('Dashboard: Attempting sign out...');
      console.log('Dashboard: Current user state:', user);
      console.log('Dashboard: Current session state:', session);

      const result = await signOut();

      console.log('Dashboard: Sign out result:', result);

      if (result.error) {
        console.error('Dashboard: Sign out error:', result.error);
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
      navigate('/Auth');
    }
  };

  const handleStartNowClick = () => {
    navigate('/material');
  };

  if (!user) {
    return (
      <div className="h-screen w-full flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        Redirecting...
      </div>
    );
  }

  const userName = profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userBonusPoints = profile?.bonus_point || 0;
  const currentAchievementTier = achievementTiers.slice().reverse().find(tier => userBonusPoints >= tier.minPoints) || achievementTiers[0];

  return (
    <div className="flex-grow p-4 sm:p-6 bg-[#F9F9FB] rounded-xl dark:bg-dark-bg-secondary">
      <header className="mb-6 p-2 sm:p-4 bg-white rounded-xl shadow-sm flex items-center justify-between dark:bg-dark-bg-tertiary">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2" aria-label="Toggle sidebar">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-dark-text-light">Hi, {userName}!</h1>
        </div>

        <div className="flex items-center justify-end gap-3 sm:space-x-4 w-auto">
          {/* <div className="relative flex-shrink-0">
            <BellIcon className="h-6 w-6 text-gray-600 cursor-pointer dark:text-dark-text-medium" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
          </div> */}

          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition-colors shadow-md disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700"
            disabled={!user}
          >
            Logout
          </button>

          <Link to="/settings" className="flex items-center space-x-2 cursor-pointer flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="User Avatar"
                className="h-8 w-8 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            ) : (
              <UserCircleOutlineIcon className="h-8 w-8 text-gray-400 dark:text-dark-text-dark" />
            )}
          </Link>
        </div>
      </header>

      <div className="bg-light-purple text-light-text-dark p-6 sm:p-8 rounded-2xl shadow-lg relative overflow-hidden mb-6 dark:bg-dark-accent-purple dark:bg-opacity-30 dark:text-dark-text-light dark:shadow-none min-h-[150px] sm:min-h-[200px] flex items-center justify-between">
        <div className="relative z-10 max-w-full sm:max-w-[60%] lg:max-w-[50%]">
          <div className='p-0 sm:p-6'>
              <h2 className="text-xl sm:text-3xl font-bold mb-2 dark:text-dark-text-light">Informatics Learning Portal</h2>
              <p className="text-gray-700 mb-4 text-sm sm:text-lg dark:text-dark-text-medium">
              One Step Closer to Becoming Tech-Savvy!
              </p>
              <button
                onClick={handleStartNowClick}
                className="bg-white text-light-text-dark font-semibold py-2 px-6 rounded-full hover:bg-gray-100 transition-colors shadow-md dark:bg-dark-bg-tertiary dark:text-dark-text-light dark:hover:bg-gray-700"
              >
              Start Now
              </button>
          </div>
        </div>
          <img
              src="/banner-img.svg"
              alt="Banner Illustration"
              className="absolute right-0 top-0 h-full w-auto object-contain pointer-events-none hidden sm:block max-h-[250px] sm:max-h-[300px] lg:max-h-[350px]"
          />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 dark:bg-dark-bg-tertiary dark:border-gray-700 dark:shadow-none">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-medium">Achievements</h3>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center dark:bg-purple-900 dark:bg-opacity-30">
              <span className="text-purple-600 font-bold">🏆</span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-light">
              {loadingStats ? '...' : currentAchievementTier.title}
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-text-dark">{currentAchievementTier.description}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 dark:bg-dark-bg-tertiary dark:border-gray-700 dark:shadow-none">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-medium">Completed Materials</h3>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center dark:bg-green-900 dark:bg-opacity-30">
              <span className="text-green-600 font-bold">📚</span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-light">
              {loadingStats ? '...' : completedMaterialsCount} Materials Completed
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-text-dark">You've completed materials. Keep going!</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 dark:bg-dark-bg-tertiary dark:border-gray-700 dark:shadow-none">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600 dark:text-dark-text-medium">Learning Streak</h3>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center dark:bg-blue-900 dark:bg-opacity-30">
              <span className="text-blue-600 font-bold">🔥</span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-light">
              {loadingStats ? '...' : learningStreak} Current Streak
            </p>
            <p className="text-sm text-gray-500 dark:text-dark-text-dark">Maintain your consistency!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 dark:bg-dark-bg-tertiary dark:border-gray-700 dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-light">Time Spent</h2>
          </div>

          <div className="flex items-end justify-between h-48 mb-4">
            {chartData.length > 0 ? (() => {
                const maxMinutes = Math.max(...chartData.map(d => d.value));
                const chartHeightPx = 192;

                return chartData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center space-y-2 w-1/7">
                        <div className="flex items-end space-x-1 w-full">
                            <div
                                className="w-full bg-purple-500 rounded-t dark:bg-dark-accent-purple"
                                style={{
                                    height: maxMinutes > 0 ? `${(data.value / maxMinutes) * chartHeightPx}px` : '0px'
                                }}
                            ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-dark-text-dark">{data.label}</span>
                    </div>
                ));
            })() : (
              <div className="w-full text-center text-gray-500 dark:text-dark-text-dark">No activity data available for charts.</div>
            )}
          </div>

          <div className="flex justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded dark:bg-dark-accent-purple"></div>
              <span className="text-gray-600 dark:text-dark-text-medium">Minutes Spent</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 dark:bg-dark-bg-tertiary dark:border-gray-700 dark:shadow-none">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-light">Progress</h2>
          </div>

          <div className="space-y-6">
            {progressData.length > 0 ? progressData.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-dark-text-light">{item.subject}</span>
                  <span className="text-sm font-medium text-gray-600 dark:text-dark-text-medium">{item.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-purple-500 h-2 rounded-full transition-all duration-300 dark:bg-dark-accent-purple"
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 dark:text-dark-text-dark">No course progress available.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}