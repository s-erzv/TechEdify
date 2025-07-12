import React, { useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { AuthContext } from '../context/AuthContext';
import { BookOpenIcon, BookmarkIcon as BookmarkOutlineIcon } from '@heroicons/react/24/outline'; // Ikon outline
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'; // Ikon solid
import { useNavigate } from 'react-router-dom';

export default function MaterialsPage() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // State untuk menyimpan ID kursus yang di-bookmark oleh pengguna
    const [bookmarkedCourseIds, setBookmarkedCourseIds] = useState(new Set()); 

    useEffect(() => {
        const fetchCoursesAndBookmarks = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch Courses
                const { data: coursesData, error: coursesError } = await supabase
                    .from('courses')
                    .select(`
                        id, 
                        title, 
                        description, 
                        thumbnail_url, 
                        profiles ( full_name ) // Ambil nama instruktur jika ada relasi
                    `);
                if (coursesError) throw coursesError;
                setCourses(coursesData);

                // Fetch User Bookmarks if user is logged in
                if (user) {
                    const { data: bookmarksData, error: bookmarksError } = await supabase
                        .from('user_bookmarks')
                        .select('course_id')
                        .eq('user_id', user.id);

                    if (bookmarksError) throw bookmarksError;
                    const bookmarkedIds = new Set(bookmarksData.map(b => b.course_id));
                    setBookmarkedCourseIds(bookmarkedIds);
                }

            } catch (err) {
                console.error('Error fetching data:', err.message);
                setError('Gagal memuat materi: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCoursesAndBookmarks();
    }, [user]); // Re-fetch when user changes

    const handleContinueCourse = (courseId) => {
        navigate(`/course/${courseId}`);
    };

    const handleBookmarkToggle = async (courseId) => {
        if (!user) {
            alert('Anda harus login untuk mem-bookmark kursus.');
            return;
        }

        try {
            if (bookmarkedCourseIds.has(courseId)) {
                // Hapus bookmark
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
                // alert('Bookmark dihapus!'); // Opsional: feedback visual
            } else {
                // Tambah bookmark
                const { error: insertError } = await supabase
                    .from('user_bookmarks')
                    .insert({
                        user_id: user.id,
                        course_id: courseId,
                    });

                if (insertError) throw insertError;
                setBookmarkedCourseIds(prev => new Set(prev).add(courseId));
                // alert('Kursus berhasil di-bookmark!'); // Opsional: feedback visual
            }
        } catch (err) {
            console.error('Error toggling bookmark:', err.message);
            alert('Gagal mengubah status bookmark: ' + err.message);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl">
                    Memuat kursus...
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
                        <BookOpenIcon className="h-8 w-8 mr-3 text-purple-600" /> Materi Pembelajaran
                    </h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.length > 0 ? (
                        courses.map((course) => (
                            <div 
                                key={course.id} 
                                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 overflow-hidden flex flex-col"
                            >
                                <div className="relative">
                                    <img 
                                        src={course.thumbnail_url || 'https://via.placeholder.com/400x200?text=Course+Image'} 
                                        alt={course.title} 
                                        className="w-full h-40 object-cover" 
                                    />
                                    {user && ( // Tampilkan tombol bookmark hanya jika user login
                                        <button
                                            onClick={(e) => { // Mencegah klik card memicu navigasi
                                                e.stopPropagation(); 
                                                handleBookmarkToggle(course.id);
                                            }}
                                            className={`absolute top-2 right-2 p-2 rounded-full transition-colors duration-200 ${
                                                bookmarkedCourseIds.has(course.id) ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'text-white bg-black bg-opacity-50 hover:bg-opacity-70'
                                            }`}
                                            title={bookmarkedCourseIds.has(course.id) ? "Hapus dari Bookmark" : "Tambah ke Bookmark"}
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
                                    <h2 className="text-xl font-semibold text-gray-800 mb-1">{course.title}</h2>
                                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{course.description}</p>
                                    <p className="text-sm text-gray-500">Instructor: <span className="font-medium text-gray-700">{course.profiles?.full_name || 'N/A'}</span></p>
                                    {/* Placeholder for progress, you'd fetch this from user_course_progress */}
                                    <div className="mt-3">
                                        <p className="text-sm text-gray-600 mb-1">Progress</p>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div 
                                                className="bg-purple-500 h-2.5 rounded-full" 
                                                style={{ width: `25%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="p-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleContinueCourse(course.id)}
                                        className="w-full px-5 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition-colors"
                                    >
                                        Lanjutkan Kursus
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center text-gray-600 text-lg py-10">
                            Belum ada kursus yang tersedia.
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}