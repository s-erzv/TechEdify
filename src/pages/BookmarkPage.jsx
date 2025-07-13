import React, { useState, useEffect, useContext, useCallback } from 'react'; // Tambah useCallback
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { SidebarContext } from '../components/mainLayout';
import { BookmarkIcon as BookmarkSolidIcon, BookOpenIcon, AcademicCapIcon, MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

export default function BookmarkPage() {
  const { user } = useContext(AuthContext);
  const { toggleSidebar } = useContext(SidebarContext);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // fetchBookmarks dipindahkan ke dalam komponen dan dibungkus dengan useCallback
  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError('You must be logged in to view your bookmarks.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('user_bookmarks')
        .select(`
          id,
          created_at,
          course_id,
          lesson_id,
          courses ( id, title, description, thumbnail_url ),
          lessons ( id, title, modules ( id, title, courses ( id, title ) ) )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const formattedBookmarks = data.map(bookmark => {
        if (bookmark.course_id && bookmark.courses) {
          return {
            id: bookmark.id,
            type: 'course',
            title: bookmark.courses.title,
            description: bookmark.courses.description,
            thumbnail_url: bookmark.courses.thumbnail_url,
            createdAt: new Date(bookmark.created_at),
            targetId: bookmark.course_id,
          };
        } else if (bookmark.lesson_id && bookmark.lessons) {
          return {
            id: bookmark.id,
            type: 'lesson',
            title: bookmark.lessons.title,
            courseTitle: bookmark.lessons.modules?.courses?.title,
            moduleTitle: bookmark.lessons.modules?.title,
            createdAt: new Date(bookmark.created_at),
            targetId: bookmark.lesson_id,
            courseId: bookmark.lessons.modules?.courses?.id,
          };
        }
        return null;
      }).filter(Boolean);

      setBookmarks(formattedBookmarks);

    } catch (err) {
      console.error('Error fetching bookmarks:', err.message);
      setError('Failed to load bookmarks: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [user]); // user sebagai dependency karena fetchBookmarks menggunakannya

  useEffect(() => {
    fetchBookmarks();
  }, [user, fetchBookmarks]); // fetchBookmarks sebagai dependency

  // handleDeleteBookmark dipindahkan ke dalam komponen
  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      const { error: deleteError } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
      fetchBookmarks();
    } catch (err) {
      console.error('Error deleting bookmark:', err.message);
      alert('Failed to delete bookmark: ' + err.message);
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const navigateToBookmark = (bookmark) => {
    if (bookmark.type === 'course') {
      navigate(`/course/${bookmark.targetId}`);
    } else if (bookmark.type === 'lesson') {
      navigate(`/course/${bookmark.courseId}/lesson/${bookmark.targetId}`);
    }
  };

  const filteredBookmarks = bookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (bookmark.type === 'course' && bookmark.description && bookmark.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (bookmark.type === 'lesson' && bookmark.moduleTitle && bookmark.moduleTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (bookmark.type === 'lesson' && bookmark.courseTitle && bookmark.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        Loading your bookmarks...
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
      <header className="mb-6 p-2 sm:p-4 bg-white rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between dark:bg-dark-bg-tertiary">
        <div className="flex items-center mb-4 md:mb-0">
          <button onClick={toggleSidebar} className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2" aria-label="Toggle sidebar">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center dark:text-dark-text-light">
            <BookmarkSolidIcon className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-purple-600 dark:text-dark-accent-purple" /> My Bookmarks
          </h1>
        </div>
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search bookmarks by title or description..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-dark-accent-purple"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-text-dark" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookmarks.length > 0 ? (
          filteredBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 overflow-hidden flex flex-col dark:bg-dark-bg-tertiary dark:border-gray-700"
            >
              <div className="relative">
                {bookmark.type === 'course' && bookmark.thumbnail_url ? (
                  <img
                    src={bookmark.thumbnail_url}
                    alt={bookmark.title}
                    className="w-full h-40 object-cover"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 flex items-center justify-center dark:bg-gray-700">
                    {bookmark.type === 'course' ? (
                      <BookOpenIcon className="h-20 w-20 text-gray-400 dark:text-gray-500" />
                    ) : (
                      <AcademicCapIcon className="h-20 w-20 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteBookmark(bookmark.id);
                  }}
                  className="absolute top-2 right-2 p-2 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors duration-200 dark:bg-dark-accent-purple dark:text-dark-text-light dark:hover:bg-purple-800"
                  title="Unbookmark"
                >
                  <BookmarkSolidIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="p-4 flex-grow">
                <h2 className="text-xl font-semibold text-gray-800 mb-1 dark:text-dark-text-light line-clamp-1">{bookmark.title}</h2>
                {bookmark.type === 'lesson' && (
                  <p className="text-sm text-gray-600 mb-2 dark:text-dark-text-medium">
                    {bookmark.moduleTitle && `Module: ${bookmark.moduleTitle}`}
                    {bookmark.moduleTitle && bookmark.courseTitle && ` | `}
                    {bookmark.courseTitle && `Course: ${bookmark.courseTitle}`}
                  </p>
                )}
                {bookmark.type === 'course' && bookmark.description && (
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2 dark:text-dark-text-medium">{bookmark.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1 dark:text-dark-text-dark">
                  Bookmarked on: {formatDateTime(bookmark.createdAt)}
                </p>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => navigateToBookmark(bookmark)}
                  className="w-full px-5 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition-colors dark:bg-dark-accent-purple dark:hover:bg-purple-800"
                >
                  View {bookmark.type === 'course' ? 'Course' : 'Lesson'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-600 text-lg py-10 dark:text-dark-text-medium">
            {searchTerm ? "No bookmarks matching your search." : "You don't have any bookmarks yet."}
          </div>
        )}
      </div>
    </div>
  );
}