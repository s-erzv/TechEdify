import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, recordDailyActivity, updateUserBonusPoints } from '../lib/supabaseClient'; // Import updateUserBonusPoints
import { AuthContext } from '../context/AuthContext';
import { SidebarContext } from '../components/mainLayout';
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
  ClipboardDocumentListIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as SolidCheckCircleIcon } from '@heroicons/react/24/solid';

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
  const { toggleSidebar } = useContext(SidebarContext);
  const navigate = useNavigate();
  const [lessonDetails, setLessonDetails] = useState(null);
  const [courseStructure, setCourseStructure] = useState([]);
  const [courseModulesTree, setCourseModulesTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [nextButtonLoading, setNextButtonLoading] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [isCompletingCourse, setIsCompletingCourse] = useState(false);
  const [rawCourseDataModules, setRawCourseDataModules] = useState([]);
  const [userCourseProgress, setUserCourseProgress] = useState(null);

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
  }, [user, courseId]);

  const updateCourseProgress = useCallback(async () => {
    if (!user || !courseId || courseStructure.length === 0) return;

    const totalLessonsInCourse = courseStructure.length;
    const actualNewCompletedLessonsCount = completedLessons.size;

    let newProgressPercentage = (actualNewCompletedLessonsCount / totalLessonsInCourse) * 100;
    if (isNaN(newProgressPercentage)) newProgressPercentage = 0;

    let isCourseCompleted = false;
    if (actualNewCompletedLessonsCount === totalLessonsInCourse && totalLessonsInCourse > 0) {
      isCourseCompleted = true;
    }

    const currentTimestamp = new Date().toISOString();

    const updateData = {
      completed_lessons_count: actualNewCompletedLessonsCount,
      progress_percentage: newProgressPercentage,
      is_completed: isCourseCompleted,
      last_accessed_at: currentTimestamp,
      ...(isCourseCompleted && userCourseProgress && !userCourseProgress.is_completed && { completed_at: currentTimestamp })
    };

    try {
      const { data: currentProgress, error: fetchProgressError } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

      if (fetchProgressError && fetchProgressError.code !== 'PGRST116') {
        throw fetchProgressError;
      }
      setUserCourseProgress(currentProgress);

      if (currentProgress) {
        const { error: updateProgressError } = await supabase
          .from('user_course_progress')
          .update(updateData)
          .eq('id', currentProgress.id);
        if (updateProgressError) throw updateProgressError;
        console.log("Course progress updated:", updateData);
      } else {
        const { error: insertProgressError } = await supabase
          .from('user_course_progress')
          .insert({
            user_id: user.id,
            course_id: courseId,
            completed_lessons_count: actualNewCompletedLessonsCount,
            progress_percentage: newProgressPercentage,
            is_completed: isCourseCompleted,
            started_at: currentTimestamp,
            last_accessed_at: currentTimestamp,
            ...(isCourseCompleted && { completed_at: currentTimestamp })
          });
        if (insertProgressError) throw insertProgressError;
        console.log("New course progress record created:", updateData);
      }
    } catch (err) {
      console.error("Error updating/inserting course progress:", err.message);
    }
  }, [user, courseId, courseStructure.length, completedLessons.size, userCourseProgress]);

  const markLessonAsComplete = useCallback(async (lessonIdToComplete) => {
    if (!user || !courseId || !lessonIdToComplete) {
      console.warn("Missing user, courseId, or lessonIdToComplete to mark lesson complete.");
      return;
    }

    try {
      const { error: completionError } = await supabase
        .from('user_lessons_completion')
        .insert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonIdToComplete,
          completed_at: new Date().toISOString()
        });

      if (completionError) {
        if (completionError.code === '23505') {
          console.log(`Lesson ${lessonIdToComplete} already marked as complete for user ${user.id}. Proceeding with progress update.`);
        } else {
          console.error("Error marking lesson complete:", completionError.message);
          return;
        }
      } else {
        console.log(`Lesson ${lessonIdToComplete} successfully marked as complete.`);
        setCompletedLessons(prev => new Set(prev).add(lessonIdToComplete));
        await recordDailyActivity(user.id, 'lesson_completed', 1);
        
        // BERIKAN 10 POIN BONUS SAAT PELAJARAN SELESAI
        if (user?.id) {
          await updateUserBonusPoints(user.id, 10); // Berikan 10 poin
        }
      }

      await updateCourseProgress();

    } catch (err) {
      console.error("Unexpected error in markLessonAsComplete:", err);
    }
  }, [user, courseId, updateCourseProgress, setCompletedLessons]);

  useEffect(() => {
    const fetchLessonAndCourseStructure = async () => {
      setLoading(true);
      setError(null);
      try {
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
        setRawCourseDataModules(courseData.modules || []);

        if (user) {
          await fetchCompletedLessons();
        }

      } catch (err) {
        console.error('Error fetching lesson or course structure:', err.message);
        setError('Failed to load lesson materials: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (courseId && lessonId) {
      fetchLessonAndCourseStructure();
    }
  }, [courseId, lessonId, user, fetchCompletedLessons]);

  useEffect(() => {
    if (!rawCourseDataModules.length) {
      setCourseStructure([]);
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
        isCompleted: completedLessons.has(lesson.id)
      }));

      allLessonsFlat = allLessonsFlat.concat(lessonsWithCompletion);
      return { ...module, lessons: lessonsWithCompletion };
    });

    setCourseStructure(allLessonsFlat);
    setCourseModulesTree(modulesTree);

    console.log("Course structure and modules tree re-built with completion status.");
    console.log("Updated courseModulesTree:", modulesTree);
    console.log("Updated courseStructure (flat):", allLessonsFlat);

  }, [rawCourseDataModules, completedLessons]);

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

  const handleNextLessonNavigation = async () => {
    if (!user || nextButtonLoading) return;

    setNextButtonLoading(true);

    try {
      if (!completedLessons.has(lessonId)) {
        await markLessonAsComplete(lessonId);
      } else {
        console.log("Lesson already completed, skipping markLessonAsComplete.");
        await updateCourseProgress();
      }

      const isCurrentLessonLast = courseStructure[courseStructure.length - 1]?.id === lessonId;

      if (nextLesson) {
        navigate(`/course/${courseId}/lesson/${nextLesson.id}`);
      } else if (isCurrentLessonLast) {
        setIsCompletingCourse(true);

        setTimeout(() => {
          navigate(`/course/${courseId}/complete`);
          setIsCompletingCourse(false);
        }, 1500);
      } else {
        console.warn("No next lesson found, but it's not the last lesson. Navigating to course overview.");
        navigate(`/course/${courseId}`);
      }
    } catch (err) {
      console.error('Error in next lesson navigation:', err.message);
      alert('An error occurred while continuing: ' + err.message);
    } finally {
      if (!isCompletingCourse) {
        setNextButtonLoading(false);
      }
    }
  };

  const renderMaterial = (material) => {
    if (!material || !material.materials) {
      return <p className="text-gray-600 dark:text-dark-text-medium">Material not found.</p>;
    }

    const { content_type, content_url, content_text, title } = material.materials;

    const youtubeEmbedUrl = content_url && getYouTubeVideoId(content_url)
                                 ? `http://googleusercontent.com/youtube.com/embed/${getYouTubeVideoId(content_url)}`
                                 : null;

    switch (content_type) {
      case 'video_url':
        return youtubeEmbedUrl ? (
          <div className="aspect-w-16 aspect-h-9 w-full">
            <iframe
              className="w-full h-full rounded-lg"
              src={youtubeEmbedUrl}
              title={title || "YouTube video player"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <p className="text-red-600 dark:text-red-400">Invalid or unsupported video URL.</p>
        );
      case 'text':
        return (
          <div className="prose max-w-none text-gray-800 dark:text-dark-text-light">
            <div dangerouslySetInnerHTML={{ __html: content_text }} />
          </div>
        );
      case 'script':
        return (
          <div className="relative">
            <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm">
              <code>{content_text}</code>
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(content_text)
                  .then(() => { /* No alert for success */ })
                  .catch(err => console.error('Failed to copy text: ', err));
              }}
              className="absolute top-2 right-2 p-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
              title="Copy to clipboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75m1.5 0h8.25c.621 0 1.125.504 1.125 1.125v10.375m-4.5 0h1.5m-1.5 0a.75.75 0 0 0 .75.75h.75a.75.75 0 0 0 .75-.75m-1.5 0V7.5" />
              </svg>
            </button>
          </div>
        );
      case 'image':
        return <img src={content_url} alt={title || "Material image"} className="max-w-full h-auto rounded-lg shadow-md dark:shadow-none" />;
      case 'pdf':
        return (
          <div className="w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden dark:bg-gray-700">
            <iframe src={content_url} className="w-full h-full" title={title || "PDF Viewer"}></iframe>
            <p className="text-center mt-2">
              <a href={content_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:underline">
                Download PDF
              </a>
            </p>
          </div>
        );
      default:
        return <p className="text-gray-600 dark:text-dark-text-medium">Unknown material type: {content_type}</p>;
    }
  };

  const materials = lessonDetails?.lesson_materials || [];
  const isCurrentLessonLast = courseStructure[courseStructure.length - 1]?.id === lessonId;

  return (
    <div className="flex-grow p-4 sm:p-6 bg-[#F9F9FB] rounded-xl dark:bg-dark-bg-secondary">
      <header className="mb-6 p-2 sm:p-4 bg-white rounded-xl shadow-sm flex items-center justify-between dark:bg-dark-bg-tertiary">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2" aria-label="Toggle sidebar">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <button onClick={handleGoBack} className="mr-4 text-gray-700 hover:text-gray-900 dark:text-dark-text-medium dark:hover:text-dark-text-light">
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex items-center">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-light">{lessonDetails?.title}</h1>
            {completedLessons.has(lessonId) && (
              <CheckCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 text-green-500 ml-3 dark:text-green-400" />
            )}
          </div>
        </div>
        <div className="text-sm sm:text-base text-gray-600 dark:text-dark-text-medium">
          <span className="font-medium">{courseTitle}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white p-4 rounded-xl shadow-md h-full overflow-y-auto max-h-[calc(100vh-120px)] sticky top-6 z-10 dark:bg-dark-bg-tertiary dark:shadow-none">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 dark:text-dark-text-light">Course Content</h2>
          <nav className="space-y-4">
            {courseModulesTree.map(module => (
              <div key={module.id}>
                <h3 className="font-bold text-lg text-gray-900 flex items-center mb-2 dark:text-dark-text-light">
                  <BookOpenIcon className="h-5 w-5 mr-2 text-purple-600 dark:text-dark-accent-purple" />
                  {module.title}
                </h3>
                {module.lessons && module.lessons.length > 0 ? (
                  <ul className="ml-4 border-l pl-3 space-y-1 dark:border-gray-600">
                    {module.lessons.map(lesson => (
                      <li key={lesson.id}>
                        <Link
                          to={`/course/${courseId}/lesson/${lesson.id}`}
                          className={`flex items-center py-2 px-3 rounded-md transition-colors duration-200 ${
                              lesson.id === lessonId
                                ? 'bg-purple-500 text-white font-medium shadow-sm dark:bg-dark-accent-purple dark:text-dark-text-light dark:shadow-none'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-purple-700 dark:text-dark-text-medium dark:hover:bg-dark-bg-secondary dark:hover:text-dark-accent-purple'
                            }`}
                        >
                          {completedLessons.has(lesson.id) ? (
                            <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500 dark:text-green-400" />
                          ) : (
                            <PlayCircleIcon className="h-4 w-4 mr-2 dark:text-dark-text-medium" />
                          )}
                          {lesson.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm ml-4 italic dark:text-dark-text-dark">No lessons in this module.</p>
                )}
              </div>
            ))}
          </nav>
        </div>

        <div className="md:col-span-3 bg-white p-6 rounded-xl shadow-md dark:bg-dark-bg-tertiary dark:shadow-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-dark-text-light">Lesson Content</h2>

          {materials.length > 0 ? (
            <div className="space-y-8">
              {materials.map((material, index) => (
                <div key={material.material_id || index} className="pb-6 border-b border-gray-200 last:border-b-0 last:pb-0 dark:border-gray-700">
                  {renderMaterial(material)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-dark-text-medium">No materials found for this lesson.</p>
          )}

          <div className="flex justify-between mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            {prevLesson ? (
              <Link
                to={`/course/${courseId}/lesson/${prevLesson.id}`}
                className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors dark:bg-gray-700 dark:text-dark-text-light dark:hover:bg-gray-600"
              >
                <ChevronLeftIcon className="h-5 w-5 mr-2" /> Previous Lesson
              </Link>
            ) : (
              <button disabled className="flex items-center px-4 py-2 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed dark:bg-gray-800 dark:text-dark-text-dark">
                <ChevronLeftIcon className="h-5 w-5 mr-2" /> Previous Lesson
              </button>
            )}

            {isCurrentLessonLast ? (
              <button
                onClick={handleNextLessonNavigation}
                disabled={nextButtonLoading || isCompletingCourse}
                className={`flex items-center px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300
                    ${isCompletingCourse ? 'bg-green-600 animate-pulse' : 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'}
                    disabled:opacity-50 disabled:cursor-not-allowed transform ${isCompletingCourse ? 'scale-105' : ''}`}
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
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 dark:bg-dark-accent-purple dark:hover:bg-purple-800"
              >
                {nextButtonLoading ? 'Loading...' : 'Next Lesson'}
                <ChevronRightIcon className="h-5 w-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}