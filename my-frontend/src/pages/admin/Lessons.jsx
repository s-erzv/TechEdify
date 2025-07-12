// frontend/src/pages/admin/Lessons.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient'; // Pastikan path ini benar
import AdminLayout from '../../components/AdminLayout'; // Jika Anda menggunakan AdminLayout di sini
import {
    MagnifyingGlassIcon,
    ChevronDownIcon,
    PencilSquareIcon, // Untuk edit
    TrashIcon, // Untuk delete
    PlusIcon, // Untuk tombol tambah
    XMarkIcon, // Untuk tombol close di modal
    ArrowLeftIcon, // Untuk pagination
    ArrowRightIcon, // Untuk pagination
    BellIcon, // Untuk header
    BookOpenIcon, // Icon untuk Lesson
    DocumentIcon, // Icon untuk PDF, diganti dari DocumentPdfIcon
    EyeIcon, // Untuk view material
    PhotoIcon, // Untuk image type
    PlayCircleIcon, // Untuk video type
    DocumentTextIcon, // Untuk text type
    CodeBracketIcon, // Untuk script type
    FolderPlusIcon // <=== BARU: Icon untuk menambah materi dari pelajaran
} from '@heroicons/react/24/outline'; // Pastikan semua ikon diimpor

export default function AdminManageLessons() {
    const [lessons, setLessons] = useState([]);
    const [modules, setModules] = useState([]); // State untuk daftar modul
    const [materialsList, setMaterialsList] = useState([]); // State untuk daftar materi (semua materi yang tersedia)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterModuleId, setFilterModuleId] = useState(''); // Filter berdasarkan modul
    const [currentPage, setCurrentPage] = useState(1);
    const [lessonsPerPage] = useState(10);
    const [totalLessonsCount, setTotalLessonsCount] = useState(0);

    // --- State untuk operasi CRUD ---
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
    const [lessonToEdit, setLessonToEdit] = useState(null); // Menyimpan data pelajaran yang akan diedit
    const [lessonToDelete, setLessonToDelete] = useState(null); // Menyimpan data pelajaran yang akan dihapus

    // State untuk form tambah/edit pelajaran
    const [newLessonData, setNewLessonData] = useState({
        title: '',
        module_id: '',
        pdf_url: '', // PDF URL legacy
        associated_materials: [], // Array of { material_id: uuid, order_in_lesson: int }
        order_in_module: 0,
    });

    // <=== BARU: State untuk mengelola modal Tambah Materi On-the-Fly
    const [showAddMaterialNestedModal, setShowAddMaterialNestedModal] = useState(false);
    const [newMaterialOnFlyData, setNewMaterialOnFlyData] = useState({
        title: '',
        description: '',
        content_type: 'text',
        content_url: '',
        content_text: '',
        file: null,
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

    // --- Fungsi untuk Fetch Pelajaran (Read) ---
    const fetchLessons = async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase.from('lessons').select(`
                *,
                modules (
                    title,
                    courses (
                        title
                    )
                ),
                lesson_materials (
                    material_id,
                    order_in_lesson,
                    materials (
                        id, title, content_type
                    )
                )
            `, { count: 'exact' });

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,pdf_url.ilike.%${searchTerm}%`);
            }

            if (filterModuleId) {
                query = query.eq('module_id', filterModuleId);
            }

            const startIndex = (currentPage - 1) * lessonsPerPage;
            const endIndex = startIndex + lessonsPerPage - 1;
            query = query.range(startIndex, endIndex).order('order_in_module', { ascending: true });

            const { data, error: fetchError, count } = await query;

            if (fetchError) throw fetchError;

            const sortedLessons = data.map(lesson => ({
                ...lesson,
                lesson_materials: lesson.lesson_materials.sort((a, b) => a.order_in_lesson - b.order_in_lesson)
            }));


            setLessons(sortedLessons || []);
            setTotalLessonsCount(count || 0);
            console.log("Fetched lessons data:", sortedLessons);
        } catch (err) {
            setError('Gagal memuat daftar pelajaran: ' + err.message);
            setLessons([]);
            setTotalLessonsCount(0);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi untuk Fetch Modul (untuk dropdown) ---
    const fetchModules = async () => {
        try {
            const { data, error } = await supabase.from('modules').select('id, title, courses (title)');
            if (error) throw error;
            setModules(data || []);
        } catch (err) {
            console.error("Error fetching modules for dropdown:", err.message);
        }
    };

    // --- Fungsi untuk Fetch Materi (untuk dropdown/pilihan) ---
    const fetchMaterialsList = async () => {
        try {
            const { data, error } = await supabase.from('materials').select('id, title, content_type');
            if (error) throw error;
            setMaterialsList(data || []);
        } catch (err) {
            console.error("Error fetching materials for dropdown:", err.message);
        }
    };


    useEffect(() => {
        fetchModules();
        fetchMaterialsList();
        fetchLessons();
    }, [searchTerm, filterModuleId, currentPage, lessonsPerPage]);

    const totalPages = Math.ceil(totalLessonsCount / lessonsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- Helpers untuk mengelola state form pelajaran ---
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewLessonData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // --- BARU: Helpers untuk mengelola state form materi on-the-fly ---
    const handleMaterialOnFlyInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewMaterialOnFlyData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleMaterialOnFlyFileChange = (e) => {
        setNewMaterialOnFlyData(prev => ({ ...prev, file: e.target.files[0] }));
    };

    // --- BARU: Fungsi untuk membuat materi baru On-the-Fly ---
    const createMaterialOnTheFly = async () => {
        setError(null);

        try {
            let finalContentUrl = newMaterialOnFlyData.content_url;

            if (newMaterialOnFlyData.file && (newMaterialOnFlyData.content_type === 'image' || newMaterialOnFlyData.content_type === 'pdf')) {
                const fileExtension = newMaterialOnFlyData.file.name.split('.').pop();
                const filePath = `public/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('materials')
                    .upload(filePath, newMaterialOnFlyData.file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;
                
                const { data: publicURLData } = supabase.storage
                    .from('materials')
                    .getPublicUrl(filePath);

                finalContentUrl = publicURLData.publicUrl;
            }

            const { data: materialData, error: insertError } = await supabase.from('materials').insert({
                title: newMaterialOnFlyData.title,
                description: newMaterialOnFlyData.description,
                content_type: newMaterialOnFlyData.content_type,
                content_url: finalContentUrl,
                content_text: newMaterialOnFlyData.content_text,
            }).select('id').single(); // Dapatkan ID materi yang baru dibuat

            if (insertError) throw insertError;

            alert('Materi baru berhasil dibuat!');
            setShowAddMaterialNestedModal(false); // Tutup modal materi
            fetchMaterialsList(); // Refresh daftar materi di dropdown
            
            return materialData.id; // Kembalikan ID materi yang baru dibuat
        } catch (err) {
            setError('Gagal membuat materi baru: ' + err.message);
            alert('Gagal membuat materi baru: ' + err.message);
            return null;
        }
    };


    // --- Helpers untuk mengelola materi yang terhubung (Associated Materials) ---
    const handleAddAssociatedMaterial = (newlyCreatedMaterialId = null) => {
        const materialIdToAdd = newlyCreatedMaterialId || (materialsList.length > 0 ? materialsList[0].id : '');

        setNewLessonData(prev => ({
            ...prev,
            associated_materials: [
                ...prev.associated_materials,
                {
                    material_id: materialIdToAdd,
                    order_in_lesson: prev.associated_materials.length > 0
                        ? Math.max(...prev.associated_materials.map(m => m.order_in_lesson)) + 1
                        : 1
                }
            ]
        }));
    };

    const handleRemoveAssociatedMaterial = (indexToRemove) => {
        setNewLessonData(prev => ({
            ...prev,
            associated_materials: prev.associated_materials.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleUpdateAssociatedMaterial = (indexToUpdate, field, value) => {
        setNewLessonData(prev => ({
            ...prev,
            associated_materials: prev.associated_materials.map((item, index) =>
                index === indexToUpdate ? { ...item, [field]: value } : item
            )
        }));
    };

    // --- Fungsi CRUD: Create (Tambah Pelajaran) ---
    const openAddModal = () => {
        setNewLessonData({
            title: '',
            module_id: modules.length > 0 ? modules[0].id : '',
            pdf_url: '',
            associated_materials: [],
            order_in_module: totalLessonsCount + 1,
        });
        setShowAddModal(true);
    };

    const closeAddModal = () => {
        setShowAddModal(false);
    };

    const handleCreateLesson = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Buat pelajaran baru di tabel 'lessons'
            const { data: lessonData, error: insertLessonError } = await supabase.from('lessons').insert({
                title: newLessonData.title,
                module_id: newLessonData.module_id,
                pdf_url: newLessonData.pdf_url,
                order_in_module: newLessonData.order_in_module,
            }).select('id').single();

            if (insertLessonError) throw insertLessonError;

            const newLessonId = lessonData.id;

            // 2. Jika ada materi yang terkait, masukkan ke tabel 'lesson_materials'
            if (newLessonData.associated_materials.length > 0) {
                const lessonMaterialsToInsert = newLessonData.associated_materials.map(item => ({
                    lesson_id: newLessonId,
                    material_id: item.material_id,
                    order_in_lesson: item.order_in_lesson
                }));
                const { error: insertAssociatedError } = await supabase.from('lesson_materials').insert(lessonMaterialsToInsert);
                if (insertAssociatedError) throw insertAssociatedError;
            }

            alert('Pelajaran berhasil ditambahkan!');
            closeAddModal();
            fetchLessons(); // Refresh daftar pelajaran
        } catch (err) {
            setError('Gagal menambahkan pelajaran: ' + err.message);
            alert('Gagal menambahkan pelajaran: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi CRUD: Update (Edit Pelajaran) ---
    const openEditModal = (lesson) => {
        setLessonToEdit(lesson);
        setNewLessonData({
            title: lesson.title,
            module_id: lesson.module_id,
            pdf_url: lesson.pdf_url,
            associated_materials: lesson.lesson_materials.map(lm => ({
                material_id: lm.material_id,
                order_in_lesson: lm.order_in_lesson,
                material_title: lm.materials.title,
                material_type: lm.materials.content_type
            })),
            order_in_module: lesson.order_in_module,
        });
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setLessonToEdit(null);
    };

    const handleUpdateLesson = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!lessonToEdit) return;

        try {
            // 1. Perbarui pelajaran di tabel 'lessons'
            const { error: updateLessonError } = await supabase
                .from('lessons')
                .update({
                    title: newLessonData.title,
                    module_id: newLessonData.module_id,
                    pdf_url: newLessonData.pdf_url,
                    order_in_module: newLessonData.order_in_module,
                })
                .eq('id', lessonToEdit.id);

            if (updateLessonError) throw updateLessonError;

            // 2. Kelola hubungan di tabel 'lesson_materials'
            const currentAssociatedMaterials = lessonToEdit.lesson_materials.map(lm => ({
                material_id: lm.material_id,
                order_in_lesson: lm.order_in_lesson
            }));

            const newAssociatedMaterials = newLessonData.associated_materials;

            // Hapus yang lama tapi tidak ada di yang baru
            const materialsToRemove = currentAssociatedMaterials.filter(
                oldMat => !newAssociatedMaterials.some(newMat => newMat.material_id === oldMat.material_id)
            );
            if (materialsToRemove.length > 0) {
                const { error: removeError } = await supabase.from('lesson_materials')
                    .delete()
                    .eq('lesson_id', lessonToEdit.id)
                    .in('material_id', materialsToRemove.map(m => m.material_id));
                if (removeError) throw removeError;
            }

            // Tambahkan yang baru
            const materialsToAdd = newAssociatedMaterials.filter(
                newMat => !currentAssociatedMaterials.some(oldMat => oldMat.material_id === newMat.material_id)
            ).map(item => ({
                lesson_id: lessonToEdit.id,
                material_id: item.material_id,
                order_in_lesson: item.order_in_lesson
            }));
            if (materialsToAdd.length > 0) {
                const { error: addError } = await supabase.from('lesson_materials').insert(materialsToAdd);
                if (addError) throw addError;
            }

            // Update order_in_lesson untuk yang sudah ada dan masih dipilih
            const materialsToUpdate = newAssociatedMaterials.filter(
                newMat => currentAssociatedMaterials.some(oldMat => oldMat.material_id === newMat.material_id && oldMat.order_in_lesson !== newMat.order_in_lesson)
            );
            for (const item of materialsToUpdate) {
                const { error: updateOrderError } = await supabase.from('lesson_materials')
                    .update({ order_in_lesson: item.order_in_lesson })
                    .eq('lesson_id', lessonToEdit.id)
                    .eq('material_id', item.material_id);
                if (updateOrderError) throw updateOrderError;
            }


            alert('Pelajaran berhasil diperbarui!');
            closeEditModal();
            fetchLessons(); // Refresh daftar pelajaran untuk menampilkan perubahan lengkap
        } catch (err) {
            setError('Gagal memperbarui pelajaran: ' + err.message);
            alert('Gagal memperbarui pelajaran: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi CRUD: Delete (Hapus Pelajaran) ---
    const openDeleteConfirm = (lesson) => {
        setLessonToDelete(lesson);
        setShowDeleteConfirmationModal(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirmationModal(false);
        setLessonToDelete(null);
    };

    const confirmDeleteLesson = async () => {
        setLoading(true);
        setError(null);

        if (!lessonToDelete) return;

        try {
            const { error: deleteError } = await supabase
                .from('lessons')
                .delete()
                .eq('id', lessonToDelete.id);

            if (deleteError) throw deleteError;

            alert('Pelajaran berhasil dihapus!');
            closeDeleteConfirm();
            fetchLessons(); // Refresh daftar pelajaran
        } catch (err) {
            setError('Gagal menghapus pelajaran: ' + err.message);
            alert('Gagal menghapus pelajaran: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Rendering UI ---
    if (loading && lessons.length === 0 && modules.length === 0 && materialsList.length === 0) {
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl">
                <i className="fas fa-spinner fa-spin mr-2"></i> Memuat data pelajaran...
            </div>
        );
    }

    if (error && lessons.length === 0 && modules.length === 0 && materialsList.length === 0) {
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
                        placeholder="Search lessons by title or PDF URL"
                        className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="relative flex space-x-4">
                    <select
                        className="w-full py-2 pl-4 pr-10 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 cursor-pointer appearance-none"
                        value={filterModuleId}
                        onChange={(e) => {
                            setFilterModuleId(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">All Modules</option>
                        {modules.map(module => (
                            <option key={module.id} value={module.id}>{module.title} ({module.courses ? module.courses.title : 'No Course'})</option>
                        ))}
                    </select>
                    <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    
                    {/* Tombol Tambah Pelajaran */}
                    <button
                        onClick={openAddModal}
                        className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center min-w-[40px] h-[40px]"
                        title="Add New Lesson"
                    >
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
                {/* Loading overlay saat operasi CRUD berlangsung */}
                {loading && lessons.length > 0 && (
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
                            <th className="px-6 py-3 text-left">Module</th>
                            <th className="px-6 py-3 text-left">Course</th>
                            <th className="px-6 py-3 text-left">Order</th>
                            <th className="px-6 py-3 text-left">Materials</th>
                            <th className="px-6 py-3 text-left">PDF URL</th>
                            <th className="px-6 py-3 text-left">Created At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {lessons.length > 0 ? (
                            lessons.map((lesson) => (
                                <tr key={lesson.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold">{lesson.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{lesson.modules ? lesson.modules.title : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{lesson.modules && lesson.modules.courses ? lesson.modules.courses.title : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{lesson.order_in_module}</td>
                                    <td className="px-6 py-4 text-gray-700 max-w-xs">
                                        {lesson.lesson_materials && lesson.lesson_materials.length > 0 ? (
                                            <ul className="list-disc list-inside text-xs">
                                                {lesson.lesson_materials.map(lm => (
                                                    <li key={lm.material_id}>
                                                        {lm.materials ? `${lm.materials.title} (${lm.materials.content_type.replace('_', ' ')})` : 'Unknown Material'}
                                                        {lm.order_in_lesson ? ` (Order: ${lm.order_in_lesson})` : ''}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-blue-600 hover:underline max-w-xs truncate">
                                        {lesson.pdf_url ? <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer">{lesson.pdf_url.split('/').pop()}</a> : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(lesson.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => openEditModal(lesson)}
                                            className="text-blue-600 hover:underline"
                                            title="Edit Lesson"
                                        >
                                            <PencilSquareIcon className="h-5 w-5 inline mr-1" />Edit
                                        </button>
                                        <button
                                            onClick={() => openDeleteConfirm(lesson)}
                                            className="text-red-600 hover:underline"
                                            title="Delete Lesson"
                                        >
                                            <TrashIcon className="h-5 w-5 inline mr-1" />Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center py-4 text-gray-500">No lessons found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalLessonsCount > lessonsPerPage && (
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

            {/* --- Modal Tambah Pelajaran (Create) --- */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button onClick={closeAddModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Tambah Pelajaran Baru</h2>
                        <form onSubmit={handleCreateLesson}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-title">Title</label>
                                <input
                                    type="text"
                                    id="add-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newLessonData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-module_id">Module</label>
                                <select
                                    id="add-module_id"
                                    name="module_id"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newLessonData.module_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a Module</option>
                                    {modules.map(module => (
                                        <option key={module.id} value={module.id}>{module.title} ({module.courses ? module.courses.title : 'No Course'})</option>
                                    ))}
                                </select>
                            </div>

                            {/* --- Bagian Pemilihan Materi Terhubung (Associated Materials) --- */}
                            <div className="mb-4 border p-3 rounded-md bg-gray-50">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Associated Materials</label>
                                {newLessonData.associated_materials.map((item, index) => {
                                    const material = materialsList.find(mat => mat.id === item.material_id);
                                    return (
                                        <div key={index} className="flex items-center space-x-2 mb-2">
                                            <select
                                                className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                                                value={item.material_id}
                                                onChange={(e) => handleUpdateAssociatedMaterial(index, 'material_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Material</option>
                                                {materialsList.map(mat => (
                                                    <option key={mat.id} value={mat.id}>{mat.title} ({mat.content_type})</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-20"
                                                placeholder="Order"
                                                value={item.order_in_lesson}
                                                onChange={(e) => handleUpdateAssociatedMaterial(index, 'order_in_lesson', parseInt(e.target.value) || 0)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAssociatedMaterial(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => handleAddAssociatedMaterial()} // Memanggil tanpa ID materi baru
                                    className="mt-2 bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded"
                                >
                                    Add Existing Material
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddMaterialNestedModal(true)} // Tombol untuk modal materi on-the-fly
                                    className="mt-2 ml-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-1 px-3 rounded flex items-center"
                                >
                                    <FolderPlusIcon className="h-4 w-4 mr-1" /> Create New Material
                                </button>
                            </div>
                            {/* --- Akhir Bagian Pemilihan Materi Terhubung --- */}

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-pdf_url">PDF URL (Legacy / Supplemental)</label>
                                <input
                                    type="url"
                                    id="add-pdf_url"
                                    name="pdf_url"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newLessonData.pdf_url}
                                    onChange={handleInputChange}
                                />
                                <p className="text-xs text-gray-500 mt-1">Optional: Provide a direct PDF URL if not using a material.</p>
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-order_in_module">Order in Module</label>
                                <input
                                    type="number"
                                    id="add-order_in_module"
                                    name="order_in_module"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newLessonData.order_in_module}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    {loading ? 'Adding...' : 'Add Lesson'}
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

            {/* --- Modal Edit Pelajaran (Update) --- */}
            {showEditModal && lessonToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button onClick={closeEditModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Pelajaran</h2>
                        <form onSubmit={handleUpdateLesson}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-title">Title</label>
                                <input
                                    type="text"
                                    id="edit-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newLessonData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-module_id">Module</label>
                                <select
                                    id="edit-module_id"
                                    name="module_id"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newLessonData.module_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select a Module</option>
                                    {modules.map(module => (
                                        <option key={module.id} value={module.id}>{module.title} ({module.courses ? module.courses.title : 'No Course'})</option>
                                    ))}
                                </select>
                            </div>

                            {/* --- Bagian Pemilihan Materi Terhubung (Associated Materials) --- */}
                            <div className="mb-4 border p-3 rounded-md bg-gray-50">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Associated Materials</label>
                                {newLessonData.associated_materials.map((item, index) => {
                                    const material = materialsList.find(mat => mat.id === item.material_id);
                                    return (
                                        <div key={index} className="flex items-center space-x-2 mb-2">
                                            <select
                                                className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                                                value={item.material_id}
                                                onChange={(e) => handleUpdateAssociatedMaterial(index, 'material_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select Material</option>
                                                {materialsList.map(mat => (
                                                    <option key={mat.id} value={mat.id}>{mat.title} ({mat.content_type})</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-20"
                                                placeholder="Order"
                                                value={item.order_in_lesson}
                                                onChange={(e) => handleUpdateAssociatedMaterial(index, 'order_in_lesson', parseInt(e.target.value) || 0)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAssociatedMaterial(index)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <XMarkIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => handleAddAssociatedMaterial()}
                                    className="mt-2 bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded"
                                >
                                    Add Existing Material
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddMaterialNestedModal(true)}
                                    className="mt-2 ml-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-1 px-3 rounded flex items-center"
                                >
                                    <FolderPlusIcon className="h-4 w-4 mr-1" /> Create New Material
                                </button>
                            </div>
                            {/* --- Akhir Bagian Pemilihan Materi Terhubung --- */}

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-pdf_url">PDF URL (Legacy / Supplemental)</label>
                                <input
                                    type="url"
                                    id="edit-pdf_url"
                                    name="pdf_url"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newLessonData.pdf_url}
                                    onChange={handleInputChange}
                                />
                                <p className="text-xs text-gray-500 mt-1">Optional: Provide a direct PDF URL if not using a material.</p>
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-order_in_module">Order in Module</label>
                                <input
                                    type="number"
                                    id="edit-order_in_module"
                                    name="order_in_module"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newLessonData.order_in_module}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Lesson'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Modal Konfirmasi Hapus Pelajaran (Delete) --- */}
            {showDeleteConfirmationModal && lessonToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm relative text-center">
                        <button onClick={closeDeleteConfirm} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Konfirmasi Penghapusan</h2>
                        <p className="mb-6 text-gray-700">
                            Apakah Anda yakin ingin menghapus pelajaran "<span className="font-semibold">{lessonToDelete.title}</span>"?
                            Tindakan ini tidak dapat dibatalkan. Ini juga akan memutus hubungan dengan kuis yang terhubung ke pelajaran ini.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDeleteLesson}
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

            {/* --- Modal Tambah Materi On-the-Fly (Nested Modal) --- */}
            {showAddMaterialNestedModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button onClick={() => setShowAddMaterialNestedModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Material</h2>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setLoading(true);
                            const newMaterialId = await createMaterialOnTheFly(); // Panggil fungsi pembuatan materi
                            if (newMaterialId) {
                                handleAddAssociatedMaterial(newMaterialId); // Langsung tambahkan ke list materi terkait pelajaran
                            }
                            setLoading(false);
                        }}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-material-title">Title</label>
                                <input
                                    type="text"
                                    id="new-material-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newMaterialOnFlyData.title}
                                    onChange={handleMaterialOnFlyInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-material-description">Description</label>
                                <textarea
                                    id="new-material-description"
                                    name="description"
                                    rows="3"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newMaterialOnFlyData.description}
                                    onChange={handleMaterialOnFlyInputChange}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-material-content_type">Content Type</label>
                                <select
                                    id="new-material-content_type"
                                    name="content_type"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newMaterialOnFlyData.content_type}
                                    onChange={handleMaterialOnFlyInputChange}
                                >
                                    <option value="text">Text</option>
                                    <option value="image">Image</option>
                                    <option value="video_url">Video URL</option>
                                    <option value="script">Script</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>

                            {newMaterialOnFlyData.content_type === 'image' || newMaterialOnFlyData.content_type === 'pdf' ? (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-material-file">Upload File</label>
                                    <input
                                        type="file"
                                        id="new-material-file"
                                        name="file"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        onChange={handleMaterialOnFlyFileChange}
                                        required
                                    />
                                </div>
                            ) : newMaterialOnFlyData.content_type === 'video_url' ? (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-material-content_url">Video URL</label>
                                    <input
                                        type="url"
                                        id="new-material-content_url"
                                        name="content_url"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        value={newMaterialOnFlyData.content_url}
                                        onChange={handleMaterialOnFlyInputChange}
                                        placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                        required
                                    />
                                </div>
                            ) : null}

                            {newMaterialOnFlyData.content_type === 'text' || newMaterialOnFlyData.content_type === 'script' ? (
                                <div className="mb-6">
                                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-material-content_text">
                                        {newMaterialOnFlyData.content_type === 'text' ? 'Content Text' : 'Script Content'}
                                    </label>
                                    <textarea
                                        id="new-material-content_text"
                                        name="content_text"
                                        rows="6"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono"
                                        value={newMaterialOnFlyData.content_text}
                                        onChange={handleMaterialOnFlyInputChange}
                                        required
                                    ></textarea>
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create & Add'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddMaterialNestedModal(false)}
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
        </div>
    );
}