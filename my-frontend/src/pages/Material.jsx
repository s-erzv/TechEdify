// frontend/src/pages/Materials.jsx
import React, { useState, useEffect, useContext } from 'react'; // Import useContext
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import {
    MagnifyingGlassIcon,
    AcademicCapIcon,
    CheckCircleIcon // Untuk indikator complete, jika diperlukan
} from '@heroicons/react/24/outline';
import { AuthContext } from '../context/AuthContext'; // Import AuthContext

export default function MaterialsPage() {
    const { user } = useContext(AuthContext); // Dapatkan user dari AuthContext
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // --- Fungsi untuk Fetch Kursus yang Dipublikasikan dan Progres User ---
    const fetchPublishedCourses = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch Kursus yang Dipublikasikan
            let query = supabase
                .from('courses')
                .select(`
                    *,
                    profiles (full_name)
                `)
                .eq('is_published', true);

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            const { data: coursesData, error: fetchError } = await query;

            if (fetchError) throw fetchError;

            // 2. Fetch Progres Kursus User Jika User Ada
            let userProgress = [];
            if (user) {
                const { data: progressData, error: progressError } = await supabase
                    .from('user_course_progress')
                    .select('course_id, progress_percentage, is_completed, completed_lessons_count')
                    .eq('user_id', user.id);

                if (progressError) {
                    console.error('Error fetching user course progress:', progressError.message);
                    // Tidak throw error di sini, agar courses tetap tampil meskipun progres gagal
                } else {
                    userProgress = progressData || [];
                }
            }

            // 3. Gabungkan Data Kursus dengan Progres User
            const coursesWithProgress = coursesData.map(course => {
                const progress = userProgress.find(p => p.course_id === course.id);
                return {
                    ...course,
                    progress_percentage: progress?.progress_percentage || 0,
                    is_course_completed: progress?.is_completed || false,
                    completed_lessons_count: progress?.completed_lessons_count || 0,
                    // Tambahkan properti lain yang mungkin perlu dari progres
                };
            });

            setCourses(coursesWithProgress || []);
            console.log("Fetched published courses with progress:", coursesWithProgress);

        } catch (err) {
            console.error('Error fetching published courses:', err.message);
            setError('Gagal memuat daftar kursus: ' + err.message);
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Panggil ulang fetch saat searchTerm atau user berubah (misal setelah login/logout)
        fetchPublishedCourses();
    }, [searchTerm, user]); // Tambahkan `user` sebagai dependency

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl">
                    Memuat daftar kursus...
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
            <div className="flex-grow p-6 h-[90vh] bg-[#F9F9FB] rounded-xl">
                <header className="flex justify-between items-center mb-6 p-4 bg-white rounded-xl shadow-sm">
                    <h1 className="text-2xl font-semibold text-gray-800">Available Courses</h1>
                    <div className="relative w-1/3">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="py-2 pl-10 pr-4 w-full rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.length > 0 ? (
                        courses.map(course => (
                            <div key={course.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col">
                                {course.thumbnail_url ? (
                                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-48 object-cover" />
                                ) : (
                                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                                        <AcademicCapIcon className="h-20 w-20" />
                                    </div>
                                )}
                                <div className="p-4 flex flex-col flex-grow">
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h2>
                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">{course.description || 'No description available.'}</p>
                                    <p className="text-xs text-gray-500 mb-4">Instructor: {course.profiles ? course.profiles.full_name : 'N/A'}</p>

                                    {/* Progress Bar Section */}
                                    {user && ( // Tampilkan progress hanya jika user login
                                        <div className="mt-auto pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center text-sm text-gray-700 mb-1">
                                                <span>Progress</span>
                                                {course.is_course_completed ? (
                                                    <span className="text-green-600 flex items-center">
                                                        <CheckCircleIcon className="h-4 w-4 mr-1" /> Completed
                                                    </span>
                                                ) : (
                                                    <span>{Math.round(course.progress_percentage)}%</span>
                                                )}
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className={`h-2.5 rounded-full ${course.is_course_completed ? 'bg-green-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${course.progress_percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    <Link to={`/course/${course.id}`} className="block w-full text-center bg-purple-600 text-white py-2 px-4 mt-4 rounded-md hover:bg-purple-700 transition-colors duration-200">
                                        {user && course.progress_percentage > 0 && !course.is_course_completed ? 'Continue Course' : 'View Course'}
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center p-8 bg-white rounded-xl shadow-sm text-gray-500">
                            No published courses found.
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}