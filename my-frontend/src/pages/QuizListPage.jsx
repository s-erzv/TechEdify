// frontend/src/pages/QuizListPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { BookOpenIcon } from '@heroicons/react/24/outline'; // Icon untuk kuis

export default function QuizListPage() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuizzes = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('quizzes')
                    .select('id, title, description, created_at, quiz_questions(count)'); // Ambil jumlah pertanyaan

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

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl">
                    Memuat daftar kuis...
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-red-600 text-xl">
                    Error: {error}
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex-grow p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)]">
                <header className="mb-8 p-4 bg-white rounded-xl shadow-sm flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <BookOpenIcon className="h-8 w-8 mr-3 text-purple-600" /> Daftar Kuis
                    </h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.length > 0 ? (
                        quizzes.map((quiz) => (
                            <div 
                                key={quiz.id} 
                                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 flex flex-col"
                            >
                                <h2 className="text-xl font-semibold text-gray-800 mb-2">{quiz.title}</h2>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{quiz.description || "Tidak ada deskripsi."}</p>
                                <div className="text-sm text-gray-500 mb-4">
                                    Jumlah Pertanyaan: <span className="font-medium text-gray-700">{quiz.question_count}</span>
                                </div>
                                <button
                                    onClick={() => handleStartQuiz(quiz.id)}
                                    className="mt-auto px-5 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition-colors self-start"
                                >
                                    Mulai Kuis
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-600 text-lg py-10">
                            Belum ada kuis yang tersedia.
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}