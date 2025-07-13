import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { SidebarContext } from '../components/mainLayout'; // Import SidebarContext
import { ClockIcon, AcademicCapIcon, ClipboardDocumentCheckIcon, BookOpenIcon, CheckCircleIcon as SolidCheckCircleIcon, Bars3Icon } from '@heroicons/react/24/outline'; // Tambah Bars3Icon

export default function HistoryPage() {
  const { user } = useContext(AuthContext);
  const { toggleSidebar } = useContext(SidebarContext); // Dapatkan toggleSidebar dari Context
  const [activityHistory, setActivityHistory] = useState([]);
  const [courseProgressHistory, setCourseProgressHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (!user) {
        setLoading(false);
        setError('You must be logged in to view history.');
        return;
      }

      setLoading(true);
      setError(null);
      try {
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
          .order('last_accessed_at', { ascending: false });

        if (courseProgressError) throw courseProgressError;

        const combinedActivities = [];

        quizAttempts.forEach(attempt => {
          combinedActivities.push({
            id: `quiz-${attempt.id}`,
            type: 'quiz_attempt',
            date: new Date(attempt.attempted_at),
            title: attempt.quizzes?.title || 'Unknown Quiz',
            score: attempt.score_obtained,
            isPassed: attempt.is_passed,
          });
        });

        lessonCompletions.forEach(completion => {
          combinedActivities.push({
            id: `lesson-${completion.id}`,
            type: 'lesson_completion',
            date: new Date(completion.completed_at),
            title: completion.lessons?.title || 'Unknown Lesson',
            moduleTitle: completion.lessons?.modules?.title,
            courseTitle: completion.lessons?.modules?.courses?.title,
          });
        });

        combinedActivities.sort((a, b) => b.date.getTime() - a.date.getTime());
        setActivityHistory(combinedActivities);

        const formattedCourseProgress = courseProgresses.map(progress => ({
          id: progress.id,
          courseTitle: progress.courses?.title || 'Unknown Course',
          percentage: progress.progress_percentage,
          isCompleted: progress.is_completed,
          startedAt: new Date(progress.started_at),
          completedAt: progress.completed_at ? new Date(progress.completed_at) : null,
          lastAccessedAt: new Date(progress.last_accessed_at),
        }));
        setCourseProgressHistory(formattedCourseProgress);

      } catch (err) {
        console.error('Error fetching history data:', err.message);
        setError('Failed to load activity history: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchHistoryData();
    }
  }, [user]);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        Loading activity history...
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

  return (
    <div className="flex-grow p-4 sm:p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)] dark:bg-dark-bg-secondary">
      <header className="mb-6 p-2 sm:p-4 bg-white rounded-xl shadow-sm flex items-center dark:bg-dark-bg-tertiary">
        <button onClick={toggleSidebar} className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2" aria-label="Toggle sidebar">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center dark:text-dark-text-light">
          <ClockIcon className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-purple-600 dark:text-dark-accent-purple" /> My Activity History
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-dark-bg-tertiary">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 flex items-center dark:text-dark-text-light">
            <ClipboardDocumentCheckIcon className="h-7 w-7 mr-2 text-blue-500 dark:text-blue-400" /> Quiz & Lesson History
          </h2>
          {activityHistory.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
              {activityHistory.map((item) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-start space-x-4 dark:border-gray-700 dark:bg-gray-800">
                  {item.type === 'quiz_attempt' && (
                    <div className="flex-shrink-0">
                      <AcademicCapIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                    </div>
                  )}
                  {item.type === 'lesson_completion' && (
                    <div className="flex-shrink-0">
                      <BookOpenIcon className="h-8 w-8 text-green-500 dark:text-green-400" />
                    </div>
                  )}
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800 dark:text-dark-text-light">
                      {item.type === 'quiz_attempt' ? (
                        <>
                          You took quiz "{item.title}" — Score: <span className="text-purple-600 font-bold dark:text-dark-accent-purple">{item.score}</span> {item.isPassed ? <span className="text-green-600 dark:text-green-500">(Passed)</span> : <span className="text-red-600 dark:text-red-500">(Failed)</span>}
                        </>
                      ) : (
                        <>
                          You completed lesson "{item.title}"
                        </>
                      )}
                    </p>
                    {item.type === 'lesson_completion' && (item.moduleTitle || item.courseTitle) && (
                      <p className="text-sm text-gray-600 mt-1 dark:text-dark-text-medium">
                        {item.moduleTitle && `Module: ${item.moduleTitle}`}
                        {item.moduleTitle && item.courseTitle && ` | `}
                        {item.courseTitle && `Course: ${item.courseTitle}`}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 dark:text-dark-text-dark">
                      {formatDateTime(item.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 text-lg py-10 dark:text-dark-text-medium">
              No quiz or lesson history yet.
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-dark-bg-tertiary">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 flex items-center dark:text-dark-text-light">
            <BookOpenIcon className="h-7 w-7 mr-2 text-purple-600 dark:text-dark-accent-purple" /> Your Course Progress
          </h2>
          {courseProgressHistory.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {courseProgressHistory.map((progress) => (
                <div key={progress.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col space-y-2 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800 dark:text-dark-text-light">{progress.courseTitle}</p>
                    {progress.isCompleted ? (
                      <span className="flex items-center text-green-600 text-sm font-medium dark:text-green-500">
                        <SolidCheckCircleIcon className="h-5 w-5 mr-1" /> Completed
                      </span>
                    ) : (
                      <span className="text-purple-600 font-bold text-lg dark:text-dark-accent-purple">{progress.percentage}%</span>
                    )}
                  </div>

                  {!progress.isCompleted && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                          <div
                              className="bg-purple-500 h-2.5 rounded-full dark:bg-dark-accent-purple"
                              style={{ width: `${progress.percentage}%` }}
                          ></div>
                      </div>
                  )}

                  <p className="text-xs text-gray-500 dark:text-dark-text-dark">
                      Started: {formatDate(progress.startedAt)}
                      {progress.completedAt && ` | Completed: ${formatDate(progress.completedAt)}`}
                      {!progress.isCompleted && ` | Last Accessed: ${formatDate(progress.lastAccessedAt)}`}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 text-lg py-10 dark:text-dark-text-medium">
              You haven't started any courses yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}