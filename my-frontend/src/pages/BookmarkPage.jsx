import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { AuthContext } from '../context/AuthContext';
import { BookmarkIcon as BookmarkSolidIcon, BookOpenIcon, AcademicCapIcon, XCircleIcon } from '@heroicons/react/24/solid'; // Solid icons for display and delete

export default function BookmarkPage() {
    const { user } = useContext(AuthContext);
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBookmarks = async () => {
        if (!user) {
            setLoading(false);
            setError('Anda harus login untuk melihat bookmark Anda.');
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
                .order('created_at', { ascending: false }); // Bookmark terbaru di atas

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
            setError('Gagal memuat bookmark: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookmarks();
    }, [user]); // Re-fetch when user changes

    const handleDeleteBookmark = async (bookmarkId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus bookmark ini?')) {
            return;
        }
        try {
            const { error: deleteError } = await supabase
                .from('user_bookmarks')
                .delete()
                .eq('id', bookmarkId)
                .eq('user_id', user.id); // Pastikan hanya user yang bersangkutan yang bisa menghapus

            if (deleteError) throw deleteError;
            alert('Bookmark berhasil dihapus.');
            fetchBookmarks(); // Refresh daftar bookmark
        } catch (err) {
            console.error('Error deleting bookmark:', err.message);
            alert('Gagal menghapus bookmark: ' + err.message);
        }
    };

    const formatDateTime = (date) => {
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl">
                    Memuat bookmark Anda...
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
                        <BookmarkSolidIcon className="h-8 w-8 mr-3 text-purple-600" /> My Bookmarks
                    </h1>
                </header>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    {bookmarks.length > 0 ? (
                        <div className="space-y-4">
                            {bookmarks.map((bookmark) => (
                                <div key={bookmark.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex items-center space-x-4">
                                    {bookmark.type === 'course' ? (
                                        <BookOpenIcon className="h-8 w-8 text-purple-500 flex-shrink-0" />
                                    ) : (
                                        <AcademicCapIcon className="h-8 w-8 text-green-500 flex-shrink-0" />
                                    )}
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-800">
                                            {bookmark.type === 'course' ? (
                                                `Kursus: ${bookmark.title}`
                                            ) : (
                                                `Pelajaran: ${bookmark.title}`
                                            )}
                                        </p>
                                        {bookmark.type === 'lesson' && (bookmark.moduleTitle || bookmark.courseTitle) && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                {bookmark.moduleTitle && `Modul: ${bookmark.moduleTitle}`}
                                                {bookmark.moduleTitle && bookmark.courseTitle && ` | `}
                                                {bookmark.courseTitle && `Kursus: ${bookmark.courseTitle}`}
                                            </p>
                                        )}
                                        {bookmark.type === 'course' && bookmark.description && (
                                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{bookmark.description}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                            Di-bookmark pada: {formatDateTime(bookmark.createdAt)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBookmark(bookmark.id)}
                                        className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full"
                                        title="Hapus Bookmark"
                                    >
                                        <XCircleIcon className="h-6 w-6" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-600 text-lg py-10">
                            Anda belum memiliki bookmark.
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}