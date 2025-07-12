// frontend/src/pages/QuizPage.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
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
                        quiz_questions ( 
                            id,
                            question_text,
                            question_type,
                            order_in_quiz,
                            options,
                            correct_answer_index,
                            correct_answer_text
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
                                } else {
                                    console.warn("Unexpected options array content for question:", qq.id, rawOptions);
                                    parsedOptions = [{ id: 'error_opt', option_text: rawOptions || 'Error parsing options', is_correct: false }];
                                }
                            } else {
                                console.warn("Options is not an array after JSON.parse for question:", qq.id, rawOptions);
                                parsedOptions = [{ id: 'error_opt', option_text: rawOptions || 'Error parsing options', is_correct: false }];
                            }
                        } catch (parseErr) {
                            console.error("Failed to parse options JSON for question:", qq.id, parseErr, "Raw options:", qq.options);
                            parsedOptions = [{ id: 'error_opt', option_text: qq.options || 'Error parsing options', is_correct: false }];
                        }

                        return {
                            id: qq.id, 
                            question_text: qq.question_text,
                            question_type: qq.question_type,
                            order_in_quiz: qq.order_in_quiz,
                            options: parsedOptions, 
                            correct_answer_index: qq.correct_answer_index, 
                            correct_answer_text: qq.correct_answer_text 
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
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
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
                if (question.question_type === 'multiple_choice' && question.correct_answer_index !== undefined && question.options[question.correct_answer_index]) {
                    const selectedOption = question.options.find(opt => opt.id === userAnswerId);
                    isCurrentAnswerCorrect = (selectedOption?.option_text === question.options[question.correct_answer_index].option_text);
                    actualCorrectAnswerText = question.options[question.correct_answer_index].option_text;
                } else if (question.correct_answer_text) {
                    const selectedOption = question.options.find(opt => opt.id === userAnswerId);
                    isCurrentAnswerCorrect = (selectedOption?.option_text === question.correct_answer_text);
                    actualCorrectAnswerText = question.correct_answer_text;
                }
            }
            
            if (isCurrentAnswerCorrect) {
                correctCount++;
                newFeedback[question.id] = { isCorrect: true };
            } else {
                newFeedback[question.id] = { 
                    isCorrect: false, 
                    correctAnswer: actualCorrectAnswerText
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
                    // Hapus baris 'total_questions' karena tidak ada di skema DB Anda
                    // atau ubah namanya jika ada kolom yang setara di DB Anda
                    is_passed: isPassed,
                    // attempted_at sudah ada di DB, jadi biarkan seperti ini
                    attempted_at: new Date().toISOString(), 
                });
                if (saveError) throw saveError;
                console.log("Quiz results saved to database.");
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
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl">
                    Memuat kuis...
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

    if (!quizDetails || questions.length === 0) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl">
                    Kuis tidak ditemukan atau belum ada pertanyaan.
                </div>
            </MainLayout>
        );
    }

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <MainLayout>
            <div className="flex-grow p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)]">
                <header className="mb-6 p-4 bg-white rounded-xl shadow-sm flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={handleGoBack} className="mr-4 text-gray-700 hover:text-gray-900">
                            <ArrowLeftIcon className="h-6 w-6" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">{quizDetails.title}</h1>
                    </div>
                    {quizDetails.description && (
                        <p className="text-sm text-gray-600">{quizDetails.description}</p>
                    )}
                </header>

                <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center">
                    {!quizCompleted ? (
                        <>
                            <div className="w-full text-center mb-6">
                                <p className="text-lg text-gray-600 mb-2">
                                    Pertanyaan {currentQuestionIndex + 1} dari {questions.length}
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" 
                                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="w-full max-w-2xl">
                                <h3 className="text-xl font-semibold mb-6 text-gray-800">
                                    {currentQuestion.question_text}
                                </h3>
                               <div className="space-y-4">
                                    {currentQuestion.options && currentQuestion.options.length > 0 ? (
                                        currentQuestion.options.map((option, index) => ( 
                                            <button
                                                key={option.id} 
                                                onClick={() => handleOptionSelect(currentQuestion.id, option.id)}
                                                className={`w-full text-left p-4 rounded-lg border-2 transition-colors duration-200
                                                    ${userAnswers[currentQuestion.id] === option.id
                                                        ? 'border-purple-600 bg-purple-50 text-purple-800'
                                                        : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {option.option_text} 
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-red-500">Opsi tidak tersedia untuk pertanyaan ini.</p>
                                    )}
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button
                                        onClick={handleNextQuestion}
                                        disabled={!userAnswers[currentQuestion.id]}
                                        className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {currentQuestionIndex === questions.length - 1 ? 'Submit Quiz' : 'Next Question'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full max-w-2xl text-center">
                            <h2 className="text-3xl font-bold mb-4 text-gray-900">Quiz Completed!</h2>
                            <p className="text-2xl text-gray-700 mb-6">Your Score: <span className="font-bold text-purple-600">{score}</span> / {questions.length}</p>
                            
                            {quizDetails.pass_score !== null && (
                                <p className={`text-xl font-semibold mb-8 ${score >= quizDetails.pass_score ? 'text-green-600' : 'text-red-600'}`}>
                                    {score >= quizDetails.pass_score ? 'You Passed!' : `You Did Not Pass. Passing score: ${quizDetails.pass_score}`}
                                </p>
                            )}

                            {showResults && (
                                <div className="mt-8 text-left border-t pt-6">
                                    <h3 className="text-2xl font-semibold mb-4 text-gray-800">Review Your Answers</h3>
                                    <div className="space-y-6">
                                        {questions.map((question, index) => (
                                            <div key={question.id} className="p-4 border rounded-lg bg-gray-50">
                                                <div className="flex items-start mb-2">
                                                    {feedback[question.id]?.isCorrect ? (
                                                        <SolidCheckCircleIcon className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                                                    ) : (
                                                        <SolidXCircleIcon className="h-6 w-6 text-red-500 mr-2 flex-shrink-0" />
                                                    )}
                                                    <p className="font-semibold text-gray-900 text-lg flex-grow">
                                                        {index + 1}. {question.question_text}
                                                    </p>
                                                </div>
                                                <p className="text-gray-700 mb-2 ml-8">Your Answer: {question.options.find(opt => opt.id === userAnswers[question.id])?.option_text || 'Not answered'}</p>
                                                {!feedback[question.id]?.isCorrect && feedback[question.id]?.correctAnswer && (
                                                    <p className="text-green-600 ml-8">Correct Answer: {feedback[question.id]?.correctAnswer}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex justify-center space-x-4">
                                <button
                                    onClick={handleRetakeQuiz}
                                    className="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                                >
                                    Retake Quiz
                                </button>
                                <button
                                    onClick={handleGoBack}
                                    className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
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