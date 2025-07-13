import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { SidebarContext } from '../components/mainLayout';
import { TrophyIcon, UserCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toggleSidebar } = useContext(SidebarContext);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: attempts, error: attemptsError } = await supabase
          .from('user_quiz_attempts')
          .select(`
            user_id,
            score_obtained,
            is_passed,
            profiles ( username, full_name, avatar_url, bonus_point ) // Menambahkan bonus_point
          `);

        if (attemptsError) throw attemptsError;
        if (!attempts) throw new Error("No attempt data found.");

        const aggregatedData = {};

        attempts.forEach(attempt => {
          const userId = attempt.user_id;
          const profile = attempt.profiles;

          if (!profile) return;

          if (!aggregatedData[userId]) {
            aggregatedData[userId] = {
              userId: userId,
              username: profile.username || profile.full_name || 'User',
              avatar_url: profile.avatar_url,
              totalScore: 0,
              totalAttempts: 0,
              totalPassedQuizzes: 0,
              currentBonusPoints: profile.bonus_point || 0 // Menyimpan bonus_point
            };
          }

          aggregatedData[userId].totalScore += attempt.score_obtained;
          aggregatedData[userId].totalAttempts += 1;
          if (attempt.is_passed) {
            aggregatedData[userId].totalPassedQuizzes += 1;
          }
          // Perbarui bonus_point setiap kali agar selalu yang terbaru jika ada banyak attempt
          aggregatedData[userId].currentBonusPoints = profile.bonus_point || 0;
        });

        const sortedLeaderboard = Object.values(aggregatedData)
          .map(user => ({
            ...user,
            averageScore: user.totalAttempts > 0 ? (user.totalScore / user.totalAttempts).toFixed(2) : 0
          }))
          // Urutkan berdasarkan currentBonusPoints (poin tertinggi di atas) atau averageScore jika poin sama
          .sort((a, b) => b.currentBonusPoints - a.currentBonusPoints || b.averageScore - a.averageScore);

        setLeaderboardData(sortedLeaderboard);
        console.log("Leaderboard Data:", sortedLeaderboard);

      } catch (err) {
        console.error('Error fetching leaderboard data:', err.message);
        setError('Failed to load leaderboard: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const getRankStyle = (index) => {
    if (index === 0) return 'bg-yellow-100 text-yellow-800 font-bold dark:bg-yellow-800 dark:text-yellow-100';
    if (index === 1) return 'bg-gray-200 text-gray-800 font-semibold dark:bg-gray-700 dark:text-gray-200';
    if (index === 2) return 'bg-amber-100 text-amber-800 font-semibold dark:bg-amber-800 dark:text-amber-100';
    return 'bg-white text-gray-700 dark:bg-dark-bg-tertiary dark:text-dark-text-medium';
  };

  if (loading) {
    return (
      <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        Loading leaderboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex justify-center items-center text-red-600 text-xl dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex-grow p-4 sm:p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)] dark:bg-dark-bg-secondary">
      <header className="mb-6 p-2 sm:p-4 bg-white rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between dark:bg-dark-bg-tertiary">
        <div className="flex items-center mb-4 md:mb-0">
          <button onClick={toggleSidebar} className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2" aria-label="Toggle sidebar">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-xl sm:text-4xl font-extrabold text-gray-900 flex items-center dark:text-dark-text-light">
            <TrophyIcon className="h-8 w-8 sm:h-10 sm:w-10 mr-4 text-yellow-500 transform rotate-[-10deg] dark:text-yellow-400" />
            Elite Leaderboard
            <SparklesIcon className="h-6 w-6 sm:h-8 sm:w-8 ml-3 text-purple-600 dark:text-dark-accent-purple" />
          </h1>
        </div>
      </header>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl dark:bg-dark-bg-tertiary dark:shadow-none">
        {leaderboardData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white dark:bg-dark-accent-purple dark:bg-opacity-50 dark:text-white">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-tl-xl">
                    Rank
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider">
                    Average Score
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold uppercase tracking-wider rounded-tr-xl">
                    Current Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 dark:bg-dark-bg-tertiary dark:divide-gray-700">
                {leaderboardData.map((user, index) => (
                  <tr key={user.userId} className={`${index % 2 === 0 ? 'bg-white dark:bg-dark-bg-tertiary' : 'bg-gray-50 dark:bg-dark-bg-secondary'} hover:bg-gray-100 transition-colors duration-150 dark:hover:bg-gray-700`}>
                    <td className={`px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-lg ${getRankStyle(index)}`}>
                      {index === 0 && <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 inline-block mr-2 text-yellow-500 dark:text-yellow-300" />}
                      {index + 1}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12">
                          {user.avatar_url ? (
                            <img className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-purple-300 shadow-md dark:border-dark-accent-purple dark:shadow-none" src={user.avatar_url} alt={user.username} />
                          ) : (
                            <UserCircleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 rounded-full border-2 border-gray-300 dark:text-dark-text-dark dark:border-gray-600" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm sm:text-md font-medium text-gray-900 dark:text-dark-text-light">{user.username}</div>
                          {user.full_name && user.username !== user.full_name && (
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-dark-text-dark">{user.full_name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-md sm:text-lg text-gray-800 dark:text-dark-text-light">
                      <span className="font-bold text-purple-700 dark:text-dark-accent-purple">{user.averageScore}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-md sm:text-lg text-gray-800 dark:text-dark-text-light">
                      <span className="font-bold text-green-600 dark:text-green-500">{user.currentBonusPoints}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-gray-600 text-lg py-10 dark:text-dark-text-medium">
            Leaderboard has no data yet. Start taking quizzes!
          </div>
        )}
      </div>
    </div>
  );
}