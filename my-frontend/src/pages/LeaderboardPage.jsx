import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { TrophyIcon, UserCircleIcon, SparklesIcon } from '@heroicons/react/24/solid'; // Menggunakan ikon solid untuk kesan premium

export default function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
                        profiles ( username, full_name, avatar_url )
                    `);

                if (attemptsError) throw attemptsError;
                if (!attempts) throw new Error("Tidak ada data percobaan ditemukan.");

                const aggregatedData = {};

                attempts.forEach(attempt => {
                    const userId = attempt.user_id;
                    const profile = attempt.profiles;

                    if (!profile) return;

                    if (!aggregatedData[userId]) {
                        aggregatedData[userId] = {
                            userId: userId,
                            username: profile.username || profile.full_name || 'Pengguna',
                            avatar_url: profile.avatar_url,
                            totalScore: 0,
                            totalAttempts: 0,
                            totalPassedQuizzes: 0
                        };
                    }

                    aggregatedData[userId].totalScore += attempt.score_obtained;
                    aggregatedData[userId].totalAttempts += 1;
                    if (attempt.is_passed) {
                        aggregatedData[userId].totalPassedQuizzes += 1;
                    }
                });

                const sortedLeaderboard = Object.values(aggregatedData)
                    .map(user => ({
                        ...user,
                        averageScore: user.totalAttempts > 0 ? (user.totalScore / user.totalAttempts).toFixed(2) : 0 
                    }))
                    .sort((a, b) => b.averageScore - a.averageScore); 

                setLeaderboardData(sortedLeaderboard);
                console.log("Leaderboard Data:", sortedLeaderboard);

            } catch (err) {
                console.error('Error fetching leaderboard data:', err.message);
                setError('Gagal memuat peringkat: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboardData();
    }, []);

    const getRankStyle = (index) => {
        if (index === 0) return 'bg-yellow-100 text-yellow-800 font-bold'; // Emas
        if (index === 1) return 'bg-gray-200 text-gray-800 font-semibold'; // Perak
        if (index === 2) return 'bg-amber-100 text-amber-800 font-semibold'; // Perunggu
        return 'bg-white text-gray-700';
    };

    return (
        <MainLayout>
            <div className="flex-grow p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-[calc(100vh-80px)]">
                <header className="mb-8 p-6 bg-white rounded-2xl shadow-xl flex items-center justify-between">
                    <h1 className="text-4xl font-extrabold text-gray-900 flex items-center">
                       <TrophyIcon className="h-10 w-10 mr-4 text-yellow-500 transform rotate-[-10deg]" /> 
                        Papan Peringkat Elite
                        <SparklesIcon className="h-8 w-8 ml-3 text-purple-600" />
                    </h1>
                </header>

                <div className="bg-white p-8 rounded-2xl shadow-2xl">
                    {leaderboardData.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider rounded-tl-xl">
                                            Peringkat
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                                            Pengguna
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                                            Skor Rata-rata
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider rounded-tr-xl">
                                            Progres
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {leaderboardData.map((user, index) => (
                                        <tr key={user.userId} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150`}>
                                            <td className={`px-6 py-4 whitespace-nowrap text-lg ${getRankStyle(index)}`}>
                                                {index === 0 && <TrophyIcon className="h-6 w-6 inline-block mr-2 text-yellow-500" />}
                                                {index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-12 w-12">
                                                        {user.avatar_url ? (
                                                            <img className="h-12 w-12 rounded-full object-cover border-2 border-purple-300 shadow-md" src={user.avatar_url} alt={user.username} />
                                                        ) : (
                                                            <UserCircleIcon className="h-12 w-12 text-gray-400 rounded-full border-2 border-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-md font-medium text-gray-900">{user.username}</div>
                                                        {user.full_name && user.username !== user.full_name && (
                                                            <div className="text-sm text-gray-500">{user.full_name}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-800">
                                                <span className="font-bold text-purple-700">{user.averageScore}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-md text-gray-800">
                                                <div className="flex items-center">
                                                    <div className="w-24 bg-gray-200 rounded-full h-2.5 mr-2">
                                                        <div 
                                                            className="bg-green-500 h-2.5 rounded-full" 
                                                            style={{ width: `${(user.totalPassedQuizzes / user.totalAttempts) * 100 || 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-gray-600">
                                                        {user.totalPassedQuizzes} dari {user.totalAttempts}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center text-gray-600 text-lg py-10">
                            Leaderboard belum memiliki data. Yuk, mulai kerjakan kuis!
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}