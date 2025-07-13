// my-frontend/src/pages/QuizPage.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, recordDailyActivity } from '../lib/supabaseClient'; // Import recordDailyActivity
import MainLayout from '../components/mainLayout';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircleIcon, XCircleIcon as SolidXCircleIcon } from '@heroicons/react/24/solid';

const getYouTubeVideoId = (url) => { 
    let videoId = '';
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([a-zA-Z0-9_-]{11})(?:\S+)?/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
        videoId = match[1];
    }
    return videoId;
};

export default function QuizPage() {
    const { quizId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [quizDetails, setQuizDetails] = useState(null);
    const [questions, setQuestions] = useState([]); 
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState({});
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [score, setScore] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showResults, setShowResults] = useState(false);
    const [feedback, setFeedback] = useState({});

    useEffect(() => {
        const fetchQuizData = async () => {
            setLoading(true);
            setError(null);
            try {
                if (!quizId) {
                    throw new Error("Quiz ID is missing from URL.");
                }

                const { data: quizData, error: quizError } = await supabase
                    .from('quizzes')
                    .select(`
                        id,
                        title,
                        description,
                        pass_score,
                        image_url, 
                        quiz_questions ( 
                            id,
                            question_text,
                            question_type,
                            order_in_quiz,
                            options,
                            correct_answer_index,
                            correct_answer_text,
                            image_url, 
                            hint
                        )
                    `)
                    .eq('id', quizId)
                    .single();

                if (quizError) throw quizError;
                if (!quizData) throw new Error("Quiz not found.");

                const questionsRaw = quizData.quiz_questions || [];

                const sortedQuestions = questionsRaw
                    .map(qq => {
                        let parsedOptions = [];
                        // Logika parsing opsi yang sudah ada untuk tipe pertanyaan lain (misal: multiple_choice)
                        if (qq.question_type === 'short_answer') {
                            parsedOptions = []; // Short answer questions don't have selectable options
                        } else {
                            try {
                                const rawOptions = qq.options;
                                const tempOptions = JSON.parse(rawOptions); 

                                if (Array.isArray(tempOptions)) {
                                    if (tempOptions.every(item => typeof item === 'string')) {
                                        parsedOptions = tempOptions.map((text, idx) => ({
                                            id: `${qq.id}-option-${idx}`, 
                                            option_text: text,
                                            is_correct: (idx === qq.correct_answer_index) 
                                        }));
                                    } 
                                    else if (tempOptions.every(item => typeof item === 'object' && item !== null && 'option_text' in item)) {
                                        parsedOptions = tempOptions.map(opt => ({
                                            id: opt.id || `${qq.id}-option-${Math.random().toString(36).substring(2, 9)}`, 
                                            option_text: opt.option_text,
                                            is_correct: opt.is_correct || false
                                        }));
                                    } 
                                    else {
                                        console.warn("Unexpected options array content for question:", qq.id, rawOptions);
                                        parsedOptions = [{ id: 'error_opt', option_text: rawOptions || 'Error parsing options', is_correct: false }];
                                    }
                                } 
                                else {
                                    console.warn("Options is not an array after JSON.parse for question:", qq.id, rawOptions);
                                    parsedOptions = [{ id: 'error_opt', option_text: rawOptions || 'Error parsing options', is_correct: false }];
                                }
                            } catch (parseErr) {
                                console.error("Failed to parse options JSON for question:", qq.id, parseErr, "Raw options:", qq.options);
                                parsedOptions = [{ id: 'error_opt', option_text: qq.options || 'Error parsing options', is_correct: false }];
                            }
                        }
                        return {
                            id: qq.id, 
                            question_text: qq.question_text,
                            question_type: qq.question_type,
                            order_in_quiz: qq.order_in_quiz,
                            options: parsedOptions, 
                            correct_answer_index: qq.correct_answer_index, 
                            correct_answer_text: qq.correct_answer_text,
                            image_url: qq.image_url, // Pastikan ini juga disalin ke objek pertanyaan
                            hint: qq.hint, // Pastikan ini juga disalin ke objek pertanyaan
                        };
                    })
                    .sort((a, b) => a.order_in_quiz - b.order_in_quiz);

                setQuizDetails(quizData);
                setQuestions(sortedQuestions);
                
                console.log("Fetched quiz data with current schema:", quizData);
                console.log("Structured questions for display (parsed options):", sortedQuestions);

            } catch (err) {
                console.error('Error fetching quiz data:', err.message);
                setError('Gagal memuat kuis: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizData();
    }, [quizId]);

    const handleOptionSelect = (questionId, optionId) => {
            console.log(`Question ID: ${questionId}, Captured Answer: ${optionId}`); // <<< TAMBAHKAN BARIS INI
            setUserAnswers(prev => ({
                ...prev,
                [questionId]: optionId
            }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            console.log("Final user answers before calculating score:", userAnswers); // <<< TAMBAHKAN BARIS INI
            calculateScore();
            setQuizCompleted(true);
        }
    };

    const calculateScore = async () => {
        let correctCount = 0;
        const newFeedback = {};
        questions.forEach(question => {
            const userAnswerId = userAnswers[question.id];
            
            let isCurrentAnswerCorrect = false;
            let actualCorrectAnswerText = '';

            const correctAnswerOption = question.options.find(opt => opt.is_correct);

            if (correctAnswerOption) {
                isCurrentAnswerCorrect = (userAnswerId === correctAnswerOption.id);
                actualCorrectAnswerText = correctAnswerOption.option_text;
            } else {
                 if (question.question_type === 'multiple_choice' || question.question_type === 'true_false') {
                // Untuk pilihan ganda/true_false, cari opsi yang benar berdasarkan is_correct atau index
                const correctAnswerOption = question.options.find(opt => opt.is_correct) || 
                    (question.correct_answer_index !== null && question.options[question.correct_answer_index]);

                if (correctAnswerOption) {
                    isCurrentAnswerCorrect = (userAnswerId === correctAnswerOption.id);
                    actualCorrectAnswerText = correctAnswerOption.option_text;
                }
            } else if (question.question_type === 'short_answer') {
                // Untuk jawaban singkat, bandingkan teks jawaban pengguna dengan correct_answer_text
                if (question.correct_answer_text) {
                    // Perbandingan case-insensitive
                    isCurrentAnswerCorrect = (userAnswers[question.id]?.toLowerCase() === question.correct_answer_text.toLowerCase());
                    actualCorrectAnswerText = question.correct_answer_text;
                }
            } else if (question.question_type === 'essay') {
                // Pertanyaan esai biasanya dinilai secara manual.
                // Secara otomatis, ini akan dinilai salah kecuali ada logika penilaian manual di sini.
                isCurrentAnswerCorrect = false; 
                actualCorrectAnswerText = question.correct_answer_text || "Penilaian manual diperlukan";
            }
            }
            
            if (isCurrentAnswerCorrect) {
                correctCount++;
                newFeedback[question.id] = { isCorrect: true };
            } else {
                newFeedback[question.id] = { 
                    isCorrect: false,
                    hint: question.hint // Pastikan hint ada di sini
                };
            }
        });
        setScore(correctCount);
        setFeedback(newFeedback);
        setShowResults(true);

        if (user && quizDetails) {
            try {
                const isPassed = quizDetails.pass_score !== null ? (correctCount >= quizDetails.pass_score) : false;
                const { error: saveError } = await supabase.from('user_quiz_attempts').insert({
                    user_id: user.id,
                    quiz_id: quizDetails.id,
                    score_obtained: correctCount,
                    is_passed: isPassed,
                    attempted_at: new Date().toISOString(), 
                });
                if (saveError) throw saveError;
                console.log("Quiz results saved to database.");
                // --- BARIS BARU: Catat aktivitas harian untuk percobaan kuis ---
                await recordDailyActivity(user.id, 'quiz_attempted', 1);
            } catch (err) {
                console.error("Error saving quiz results:", err.message);
            }
        }
    };

    const handleRetakeQuiz = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setQuizCompleted(false);
        setScore(0);
        setFeedback({});
        setShowResults(false);
    };

    const handleGoBack = () => {
        navigate('/dashboard'); 
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                    Memuat kuis...
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

    if (!quizDetails || questions.length === 0) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                    Kuis tidak ditemukan atau belum ada pertanyaan.
                </div>
            </MainLayout>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <MainLayout>
            <div className="flex-grow p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)] dark:bg-dark-bg-secondary">
                <header className="mb-6 p-4 bg-white rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between dark:bg-dark-bg-tertiary">
                    <div className="flex items-center mb-4 md:mb-0">
                        <button onClick={handleGoBack} className="mr-4 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                            <ArrowLeftIcon className="h-6 w-6" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{quizDetails.title}</h1>
                    </div>
                    {quizDetails.image_url && ( // <<< BLOK BARU UNTUK GAMBAR THUMBNAIL KUIS
                        <div className="md:ml-auto mb-4 md:mb-0">
                            <img src={quizDetails.image_url} alt={`${quizDetails.title} Thumbnail`} className="h-10 w-auto object-cover rounded-full" />
                        </div>
                    )}
                    {quizDetails.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 md:ml-4">{quizDetails.description}</p>
                    )}
                </header>

                <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center dark:bg-dark-bg-tertiary dark:shadow-none">
                    {!quizCompleted ? (
                        <>
                            <div className="w-full text-center mb-6">
                                <p className="text-lg text-gray-600 mb-2 dark:text-gray-300">
                                    Pertanyaan {currentQuestionIndex + 1} dari {questions.length}
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                    <div 
                                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 dark:bg-dark-accent-purple" 
                                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="w-full max-w-2xl">
                                <h3 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
                                    {currentQuestion.question_text}
                                </h3>
                                {currentQuestion.image_url && ( // <<< BLOK BARU UNTUK GAMBAR PERTANYAAN
                                    <div className="mb-6">
                                        <img src={currentQuestion.image_url} alt="Question Image" className="max-w-full h-auto rounded-lg shadow-md dark:shadow-none mx-auto" />
                                    </div>
                                )}
                                <div className="space-y-4">
                                    {currentQuestion.question_type === 'multiple_choice' || currentQuestion.question_type === 'true_false' ? (
                                        // Render opsi sebagai tombol untuk multiple_choice atau true_false
                                        currentQuestion.options && currentQuestion.options.length > 0 ? (
                                            currentQuestion.options.map((option, index) => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                                                    className={`w-full text-left p-4 rounded-lg border-2 transition-colors duration-200
                                                        ${userAnswers[currentQuestion.id] === option.id
                                                            ? 'border-purple-600 bg-purple-50 text-purple-800 dark:border-dark-accent-purple dark:bg-dark-accent-purple dark:bg-opacity-20 dark:text-dark-accent-purple'
                                                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100'
                                                        }`}
                                                >
                                                    {option.option_text}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-red-500 dark:text-red-400">Opsi tidak tersedia untuk pertanyaan ini.</p>
                                        )
                                    ) : currentQuestion.question_type === 'short_answer' ? (
                                        // Render input teks untuk short_answer
                                        <input
                                            type="text"
                                            className="w-full p-4 rounded-lg border-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                                            placeholder="Ketik jawaban Anda di sini..."
                                            value={userAnswers[currentQuestion.id] || ''}
                                            onChange={(e) => handleOptionSelect(currentQuestion.id, e.target.value)}
                                        />
                                    ) : (
                                        // Fallback jika tipe pertanyaan tidak dikenal
                                        <p className="text-red-500 dark:text-red-400">Tipe pertanyaan tidak didukung.</p>
                                    )}
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handleNextQuestion}
                                        disabled={!userAnswers[currentQuestion.id]}
                                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-accent-purple dark:hover:bg-purple-800"
                                    >
                                        {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full max-w-2xl text-center">
                            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Quiz Completed!</h2>
                            <p className="text-2xl text-gray-700 mb-6 dark:text-gray-200">Your Score: <span className="font-bold text-purple-600 dark:text-dark-accent-purple">{score}</span> / {questions.length}</p>
                            
                            {quizDetails.pass_score !== null && (
                                <p className={`text-xl font-semibold mb-8 ${score >= quizDetails.pass_score ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                    {score >= quizDetails.pass_score ? 'You Passed!' : `You Did Not Pass. Passing score: ${quizDetails.pass_score}`}
                                </p>
                            )}

                            {showResults && (
                                <div className="mt-8 text-left border-t pt-6 dark:border-gray-700">
                                    <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Review Your Answers</h3>
                                    <div className="space-y-6">
                                        {questions.map((question, index) => (
                                            <div key={question.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                                                <div className="flex items-start mb-2">
                                                    {feedback[question.id]?.isCorrect ? (
                                                        <SolidCheckCircleIcon className="h-6 w-6 text-green-500 mr-2 flex-shrink-0 dark:text-green-400" />
                                                    ) : (
                                                        <SolidXCircleIcon className="h-6 w-6 text-red-500 mr-2 flex-shrink-0 dark:text-red-400" />
                                                    )}
                                                    <p className="font-semibold text-gray-900 text-lg flex-grow dark:text-white">
                                                        {index + 1}. {question.question_text}
                                                    </p>
                                                </div>
                                                <p className="text-gray-700 mb-2 ml-8 dark:text-gray-300">
                                                    Your Answer: {
                                                        currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay' ?
                                                        (userAnswers[currentQuestion.id] || 'Tidak dijawab') : // Tampilkan teks langsung
                                                        (question.options.find(opt => opt.id === userAnswers[currentQuestion.id])?.option_text || 'Tidak dijawab') // Untuk pilihan ganda
                                                    }
                                                </p>
                                                
                                                {/* Konten Hint */}
                                                {!feedback[question.id]?.isCorrect && feedback[question.id]?.hint && (
                                                    <p className="text-blue-600 ml-8 dark:text-blue-400">Petunjuk: {feedback[question.id]?.hint}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex justify-center space-x-4">
                                <button
                                    onClick={handleRetakeQuiz}
                                    className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    Retake Quiz
                                </button>
                                <button
                                    onClick={handleGoBack}
                                    className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}