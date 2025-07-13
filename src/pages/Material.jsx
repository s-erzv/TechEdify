import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { SidebarContext } from '../components/mainLayout';
import { BookOpenIcon, BookmarkIcon as BookmarkOutlineIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

export default function MaterialsPage() {
  const { user } = useContext(AuthContext);
  const { toggleSidebar } = useContext(SidebarContext);
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarkedCourseIds, setBookmarkedCourseIds] = useState(new Set());
  const [userCourseProgressMap, setUserCourseProgressMap] = useState(new Map());

  useEffect(() => {
    const fetchCoursesAndBookmarks = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            id,
            title,
            description,
            thumbnail_url,
            profiles ( full_name )
          `);
        if (coursesError) throw coursesError;
        setCourses(coursesData);

        if (user) {
          const { data: bookmarksData, error: bookmarksError } = await supabase
            .from('user_bookmarks')
            .select('course_id')
            .eq('user_id', user.id);

          if (bookmarksError) throw bookmarksError;
          const bookmarkedIds = new Set(bookmarksData.map(b => b.course_id));
          setBookmarkedCourseIds(bookmarkedIds);

          const { data: progressData, error: progressError } = await supabase
            .from('user_course_progress')
            .select('course_id, progress_percentage')
            .eq('user_id', user.id);

          if (progressError) throw progressError;
          const progressMap = new Map();
          progressData.forEach(p => progressMap.set(p.course_id, p.progress_percentage));
          setUserCourseProgressMap(progressMap);
        }

      } catch (err) {
        console.error('Error fetching data:', err.message);
        setError('Failed to load materials: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursesAndBookmarks();
  }, [user]);

  const handleContinueCourse = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const handleBookmarkToggle = async (courseId) => {
    if (!user) {
      alert('You must be logged in to bookmark courses.');
      return;
    }

    try {
      if (bookmarkedCourseIds.has(courseId)) {
        const { error: deleteError } = await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('course_id', courseId);

        if (deleteError) throw deleteError;
        setBookmarkedCourseIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(courseId);
          return newSet;
        });
        // alert('Bookmark removed!'); // Dihapus
      } else {
        const { error: insertError } = await supabase
          .from('user_bookmarks')
          .insert({
            user_id: user.id,
            course_id: courseId,
          });

        if (insertError) throw insertError;
        setBookmarkedCourseIds(prev => new Set(prev).add(courseId));
        // alert('Course bookmarked successfully!'); // Dihapus
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err.message);
      alert('Failed to change bookmark status: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        Loading courses...
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
      <header className="mb-6 p-2 sm:p-4 bg-white rounded-xl shadow-sm flex items-center justify-between dark:bg-dark-bg-tertiary">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center dark:text-dark-text-light">
            <BookOpenIcon className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-purple-600 dark:text-dark-accent-purple" /> Learning Materials
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length > 0 ? (
          courses.map((course) => {
            const courseProgress = userCourseProgressMap.get(course.id) || 0;
            return (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 overflow-hidden flex flex-col dark:bg-dark-bg-tertiary dark:border-gray-700"
              >
                <div className="relative">
                  <img
                    src={course.thumbnail_url || 'https://via.placeholder.com/400x200?text=Course+Image'}
                    alt={course.title}
                    className="w-full h-40 object-cover"
                  />
                  {user && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmarkToggle(course.id);
                      }}
                      className={`absolute top-2 right-2 p-2 rounded-full transition-colors duration-200 ${
                        bookmarkedCourseIds.has(course.id)
                          ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-dark-accent-purple dark:text-dark-text-light dark:hover:bg-purple-800'
                          : 'text-white bg-black bg-opacity-50 hover:bg-opacity-70 dark:bg-gray-700 dark:bg-opacity-50 dark:hover:bg-opacity-70'
                      }`}
                      title={bookmarkedCourseIds.has(course.id) ? "Remove from Bookmark" : "Add to Bookmark"}
                    >
                      {bookmarkedCourseIds.has(course.id) ? (
                        <BookmarkSolidIcon className="h-6 w-6" />
                      ) : (
                        <BookmarkOutlineIcon className="h-6 w-6" />
                      )}
                    </button>
                  )}
                </div>
                <div className="p-4 flex-grow">
                  <h2 className="text-xl font-semibold text-gray-800 mb-1 dark:text-dark-text-light">{course.title}</h2>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2 dark:text-dark-text-medium">{course.description}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Instructor: <span className="font-medium text-gray-700 dark:text-dark-text-light">{course.profiles?.full_name || 'N/A'}</span></p>
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-1 dark:text-dark-text-medium">Progress: {courseProgress}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                      <div
                        className="bg-purple-500 h-2.5 rounded-full dark:bg-dark-accent-purple"
                        style={{ width: `${courseProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleContinueCourse(course.id)}
                    className="w-full px-5 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition-colors dark:bg-dark-accent-purple dark:hover:bg-purple-800"
                  >
                    Continue Course
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center text-gray-600 text-lg py-10 dark:text-dark-text-medium">
            No courses available yet.
          </div>
        )}
      </div>
    </div>
  );
}