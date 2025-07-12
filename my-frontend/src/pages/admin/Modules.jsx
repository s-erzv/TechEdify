// frontend/src/pages/admin/Modules.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient'; // Pastikan path ini benar
import AdminLayout from '../../components/AdminLayout'; // Jika Anda menggunakan AdminLayout di sini
import {
    MagnifyingGlassIcon,
    ChevronDownIcon,
    PencilSquareIcon, // Untuk edit
    TrashIcon, // Untuk delete
    EyeIcon, // Untuk view (jika ada detail)
    PlusIcon, // Untuk tombol tambah
    XMarkIcon, // Untuk tombol close di modal
    ArrowLeftIcon, // Untuk pagination
    ArrowRightIcon, // Untuk pagination
    BellIcon // Untuk header
} from '@heroicons/react/24/outline'; // Pastikan semua ikon diimpor

export default function AdminManageModules() {
    const [modules, setModules] = useState([]);
    const [courses, setCourses] = useState([]); // State untuk daftar kursus
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCourseId, setFilterCourseId] = useState(''); // Filter berdasarkan course
    const [currentPage, setCurrentPage] = useState(1);
    const [modulesPerPage] = useState(10);
    const [totalModulesCount, setTotalModulesCount] = useState(0);

    // --- State untuk operasi CRUD ---
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
    const [moduleToEdit, setModuleToEdit] = useState(null); // Menyimpan data modul yang akan diedit
    const [moduleToDelete, setModuleToDelete] = useState(null); // Menyimpan data modul yang akan dihapus

    // State untuk form tambah/edit modul
    const [newModuleData, setNewModuleData] = useState({
        title: '',
        description: '',
        course_id: '', // Wajib diisi dari dropdown kursus
        order_in_course: 0,
        is_active: true,
    });

    // Data dummy admin user untuk header (ini harusnya dari AuthContext Anda)
    const adminUser = {
        user_metadata: {
            first_name: "Admin",
            avatar_url: "/default-avatar.jpg"
        },
        email: "techedifysma@gmail.com"
    };
    const adminUserName = adminUser?.user_metadata?.first_name || adminUser?.email?.split('@')[0] || 'Admin';

    // --- Fungsi untuk Fetch Modul (Read) ---
    const fetchModules = async () => {
        setLoading(true);
        setError(null);

        try {
            // Kita join dengan tabel courses untuk menampilkan nama kursus
            let query = supabase.from('modules').select(`
                *,
                courses (
                    title
                )
            `, { count: 'exact' });

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            if (filterCourseId) {
                query = query.eq('course_id', filterCourseId);
            }

            const startIndex = (currentPage - 1) * modulesPerPage;
            const endIndex = startIndex + modulesPerPage - 1;
            query = query.range(startIndex, endIndex).order('order_in_course', { ascending: true }); // Urutkan berdasarkan order_in_course

            const { data, error: fetchError, count } = await query;

            if (fetchError) throw fetchError;

            setModules(data || []);
            setTotalModulesCount(count || 0);
            console.log("Fetched modules data:", data);
        } catch (err) {
            setError('Failed to load modules list: ' + err.message);
            setModules([]);
            setTotalModulesCount(0);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi untuk Fetch Kursus (untuk dropdown) ---
    const fetchCourses = async () => {
        try {
            const { data, error } = await supabase.from('courses').select('id, title');
            if (error) throw error;
            setCourses(data || []);
        } catch (err) {
            console.error("Error fetching courses for dropdown:", err.message);
            // setError('Failed to load courses for dropdown: ' + err.message); // Bisa ditampilkan jika ingin
        }
    };

    useEffect(() => {
        fetchCourses(); // Ambil daftar kursus saat komponen dimuat
        fetchModules(); // Ambil daftar modul
    }, [searchTerm, filterCourseId, currentPage, modulesPerPage]);

    const totalPages = Math.ceil(totalModulesCount / modulesPerPage);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- Helpers untuk mengelola state form modul ---
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewModuleData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // --- Fungsi CRUD: Create (Tambah Modul) ---
    const openAddModal = () => {
        setNewModuleData({
            title: '',
            description: '',
            course_id: courses.length > 0 ? courses[0].id : '', // Pilih kursus pertama sebagai default
            order_in_course: totalModulesCount + 1, // Urutan default (terakhir)
            is_active: true,
        });
        setShowAddModal(true);
    };

    const closeAddModal = () => {
        setShowAddModal(false);
    };

    const handleCreateModule = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase.from('modules').insert({
                title: newModuleData.title,
                description: newModuleData.description,
                course_id: newModuleData.course_id,
                order_in_course: newModuleData.order_in_course,
                is_active: newModuleData.is_active,
            });

            if (insertError) throw insertError;

            alert('Modul berhasil ditambahkan!');
            closeAddModal();
            fetchModules(); // Refresh daftar modul
        } catch (err) {
            setError('Gagal menambahkan modul: ' + err.message);
            alert('Gagal menambahkan modul: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi CRUD: Update (Edit Modul) ---
    const openEditModal = (module) => {
        setModuleToEdit(module);
        setNewModuleData({
            title: module.title,
            description: module.description,
            course_id: module.course_id,
            order_in_course: module.order_in_course,
            is_active: module.is_active,
        });
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setModuleToEdit(null);
    };

    const handleUpdateModule = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!moduleToEdit) return;

        try {
            const { error: updateError } = await supabase
                .from('modules')
                .update({
                    title: newModuleData.title,
                    description: newModuleData.description,
                    course_id: newModuleData.course_id,
                    order_in_course: newModuleData.order_in_course,
                    is_active: newModuleData.is_active,
                })
                .eq('id', moduleToEdit.id);

            if (updateError) throw updateError;

            // Perbarui state 'modules' secara langsung
            setModules(prevModules =>
                prevModules.map(module =>
                    module.id === moduleToEdit.id
                        ? { ...module,
                            title: newModuleData.title,
                            description: newModuleData.description,
                            course_id: newModuleData.course_id,
                            order_in_course: newModuleData.order_in_course,
                            is_active: newModuleData.is_active,
                            // Perbarui juga data course (title) jika ada di tampilan
                            courses: courses.find(c => c.id === newModuleData.course_id) || module.courses
                        }
                        : module
                )
            );

            alert('Modul berhasil diperbarui!');
            closeEditModal();
        } catch (err) {
            setError('Gagal memperbarui modul: ' + err.message);
            alert('Gagal memperbarui modul: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi CRUD: Delete (Hapus Modul) ---
    const openDeleteConfirm = (module) => {
        setModuleToDelete(module);
        setShowDeleteConfirmationModal(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirmationModal(false);
        setModuleToDelete(null);
    };

    const confirmDeleteModule = async () => {
        setLoading(true);
        setError(null);

        if (!moduleToDelete) return;

        try {
            const { error: deleteError } = await supabase
                .from('modules')
                .delete()
                .eq('id', moduleToDelete.id);

            if (deleteError) throw deleteError;

            // Perbarui state 'modules' secara langsung
            setModules(prevModules => prevModules.filter(module => module.id !== moduleToDelete.id));
            setTotalModulesCount(prevCount => prevCount - 1);

            alert('Modul berhasil dihapus!');
            closeDeleteConfirm();
        } catch (err) {
            setError('Gagal menghapus modul: ' + err.message);
            alert('Gagal menghapus modul: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Rendering UI ---
    if (loading && modules.length === 0 && courses.length === 0) { // Tampilkan loading screen penuh jika belum ada data modul dan kursus
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl">
                <i className="fas fa-spinner fa-spin mr-2"></i> Memuat data modul...
            </div>
        );
    }

    if (error && modules.length === 0 && courses.length === 0) { // Tampilkan error screen penuh jika ada error dan belum ada data
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-red-600 text-xl">
                <i className="fas fa-exclamation-triangle mr-2"></i> Error: {error}
            </div>
        );
    }

    return (
        <div className="flex-grow h-[95vh] scrollbar-hide overflow-y-auto rounded-xl p-6 bg-[#F9F9FB]">
            <header className="sticky top-0 z-10 bg-[#F9F9FB] flex justify-between items-center p-6 mb-6 shadow-sm rounded-xl">
                <h1 className="text-3xl font-bold text-gray-900">Hi, {adminUserName}!</h1>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <BellIcon className="h-6 w-6 text-gray-600 cursor-pointer" />
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={adminUser?.user_metadata?.avatar_url || '/default-avatar.jpg'}
                            alt="Admin Avatar"
                        />
                        <ChevronDownIcon className="h-5 w-5 text-gray-500 cursor-pointer" />
                    </div>
                </div>
            </header>

            <div className="bg-white p-4 mb-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search modules by title or description"
                        className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="relative flex space-x-4">
                    <select
                        className="w-full py-2 pl-4 pr-10 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 cursor-pointer appearance-none"
                        value={filterCourseId}
                        onChange={(e) => {
                            setFilterCourseId(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">All Courses</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                    </select>
                    <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    
                    {/* Tombol Tambah Modul */}
                    <button
                        onClick={openAddModal}
                        className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center min-w-[40px] h-[40px]"
                        title="Add New Module"
                    >
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
                {/* Loading overlay saat operasi CRUD berlangsung */}
                {loading && modules.length > 0 && (
                    <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-20 rounded-xl">
                        <i className="fas fa-spinner fa-spin text-purple-600 text-4xl"></i>
                    </div>
                )}
                {/* Pesan error umum */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                )}

                <table className="min-w-full divide-y divide-gray-300 text-sm">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-6 py-3 text-left">Title</th>
                            <th className="px-6 py-3 text-left">Course</th>
                            <th className="px-6 py-3 text-left">Order</th>
                            <th className="px-6 py-3 text-left">Active</th>
                            <th className="px-6 py-3 text-left">Description</th>
                            <th className="px-6 py-3 text-left">Created At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {modules.length > 0 ? (
                            modules.map((module) => (
                                <tr key={module.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold">{module.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{module.courses ? module.courses.title : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{module.order_in_course}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            module.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {module.is_active ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{module.description || '-'}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(module.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => openEditModal(module)}
                                            className="text-blue-600 hover:underline"
                                            title="Edit Module"
                                        >
                                            <PencilSquareIcon className="h-5 w-5 inline mr-1" />Edit
                                        </button>
                                        <button
                                            onClick={() => openDeleteConfirm(module)}
                                            className="text-red-600 hover:underline"
                                            title="Delete Module"
                                        >
                                            <TrashIcon className="h-5 w-5 inline mr-1" />Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4 text-gray-500">No modules found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalModulesCount > modulesPerPage && (
                <nav className="flex items-center justify-center mt-6 space-x-1">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        <ArrowLeftIcon className="h-4 w-4 inline" /> Prev
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            className={`px-4 py-2 text-sm border ${
                                currentPage === i + 1
                                    ? 'bg-purple-600 text-white border-purple-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                        Next <ArrowRightIcon className="h-4 w-4 inline" />
                    </button>
                </nav>
            )}

            {/* --- Modal Tambah Modul (Create) --- */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button onClick={closeAddModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Tambah Modul Baru</h2>
                        <form onSubmit={handleCreateModule}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-title">Title</label>
                                <input
                                    type="text"
                                    id="add-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newModuleData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-description">Description</label>
                                <textarea
                                    id="add-description"
                                    name="description"
                                    rows="3"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newModuleData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-course_id">Course</label>
                                <select
                                    id="add-course_id"
                                    name="course_id"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newModuleData.course_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a Course</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-order_in_course">Order in Course</label>
                                <input
                                    type="number"
                                    id="add-order_in_course"
                                    name="order_in_course"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newModuleData.order_in_course}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-is_active">
                                    <input
                                        type="checkbox"
                                        id="add-is_active"
                                        name="is_active"
                                        className="mr-2 leading-tight"
                                        checked={newModuleData.is_active}
                                        onChange={handleInputChange}
                                    />
                                    <span className="text-sm">Is Active</span>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    {loading ? 'Adding...' : 'Add Module'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeAddModal}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Modal Edit Modul (Update) --- */}
            {showEditModal && moduleToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button onClick={closeEditModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Modul</h2>
                        <form onSubmit={handleUpdateModule}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-title">Title</label>
                                <input
                                    type="text"
                                    id="edit-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newModuleData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-description">Description</label>
                                <textarea
                                    id="edit-description"
                                    name="description"
                                    rows="3"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newModuleData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-course_id">Course</label>
                                <select
                                    id="edit-course_id"
                                    name="course_id"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newModuleData.course_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a Course</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-order_in_course">Order in Course</label>
                                <input
                                    type="number"
                                    id="edit-order_in_course"
                                    name="order_in_course"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newModuleData.order_in_course}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-is_active">
                                    <input
                                        type="checkbox"
                                        id="edit-is_active"
                                        name="is_active"
                                        className="mr-2 leading-tight"
                                        checked={newModuleData.is_active}
                                        onChange={handleInputChange}
                                    />
                                    <span className="text-sm">Is Active</span>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Module'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Modal Konfirmasi Hapus Modul (Delete) --- */}
            {showDeleteConfirmationModal && moduleToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm relative text-center">
                        <button onClick={closeDeleteConfirm} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Konfirmasi Penghapusan</h2>
                        <p className="mb-6 text-gray-700">
                            Apakah Anda yakin ingin menghapus modul "<span className="font-semibold">{moduleToDelete.title}</span>"?
                            Tindakan ini tidak dapat dibatalkan. Ini juga akan menghapus pelajaran dan kuis yang terhubung ke modul ini.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDeleteModule}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                type="button"
                                onClick={closeDeleteConfirm}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                disabled={loading}
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}