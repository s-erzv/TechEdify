// frontend/src/pages/admin/Modules.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient'; 
// import AdminLayout from '../../components/AdminLayout'; // Hapus import ini
import { // Pastikan semua ikon diimpor
    MagnifyingGlassIcon,
    ChevronDownIcon,
    PencilSquareIcon, // Untuk edit
    TrashIcon, // Untuk delete
    EyeIcon, // Untuk view (jika ada detail)
    PlusIcon, // Untuk tombol tambah
    XMarkIcon, // Untuk tombol close di modal
    ArrowLeftIcon, // Untuk pagination
    ArrowRightIcon, // Untuk pagination
    BellIcon // Untuk header (akan dihapus jika header dihapus)
} from '@heroicons/react/24/outline'; 

export default function AdminManageModules() {
    // const { user, profile } = useContext(AuthContext); // Tidak perlu AuthContext jika header dihapus
    // Karena header dihapus, adminUserName dan adminAvatarUrl tidak lagi diperlukan di sini
    // const adminUserName = profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'Admin';
    // const adminAvatarUrl = profile?.avatar_url || '/default-admin-avatar.jpg';

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
    const [moduleToEdit, setModuleToEdit] = useState(null); 
    const [moduleToDelete, setModuleToDelete] = useState(null); 

    // State untuk form tambah/edit modul
    const [newModuleData, setNewModuleData] = useState({
        title: '',
        description: '',
        course_id: '', 
        order_in_course: 0,
        is_active: true,
    });

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
            query = query.range(startIndex, endIndex).order('order_in_course', { ascending: true }); 

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
        }
    };

    useEffect(() => {
        fetchCourses(); 
        fetchModules(); 
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
            course_id: courses.length > 0 ? courses[0].id : '', 
            order_in_course: totalModulesCount + 1, 
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

            alert('Module successfully added!');
            closeAddModal();
            fetchModules(); 
        } catch (err) {
            setError('Failed to add module: ' + err.message);
            alert('Failed to add module: ' + err.message);
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

            // Update state 'modules' directly
            setModules(prevModules =>
                prevModules.map(module =>
                    module.id === moduleToEdit.id
                        ? { ...module,
                            title: newModuleData.title,
                            description: newModuleData.description,
                            course_id: newModuleData.course_id,
                            order_in_course: newModuleData.order_in_course,
                            is_active: newModuleData.is_active,
                            courses: courses.find(c => c.id === newModuleData.course_id) || module.courses
                        }
                        : module
                )
            );

            alert('Module successfully updated!');
            closeEditModal();
        } catch (err) {
            setError('Failed to update module: ' + err.message);
            alert('Failed to update module: ' + err.message);
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

            // Update state 'modules' directly by removing the module
            setModules(prevModules => prevModules.filter(module => module.id !== moduleToDelete.id));
            setTotalModulesCount(prevCount => prevCount - 1);

            alert('Module successfully deleted!');
            closeDeleteConfirm();
        } catch (err) {
            setError('Failed to delete module: ' + err.message);
            alert('Failed to delete module: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Rendering UI ---
    if (loading && modules.length === 0 && courses.length === 0) {
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading module data...
            </div>
        );
    }

    if (error && modules.length === 0 && courses.length === 0) {
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-red-600 text-xl dark:text-red-400">
                <svg className="h-6 w-6 mr-2 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Error: {error}
            </div>
        );
    }

    return (
        <div className="flex-grow h-[95vh] scrollbar-hide overflow-y-auto rounded-xl p-6 bg-[#F9F9FB] dark:bg-adminDark-bg-secondary">
            {/* Header Admin Page */}
            {/* Header dihapus karena instruksi pengguna */}

            <div className="bg-white p-4 mb-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 items-center dark:bg-adminDark-bg-tertiary dark:shadow-none">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search modules by title or description"
                        className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-adminDark-accent-green"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-500" />
                </div>

                <div className="relative flex space-x-4">
                    <select
                        className="w-full py-2 pl-4 pr-10 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 cursor-pointer appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-adminDark-accent-green"
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
                    <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none dark:text-gray-500" />
                    
                    {/* Tombol Tambah Modul */}
                    <button
                        onClick={openAddModal}
                        className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center min-w-[40px] h-[40px] dark:bg-adminDark-accent-green dark:hover:bg-green-700"
                        title="Add New Module"
                    >
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto dark:bg-adminDark-bg-tertiary dark:shadow-none">
                {/* Loading overlay saat operasi CRUD berlangsung */}
                {loading && modules.length > 0 && (
                    <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-20 rounded-xl dark:bg-gray-900 dark:bg-opacity-75">
                        <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-adminDark-accent-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                {/* Pesan error umum */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-700 dark:border-red-600 dark:text-white" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline"> {error}</span>
                    </div>
                )}

                <table className="min-w-full divide-y divide-gray-300 text-sm dark:divide-gray-700">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider dark:bg-gray-800 dark:text-gray-300">
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
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-adminDark-bg-tertiary dark:divide-gray-700">
                        {modules.length > 0 ? (
                            modules.map((module) => (
                                <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold dark:text-white">{module.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{module.courses ? module.courses.title : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{module.order_in_course}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            module.is_active ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                        }`}>
                                            {module.is_active ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 max-w-xs truncate dark:text-gray-300">{module.description || '-'}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {new Date(module.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => openEditModal(module)}
                                            className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                            title="Edit Module"
                                        >
                                            <PencilSquareIcon className="h-5 w-5 inline mr-1" />Edit
                                        </button>
                                        <button
                                            onClick={() => openDeleteConfirm(module)}
                                            className="text-red-600 hover:underline dark:text-red-500 dark:hover:text-red-400"
                                            title="Delete Module"
                                        >
                                            <TrashIcon className="h-5 w-5 inline mr-1" />Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4 text-gray-500 dark:text-gray-400">No modules found.</td>
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
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <ArrowLeftIcon className="h-4 w-4 inline" /> Prev
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            className={`px-4 py-2 text-sm border ${
                                currentPage === i + 1
                                    ? 'bg-purple-600 text-white border-purple-600 dark:bg-adminDark-accent-green dark:text-white dark:border-adminDark-accent-green'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        Next <ArrowRightIcon className="h-4 w-4 inline" />
                    </button>
                </nav>
            )}

            {/* --- Modal Tambah Modul (Create) --- */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative dark:bg-adminDark-bg-tertiary dark:text-white">
                        <button onClick={closeAddModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Add New Module</h2>
                        <form onSubmit={handleCreateModule}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-title">Title</label>
                                <input
                                    type="text"
                                    id="add-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newModuleData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-description">Description</label>
                                <textarea
                                    id="add-description"
                                    name="description"
                                    rows="3"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newModuleData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-course_id">Course</label>
                                <select
                                    id="add-course_id"
                                    name="course_id"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-order_in_course">Order in Course</label>
                                <input
                                    type="number"
                                    id="add-order_in_course"
                                    name="order_in_course"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newModuleData.order_in_course}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-is_active">
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
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-adminDark-accent-green dark:hover:bg-green-700"
                                    disabled={loading}
                                >
                                    {loading ? 'Adding...' : 'Add Module'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeAddModal}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative dark:bg-adminDark-bg-tertiary dark:text-white">
                        <button onClick={closeEditModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Edit Module</h2>
                        <form onSubmit={handleUpdateModule}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-title">Title</label>
                                <input
                                    type="text"
                                    id="edit-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newModuleData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-description">Description</label>
                                <textarea
                                    id="edit-description"
                                    name="description"
                                    rows="3"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newModuleData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-course_id">Course</label>
                                <select
                                    id="edit-course_id"
                                    name="course_id"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-order_in_course">Order in Course</label>
                                <input
                                    type="number"
                                    id="edit-order_in_course"
                                    name="order_in_course"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newModuleData.order_in_course}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-is_active">
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-adminDark-accent-green dark:hover:bg-green-700"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Module'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm relative text-center dark:bg-adminDark-bg-tertiary dark:text-white">
                        <button onClick={closeDeleteConfirm} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Confirm Deletion</h2>
                        <p className="mb-6 text-gray-700 dark:text-gray-300">
                            Are you sure you want to delete module "<span className="font-semibold">{moduleToDelete.title}</span>"?
                            This action cannot be undone. This will also delete lessons and quizzes connected to this module.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDeleteModule}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-red-700 dark:hover:bg-red-800"
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                type="button"
                                onClick={closeDeleteConfirm}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}