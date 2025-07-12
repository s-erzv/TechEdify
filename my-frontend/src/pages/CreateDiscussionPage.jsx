// frontend/src/pages/CreateDiscussionPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeftIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

export default function CreateDiscussionPage() {
    const { user } = useContext(AuthContext); // Dapatkan informasi user yang login
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [courses, setCourses] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        const fetchCoursesAndModules = async () => {
            setError(null);
            try {
                // Fetch Courses
                const { data: coursesData, error: coursesError } = await supabase
                    .from('courses')
                    .select('id, title');
                if (coursesError) throw coursesError;
                setCourses(coursesData);

                // Fetch Modules
                const { data: modulesData, error: modulesError } = await supabase
                    .from('modules')
                    .select('id, title, course_id'); // Ambil course_id juga untuk filtering
                if (modulesError) throw modulesError;
                setModules(modulesData);

            } catch (err) {
                console.error('Error fetching courses/modules:', err.message);
                setError('Gagal memuat daftar kursus/modul: ' + err.message);
            }
        };

        fetchCoursesAndModules();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage('');

        if (!user) {
            setError('Anda harus login untuk membuat diskusi.');
            setLoading(false);
            return;
        }

        if (!title.trim() || !content.trim()) {
            setError('Judul dan Konten diskusi tidak boleh kosong.');
            setLoading(false);
            return;
        }

        try {
            const { data, error: insertError } = await supabase
                .from('discussions')
                .insert({
                    user_id: user.id,
                    title: title.trim(),
                    content: content.trim(),
                    course_id: selectedCourse || null, // Jika tidak dipilih, set ke NULL
                    module_id: selectedModule || null, // Jika tidak dipilih, set ke NULL
                    // image_url: '...', // Tambahkan ini jika ada fitur upload gambar
                })
                .select(); // Mengembalikan data yang baru saja diinsert

            if (insertError) throw insertError;

            setSuccessMessage('Diskusi berhasil dibuat!');
            setTitle('');
            setContent('');
            setSelectedCourse('');
            setSelectedModule('');

            // Opsional: Langsung arahkan ke halaman detail diskusi yang baru dibuat
            // atau kembali ke daftar diskusi setelah beberapa detik
            setTimeout(() => {
                navigate(`/discussions/${data[0].id}`); 
            }, 2000); 

        } catch (err) {
            console.error('Error creating discussion:', err.message);
            setError('Gagal membuat diskusi: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter modul berdasarkan kursus yang dipilih
    const filteredModules = selectedCourse 
        ? modules.filter(module => module.course_id === selectedCourse)
        : modules;

    return (
        <MainLayout>
            <div className="flex-grow p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)]">
                <header className="mb-6 p-4 bg-white rounded-xl shadow-sm flex items-center">
                    <button onClick={() => navigate('/discussions')} className="mr-4 text-gray-700 hover:text-gray-900">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <PlusCircleIcon className="h-8 w-8 mr-3 text-purple-600" /> Buat Diskusi Baru
                    </h1>
                </header>

                <div className="bg-white p-6 rounded-xl shadow-md">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                <strong className="font-bold">Error!</strong>
                                <span className="block sm:inline"> {error}</span>
                            </div>
                        )}
                        {successMessage && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                                <strong className="font-bold">Sukses!</strong>
                                <span className="block sm:inline"> {successMessage}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Judul Diskusi</label>
                            <input
                                type="text"
                                id="title"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Masukkan judul diskusi Anda"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">Konten Diskusi</label>
                            <textarea
                                id="content"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-y min-h-[150px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Tulis konten diskusi Anda di sini..."
                                rows="6"
                                required
                            ></textarea>
                        </div>

                        <div>
                            <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">Pilih Kursus (Opsional)</label>
                            <select
                                id="course"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                value={selectedCourse}
                                onChange={(e) => {
                                    setSelectedCourse(e.target.value);
                                    setSelectedModule(''); // Reset modul saat kursus berubah
                                }}
                            >
                                <option value="">-- Pilih Kursus --</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.title}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2">Pilih Modul (Opsional)</label>
                            <select
                                id="module"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                                disabled={!selectedCourse} // Nonaktifkan jika belum ada kursus yang dipilih
                            >
                                <option value="">-- Pilih Modul --</option>
                                {filteredModules.map(module => (
                                    <option key={module.id} value={module.id}>{module.title}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !title.trim() || !content.trim()}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full"
                        >
                            {loading ? 'Membuat Diskusi...' : (
                                <>
                                    <PlusCircleIcon className="h-5 w-5 mr-2" /> Buat Diskusi
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}