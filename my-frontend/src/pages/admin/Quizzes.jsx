// frontend/src/pages/admin/Quizzes.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient'; // Pastikan path ini benar
import AdminLayout from '../../components/AdminLayout'; // Jika Anda menggunakan AdminLayout di sini
import {
    MagnifyingGlassIcon,
    ChevronDownIcon,
    PencilSquareIcon, // Untuk edit quiz
    TrashIcon, // Untuk delete quiz
    PlusIcon, // Untuk tombol tambah quiz/question
    XMarkIcon, // Untuk tombol close di modal
    ArrowLeftIcon, // Untuk pagination
    ArrowRightIcon, // Untuk pagination
    BellIcon, // Untuk header
    ClipboardDocumentListIcon, // Icon untuk Quiz
    DocumentTextIcon, // Icon untuk question text
    AdjustmentsVerticalIcon, // Icon for question options
    CheckCircleIcon, // Icon for correct answer
    CodeBracketIcon, // Icon for essay/script type
    ListBulletIcon, // Icon for multiple choice
    CommandLineIcon, // Icon for short answer
    PhotoIcon // <=== BARU: Untuk gambar
} from '@heroicons/react/24/outline'; // Pastikan semua ikon diimpor

export default function AdminManageQuizzes() {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [quizzesPerPage] = useState(10);
    const [totalQuizzesCount, setTotalQuizzesCount] = useState(0);

    // --- State untuk operasi CRUD Quiz ---
    const [showAddQuizModal, setShowAddQuizModal] = useState(false);
    const [showEditQuizModal, setShowEditQuizModal] = useState(false);
    const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
    const [quizToEdit, setQuizToEdit] = useState(null); // Menyimpan data kuis yang akan diedit
    const [quizToDelete, setQuizToDelete] = useState(null); // Menyimpan data kuis yang akan dihapus

    // State untuk form tambah/edit kuis
    const [newQuizData, setNewQuizData] = useState({
        title: '',
        description: '',
        type: 'standard', // 'standard', 'practice', 'exam'
        max_attempts: 1,
        pass_score: 70,
        // image_url: '', // <=== DIHAPUS: Ini akan digantikan oleh 'quizFile'
        quizFile: null, // <=== BARU: Untuk menyimpan objek file gambar thumbnail kuis
    });

    // --- State untuk manajemen Pertanyaan dalam Quiz ---
    const [showManageQuestionsModal, setShowManageQuestionsModal] = useState(false);
    const [currentQuizQuestions, setCurrentQuizQuestions] = useState([]);
    const [quizToManageQuestions, setQuizToManageQuestions] = useState(null);
    const [newQuestionData, setNewQuestionData] = useState({
        question_text: '',
        question_type: 'multiple_choice', // default
        options: [''], // Array of strings for multiple choice
        correct_answer_index: 0, // For multiple choice
        correct_answer_text: '', // For short answer
        score_value: 10,
        // image_url: '' // <=== DIHAPUS: Ini akan digantikan oleh 'questionFile'
        questionFile: null // <=== BARU: Untuk menyimpan objek file gambar pertanyaan
    });
    const [editingQuestionIndex, setEditingQuestionIndex] = useState(null); // Index of question being edited


    // Data dummy admin user untuk header (ini harusnya dari AuthContext Anda)
    const adminUser = {
        user_metadata: {
            first_name: "Admin",
            avatar_url: "/default-avatar.jpg"
        },
        email: "techedifysma@gmail.com"
    };
    const adminUserName = adminUser?.user_metadata?.first_name || adminUser?.email?.split('@')[0] || 'Admin';

    // --- Fungsi untuk Fetch Kuis (Read) ---
    const fetchQuizzes = async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase.from('quizzes').select(`*`, { count: 'exact' });

            if (searchTerm) {
                query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
            }

            const startIndex = (currentPage - 1) * quizzesPerPage;
            const endIndex = startIndex + quizzesPerPage - 1;
            query = query.range(startIndex, endIndex).order('created_at', { ascending: false });

            const { data, error: fetchError, count } = await query;

            if (fetchError) throw fetchError;

            setQuizzes(data || []);
            setTotalQuizzesCount(count || 0);
            console.log("Fetched quizzes data:", data);
        } catch (err) {
            setError('Gagal memuat daftar kuis: ' + err.message);
            setQuizzes([]);
            setTotalQuizzesCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, [searchTerm, currentPage, quizzesPerPage]);

    const totalPages = Math.ceil(totalQuizzesCount / quizzesPerPage);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- Helpers untuk mengelola state form kuis/pertanyaan ---
    const handleQuizInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewQuizData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleQuizFileChange = (e) => { // <=== BARU: Handler untuk file kuis
        setNewQuizData(prev => ({ ...prev, quizFile: e.target.files[0] }));
    };

    const handleQuestionInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewQuestionData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleQuestionFileChange = (e) => { // <=== BARU: Handler untuk file pertanyaan
        setNewQuestionData(prev => ({ ...prev, questionFile: e.target.files[0] }));
    };

    // --- Fungsi CRUD Quiz: Create (Tambah Kuis) ---
    const openAddQuizModal = () => {
        setNewQuizData({
            title: '',
            description: '',
            type: 'standard',
            max_attempts: 1,
            pass_score: 70,
            quizFile: null, // Reset file input
        });
        setShowAddQuizModal(true);
    };

    const closeAddQuizModal = () => {
        setShowAddQuizModal(false);
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let finalImageUrl = '';

            // Jika ada file gambar kuis yang diunggah
            if (newQuizData.quizFile) {
                const fileExtension = newQuizData.quizFile.name.split('.').pop();
                const filePath = `quiz_thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('materials') // Menggunakan bucket 'materials'
                    .upload(filePath, newQuizData.quizFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;
                
                const { data: publicURLData } = supabase.storage
                    .from('materials')
                    .getPublicUrl(filePath);

                finalImageUrl = publicURLData.publicUrl;
            }

            const { error: insertError } = await supabase.from('quizzes').insert({
                title: newQuizData.title,
                description: newQuizData.description,
                type: newQuizData.type,
                max_attempts: newQuizData.max_attempts,
                pass_score: newQuizData.pass_score,
                image_url: finalImageUrl, // Menggunakan URL dari hasil upload
            });

            if (insertError) throw insertError;

            alert('Kuis berhasil ditambahkan!');
            closeAddQuizModal();
            fetchQuizzes(); // Refresh daftar kuis
        } catch (err) {
            setError('Gagal menambahkan kuis: ' + err.message);
            alert('Gagal menambahkan kuis: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi CRUD Quiz: Update (Edit Kuis) ---
    const openEditQuizModal = (quiz) => {
        setQuizToEdit(quiz);
        setNewQuizData({
            title: quiz.title,
            description: quiz.description,
            type: quiz.type,
            max_attempts: quiz.max_attempts,
            pass_score: quiz.pass_score,
            // image_url: quiz.image_url || '', // Tidak lagi langsung di state ini
            quizFile: null, // Reset file input
        });
        setShowEditQuizModal(true);
    };

    const closeEditQuizModal = () => {
        setShowEditQuizModal(false);
        setQuizToEdit(null);
    };

    const handleUpdateQuiz = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!quizToEdit) return;

        try {
            let finalImageUrl = quizToEdit.image_url; // Default ke URL yang ada
            let oldFilePath = null;

            // Jika ada file gambar kuis baru yang diunggah
            if (newQuizData.quizFile) {
                const fileExtension = newQuizData.quizFile.name.split('.').pop();
                const filePath = `quiz_thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('materials')
                    .upload(filePath, newQuizData.quizFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;
                
                const { data: publicURLData } = supabase.storage
                    .from('materials')
                    .getPublicUrl(filePath);

                finalImageUrl = publicURLData.publicUrl;

                if (quizToEdit.image_url && 
                    quizToEdit.image_url.includes(supabase.storage.from('materials').getPublicUrl('').publicUrl.split('?')[0])
                ) {
                    oldFilePath = quizToEdit.image_url.split('quiz_thumbnails/').pop();
                }
            }


            const { error: updateError } = await supabase
                .from('quizzes')
                .update({
                    title: newQuizData.title,
                    description: newQuizData.description,
                    type: newQuizData.type,
                    max_attempts: newQuizData.max_attempts,
                    pass_score: newQuizData.pass_score,
                    image_url: finalImageUrl, // Menggunakan URL baru atau yang lama
                })
                .eq('id', quizToEdit.id);

            if (updateError) throw updateError;

            // Hapus file lama dari storage jika ada dan berhasil diunggah yang baru
            if (oldFilePath) {
                const { error: deleteOldError } = await supabase.storage
                    .from('materials')
                    .remove([`quiz_thumbnails/${oldFilePath}`]);

                if (deleteOldError) console.error("Error deleting old quiz thumbnail:", deleteOldError.message);
            }

            // Perbarui state 'quizzes' secara langsung
            setQuizzes(prevQuizzes =>
                prevQuizzes.map(quiz =>
                    quiz.id === quizToEdit.id
                        ? { ...quiz,
                            title: newQuizData.title,
                            description: newQuizData.description,
                            type: newQuizData.type,
                            max_attempts: newQuizData.max_attempts,
                            pass_score: newQuizData.pass_score,
                            image_url: finalImageUrl,
                        }
                        : quiz
                )
            );

            alert('Kuis berhasil diperbarui!');
            closeEditQuizModal();
        } catch (err) {
            setError('Gagal memperbarui kuis: ' + err.message);
            alert('Gagal memperbarui kuis: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi CRUD Quiz: Delete (Hapus Kuis) ---
    const openDeleteConfirm = (quiz) => {
        setQuizToDelete(quiz);
        setShowDeleteConfirmationModal(true);
    };

    const closeDeleteConfirm = () => {
        setShowDeleteConfirmationModal(false);
        setQuizToDelete(null);
    };

    const confirmDeleteQuiz = async () => {
        setLoading(true);
        setError(null);

        if (!quizToDelete) return;

        try {
            // Hapus thumbnail kuis dari storage jika ada
            if (quizToDelete.image_url && 
                quizToDelete.image_url.includes(supabase.storage.from('materials').getPublicUrl('').publicUrl.split('?')[0])
            ) {
                const filePathToDelete = quizToDelete.image_url.split('quiz_thumbnails/').pop();
                if (filePathToDelete) {
                    const { error: storageDeleteError } = await supabase.storage
                        .from('materials')
                        .remove([`quiz_thumbnails/${filePathToDelete}`]);

                    if (storageDeleteError) console.error("Error deleting quiz thumbnail from storage:", storageDeleteError.message);
                }
            }

            // Ini akan menghapus kuis dan, jika Anda punya foreign key cascade,
            // akan otomatis menghapus pertanyaan dan jawaban terkait.
            const { error: deleteError } = await supabase
                .from('quizzes')
                .delete()
                .eq('id', quizToDelete.id);

            if (deleteError) throw deleteError;

            // Perbarui state 'quizzes' secara langsung
            setQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz.id !== quizToDelete.id));
            setTotalQuizzesCount(prevCount => prevCount - 1);

            alert('Kuis berhasil dihapus!');
            closeDeleteConfirm();
        } catch (err) {
            setError('Gagal menghapus kuis: ' + err.message);
            alert('Gagal menghapus kuis: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi Manajemen Pertanyaan (CRUD Questions) ---

    const fetchQuizQuestions = async (quizId) => {
        try {
            const { data, error } = await supabase
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', quizId)
                .order('order_in_quiz', { ascending: true });

            if (error) throw error;
            setCurrentQuizQuestions(data || []);
        } catch (err) {
            console.error("Error fetching quiz questions:", err.message);
            setError('Gagal memuat pertanyaan kuis: ' + err.message);
        }
    };

    const openManageQuestionsModal = (quiz) => {
        setQuizToManageQuestions(quiz);
        fetchQuizQuestions(quiz.id);
        setShowManageQuestionsModal(true);
    };

    const closeManageQuestionsModal = () => {
        setShowManageQuestionsModal(false);
        setQuizToManageQuestions(null);
        setCurrentQuizQuestions([]);
        setNewQuestionData({ // Reset form pertanyaan
            question_text: '',
            question_type: 'multiple_choice',
            options: [''],
            correct_answer_index: 0,
            correct_answer_text: '',
            score_value: 10,
            questionFile: null // Reset file input pertanyaan
        });
        setEditingQuestionIndex(null);
    };

    const handleAddOption = () => {
        setNewQuestionData(prev => ({
            ...prev,
            options: [...prev.options, '']
        }));
    };

    const handleOptionChange = (index, value) => {
        const updatedOptions = newQuestionData.options.map((option, i) =>
            i === index ? value : option
        );
        setNewQuestionData(prev => ({ ...prev, options: updatedOptions }));
    };

    const handleRemoveOption = (indexToRemove) => {
        setNewQuestionData(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== indexToRemove)
        }));
    };

    const handleAddUpdateQuestion = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!quizToManageQuestions) return;

        try {
            let finalQuestionImageUrl = newQuestionData.image_url; // Default ke URL yang ada (jika sedang edit dan tidak upload baru)
            let oldFilePath = null; // Untuk menghapus file lama jika ada

            // Jika ada file gambar pertanyaan yang diunggah
            if (newQuestionData.questionFile) {
                const fileExtension = newQuestionData.questionFile.name.split('.').pop();
                const filePath = `question_images/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('materials') // Menggunakan bucket 'materials'
                    .upload(filePath, newQuestionData.questionFile, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;
                
                const { data: publicURLData } = supabase.storage
                    .from('materials')
                    .getPublicUrl(filePath);

                finalQuestionImageUrl = publicURLData.publicUrl;

                // Jika sedang edit dan ada gambar lama, siapkan untuk dihapus
                if (editingQuestionIndex !== null && currentQuizQuestions[editingQuestionIndex].image_url &&
                    currentQuizQuestions[editingQuestionIndex].image_url.includes(supabase.storage.from('materials').getPublicUrl('').publicUrl.split('?')[0])
                ) {
                    oldFilePath = currentQuizQuestions[editingQuestionIndex].image_url.split('question_images/').pop();
                }
            } else if (editingQuestionIndex !== null && newQuestionData.image_url === '') {
                // Kasus: menghapus gambar yang sudah ada (mengosongkan input URL)
                if (currentQuizQuestions[editingQuestionIndex].image_url &&
                    currentQuizQuestions[editingQuestionIndex].image_url.includes(supabase.storage.from('materials').getPublicUrl('').publicUrl.split('?')[0])
                ) {
                    oldFilePath = currentQuizQuestions[editingQuestionIndex].image_url.split('question_images/').pop();
                }
                finalQuestionImageUrl = null; // Set ke null di DB
            }


            const questionPayload = {
                quiz_id: quizToManageQuestions.id,
                question_text: newQuestionData.question_text,
                question_type: newQuestionData.question_type,
                score_value: newQuestionData.score_value,
                order_in_quiz: editingQuestionIndex !== null ? currentQuizQuestions[editingQuestionIndex].order_in_quiz : currentQuizQuestions.length + 1,
                image_url: finalQuestionImageUrl, // Menggunakan URL dari hasil upload/input
                // Kondisional berdasarkan tipe pertanyaan
                options: newQuestionData.question_type === 'multiple_choice' ? JSON.stringify(newQuestionData.options) : null,
                correct_answer_index: newQuestionData.question_type === 'multiple_choice' ? newQuestionData.correct_answer_index : null,
                correct_answer_text: newQuestionData.question_type === 'short_answer' || newQuestionData.question_type === 'essay' ? newQuestionData.correct_answer_text : null,
            };

            if (editingQuestionIndex !== null) { // Update existing question
                const { error: updateError } = await supabase
                    .from('quiz_questions')
                    .update(questionPayload)
                    .eq('id', currentQuizQuestions[editingQuestionIndex].id);
                if (updateError) throw updateError;
            } else { // Add new question
                const { error: insertError } = await supabase
                    .from('quiz_questions')
                    .insert(questionPayload);
                if (insertError) throw insertError;
            }

            // Hapus file lama dari storage jika ada
            if (oldFilePath) {
                const { error: deleteOldError } = await supabase.storage
                    .from('materials')
                    .remove([`question_images/${oldFilePath}`]);

                if (deleteOldError) console.error("Error deleting old question image:", deleteOldError.message);
            }


            alert('Pertanyaan berhasil disimpan!');
            setNewQuestionData({ // Reset form
                question_text: '',
                question_type: 'multiple_choice',
                options: [''],
                correct_answer_index: 0,
                correct_answer_text: '',
                score_value: 10,
                questionFile: null // Reset file input
            });
            setEditingQuestionIndex(null);
            fetchQuizQuestions(quizToManageQuestions.id); // Refresh daftar pertanyaan
        } catch (err) {
            setError('Gagal menyimpan pertanyaan: ' + err.message);
            alert('Gagal menyimpan pertanyaan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditQuestion = (question, index) => {
        setNewQuestionData({
            question_text: question.question_text,
            question_type: question.question_type,
            options: question.question_type === 'multiple_choice' ? (typeof question.options === 'string' ? JSON.parse(question.options) : (question.options || [''])) : [''],
            correct_answer_index: question.question_type === 'multiple_choice' ? question.correct_answer_index : 0,
            correct_answer_text: question.question_type === 'short_answer' || question.question_type === 'essay' ? (question.correct_answer_text || '') : '',
            score_value: question.score_value,
            image_url: question.image_url || '', // Tetap simpan URL yang ada untuk tampilan
            questionFile: null // Reset file input
        });
        setEditingQuestionIndex(index);
    };

    const handleDeleteQuestion = async (questionId, imageUrl) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus pertanyaan ini?')) return;
        setLoading(true);
        setError(null);
        try {
            // Hapus gambar pertanyaan dari storage jika ada
            if (imageUrl && imageUrl.includes(supabase.storage.from('materials').getPublicUrl('').publicUrl.split('?')[0])) {
                const filePathToDelete = imageUrl.split('question_images/').pop();
                if (filePathToDelete) {
                    const { error: storageDeleteError } = await supabase.storage
                        .from('materials')
                        .remove([`question_images/${filePathToDelete}`]);

                    if (storageDeleteError) console.error("Error deleting question image from storage:", storageDeleteError.message);
                }
            }

            const { error: deleteError } = await supabase
                .from('quiz_questions')
                .delete()
                .eq('id', questionId);
            if (deleteError) throw deleteError;

            alert('Pertanyaan berhasil dihapus!');
            fetchQuizQuestions(quizToManageQuestions.id);
        } catch (err) {
            setError('Gagal menghapus pertanyaan: ' + err.message);
            alert('Gagal menghapus pertanyaan: ' + err.message);
        } finally {
            setLoading(false);
        }
    };


    // --- Rendering UI ---
    if (loading && quizzes.length === 0) {
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl">
                <i className="fas fa-spinner fa-spin mr-2"></i> Memuat daftar kuis...
            </div>
        );
    }

    if (error && quizzes.length === 0) {
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
                        placeholder="Search quizzes by title or description"
                        className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="relative flex justify-end">
                    {/* Tombol Tambah Kuis */}
                    <button
                        onClick={openAddQuizModal}
                        className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center min-w-[40px] h-[40px]"
                        title="Add New Quiz"
                    >
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
                {/* Loading overlay saat operasi CRUD berlangsung */}
                {loading && quizzes.length > 0 && (
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
                            <th className="px-6 py-3 text-left">Description</th>
                            <th className="px-6 py-3 text-left">Type</th>
                            <th className="px-6 py-3 text-left">Max Attempts</th>
                            <th className="px-6 py-3 text-left">Pass Score</th>
                            <th className="px-6 py-3 text-left">Created At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {quizzes.length > 0 ? (
                            quizzes.map((quiz) => (
                                <tr key={quiz.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold">{quiz.title}</td>
                                    <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{quiz.description || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap capitalize">{quiz.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{quiz.max_attempts}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{quiz.pass_score}%</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(quiz.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => openManageQuestionsModal(quiz)}
                                            className="text-indigo-600 hover:underline"
                                            title="Manage Questions"
                                        >
                                            <ListBulletIcon className="h-5 w-5 inline mr-1" />Questions
                                        </button>
                                        <button
                                            onClick={() => openEditQuizModal(quiz)}
                                            className="text-blue-600 hover:underline"
                                            title="Edit Quiz"
                                        >
                                            <PencilSquareIcon className="h-5 w-5 inline mr-1" />Edit
                                        </button>
                                        <button
                                            onClick={() => openDeleteConfirm(quiz)}
                                            className="text-red-600 hover:underline"
                                            title="Delete Quiz"
                                        >
                                            <TrashIcon className="h-5 w-5 inline mr-1" />Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4 text-gray-500">No quizzes found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalQuizzesCount > quizzesPerPage && (
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

            {/* --- Modal Tambah Kuis (Create) --- */}
            {showAddQuizModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button onClick={closeAddQuizModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Tambah Kuis Baru</h2>
                        <form onSubmit={handleCreateQuiz}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-quiz-title">Title</label>
                                <input
                                    type="text"
                                    id="add-quiz-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newQuizData.title}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-quiz-description">Description</label>
                                <textarea
                                    id="add-quiz-description"
                                    name="description"
                                    rows="3"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newQuizData.description}
                                    onChange={handleQuizInputChange}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-quiz-type">Type</label>
                                <select
                                    id="add-quiz-type"
                                    name="type"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newQuizData.type}
                                    onChange={handleQuizInputChange}
                                >
                                    <option value="standard">Standard</option>
                                    <option value="practice">Practice</option>
                                    <option value="exam">Exam</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-quiz-max_attempts">Max Attempts</label>
                                <input
                                    type="number"
                                    id="add-quiz-max_attempts"
                                    name="max_attempts"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newQuizData.max_attempts}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-quiz-pass_score">Pass Score (%)</label>
                                <input
                                    type="number"
                                    id="add-quiz-pass_score"
                                    name="pass_score"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newQuizData.pass_score}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                             <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-quiz-file">Quiz Thumbnail Image (Optional)</label>
                                <input
                                    type="file"
                                    id="add-quiz-file"
                                    name="quizFile"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    onChange={handleQuizFileChange} // <=== BARU: Menggunakan handler file
                                />
                                <p className="text-xs text-gray-500 mt-1">Upload an image for the quiz banner/thumbnail.</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    {loading ? 'Adding...' : 'Add Quiz'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeAddQuizModal}
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

            {/* --- Modal Edit Kuis (Update) --- */}
            {showEditQuizModal && quizToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button onClick={closeEditQuizModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Kuis</h2>
                        <form onSubmit={handleUpdateQuiz}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-quiz-title">Title</label>
                                <input
                                    type="text"
                                    id="edit-quiz-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newQuizData.title}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-quiz-description">Description</label>
                                <textarea
                                    id="edit-quiz-description"
                                    name="description"
                                    rows="3"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newQuizData.description}
                                    onChange={handleQuizInputChange}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-quiz-type">Type</label>
                                <select
                                    id="edit-quiz-type"
                                    name="type"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newQuizData.type}
                                    onChange={handleQuizInputChange}
                                >
                                    <option value="standard">Standard</option>
                                    <option value="practice">Practice</option>
                                    <option value="exam">Exam</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-quiz-max_attempts">Max Attempts</label>
                                <input
                                    type="number"
                                    id="edit-quiz-max_attempts"
                                    name="max_attempts"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newQuizData.max_attempts}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-quiz-pass_score">Pass Score (%)</label>
                                <input
                                    type="number"
                                    id="edit-quiz-pass_score"
                                    name="pass_score"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newQuizData.pass_score}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-quiz-file">Quiz Thumbnail Image (Optional)</label>
                                {quizToEdit.image_url && (
                                    <div className="mb-2">
                                        <img src={quizToEdit.image_url} alt="Current Thumbnail" className="h-20 w-20 object-cover rounded-md" />
                                        <p className="text-xs text-gray-500 mt-1">Current: <a href={quizToEdit.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{quizToEdit.image_url.split('/').pop()}</a></p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="edit-quiz-file"
                                    name="quizFile"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    onChange={handleQuizFileChange}
                                />
                                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current thumbnail. Upload new image to replace.</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Quiz'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeEditQuizModal}
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

            {/* --- Modal Konfirmasi Hapus Kuis (Delete) --- */}
            {showDeleteConfirmationModal && quizToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm relative text-center">
                        <button onClick={closeDeleteConfirm} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Konfirmasi Penghapusan</h2>
                        <p className="mb-6 text-gray-700">
                            Apakah Anda yakin ingin menghapus kuis "<span className="font-semibold">{quizToDelete.title}</span>"?
                            Tindakan ini tidak dapat dibatalkan dan juga akan menghapus semua pertanyaan dan jawaban terkait.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDeleteQuiz}
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

            {/* --- Modal Manajemen Pertanyaan (Manage Questions) --- */}
            {showManageQuestionsModal && quizToManageQuestions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={closeManageQuestionsModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Manage Questions for "{quizToManageQuestions.title}"</h2>

                        {/* Form Tambah/Edit Pertanyaan */}
                        <div className="mb-6 border p-4 rounded-lg bg-gray-50">
                            <h3 className="text-xl font-semibold mb-4">{editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}</h3>
                            <form onSubmit={handleAddUpdateQuestion}>
                                <div className="mb-3">
                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="question_text">Question Text</label>
                                    <textarea
                                        id="question_text"
                                        name="question_text"
                                        rows="3"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        value={newQuestionData.question_text}
                                        onChange={handleQuestionInputChange}
                                        required
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="question_type">Question Type</label>
                                    <select
                                        id="question_type"
                                        name="question_type"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        value={newQuestionData.question_type}
                                        onChange={handleQuestionInputChange}
                                    >
                                        <option value="multiple_choice">Multiple Choice</option>
                                        <option value="short_answer">Short Answer</option>
                                        <option value="essay">Essay</option>
                                    </select>
                                </div>

                                {/* Kondisional berdasarkan Tipe Pertanyaan */}
                                {newQuestionData.question_type === 'multiple_choice' && (
                                    <div className="mb-3 border p-3 rounded bg-white">
                                        <label className="block text-gray-700 text-sm font-bold mb-1">Options</label>
                                        {newQuestionData.options.map((option, index) => (
                                            <div key={index} className="flex items-center mb-2">
                                                <input
                                                    type="text"
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow"
                                                    value={option}
                                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                                    placeholder={`Option ${index + 1}`}
                                                    required
                                                />
                                                <button type="button" onClick={() => handleRemoveOption(index)} className="ml-2 text-red-500 hover:text-red-700">
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={handleAddOption} className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-1 px-3 rounded mt-2">Add Option</button>

                                        <label className="block text-gray-700 text-sm font-bold mb-1 mt-3" htmlFor="correct_answer_index">Correct Answer (Index)</label>
                                        <input
                                            type="number"
                                            id="correct_answer_index"
                                            name="correct_answer_index"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            value={newQuestionData.correct_answer_index}
                                            onChange={handleQuestionInputChange}
                                            min="0"
                                            max={newQuestionData.options.length - 1}
                                            required
                                        />
                                        <p className="text-xs text-gray-500">0-indexed. E.g., 0 for first option, 1 for second.</p>
                                    </div>
                                )}

                                {newQuestionData.question_type === 'short_answer' && (
                                    <div className="mb-3">
                                        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="correct_answer_text">Correct Answer Text</label>
                                        <input
                                            type="text"
                                            id="correct_answer_text"
                                            name="correct_answer_text"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            value={newQuestionData.correct_answer_text}
                                            onChange={handleQuestionInputChange}
                                            required
                                        />
                                        <p className="text-xs text-gray-500">Case-insensitive exact match will be graded correct.</p>
                                    </div>
                                )}

                                {newQuestionData.question_type === 'essay' && (
                                    <div className="mb-3">
                                        <p className="text-sm text-gray-600 italic">Essay questions require manual grading by admin.</p>
                                        <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="essay_guideline">Grading Guideline (Optional)</label>
                                        <textarea
                                            id="essay_guideline"
                                            name="correct_answer_text" // Menggunakan correct_answer_text untuk menyimpan panduan grading
                                            rows="2"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            value={newQuestionData.correct_answer_text}
                                            onChange={handleQuestionInputChange}
                                            placeholder="e.g., Kriteria penilaian: kelengkapan, koherensi, orisinalitas."
                                        ></textarea>
                                        <p className="text-xs text-gray-500 mt-1">Ini akan muncul sebagai panduan untuk admin saat melakukan grading manual.</p>
                                    </div>
                                )}
                                
                                <div className="mb-3">
                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="score_value">Score Value</label>
                                    <input
                                        type="number"
                                        id="score_value"
                                        name="score_value"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        value={newQuestionData.score_value}
                                        onChange={handleQuestionInputChange}
                                        required
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-gray-700 text-sm font-bold mb-1" htmlFor="question_file">Question Image (Optional)</label>
                                    {newQuestionData.image_url && ( // Tampilkan gambar yang ada saat edit
                                        <div className="mb-2">
                                            <img src={newQuestionData.image_url} alt="Current Question Image" className="h-16 w-auto object-cover rounded-md" />
                                            <p className="text-xs text-gray-500 mt-1">Current: <a href={newQuestionData.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{newQuestionData.image_url.split('/').pop()}</a></p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="question_file"
                                        name="questionFile"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        onChange={handleQuestionFileChange} // <=== BARU: Menggunakan handler file pertanyaan
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Upload an image for the question.</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <button
                                        type="submit"
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                        disabled={loading}
                                    >
                                        {loading ? 'Saving...' : (editingQuestionIndex !== null ? 'Update Question' : 'Add Question')}
                                    </button>
                                    {editingQuestionIndex !== null && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingQuestionIndex(null);
                                                setNewQuestionData({ // Reset form
                                                    question_text: '',
                                                    question_type: 'multiple_choice',
                                                    options: [''],
                                                    correct_answer_index: 0,
                                                    correct_answer_text: '',
                                                    score_value: 10,
                                                    questionFile: null // Reset file input
                                                });
                                            }}
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                            disabled={loading}
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Daftar Pertanyaan */}
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h3 className="text-xl font-semibold mb-4">Questions List</h3>
                            {currentQuizQuestions.length > 0 ? (
                                <ul className="divide-y divide-gray-200">
                                    {currentQuizQuestions.map((question, index) => (
                                        <li key={question.id} className="py-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-gray-800">Q{question.order_in_quiz}: {question.question_text}</p>
                                                    <p className="text-sm text-gray-600 capitalize">Type: {question.question_type.replace('_', ' ')} (Score: {question.score_value})</p>
                                                    {question.image_url && (
                                                        <img src={question.image_url} alt="Question Image" className="mt-2 max-h-24 object-cover rounded-md" />
                                                    )}
                                                    {question.question_type === 'multiple_choice' && (
                                                        <div className="text-xs text-gray-700 mt-1">
                                                            Options:
                                                            <ol className="list-decimal list-inside ml-2">
                                                                {typeof question.options === 'string' ? JSON.parse(question.options).map((opt, i) => (
                                                                    <li key={i} className={question.correct_answer_index === i ? 'font-bold text-green-700' : ''}>{opt}</li>
                                                                )) : question.options.map((opt, i) => (
                                                                    <li key={i} className={question.correct_answer_index === i ? 'font-bold text-green-700' : ''}>{opt}</li>
                                                                ))}
                                                            </ol>
                                                        </div>
                                                    )}
                                                    {question.question_type === 'short_answer' && (
                                                        <p className="text-sm text-gray-700 mt-1">Correct Answer: <span className="font-bold">{question.correct_answer_text}</span></p>
                                                    )}
                                                    {question.question_type === 'essay' && (
                                                        <p className="text-sm text-gray-700 mt-1 italic">Grading Guideline: {question.correct_answer_text || '-'}</p>
                                                    )}
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleEditQuestion(question, index)} className="text-blue-600 hover:underline"><PencilSquareIcon className="h-4 w-4 inline" /></button>
                                                    <button onClick={() => handleDeleteQuestion(question.id, question.image_url)} className="text-red-600 hover:underline"><TrashIcon className="h-4 w-4 inline" /></button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic">No questions added yet for this quiz.</p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={closeManageQuestionsModal}
                                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
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