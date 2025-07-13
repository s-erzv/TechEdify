// frontend/src/pages/BookmarkPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { AuthContext } from '../context/AuthContext';
import { BookmarkIcon as BookmarkSolidIcon, BookOpenIcon, AcademicCapIcon, XCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid'; // Solid icons for display and delete, add MagnifyingGlassIcon

export default function BookmarkPage() {
    const { user } = useContext(AuthContext);
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // State for search term

    const fetchBookmarks = async () => {
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
                .order('created_at', { ascending: false }); // Latest bookmark on top

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
                    };
                }
                return null; // Should not happen if schema is correct
            }).filter(Boolean); // Remove any null entries

            setBookmarks(formattedBookmarks);

        } catch (err) {
            console.error('Error fetching bookmarks:', err.message);
            setError('Failed to load bookmarks: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookmarks();
    }, [user]); // Re-fetch when user changes

    const handleDeleteBookmark = async (bookmarkId) => {
        if (!window.confirm('Are you sure you want to delete this bookmark?')) {
            return;
        }
        try {
            const { error: deleteError } = await supabase
                .from('user_bookmarks')
                .delete()
                .eq('id', bookmarkId)
                .eq('user_id', user.id); // Ensure only the current user can delete their bookmark

            if (deleteError) throw deleteError;
            alert('Bookmark successfully deleted.');
            fetchBookmarks(); // Refresh bookmark list
        } catch (err) {
            console.error('Error deleting bookmark:', err.message);
            alert('Failed to delete bookmark: ' + err.message);
        }
    };

    const formatDateTime = (date) => {
        return date.toLocaleString('en-US', { // Using 'en-US' for English format
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Filtered bookmarks based on search query
    const filteredBookmarks = bookmarks.filter(bookmark =>
        bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bookmark.type === 'course' && bookmark.description && bookmark.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bookmark.type === 'lesson' && bookmark.moduleTitle && bookmark.moduleTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bookmark.type === 'lesson' && bookmark.courseTitle && bookmark.courseTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                    Loading your bookmarks...
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

    return (
        <MainLayout>
            <div className="flex-grow p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)] dark:bg-dark-bg-secondary">
                <header className="mb-8 p-4 bg-white rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between dark:bg-dark-bg-tertiary">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center mb-4 md:mb-0 dark:text-white">
                        <BookmarkSolidIcon className="h-8 w-8 mr-3 text-purple-600 dark:text-dark-accent-purple" /> My Bookmarks
                    </h1>
                    {/* Search Bar */}
                    <div className="relative w-full md:w-1/3">
                        <input
                            type="text"
                            placeholder="Search bookmarks by title or description..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-dark-accent-purple"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                </header>

                <div className="bg-white p-6 rounded-xl shadow-md dark:bg-dark-bg-tertiary">
                    {filteredBookmarks.length > 0 ? (
                        <div className="space-y-4">
                            {filteredBookmarks.map((bookmark) => (
                                <div key={bookmark.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-center space-x-4 dark:border-gray-700 dark:bg-gray-800">
                                    {bookmark.type === 'course' ? (
                                        <BookOpenIcon className="h-8 w-8 text-purple-500 flex-shrink-0 dark:text-dark-accent-purple" />
                                    ) : (
                                        <AcademicCapIcon className="h-8 w-8 text-green-500 flex-shrink-0 dark:text-green-400" />
                                    )}
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800 dark:text-white">
                                            {bookmark.type === 'course' ? (
                                                `Course: ${bookmark.title}`
                                            ) : (
                                                `Lesson: ${bookmark.title}`
                                            )}
                                        </p>
                                        {bookmark.type === 'lesson' && (bookmark.moduleTitle || bookmark.courseTitle) && (
                                            <p className="text-sm text-gray-600 mt-1 dark:text-gray-300">
                                                {bookmark.moduleTitle && `Module: ${bookmark.moduleTitle}`}
                                                {bookmark.moduleTitle && bookmark.courseTitle && ` | `}
                                                {bookmark.courseTitle && `Course: ${bookmark.courseTitle}`}
                                            </p>
                                        )}
                                        {bookmark.type === 'course' && bookmark.description && (
                                            <p className="text-sm text-gray-600 line-clamp-2 mt-1 dark:text-gray-300">{bookmark.description}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                                            Bookmarked on: {formatDateTime(bookmark.createdAt)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBookmark(bookmark.id)}
                                        className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full dark:text-red-400 dark:hover:text-red-500"
                                        title="Delete Bookmark"
                                    >
                                        <XCircleIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-600 text-lg py-10 dark:text-gray-400">
                            {searchTerm ? "No bookmarks matching your search." : "You don't have any bookmarks yet."}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}