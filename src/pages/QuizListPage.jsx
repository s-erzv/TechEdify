// frontend/src/pages/QuizListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { BookOpenIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Import MagnifyingGlassIcon

export default function QuizListPage() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // State for search query
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuizzes = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('quizzes')
                    .select('id, title, description, created_at, quiz_questions(count)');

                if (error) throw error;
                if (!data) throw new Error("Tidak ada kuis ditemukan.");
                
                // Map data untuk menyertakan jumlah pertanyaan
                const quizzesWithQuestionCount = data.map(quiz => ({
                    ...quiz,
                    question_count: quiz.quiz_questions[0]?.count || 0 // Akses count dari relasi
                }));
                
                setQuizzes(quizzesWithQuestionCount);
                console.log("Fetched quizzes:", quizzesWithQuestionCount);
            } catch (err) {
                console.error('Error fetching quizzes:', err.message);
                setError('Gagal memuat daftar kuis: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    const handleStartQuiz = (quizId) => {
        // Arahkan ke halaman kuis dengan quizId sebagai parameter
        navigate(`/quiz/${quizId}`);
    };

    // Filtered quizzes based on search query
    const filteredQuizzes = quizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                    Memuat daftar kuis...
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-red-600 text-xl dark:text-red-400">
                    Error: {error}
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex-grow p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)] dark:bg-dark-bg-secondary">
                <header className="mb-8 p-4 bg-white rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between dark:bg-dark-bg-tertiary">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-4 md:mb-0 dark:text-white">
                        <BookOpenIcon className="h-8 w-8 mr-3 text-purple-600 dark:text-dark-accent-purple" /> Daftar Kuis
                    </h1>
                    {/* Search Bar */}
                    <div className="relative w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder="Cari kuis..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-dark-accent-purple"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQuizzes.length > 0 ? (
                        filteredQuizzes.map((quiz) => (
                            <div 
                                key={quiz.id} 
                                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 flex flex-col dark:bg-dark-bg-tertiary dark:border-gray-700"
                            >
                                <h2 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">{quiz.title}</h2>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow dark:text-gray-300">{quiz.description || "Tidak ada deskripsi."}</p>
                                <div className="text-sm text-gray-500 mb-4 dark:text-gray-400">
                                    Jumlah Pertanyaan: <span className="font-medium text-gray-700 dark:text-gray-200">{quiz.question_count}</span>
                                </div>
                                <button
                                    onClick={() => handleStartQuiz(quiz.id)}
                                    className="mt-auto px-5 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition-colors self-start dark:bg-dark-accent-purple dark:hover:bg-purple-800"
                                >
                                    Mulai Kuis
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-600 text-lg py-10 dark:text-gray-400">
                            {searchQuery ? "Tidak ada kuis yang cocok dengan pencarian Anda." : "Belum ada kuis yang tersedia."}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}