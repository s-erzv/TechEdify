// frontend/src/pages/LessonViewerPage.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react'; // Tambah useCallback
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { AuthContext } from '../context/AuthContext';
import {
    ArrowLeftIcon,
    PlayCircleIcon,
    DocumentTextIcon,
    DocumentIcon,
    PhotoIcon,
    CodeBracketIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    BookOpenIcon,
    ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/solid';

// Helper function untuk mendapatkan ID video YouTube
const getYouTubeVideoId = (url) => {
    let videoId = '';
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=|embed\/|v\/|)([a-zA-Z0-9_-]{11})(?:\S+)?/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
        videoId = match[1];
    }
    return videoId;
};

export default function LessonViewerPage() {
    const { courseId, lessonId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [lessonDetails, setLessonDetails] = useState(null);
    const [courseStructure, setCourseStructure] = useState([]); // Daftar flat semua pelajaran di kursus
    const [courseModulesTree, setCourseModulesTree] = useState([]); // Struktur pohon modul & pelajaran
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [completedLessons, setCompletedLessons] = useState(new Set()); // Set untuk menyimpan ID pelajaran yang sudah selesai
    const [nextButtonLoading, setNextButtonLoading] = useState(false); // Loading untuk tombol next
    const [courseTitle, setCourseTitle] = useState(''); // Judul kursus
    const [isCompletingCourse, setIsCompletingCourse] = useState(false); // State baru untuk animasi tombol Complete Course
    const [rawCourseDataModules, setRawCourseDataModules] = useState([]); // State temporer untuk struktur course mentah

    // Fungsi untuk Fetch completed lessons - Dibuat sebagai useCallback agar stabil
    const fetchCompletedLessons = useCallback(async () => {
        if (!user || !courseId) return;
        try {
            console.log("Fetching completed lessons for user:", user.id, "course:", courseId);
            const { data, error } = await supabase
                .from('user_lessons_completion')
                .select('lesson_id')
                .eq('user_id', user.id)
                .eq('course_id', courseId);

            if (error) throw error;
            
            const completedLessonIds = new Set(data.map(item => item.lesson_id));
            setCompletedLessons(completedLessonIds);
            console.log("Completed lessons fetched:", completedLessonIds);
        } catch (err) {
            console.error('Error fetching completed lessons:', err.message);
        }
    }, [user, courseId]); // Dependencies: user dan courseId

    // useEffect pertama: Fetch detail pelajaran dan struktur kursus
    // Ini akan berjalan saat courseId atau lessonId berubah
    useEffect(() => {
        const fetchLessonAndCourseStructure = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch detail pelajaran saat ini dengan materinya
                const { data: lessonData, error: lessonError } = await supabase
                    .from('lessons')
                    .select(`
                        *,
                        lesson_materials (
                            order_in_lesson,
                            materials (id, title, content_type, content_url, content_text)
                        )
                    `)
                    .eq('id', lessonId)
                    .single();

                if (lessonError) throw lessonError;

                if (lessonData && lessonData.lesson_materials) {
                    lessonData.lesson_materials.sort((a, b) => a.order_in_lesson - b.order_in_lesson);
                }
                setLessonDetails(lessonData);

                // Fetch seluruh struktur kursus untuk navigasi sidebar dan tombol prev/next
                const { data: courseData, error: courseError } = await supabase
                    .from('courses')
                    .select(`
                        id,
                        title,
                        modules (
                            id,
                            title,
                            order_in_course,
                            lessons (
                                id,
                                title,
                                order_in_module
                            )
                        )
                    `)
                    .eq('id', courseId)
                    .single();

                if (courseError) throw courseError;

                setCourseTitle(courseData.title);
                setRawCourseDataModules(courseData.modules || []); // Simpan data mentah modul
                
                // Setelah fetching struktur kursus, panggil juga fetch completed lessons
                // ini untuk memastikan completedLessons di-refresh saat berpindah lesson
                if (user) {
                    await fetchCompletedLessons(); 
                }

            } catch (err) {
                console.error('Error fetching lesson or course structure:', err.message);
                setError('Gagal memuat materi pelajaran: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        if (courseId && lessonId) {
            fetchLessonAndCourseStructure();
        }
    }, [courseId, lessonId, user, fetchCompletedLessons]); // Tambahkan fetchCompletedLessons ke dependency array


    // useEffect kedua: Merekonstruksi courseModulesTree dan courseStructure
    // Kapanpun rawCourseDataModules atau completedLessons berubah, ini akan berjalan
    useEffect(() => {
        if (!rawCourseDataModules.length) {
            setCourseStructure([]); // Kosongkan jika tidak ada modul
            setCourseModulesTree([]);
            return;
        }

        const sortedModules = rawCourseDataModules.sort((a, b) => a.order_in_course - b.order_in_course);
        
        let allLessonsFlat = [];
        const modulesTree = sortedModules.map(module => {
            const sortedLessons = module.lessons ? module.lessons.sort((a, b) => a.order_in_module - b.order_in_module) : [];
            
            const lessonsWithCompletion = sortedLessons.map(lesson => ({
                ...lesson,
                moduleId: module.id,
                moduleTitle: module.title,
                isCompleted: completedLessons.has(lesson.id) // Tambahkan isCompleted di sini
            }));

            allLessonsFlat = allLessonsFlat.concat(lessonsWithCompletion);
            return { ...module, lessons: lessonsWithCompletion };
        });

        setCourseStructure(allLessonsFlat); // Data flat untuk prev/next
        setCourseModulesTree(modulesTree); // Data tree untuk sidebar

        console.log("Course structure and modules tree re-built with completion status.");
        console.log("Updated courseModulesTree:", modulesTree);
        console.log("Updated courseStructure (flat):", allLessonsFlat);

    }, [rawCourseDataModules, completedLessons]); // Dependencies: saat ini berubah, re-render tree


    const handleGoBack = () => {
        navigate(-1);
    };

    const findAdjacentLesson = (direction) => {
        const currentIndex = courseStructure.findIndex(lesson => lesson.id === lessonId);
        if (currentIndex === -1) return null;

        if (direction === 'prev' && currentIndex > 0) {
            return courseStructure[currentIndex - 1];
        } else if (direction === 'next' && currentIndex < courseStructure.length - 1) {
            return courseStructure[currentIndex + 1];
        }
        return null;
    };

    const prevLesson = findAdjacentLesson('prev');
    const nextLesson = findAdjacentLesson('next');

    const markLessonAsComplete = async (lessonIdToComplete) => {
        if (!user || !lessonIdToComplete || completedLessons.has(lessonIdToComplete)) return;

        try {
            console.log("Attempting to mark lesson as complete:", lessonIdToComplete);
            // 1. Catat penyelesaian pelajaran
            const { error: completionError } = await supabase.from('user_lessons_completion').insert({
                user_id: user.id,
                course_id: courseId,
                lesson_id: lessonIdToComplete,
                completed_at: new Date().toISOString()
            });
            if (completionError) throw completionError;

            console.log("Lesson completion recorded in DB.");

            // PENTING: Update local `completedLessons` SETELAH DB sukses.
            // Ini akan memicu `useEffect` ke-3 untuk merekonstruksi sidebar
            setCompletedLessons(prev => {
                const newSet = new Set(prev);
                newSet.add(lessonIdToComplete);
                console.log("Local completedLessons updated:", newSet);
                return newSet;
            });
            
            // 2. Perbarui progres kursus
            // Fetch ulang progres untuk memastikan kita punya data terbaru sebelum update
            const { data: userCourseProgress, error: fetchProgressError } = await supabase
                .from('user_course_progress')
                .select('*')
                .eq('user_id', user.id)
                .eq('course_id', courseId)
                .single();
            
            if (fetchProgressError && fetchProgressError.code !== 'PGRST116') { // PGRST116 = no rows found
                throw fetchProgressError;
            }

            const totalLessonsInCourse = courseStructure.length;
            
            // Hitung completed lessons berdasarkan SET LOKAL yang sudah diupdate
            const newCompletedLessonsCount = (completedLessons.has(lessonIdToComplete) ? completedLessons.size : completedLessons.size + 1);
            // Safety check for calculation if the set was not updated instantly
            // Or better, just use tempCompleted which contains the latest state including the just completed one
            const tempCompletedForCalculation = new Set(completedLessons);
            tempCompletedForCalculation.add(lessonIdToComplete);
            const actualNewCompletedLessonsCount = tempCompletedForCalculation.size;


            let newProgressPercentage = (actualNewCompletedLessonsCount / totalLessonsInCourse) * 100;
            if (isNaN(newProgressPercentage) || totalLessonsInCourse === 0) newProgressPercentage = 0;

            const updateData = {
                completed_lessons_count: actualNewCompletedLessonsCount,
                progress_percentage: newProgressPercentage,
                is_completed: newProgressPercentage >= 100,
                last_accessed_at: new Date().toISOString(),
                current_module_id: lessonDetails?.module_id || null,
                current_lesson_id: lessonDetails?.id || null
            };
            console.log("Calculated updateData for course progress:", updateData);

            if (userCourseProgress) {
                const { error: updateProgressError } = await supabase
                    .from('user_course_progress')
                    .update(updateData)
                    .eq('id', userCourseProgress.id);
                if (updateProgressError) throw updateProgressError;
                console.log("User course progress updated.");
            } else {
                console.warn("User course progress record not found, creating new one during completion.");
                const { error: insertProgressError } = await supabase
                    .from('user_course_progress')
                    .insert({
                        user_id: user.id,
                        course_id: courseId,
                        started_at: new Date().toISOString(),
                        ...updateData
                    });
                if (insertProgressError) throw insertProgressError;
                console.log("New user course progress created.");
            }

        } catch (err) {
            console.error('Error marking lesson complete:', err.message);
            if (err.code === '23505') {
                // Duplicate key error - lesson already completed. Set local state anyway.
                setCompletedLessons(prev => new Set([...prev, lessonIdToComplete]));
                console.log("Lesson already marked complete (duplicate key). Local state updated.");
            } else {
                alert('Gagal menandai pelajaran selesai: ' + err.message);
                // Rollback local state jika terjadi error (selain duplicate key)
                setCompletedLessons(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(lessonIdToComplete);
                    console.log("Error, rolling back local completedLessons:", newSet);
                    return newSet;
                });
            }
        }
    };

    const handleNextLessonNavigation = async () => {
        if (!user || nextButtonLoading) return;

        setNextButtonLoading(true);
        
        try {
            // Mark current lesson as complete if not already
            if (!completedLessons.has(lessonId)) {
                await markLessonAsComplete(lessonId);
            } else {
                console.log("Lesson already completed, skipping markLessonAsComplete.");
            }

            // Setelah operasi markLessonAsComplete selesai dan state `completedLessons` diperbarui,
            // barulah kita cek kondisi untuk navigasi.
            // Tidak perlu setTimeout di sini karena `completedLessons` sudah memicu re-render.
            
            const isCurrentLessonLast = courseStructure[courseStructure.length - 1]?.id === lessonId;

            if (nextLesson) {
                navigate(`/course/${courseId}/lesson/${nextLesson.id}`);
            } else if (isCurrentLessonLast) {
                setIsCompletingCourse(true);
                
                setTimeout(() => {
                    alert('Selamat! Anda telah menyelesaikan semua pelajaran dalam kursus ini.');
                    navigate(`/course/${courseId}/complete`);
                    setIsCompletingCourse(false);
                }, 1500); // Tunggu sebentar untuk animasi "Completing..."
            } else {
                console.warn("No next lesson found, but it's not the last lesson. Navigating to course overview.");
                navigate(`/course/${courseId}`);
            }
        } catch (err) {
            console.error('Error in next lesson navigation:', err.message);
            alert('Terjadi kesalahan saat melanjutkan: ' + err.message);
        } finally {
            if (!isCompletingCourse) {
                setNextButtonLoading(false);
            }
        }
    };

    const renderMaterial = (material) => {
        if (!material || !material.materials) {
            return <p>Materi tidak ditemukan.</p>;
        }

        const { content_type, content_url, content_text, title } = material.materials;

        const youtubeEmbedUrl = content_url && getYouTubeVideoId(content_url) 
                                ? `https://www.youtube.com/embed/${getYouTubeVideoId(content_url)}` 
                                : null; // Perbaikan URL YouTube embed

        switch (content_type) {
            case 'video_url':
                return youtubeEmbedUrl ? (
                    <div className="aspect-w-16 aspect-h-9 w-full">
                        <iframe
                            className="w-full h-full rounded-lg"
                            src={youtubeEmbedUrl}
                            title={title || "Video player"}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                ) : (
                    <p className="text-red-600">URL video tidak valid atau tidak didukung.</p>
                );
            case 'text':
                return (
                    <div className="prose max-w-none">
                        {/* Menggunakan dangerouslySetInnerHTML jika content_text adalah HTML */}
                        <div dangerouslySetInnerHTML={{ __html: content_text }} /> 
                        {/* Jika content_text adalah plain text, gunakan ini:
                        <p className="whitespace-pre-wrap">{content_text}</p>
                        */}
                    </div>
                );
            case 'script':
                return (
                    <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{content_text}</code>
                    </pre>
                );
            case 'image':
                return <img src={content_url} alt={title || "Material image"} className="max-w-full h-auto rounded-lg shadow-md" />;
            case 'pdf':
                return (
                    <div className="w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
                        <iframe src={content_url} className="w-full h-full" title={title || "PDF Viewer"}></iframe>
                        <p className="text-center mt-2">
                            <a href={content_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Unduh PDF
                            </a>
                        </p>
                    </div>
                );
            default:
                return <p>Tipe materi tidak dikenal: {content_type}</p>;
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl">
                    Memuat pelajaran...
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

    if (!lessonDetails) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl">
                    Pelajaran tidak ditemukan.
                </div>
            </MainLayout>
        );
    }

    const materials = lessonDetails.lesson_materials || [];
    const isCurrentLessonLast = courseStructure[courseStructure.length - 1]?.id === lessonId;


    return (
        <MainLayout>
            <div className="flex-grow p-6 bg-[#F9F9FB] rounded-xl">
                <header className="mb-6 p-4 bg-white rounded-xl shadow-sm flex items-center justify-between">
                    <div className="flex items-center">
                        <button onClick={handleGoBack} className="mr-4 text-gray-700 hover:text-gray-900">
                            <ArrowLeftIcon className="h-6 w-6" />
                        </button>
                        <div className="flex items-center">
                            <h1 className="text-3xl font-bold text-gray-900">{lessonDetails.title}</h1>
                            {/* Icon di samping judul pelajaran */}
                            {completedLessons.has(lessonId) && (
                                <CheckCircleIcon className="h-8 w-8 text-green-500 ml-3" />
                            )}
                        </div>
                    </div>
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">{courseTitle}</span>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Sidebar Navigasi Modul & Pelajaran */}
                    <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-md h-full overflow-y-auto max-h-[calc(100vh-120px)] sticky top-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Course Content</h2>
                        <nav className="space-y-4">
                            {courseModulesTree.map(module => (
                                <div key={module.id}>
                                    <h3 className="font-bold text-lg text-gray-900 flex items-center mb-2">
                                        <BookOpenIcon className="h-5 w-5 mr-2 text-purple-600" />
                                        {module.title}
                                    </h3>
                                    {module.lessons && module.lessons.length > 0 ? (
                                        <ul className="ml-4 border-l pl-3 space-y-1">
                                            {module.lessons.map(lesson => (
                                                <li key={lesson.id}>
                                                    <Link
                                                        to={`/course/${courseId}/lesson/${lesson.id}`}
                                                        className={`flex items-center py-2 px-3 rounded-md transition-colors duration-200 ${
                                                            lesson.id === lessonId
                                                                ? 'bg-purple-500 text-white font-medium shadow-sm'
                                                                : 'text-gray-700 hover:bg-gray-100 hover:text-purple-700'
                                                        }`}
                                                    >
                                                        {/* Icon di sidebar lesson - kini menggunakan `lesson.isCompleted` */}
                                                        {lesson.isCompleted ? (
                                                            <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                                                        ) : (
                                                            <PlayCircleIcon className="h-4 w-4 mr-2" />
                                                        )}
                                                        {lesson.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500 text-sm ml-4 italic">No lessons in this module.</p>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>

                    {/* Konten Pelajaran Utama */}
                    <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Lesson Content</h2>
                        
                        {materials.length > 0 ? (
                            <div className="space-y-8">
                                {materials.map((material, index) => (
                                    <div key={material.material_id || index} className="pb-6 border-b border-gray-200 last:border-b-0 last:pb-0">
                                        {renderMaterial(material)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600">Tidak ada materi ditemukan untuk pelajaran ini.</p>
                        )}

                        {/* Navigasi antar pelajaran */}
                        <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
                            {prevLesson ? (
                                <Link
                                    to={`/course/${courseId}/lesson/${prevLesson.id}`}
                                    className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                                >
                                    <ChevronLeftIcon className="h-5 w-5 mr-2" /> Previous Lesson
                                </Link>
                            ) : (
                                <button disabled className="flex items-center px-4 py-2 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed">
                                    <ChevronLeftIcon className="h-5 w-5 mr-2" /> Previous Lesson
                                </button>
                            )}

                            {isCurrentLessonLast ? (
                                <button
                                    onClick={handleNextLessonNavigation}
                                    disabled={nextButtonLoading || isCompletingCourse}
                                    className={`flex items-center px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300
                                        ${isCompletingCourse ? 'bg-green-600 animate-pulse' : 'bg-green-500 hover:bg-green-600'}
                                        disabled:opacity-50 disabled:cursor-not-allowed transform ${isCompletingCourse ? 'scale-105' : ''}`
                                    }
                                >
                                    {isCompletingCourse ? (
                                        <>
                                            <SolidCheckCircleIcon className="h-5 w-5 mr-2 animate-bounce" /> Completing...
                                        </>
                                    ) : (
                                        <>
                                            Complete Course <CheckCircleIcon className="h-5 w-5 ml-2" />
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={handleNextLessonNavigation}
                                    disabled={nextButtonLoading}
                                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                                >
                                    {nextButtonLoading ? 'Loading...' : 'Next Lesson'} 
                                    <ChevronRightIcon className="h-5 w-5 ml-2" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}