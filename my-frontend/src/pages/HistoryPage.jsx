// frontend/src/pages/HistoryPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { AuthContext } from '../context/AuthContext';
import { ClockIcon, AcademicCapIcon, ClipboardDocumentCheckIcon, BookOpenIcon, CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/outline'; // Tambah BookOpenIcon

export default function HistoryPage() {
    const { user } = useContext(AuthContext);
    const [activityHistory, setActivityHistory] = useState([]);
    const [courseProgressHistory, setCourseProgressHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistoryData = async () => {
            if (!user) {
                setLoading(false);
                setError('Anda harus login untuk melihat riwayat.');
                return;
            }

            setLoading(true);
            setError(null);
            try {
                // Fetch Quiz Attempts
                const { data: quizAttempts, error: quizError } = await supabase
                    .from('user_quiz_attempts')
                    .select(`
                        id,
                        quiz_id,
                        score_obtained,
                        is_passed,
                        attempted_at,
                        quizzes ( title )
                    `)
                    .eq('user_id', user.id);

                if (quizError) throw quizError;

                // Fetch Lesson Completions
                const { data: lessonCompletions, error: lessonError } = await supabase
                    .from('user_lessons_completion')
                    .select(`
                        id,
                        lesson_id,
                        completed_at,
                        lessons ( title, modules ( title, courses ( title ) ) )
                    `)
                    .eq('user_id', user.id);

                if (lessonError) throw lessonError;

                // Fetch Course Progress
                const { data: courseProgresses, error: courseProgressError } = await supabase
                    .from('user_course_progress')
                    .select(`
                        id,
                        course_id,
                        progress_percentage,
                        is_completed,
                        started_at,
                        completed_at,
                        last_accessed_at,
                        courses ( title )
                    `)
                    .eq('user_id', user.id)
                    .order('last_accessed_at', { ascending: false }); // Urutkan berdasarkan terakhir diakses

                if (courseProgressError) throw courseProgressError;

                const combinedActivities = [];

                // Format Quiz Attempts
                quizAttempts.forEach(attempt => {
                    combinedActivities.push({
                        id: `quiz-${attempt.id}`,
                        type: 'quiz_attempt',
                        date: new Date(attempt.attempted_at),
                        title: attempt.quizzes?.title || 'Kuis Tidak Dikenal',
                        score: attempt.score_obtained,
                        isPassed: attempt.is_passed,
                    });
                });

                // Format Lesson Completions
                lessonCompletions.forEach(completion => {
                    combinedActivities.push({
                        id: `lesson-${completion.id}`,
                        type: 'lesson_completion',
                        date: new Date(completion.completed_at),
                        title: completion.lessons?.title || 'Pelajaran Tidak Dikenal',
                        moduleTitle: completion.lessons?.modules?.title,
                        courseTitle: completion.lessons?.modules?.courses?.title,
                    });
                });

                // Sort activities by date (descending)
                combinedActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
                setActivityHistory(combinedActivities);

                // Format Course Progress (sudah diurutkan dari query)
                const formattedCourseProgress = courseProgresses.map(progress => ({
                    id: progress.id,
                    courseTitle: progress.courses?.title || 'Kursus Tidak Dikenal',
                    percentage: progress.progress_percentage,
                    isCompleted: progress.is_completed,
                    startedAt: new Date(progress.started_at),
                    completedAt: progress.completed_at ? new Date(progress.completed_at) : null,
                    lastAccessedAt: new Date(progress.last_accessed_at),
                }));
                setCourseProgressHistory(formattedCourseProgress);

            } catch (err) {
                console.error('Error fetching history data:', err.message);
                setError('Gagal memuat riwayat aktivitas: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchHistoryData();
        }
    }, [user]);

    const formatDateTime = (date) => {
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            // second: '2-digit', // Biasanya tidak perlu detik untuk riwayat
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl">
                    Memuat riwayat aktivitas...
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
                        <ClockIcon className="h-8 w-8 mr-3 text-purple-600" /> Riwayat Aktivitas Saya
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Card 1: Riwayat Aktivitas (Kuis & Pelajaran) */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                            <ClipboardDocumentCheckIcon className="h-7 w-7 mr-2 text-blue-500" /> Riwayat Kuis & Pelajaran
                        </h2>
                        {activityHistory.length > 0 ? (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2  scrollbar-hide"> {/* Tambah scrollbar */}
                                {activityHistory.map((item) => (
                                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-start space-x-4">
                                        {item.type === 'quiz_attempt' && (
                                            <div className="flex-shrink-0">
                                                <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-500" />
                                            </div>
                                        )}
                                        {item.type === 'lesson_completion' && (
                                            <div className="flex-shrink-0">
                                                <AcademicCapIcon className="h-8 w-8 text-green-500" />
                                            </div>
                                        )}
                                        <div className="flex-grow">
                                            <p className="font-semibold text-gray-800">
                                                {item.type === 'quiz_attempt' ? (
                                                    <>
                                                        Anda mengikuti kuis "{item.title}" &mdash; Skor: <span className="text-purple-600 font-bold">{item.score}</span> {item.isPassed ? <span className="text-green-600">(Lulus)</span> : <span className="text-red-600">(Tidak Lulus)</span>}
                                                    </>
                                                ) : (
                                                    <>
                                                        Anda menyelesaikan pelajaran "{item.title}"
                                                    </>
                                                )}
                                            </p>
                                            {item.type === 'lesson_completion' && (item.moduleTitle || item.courseTitle) && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {item.moduleTitle && `Modul: ${item.moduleTitle}`}
                                                    {item.moduleTitle && item.courseTitle && ` | `}
                                                    {item.courseTitle && `Kursus: ${item.courseTitle}`}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDateTime(item.date)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 text-lg py-10">
                                Belum ada riwayat kuis atau pelajaran.
                            </div>
                        )}
                    </div>

                    {/* Card 2: Riwayat Progres Kursus */}
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                            <BookOpenIcon className="h-7 w-7 mr-2 text-purple-600" /> Progres Kursus Anda
                        </h2>
                        {courseProgressHistory.length > 0 ? (
                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2"> {/* Tambah scrollbar */}
                                {courseProgressHistory.map((progress) => (
                                    <div key={progress.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="font-semibold text-gray-800">{progress.courseTitle}</p>
                                            {progress.isCompleted ? (
                                                <span className="flex items-center text-green-600 text-sm font-medium">
                                                    <SolidCheckCircleIcon className="h-5 w-5 mr-1" /> Selesai
                                                </span>
                                            ) : (
                                                <span className="text-purple-600 font-bold text-lg">{progress.percentage}%</span>
                                            )}
                                        </div>
                                        
                                        {!progress.isCompleted && (
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div 
                                                    className="bg-purple-500 h-2.5 rounded-full" 
                                                    style={{ width: `${progress.percentage}%` }}
                                                ></div>
                                            </div>
                                        )}

                                        <p className="text-xs text-gray-500">
                                            Dimulai: {formatDate(progress.startedAt)}
                                            {progress.completedAt && ` | Selesai: ${formatDate(progress.completedAt)}`}
                                            {!progress.isCompleted && ` | Terakhir Diakses: ${formatDate(progress.lastAccessedAt)}`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-600 text-lg py-10">
                                Anda belum memulai kursus apa pun.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}