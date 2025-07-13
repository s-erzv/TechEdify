import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { SidebarContext } from '../components/mainLayout';
import {
  AcademicCapIcon,
  BookOpenIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  DocumentIcon,
  PhotoIcon,
  EyeIcon, // Tetap ada EyeIcon jika digunakan di tempat lain
  // XMarkIcon, // Dihapus karena tidak digunakan
  CodeBracketIcon,
  ArrowLeftIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

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
  const { toggleSidebar } = useContext(SidebarContext);
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
        setError('Failed to load course details: ' + err.message);
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
          .limit(1);

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        setIsEnrolled(!!data && data.length > 0);
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
      alert('You must be logged in to enroll in courses.');
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

      if (firstLesson) {
        navigate(`/course/${courseDetails.id}/lesson/${firstLesson.id}`);
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      console.error('Error enrolling in course:', err.message);
      if (err.code === '23505') {
        alert('You are already enrolled in this course.');
        setIsEnrolled(true);
        const firstModule = courseDetails.modules.length > 0 ? courseDetails.modules[0] : null;
        const firstLesson = firstModule && firstModule.lessons.length > 0 ? firstModule.lessons[0] : null;
        if (firstLesson) {
          navigate(`/course/${courseDetails.id}/lesson/${firstLesson.id}`);
        } else {
          navigate('/dashboard');
        }
      } else {
        alert('Failed to enroll in course: ' + err.message);
      }
    } finally {
      setEnrollLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        Loading course details...
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

  if (!courseDetails) {
    return (
      <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        Course not found.
      </div>
    );
  }

  return (
    <div className="flex-grow p-4 sm:p-6 bg-[#F9F9FB] rounded-xl dark:bg-dark-bg-secondary">
      <header className="mb-6 p-2 sm:p-4 bg-white rounded-xl shadow-sm flex items-center dark:bg-dark-bg-tertiary">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <button onClick={handleGoBack} className="mr-4 text-gray-700 hover:text-gray-900 dark:text-dark-text-medium dark:hover:text-dark-text-light">
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate dark:text-dark-text-light">{courseDetails.title}</h1>
        <p className="ml-auto text-sm sm:text-base text-gray-600 dark:text-dark-text-medium">Instructor: {courseDetails.profiles?.full_name || 'N/A'}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mb-6 dark:bg-dark-bg-tertiary">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 dark:text-dark-text-light">Course Info</h2>
            {/* Thumbnail dihapus */}
            <p className="text-lg font-semibold sm:text-xl text-gray-900 mb-2 dark:text-dark-text-light">{courseDetails.title}</p>
            <p className="text-sm sm:text-base text-gray-700 mb-2 whitespace-pre-wrap dark:text-dark-text-medium">{courseDetails.description || 'No description available.'}</p>


            <p className="text-xs sm:text-sm text-gray-700 mb-2 dark:text-dark-text-light"><strong>Instructor:</strong> {courseDetails.profiles?.full_name || 'N/A'}</p>

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
              disabled={enrollLoading}
              className={`mt-4 w-full py-2 rounded-md transition-colors ${
                isEnrolled
                  ? 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-dark-accent-purple dark:hover:bg-purple-800'
                  : 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-dark-accent-purple dark:hover:bg-purple-800'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {enrollLoading ? 'Processing...' : (isEnrolled ? 'Continue Course' : 'Enroll Course')}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md dark:bg-dark-bg-tertiary">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 dark:text-dark-text-light">Modules & Lessons</h2>
            {courseDetails.modules && courseDetails.modules.length > 0 ? (
              <div className="space-y-6">
                {courseDetails.modules.map(module => (
                  <div key={module.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 border-b pb-2 border-gray-200 dark:text-dark-text-light dark:border-gray-600">
                      {module.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 dark:text-dark-text-medium">{module.description || 'No description available.'}</p>

                    {module.lessons && module.lessons.length > 0 ? (
                      <div className="mt-3 ml-2 border-l pl-3 dark:border-gray-600">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 dark:text-dark-text-light">Lessons in this Module:</h4>
                        <ul className="space-y-3">
                          {module.lessons.map((lesson, index) => (
                            <li key={lesson.id || index} className="bg-white p-3 rounded-md shadow-sm dark:bg-[#4A4A5A] dark:shadow-none">
                              <Link
                                to={`/course/${courseId}/lesson/${lesson.id}`}
                                className="block font-medium text-gray-800 hover:text-purple-700 transition-colors dark:text-dark-text-light dark:hover:text-dark-accent-purple"
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
                                  <h5 className="font-semibold text-gray-700 mb-1 dark:text-dark-text-light">Materials in this Lesson:</h5>
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
                                            <span className="dark:text-dark-text-light">{lm.materials.title}</span>
                                            {/* 'View' link removed */}
                                          </div>
                                        ) : (
                                          <span className="dark:text-dark-text-dark">Unknown Material</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <p className="text-gray-500 italic mt-2 dark:text-dark-text-dark">No materials found for this lesson.</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-gray-600 italic mt-2 dark:text-dark-text-medium">No lessons found for this module.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 italic dark:text-dark-text-medium">No modules found for this course.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}