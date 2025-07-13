// frontend/src/pages/CourseDetailsPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { AuthContext } from '../context/AuthContext';
import {
    AcademicCapIcon,
    BookOpenIcon,
    PlayCircleIcon,
    DocumentTextIcon,
    DocumentIcon,
    PhotoIcon,
    EyeIcon,
    XMarkIcon,
    CodeBracketIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

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

export default function CourseDetailsPage() {
    const { courseId } = useParams();
    const { user } = useContext(AuthContext);
    const [courseDetails, setCourseDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourseDetails = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase.from('courses').select(`
                    *,
                    profiles (full_name, email),
                    modules (
                        *,
                        lessons (
                            *,
                            lesson_materials (
                                order_in_lesson,
                                materials (id, title, content_type, content_url, content_text)
                            )
                        )
                    )
                `).eq('id', courseId).single();

                if (fetchError) throw fetchError;

                if (data && data.modules) {
                    data.modules.sort((a, b) => a.order_in_course - b.order_in_course);
                    data.modules.forEach(module => {
                        if (module.lessons) {
                            module.lessons.sort((a, b) => a.order_in_module - b.order_in_module);
                            module.lessons.forEach(lesson => {
                                if (lesson.lesson_materials) {
                                    lesson.lesson_materials.sort((a, b) => a.order_in_lesson - b.order_in_lesson);
                                }
                            });
                        }
                    });
                }
                
                setCourseDetails(data);
            } catch (err) {
                console.error('Error fetching course details:', err.message);
                setError('Gagal memuat detail kursus: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        const checkEnrollmentStatus = async () => {
            if (!user || !courseId) return;

            try {
                const { data, error } = await supabase
                    .from('user_course_progress')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('course_id', courseId)
                    //.single();
                    .limit(1);
                
                if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found (not an error for .single())
                    throw error;
                }
                setIsEnrolled(!!data);
            } catch (err) {
                console.error('Error checking enrollment status:', err.message);
            }
        };


        if (courseId) {
            fetchCourseDetails();
            checkEnrollmentStatus();
        }
    }, [courseId, user]);

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleEnroll = async () => {
        if (!user || !courseDetails) {
            alert('Anda harus login untuk mendaftar kursus.');
            return;
        }
        
        setEnrollLoading(true);
        try {
            const firstModule = courseDetails.modules.length > 0 ? courseDetails.modules[0] : null;
            const firstLesson = firstModule && firstModule.lessons.length > 0 ? firstModule.lessons[0] : null;

            const { error: enrollError } = await supabase.from('user_course_progress').insert({
                user_id: user.id,
                course_id: courseDetails.id,
                current_module_id: firstModule ? firstModule.id : null,
                current_lesson_id: firstLesson ? firstLesson.id : null,
                completed_lessons_count: 0,
                progress_percentage: 0,
                is_completed: false,
                started_at: new Date().toISOString(),
                last_accessed_at: new Date().toISOString(),
            });

            if (enrollError) throw enrollError;

            setIsEnrolled(true);
            alert('Berhasil mendaftar kursus!');
            
            if (firstLesson) {
                navigate(`/course/${courseDetails.id}/lesson/${firstLesson.id}`);
            } else {
                navigate('/dashboard'); 
            }

        } catch (err) {
            console.error('Error enrolling in course:', err.message);
            if (err.code === '23505') { // Ini adalah penanganan untuk error duplicate key
                alert('Anda sudah terdaftar di kursus ini.');
                setIsEnrolled(true);
                const firstModule = courseDetails.modules.length > 0 ? courseDetails.modules[0] : null;
                const firstLesson = firstModule && firstModule.lessons.length > 0 ? firstModule.lessons[0] : null;
                if (firstLesson) {
                    navigate(`/course/${courseDetails.id}/lesson/${firstLesson.id}`);
                } else {
                    navigate('/dashboard');
                }
            } else {
                alert('Gagal mendaftar kursus: ' + err.message);
            }
        } finally {
            setEnrollLoading(false);
        }
    };


    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                    Memuat detail kursus...
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

    if (!courseDetails) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                    Kursus tidak ditemukan.
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex-grow p-6 bg-[#F9F9FB] rounded-xl dark:bg-dark-bg-secondary">
                <header className="mb-6 p-4 bg-white rounded-xl shadow-sm flex items-center justify-between dark:bg-dark-bg-tertiary">
                    <div className="flex items-center">
                        <button onClick={handleGoBack} className="mr-4 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
                            <ArrowLeftIcon className="h-6 w-6" />
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{courseDetails.title}</h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">Instructor: {courseDetails.profiles?.full_name || 'N/A'}</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-md mb-6 dark:bg-dark-bg-tertiary">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Course Info</h2>
                            <p className="text-gray-700 mb-2 dark:text-gray-300"><strong>Course Title:</strong> {courseDetails.title}</p>
                            <p className="text-gray-700 mb-2 whitespace-pre-wrap dark:text-gray-300"><strong>Description:</strong> {courseDetails.description || '-'}</p>
                            
                            {courseDetails.thumbnail_url && (
                                <div className="mt-4 mb-2">
                                    <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-white">Thumbnail</h3>
                                    <img src={courseDetails.thumbnail_url} alt={courseDetails.title} className="max-w-full h-auto rounded-lg shadow-sm" />
                                </div>
                            )}

                            <p className="text-gray-700 mb-2 dark:text-gray-300"><strong>Instructor:</strong> {courseDetails.profiles?.full_name || 'N/A'}</p>
                            
                            <button
                                onClick={isEnrolled ? () => {
                                    const firstModule = courseDetails.modules.length > 0 ? courseDetails.modules[0] : null;
                                    const firstLesson = firstModule && firstModule.lessons.length > 0 ? firstModule.lessons[0] : null;
                                    if (firstLesson) {
                                        navigate(`/course/${courseDetails.id}/lesson/${firstLesson.id}`);
                                    } else {
                                        navigate('/dashboard');
                                    }
                                } : handleEnroll}
                                disabled={enrollLoading} // <--- PERUBAHAN UTAMA DI SINI
                                className={`mt-4 w-full py-2 rounded-md transition-colors ${
                                    isEnrolled
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-dark-accent-purple dark:hover:bg-purple-800'
                                        : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-dark-accent-purple dark:hover:bg-purple-800'
                                }`}
                            >
                                {enrollLoading ? 'Memproses...' : (isEnrolled ? 'Lanjutkan Kursus' : 'Daftar Kursus')}
                            </button>
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                            <div className="bg-white p-6 rounded-xl shadow-md dark:bg-dark-bg-tertiary">
                                <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-white">Modules & Lessons</h2>
                                {courseDetails.modules && courseDetails.modules.length > 0 ? (
                                    <div className="space-y-6">
                                        {courseDetails.modules.map(module => (
                                            <div key={module.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-700"> {/* Module background darker */}
                                                <h3 className="text-xl font-bold text-gray-800 mb-2 border-b pb-2 border-gray-200 dark:text-white dark:border-gray-600">
                                                    {module.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 mb-3 dark:text-gray-300">{module.description || '-'}</p>
                                                
                                                {module.lessons && module.lessons.length > 0 ? (
                                                    <div className="mt-3 ml-2 border-l pl-3 dark:border-gray-600">
                                                        <h4 className="text-lg font-semibold text-gray-700 mb-2 dark:text-gray-200">Lessons in this Module:</h4>
                                                        <ul className="space-y-3">
                                                            {module.lessons.map((lesson, index) => (
                                                                <li key={lesson.id || index} className="bg-white p-3 rounded-md shadow-sm dark:bg-[#4A4A5A] dark:shadow-none"> {/* Lesson background */}
                                                                    <Link
                                                                        to={`/course/${courseId}/lesson/${lesson.id}`}
                                                                        className="block font-medium text-gray-800 hover:text-purple-700 transition-colors dark:text-white dark:hover:text-dark-accent-purple"
                                                                    >
                                                                        {lesson.title} 
                                                                    </Link>
                                                                    {lesson.pdf_url && (
                                                                        <p className="text-xs text-blue-600 truncate mb-1 dark:text-blue-400">
                                                                            <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer">PDF: {lesson.pdf_url.split('/').pop()}</a>
                                                                        </p>
                                                                    )}
                                                                    
                                                                    {lesson.lesson_materials && lesson.lesson_materials.length > 0 ? (
                                                                        <div className="mt-2 text-xs">
                                                                            <h5 className="font-semibold text-gray-700 mb-1 dark:text-gray-200">Materials in this Lesson:</h5>
                                                                            <ul className="space-y-1">
                                                                                {lesson.lesson_materials.map((lm, index) => (
                                                                                    <li key={lm.material_id || index }>
                                                                                        {lm.materials ? (
                                                                                            <div className="flex items-center space-x-1">
                                                                                                {lm.materials.content_type === 'image' && <PhotoIcon className="h-4 w-4 text-green-500 dark:text-green-400" />}
                                                                                                {lm.materials.content_type === 'video_url' && <PlayCircleIcon className="h-4 w-4 text-red-500 dark:text-red-400" />}
                                                                                                {lm.materials.content_type === 'text' && <DocumentTextIcon className="h-4 w-4 text-blue-500 dark:text-blue-400" />}
                                                                                                {lm.materials.content_type === 'script' && <CodeBracketIcon className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />}
                                                                                                {lm.materials.content_type === 'pdf' && <DocumentIcon className="h-4 w-4 text-purple-500 dark:text-purple-400" />}
                                                                                                <span className="dark:text-gray-100">{lm.materials.title}</span> 
                                                                                                {lm.materials.content_url && (
                                                                                                    <a href={lm.materials.content_url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-500 hover:underline dark:text-blue-400 dark:hover:underline">View</a>
                                                                                                )}
                                                                                            </div>
                                                                                        ) : (
                                                                                            <span className="dark:text-gray-400">Unknown Material</span>
                                                                                        )}
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-gray-500 italic mt-2 dark:text-gray-400">No materials found for this lesson.</p>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-600 italic mt-2 dark:text-gray-400">No lessons found for this module.</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-600 italic dark:text-gray-400">No modules found for this course.</p>
                                )}
                            </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}