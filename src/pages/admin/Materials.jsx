// frontend/src/pages/admin/Materials.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient'; 
import {
    MagnifyingGlassIcon,
    ChevronDownIcon,
    PencilSquareIcon, 
    TrashIcon, 
    EyeIcon, 
    PlusIcon, 
    XMarkIcon, 
    PhotoIcon, 
    VideoCameraIcon, 
    DocumentTextIcon, 
    CodeBracketIcon, 
    DocumentIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon,
} from '@heroicons/react/24/outline'; 

// Helper function untuk mendapatkan ID video YouTube
const getYouTubeVideoId = (url) => {
    let videoId = '';
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|[^#]*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
        videoId = match[1];
    }
    return videoId;
};

export default function AdminManageMaterials() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [materialsPerPage] = useState(10);
    const [totalMaterialsCount, setTotalMaterialsCount] = useState(0);

    // --- State untuk operasi CRUD ---
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
    const [materialToEdit, setMaterialToEdit] = useState(null); 
    const [materialToDelete, setMaterialToDelete] = useState(null); 
    const [showViewModal, setShowViewModal] = useState(false); 
    const [materialToView, setMaterialToView] = useState(null); 

    // State untuk form tambah/edit materi
    const [newMaterialData, setNewMaterialData] = useState({
        title: '',
        description: '',
        content_type: 'text', 
        content_url: '',
        content_text: '',
        file: null, 
    });

    // --- Fungsi untuk Fetch Materi (Read) ---
    const fetchMaterials = async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase.from('materials').select('*', { count: 'exact' });

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            if (filterType) {
                query = query.eq('content_type', filterType);
            }

            const startIndex = (currentPage - 1) * materialsPerPage;
            const endIndex = startIndex + materialsPerPage - 1;
            query = query.range(startIndex, endIndex).order('created_at', { ascending: false });

            const { data, error: fetchError, count } = await query;

            if (fetchError) throw fetchError;

            setMaterials(data || []);
            setTotalMaterialsCount(count || 0);
            console.log("Fetched materials data:", data);
            console.log("Total count from Supabase:", count);
        } catch (err) {
            setError('Failed to load materials list: ' + err.message);
            setMaterials([]);
            setTotalMaterialsCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, [searchTerm, filterType, currentPage, materialsPerPage]);

    const totalPages = Math.ceil(totalMaterialsCount / materialsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- Helpers untuk mengelola state form materi ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewMaterialData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        setNewMaterialData(prev => ({ ...prev, file: e.target.files[0] }));
    };

    // --- Fungsi CRUD: Create (Tambah Materi) ---
    const openAddModal = () => {
        setNewMaterialData({
            title: '',
            description: '',
            content_type: 'text',
            content_url: '',
            content_text: '',
            file: null,
        });
        setShowAddModal(true);
    };

    const closeAddModal = () => {
        setShowAddModal(false);
    };

    const handleCreateMaterial = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let finalContentUrl = newMaterialData.content_url;

            // Hanya unggah file jika tipe kontennya adalah gambar atau PDF
            if (newMaterialData.file && (newMaterialData.content_type === 'image' || newMaterialData.content_type === 'pdf')) {
                const fileExtension = newMaterialData.file.name.split('.').pop();
                const filePath = `public/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('materials') 
                    .upload(filePath, newMaterialData.file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;
                
                const { data: publicURLData } = supabase.storage
                    .from('materials')
                    .getPublicUrl(filePath);

                finalContentUrl = publicURLData.publicUrl;
            }

            // Masukkan data materi ke tabel 'materials'
            const { error: insertError } = await supabase.from('materials').insert({
                title: newMaterialData.title,
                description: newMaterialData.description,
                content_type: newMaterialData.content_type,
                content_url: finalContentUrl,
                content_text: newMaterialData.content_text,
            });

            if (insertError) throw insertError;

            alert('Material successfully added!');
            closeAddModal();
            fetchMaterials(); 
        } catch (err) {
            setError('Failed to add material: ' + err.message);
            alert('Failed to add material: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi CRUD: Update (Edit Materi) ---
    const openEditModal = (material) => {
        setMaterialToEdit(material);
        setNewMaterialData({
            title: material.title,
            description: material.description,
            content_type: material.content_type,
            content_url: material.content_url || '',
            content_text: material.content_text || '',
            file: null, 
        });
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setMaterialToEdit(null);
    };

    const handleUpdateMaterial = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!materialToEdit) return;

        try {
            let finalContentUrl = newMaterialData.content_url;
            let oldFilePath = null; 

            // Hanya unggah file baru jika tipe kontennya adalah gambar atau PDF
            if (newMaterialData.file && (newMaterialData.content_type === 'image' || newMaterialData.content_type === 'pdf')) {
                const fileExtension = newMaterialData.file.name.split('.').pop();
                const filePath = `public/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
                
                // Unggah file baru
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('materials')
                    .upload(filePath, newMaterialData.file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                // Dapatkan URL publik dari file yang diunggah
                const { data: publicURLData } = supabase.storage
                    .from('materials')
                    .getPublicUrl(filePath);

                finalContentUrl = publicURLData.publicUrl;

                // Jika materi lama memiliki URL file dan tipe yang sama, siapkan untuk dihapus
                if (materialToEdit.content_url && 
                    (materialToEdit.content_type === 'image' || materialToEdit.content_type === 'pdf') &&
                    materialToEdit.content_url.includes(supabase.storage.from('materials').getPublicUrl('').publicUrl.split('?')[0]) 
                ) {
                    oldFilePath = materialToEdit.content_url.split('public/').pop(); 
                }
            } else if (newMaterialData.content_type === 'video_url' || newMaterialData.content_type === 'script') {
                     // Jika tipe berubah ke video_url atau script, pastikan content_url yang baru digunakan
                     // dan file lama (jika ada) dihapus
                     if (materialToEdit.content_url && 
                         (materialToEdit.content_type === 'image' || materialToEdit.content_type === 'pdf') &&
                         materialToEdit.content_url.includes(supabase.storage.from('materials').getPublicUrl('').publicUrl.split('?')[0])
                     ) {
                        oldFilePath = materialToEdit.content_url.split('public/').pop();
                    }
            }


            // Perbarui data materi di tabel 'materials'
            const { error: updateError } = await supabase
                .from('materials')
                .update({
                    title: newMaterialData.title,
                    description: newMaterialData.description,
                    content_type: newMaterialData.content_type,
                    content_url: finalContentUrl,
                    content_text: newMaterialData.content_text,
                })
                .eq('id', materialToEdit.id);

            if (updateError) throw updateError;

            // Hapus file lama dari storage jika ada dan berhasil diunggah yang baru
            if (oldFilePath) {
                const { error: deleteOldError } = await supabase.storage
                    .from('materials')
                    .remove([`public/${oldFilePath}`]);

                if (deleteOldError) console.error("Error deleting old file:", deleteOldError.message);
            }

            // Perbarui state 'materials' secara langsung
            setMaterials(prevMaterials =>
                prevMaterials.map(material =>
                    material.id === materialToEdit.id
                        ? { ...material,
                            title: newMaterialData.title,
                            description: newMaterialData.description,
                            content_type: newMaterialData.content_type,
                            content_url: finalContentUrl,
                            content_text: newMaterialData.content_text,
                        }
                        : material
                )
            );

            alert('Material successfully updated!');
            closeEditModal();
        } catch (err) {
            setError('Failed to update material: ' + err.message);
            alert('Failed to update material: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi CRUD: Delete (Hapus Materi) ---
    const openDeleteConfirm = (material) => {
        setMaterialToDelete(material);
        setShowDeleteConfirmationModal(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirmationModal(false);
        setMaterialToDelete(null);
    };

    const confirmDeleteMaterial = async () => {
        setLoading(true);
        setError(null);

        if (!materialToDelete) return;

        try {
            // Hapus file dari storage jika ada dan ini adalah file content
            if (materialToDelete.content_url && (materialToDelete.content_type === 'image' || materialToDelete.content_type === 'pdf')) {
                 // Dapatkan path relatif dari URL publik
                const filePathToDelete = materialToDelete.content_url.split('public/').pop();
                if (filePathToDelete) {
                    const { error: storageDeleteError } = await supabase.storage
                        .from('materials')
                        .remove([`public/${filePathToDelete}`]);

                    if (storageDeleteError) console.error("Error deleting material file from storage:", storageDeleteError.message);
                }
            }

            // Hapus entri dari tabel materials
            const { error: deleteError } = await supabase
                .from('materials')
                .delete()
                .eq('id', materialToDelete.id);

            if (deleteError) throw deleteError;

            // Perbarui state 'materials' secara langsung
            setMaterials(prevMaterials => prevMaterials.filter(material => material.id !== materialToDelete.id));
            setTotalMaterialsCount(prevCount => prevCount - 1);

            alert('Material successfully deleted!');
            closeDeleteConfirm();
        } catch (err) {
            setError('Failed to delete material: ' + err.message);
            alert('Failed to delete material: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi View Detail Materi ---
    const openViewModal = (material) => {
        setMaterialToView(material);
        setShowViewModal(true);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setMaterialToView(null);
    };

    // --- Helper untuk mendapatkan ikon berdasarkan tipe konten ---
    const getContentTypeIcon = (type) => {
        switch (type) {
            case 'image': return <PhotoIcon className="h-5 w-5" />;
            case 'video_url': return <VideoCameraIcon className="h-5 w-5" />;
            case 'text': return <DocumentTextIcon className="h-5 w-5" />;
            case 'script': return <CodeBracketIcon className="h-5 w-5" />;
            case 'pdf': return <DocumentIcon className="h-5 w-5" />; 
            default: return <EyeIcon className="h-5 w-5" />;
        }
    };

    // --- Rendering UI ---
    if (loading && materials.length === 0) {
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading material list...
            </div>
        );
    }

    if (error && materials.length === 0) {
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
                        placeholder="Search materials by title or description"
                        className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-adminDark-accent-green"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-500" />
                </div>

                <div className="relative flex space-x-4">
                    {/* Bungkus select dalam div relatif terpisah */}
                    <div className="relative flex-grow">
                        <select
                            className="w-full py-2 pl-4 pr-10 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 cursor-pointer appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-adminDark-accent-green"
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="">All Types</option>
                            <option value="text">Text</option>
                            <option value="image">Image</option>
                            <option value="video_url">Video URL</option>
                            <option value="script">Script</option>
                            <option value="pdf">PDF</option>
                        </select>
                        <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none dark:text-gray-500" />
                    </div>
                    
                    {/* Tombol Tambah Materi */}
                    <button
                        onClick={openAddModal}
                        className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center min-w-[40px] h-[40px] dark:bg-adminDark-accent-green dark:hover:bg-green-700"
                        title="Add New Material"
                    >
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto dark:bg-adminDark-bg-tertiary dark:shadow-none">
                {/* Loading overlay saat operasi CRUD berlangsung */}
                {loading && materials.length > 0 && (
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
                            <th className="px-6 py-3 text-left">Type</th>
                            <th className="px-6 py-3 text-left">Description</th>
                            <th className="px-6 py-3 text-left">Created At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-adminDark-bg-tertiary dark:divide-gray-700">
                        {materials.length > 0 ? (
                            materials.map((material) => (
                                <tr key={material.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold dark:text-white">{material.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                                            material.content_type === 'text' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                                            material.content_type === 'image' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                                            material.content_type === 'video_url' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' :
                                            material.content_type === 'script' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                                            material.content_type === 'pdf' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                        }`}>
                                            {material.content_type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700 max-w-xs truncate dark:text-gray-300">{material.description || '-'}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {new Date(material.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => openViewModal(material)}
                                            className="text-indigo-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                            title="View Details"
                                        >
                                            <EyeIcon className="h-5 w-5 inline mr-1" />View
                                        </button>
                                        <button
                                            onClick={() => openEditModal(material)}
                                            className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                            title="Edit Material"
                                        >
                                            <PencilSquareIcon className="h-5 w-5 inline mr-1" />Edit
                                        </button>
                                        <button
                                            onClick={() => openDeleteConfirm(material)}
                                            className="text-red-600 hover:underline dark:text-red-500 dark:hover:text-red-400"
                                            title="Delete Material"
                                        >
                                            <TrashIcon className="h-5 w-5 inline mr-1" />Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-500 dark:text-gray-400">No materials found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalMaterialsCount > materialsPerPage && (
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

            {/* --- Modal Tambah Materi (Create) --- */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative dark:bg-adminDark-bg-tertiary dark:text-white">
                        <button onClick={closeAddModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Add New Material</h2>
                        <form onSubmit={handleCreateMaterial}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-title">Title</label>
                                <input
                                    type="text"
                                    id="add-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newMaterialData.title}
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
                                    value={newMaterialData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-content_type">Content Type</label>
                                <select
                                    id="add-content_type"
                                    name="content_type"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newMaterialData.content_type}
                                    onChange={handleInputChange}
                                >
                                    <option value="text">Text</option>
                                    <option value="image">Image</option>
                                    <option value="video_url">Video URL</option>
                                    <option value="script">Script</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>

                            {/* Conditional fields based on content_type */}
                            {newMaterialData.content_type === 'image' || newMaterialData.content_type === 'pdf' ? (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-file">Upload File</label>
                                    <input
                                        type="file"
                                        id="add-file"
                                        name="file"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        onChange={handleFileChange}
                                        required
                                    />
                                </div>
                            ) : newMaterialData.content_type === 'video_url' ? (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-content_url">Video URL</label>
                                    <input
                                        type="url"
                                        id="add-content_url"
                                        name="content_url"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={newMaterialData.content_url}
                                        onChange={handleInputChange}
                                        placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                                        required
                                    />
                                </div>
                            ) : null}

                            {newMaterialData.content_type === 'text' || newMaterialData.content_type === 'script' ? (
                                <div className="mb-6">
                                    <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-content_text">
                                        {newMaterialData.content_type === 'text' ? 'Content Text' : 'Script Content'}
                                    </label>
                                    <textarea
                                        id="add-content_text"
                                        name="content_text"
                                        rows="6"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={newMaterialData.content_text}
                                        onChange={handleInputChange}
                                        required
                                    ></textarea>
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-adminDark-accent-green dark:hover:bg-green-700"
                                    disabled={loading}
                                >
                                    {loading ? 'Adding...' : 'Add Material'}
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

            {/* --- Modal Edit Materi (Update) --- */}
            {showEditModal && materialToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative dark:bg-adminDark-bg-tertiary dark:text-white">
                        <button onClick={closeEditModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Edit Material</h2>
                        <form onSubmit={handleUpdateMaterial}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-title">Title</label>
                                <input
                                    type="text"
                                    id="edit-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newMaterialData.title}
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
                                    value={newMaterialData.description}
                                    onChange={handleInputChange}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-content_type">Content Type</label>
                                <select
                                    id="edit-content_type"
                                    name="content_type"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newMaterialData.content_type}
                                    onChange={handleInputChange}
                                >
                                    <option value="text">Text</option>
                                    <option value="image">Image</option>
                                    <option value="video_url">Video URL</option>
                                    <option value="script">Script</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>

                            {newMaterialData.content_type === 'image' || newMaterialData.content_type === 'pdf' ? (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-file">Upload New File</label>
                                    {materialToEdit.content_url && (
                                        <p className="text-sm text-gray-600 mb-2 dark:text-gray-400">Current File: <a href={materialToEdit.content_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate inline-block max-w-[calc(100%-100px)] dark:text-blue-400 dark:hover:underline">{materialToEdit.content_url.split('/').pop()}</a></p>
                                    )}
                                    <input
                                        type="file"
                                        id="edit-file"
                                        name="file"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        onChange={handleFileChange}
                                    />
                                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Leave blank to keep current file. Upload new file to replace.</p>
                                </div>
                            ) : newMaterialData.content_type === 'video_url' ? (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-content_url">Video URL</label>
                                    <input
                                        type="url"
                                        id="edit-content_url"
                                        name="content_url"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={newMaterialData.content_url}
                                        onChange={handleInputChange}
                                        placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                                        required
                                    />
                                </div>
                            ) : null}

                            {newMaterialData.content_type === 'text' || newMaterialData.content_type === 'script' ? (
                                <div className="mb-6">
                                    <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-content_text">
                                        {newMaterialData.content_type === 'text' ? 'Content Text' : 'Script Content'}
                                    </label>
                                    <textarea
                                        id="edit-content_text"
                                        name="content_text"
                                        rows="6"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={newMaterialData.content_text}
                                        onChange={handleInputChange}
                                        required
                                    ></textarea>
                                </div>
                            ) : null}

                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-adminDark-accent-green dark:hover:bg-green-700"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Material'}
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

            {/* --- Modal Konfirmasi Hapus Materi (Delete) --- */}
            {showDeleteConfirmationModal && materialToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm relative text-center dark:bg-adminDark-bg-tertiary dark:text-white">
                        <button onClick={closeDeleteConfirm} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Confirm Deletion</h2>
                        <p className="mb-6 text-gray-700 dark:text-gray-300">
                            Are you sure you want to delete material "<span className="font-semibold">{materialToDelete.title}</span>"?
                            This action cannot be undone. This will also delete the associated file if it's in storage.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDeleteMaterial}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-red-700 dark:hover:bg-red-800"
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                type="button"
                                onClick={closeDeleteConfirm}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Modal View Detail Materi --- */}
            {showViewModal && materialToView && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl relative dark:bg-adminDark-bg-tertiary dark:text-white">
                        <button onClick={closeViewModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">{materialToView.title}</h2>
                        <p className="text-sm text-gray-600 mb-4 capitalize dark:text-gray-300">Type: {materialToView.content_type.replace('_', ' ')}</p>
                        <p className="text-gray-700 mb-6 dark:text-gray-200">{materialToView.description}</p>

                        {/* Dynamic Content Based on Type */}
                        <div className="mt-4 border p-4 rounded-lg bg-gray-50 max-h-[50vh] overflow-y-auto dark:border-gray-700 dark:bg-gray-800">
                            {materialToView.content_type === 'image' && materialToView.content_url && (
                                <img src={materialToView.content_url} alt={materialToView.title} className="max-w-full h-auto rounded-lg" />
                            )}
                            {materialToView.content_type === 'video_url' && materialToView.content_url && (
                                <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                                    {/* Embed YouTube/Vimeo or other video URL */}
                                    {(materialToView.content_url.includes('youtube.com') || materialToView.content_url.includes('youtu.be')) ? (
                                        <iframe
                                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                                            src={`https://www.youtube.com/embed/${getYouTubeVideoId(materialToView.content_url)}`}
                                            title="YouTube video player"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            referrerPolicy="strict-origin-when-cross-origin"
                                            allowFullScreen
                                        ></iframe>
                                    ) : (
                                        <video controls src={materialToView.content_url} className="absolute top-0 left-0 w-full h-full rounded-lg">
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                </div>
                            )}
                            {materialToView.content_type === 'text' && materialToView.content_text && (
                                <p className="text-gray-800 whitespace-pre-wrap dark:text-gray-200">{materialToView.content_text}</p>
                            )}
                            {materialToView.content_type === 'script' && materialToView.content_text && (
                                <pre className="bg-gray-800 text-green-300 p-3 rounded-lg overflow-x-auto text-sm font-mono">
                                    <code>{materialToView.content_text}</code>
                                </pre>
                            )}
                            {materialToView.content_type === 'pdf' && materialToView.content_url && (
                                <iframe src={materialToView.content_url} className="w-full h-[500px] border-0 rounded-lg"></iframe>
                            )}
                            {(!materialToView.content_url && !materialToView.content_text) && (
                                <p className="text-gray-500 italic dark:text-gray-400">No content available for this material type.</p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={closeViewModal}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}