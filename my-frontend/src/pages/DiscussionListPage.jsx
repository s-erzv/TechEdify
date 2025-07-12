// frontend/src/pages/DiscussionListPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { ChatBubbleLeftRightIcon, PlusIcon, CalendarDaysIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Tambah MagnifyingGlassIcon
import { useNavigate } from 'react-router-dom';

export default function DiscussionListPage() {
    const [discussions, setDiscussions] = useState([]);
    const [courses, setCourses] = useState([]); // State untuk menyimpan daftar kursus
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState(''); // State untuk search bar
    const [selectedCourseFilter, setSelectedCourseFilter] = useState(''); // State untuk filter kursus
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDiscussionsAndCourses = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Fetch Courses (untuk filter dropdown)
                const { data: coursesData, error: coursesError } = await supabase
                    .from('courses')
                    .select('id, title');
                if (coursesError) throw coursesError;
                setCourses(coursesData);

                // 2. Fetch Discussions dengan filter dan search
                let query = supabase
                    .from('discussions')
                    .select(`
                        id,
                        title,
                        content,
                        created_at,
                        user_id,
                        profiles ( username, full_name, avatar_url ),
                        courses ( title ),
                        modules ( title ),
                        discussion_posts ( count )
                    `)
                    .order('created_at', { ascending: false });

                // Terapkan filter kursus jika ada yang dipilih
                if (selectedCourseFilter) {
                    query = query.eq('course_id', selectedCourseFilter);
                }

                // Terapkan pencarian jika ada searchTerm
                if (searchTerm) {
                    // Mencari di title atau content diskusi
                    query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
                }

                const { data, error: fetchError } = await query;

                if (fetchError) throw fetchError;
                if (!data) throw new Error("Tidak ada topik diskusi ditemukan.");

                const formattedDiscussions = data.map(discussion => ({
                    ...discussion,
                    author_name: discussion.profiles?.username || discussion.profiles?.full_name || 'Pengguna Tidak Dikenal',
                    author_avatar: discussion.profiles?.avatar_url,
                    course_title: discussion.courses?.title,
                    module_title: discussion.modules?.title,
                    post_count: discussion.discussion_posts[0]?.count || 0
                }));
                
                setDiscussions(formattedDiscussions);
                console.log("Fetched discussions:", formattedDiscussions);

            } catch (err) {
                console.error('Error fetching discussions:', err.message);
                setError('Gagal memuat daftar diskusi: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        // Panggil fungsi fetch setiap kali searchTerm atau selectedCourseFilter berubah
        fetchDiscussionsAndCourses();
    }, [searchTerm, selectedCourseFilter]); // Dependency array

    const handleViewDiscussion = (discussionId) => {
        navigate(`/discussions/${discussionId}`);
    };

    const handleCreateNewDiscussion = () => {
        navigate('/discussions/new');
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                    Memuat topik diskusi...
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
                <header className="mb-8 p-4 bg-white rounded-xl shadow-sm flex items-center justify-between dark:bg-dark-bg-tertiary">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center dark:text-white">
                        <ChatBubbleLeftRightIcon className="h-8 w-8 mr-3 text-purple-600 dark:text-dark-accent-purple" /> Forum Diskusi
                    </h1>
                    <button
                        onClick={handleCreateNewDiscussion}
                        className="px-5 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition-colors flex items-center dark:bg-dark-accent-purple dark:hover:bg-purple-800"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" /> Diskusi Baru
                    </button>
                </header>

                {/* Search and Filter Section */}
                <div className="mb-6 p-4 bg-white rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 dark:bg-dark-bg-tertiary">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Cari diskusi berdasarkan judul atau konten..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-dark-accent-purple"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <div className="relative">
                        <select
                            className="w-full sm:w-auto pl-4 pr-10 py-2 border border-gray-300 rounded-md appearance-none focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-dark-accent-purple"
                            value={selectedCourseFilter}
                            onChange={(e) => setSelectedCourseFilter(e.target.value)}
                        >
                            <option value="">Semua Kursus</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>{course.title}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {discussions.length > 0 ? (
                        discussions.map((discussion) => (
                            <div 
                                key={discussion.id} 
                                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 cursor-pointer dark:bg-dark-bg-tertiary dark:border-gray-700"
                                onClick={() => handleViewDiscussion(discussion.id)}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <h2 className="text-xl font-semibold text-gray-800 line-clamp-1 dark:text-white">{discussion.title}</h2>
                                    <div className="text-sm text-gray-500 flex items-center ml-4 dark:text-gray-400">
                                        <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" /> {discussion.post_count}
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2 dark:text-gray-300">{discussion.content || "Tidak ada konten."}</p>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                    {discussion.author_avatar ? (
                                        <img src={discussion.author_avatar} alt={discussion.author_name} className="h-6 w-6 rounded-full object-cover mr-2" />
                                    ) : (
                                        <img src={`https://ui-avatars.com/api/?name=${discussion.author_name}&background=random&color=fff&size=24`} alt={discussion.author_name} className="h-6 w-6 rounded-full object-cover mr-2" />
                                    )}
                                    <span>Diposting oleh <span className="font-medium text-gray-700 dark:text-gray-200">{discussion.author_name}</span></span>
                                    {discussion.course_title && (
                                        <span className="ml-3 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs dark:bg-blue-800 dark:text-blue-100">
                                            {discussion.course_title}
                                        </span>
                                    )}
                                    {discussion.module_title && (
                                        <span className="ml-3 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs dark:bg-green-800 dark:text-green-100">
                                            {discussion.module_title}
                                        </span>
                                    )}
                                    <span className="ml-auto flex items-center">
                                        <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                        {new Date(discussion.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-600 text-lg py-10 dark:text-gray-400">
                            {searchTerm || selectedCourseFilter ? "Tidak ada diskusi yang cocok dengan kriteria Anda." : "Belum ada topik diskusi yang tersedia."}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}