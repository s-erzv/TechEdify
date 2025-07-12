// frontend/src/pages/admin/Quizzes.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient'; 
// import AdminLayout from '../../components/AdminLayout'; // Hapus import ini
// import AuthContext jika tidak digunakan untuk header admin di sini
// import { AuthContext } from '../../context/AuthContext';
import {
    MagnifyingGlassIcon,
    ChevronDownIcon,
    PencilSquareIcon, 
    TrashIcon, 
    PlusIcon, 
    XMarkIcon, 
    ArrowLeftIcon, 
    ArrowRightIcon, 
    BellIcon, // Tidak digunakan jika header dihapus
    ClipboardDocumentListIcon, 
    DocumentTextIcon, 
    AdjustmentsVerticalIcon, 
    CheckCircleIcon, 
    CodeBracketIcon, 
    ListBulletIcon, 
    CommandLineIcon, 
    PhotoIcon,
    VideoCameraIcon // Untuk video di modal View
} from '@heroicons/react/24/outline'; 

// Helper function untuk mendapatkan ID video YouTube (jika digunakan untuk display)
const getYouTubeVideoId = (url) => { 
    let videoId = '';
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|[^#]*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
        videoId = match[1];
    }
    return videoId;
};

export default function AdminManageQuizzes() {
    // Jika header admin dihapus, user dan profile dari AuthContext tidak diperlukan di sini
    // const { user, profile } = useContext(AuthContext); 
    // const adminUserName = profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'Admin';
    // const adminAvatarUrl = profile?.avatar_url || '/default-admin-avatar.jpg';

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
    const [quizToEdit, setQuizToEdit] = useState(null); 
    const [quizToDelete, setQuizToDelete] = useState(null); 

    // State untuk form tambah/edit kuis
    const [newQuizData, setNewQuizData] = useState({
        title: '',
        description: '',
        type: 'standard', // 'standard', 'practice', 'exam'
        max_attempts: 1,
        pass_score: 70,
        quizFile: null, // Untuk menyimpan objek file gambar thumbnail kuis
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
        questionFile: null // Untuk menyimpan objek file gambar pertanyaan
    });
    const [editingQuestionIndex, setEditingQuestionIndex] = useState(null); // Index of question being edited


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
            setError('Failed to load quiz list: ' + err.message);
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

    const handleQuizFileChange = (e) => { 
        setNewQuizData(prev => ({ ...prev, quizFile: e.target.files[0] }));
    };

    const handleQuestionInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewQuestionData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleQuestionFileChange = (e) => { 
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
            quizFile: null, 
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
            }

            const { error: insertError } = await supabase.from('quizzes').insert({
                title: newQuizData.title,
                description: newQuizData.description,
                type: newQuizData.type,
                max_attempts: newQuizData.max_attempts,
                pass_score: newQuizData.pass_score,
                image_url: finalImageUrl, 
            });

            if (insertError) throw insertError;

            alert('Quiz successfully added!');
            closeAddQuizModal();
            fetchQuizzes(); 
        } catch (err) {
            setError('Failed to add quiz: ' + err.message);
            alert('Failed to add quiz: ' + err.message);
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
            quizFile: null, 
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
            let finalImageUrl = quizToEdit.image_url; 
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
                    image_url: finalImageUrl, 
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

            alert('Quiz successfully updated!');
            closeEditQuizModal();
        } catch (err) {
            setError('Failed to update quiz: ' + err.message);
            alert('Failed to update quiz: ' + err.message);
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

                    if (storageDeleteError) console.error("Error deleting quiz thumbnail:", storageDeleteError.message);
                }
            }

            // Ini akan menghapus kuis dan, jika Anda punya foreign key cascade,
            // akan otomatis menghapus pertanyaan dan jawaban terkait.
            const { error: deleteError } = await supabase
                .from('quizzes')
                .delete()
                .eq('id', quizToDelete.id);

            if (deleteError) throw deleteError;

            setQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz.id !== quizToDelete.id));
            setTotalQuizzesCount(prevCount => prevCount - 1);

            alert('Quiz successfully deleted!');
            closeDeleteConfirm();
        } catch (err) {
            setError('Failed to delete quiz: ' + err.message);
            alert('Failed to delete quiz: ' + err.message);
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
            setError('Failed to load quiz questions: ' + err.message);
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
            questionFile: null 
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
            let finalQuestionImageUrl = newQuestionData.image_url; 
            let oldFilePath = null; 

            // Jika ada file gambar pertanyaan yang diunggah
            if (newQuestionData.questionFile) {
                const fileExtension = newQuestionData.questionFile.name.split('.').pop();
                const filePath = `question_images/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('materials') 
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
                image_url: finalQuestionImageUrl, 
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


            alert('Question successfully saved!');
            setNewQuestionData({ // Reset form
                question_text: '',
                question_type: 'multiple_choice',
                options: [''],
                correct_answer_index: 0,
                correct_answer_text: '',
                score_value: 10,
                questionFile: null 
            });
            setEditingQuestionIndex(null);
            fetchQuizQuestions(quizToManageQuestions.id); // Refresh daftar pertanyaan
        } catch (err) {
            setError('Failed to save question: ' + err.message);
            alert('Failed to save question: ' + err.message);
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
            image_url: question.image_url || '', 
            questionFile: null 
        });
        setEditingQuestionIndex(index);
    };

    const handleDeleteQuestion = async (questionId, imageUrl) => {
        if (!window.confirm('Are you sure you want to delete this question?')) return;
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

            alert('Question successfully deleted!');
            fetchQuizQuestions(quizToManageQuestions.id);
        } catch (err) {
            setError('Failed to delete question: ' + err.message);
            alert('Failed to delete question: ' + err.message);
        } finally {
            setLoading(false);
        }
    };


    // --- Rendering UI ---
    if (loading && quizzes.length === 0) {
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading quiz list...
            </div>
        );
    }

    if (error && quizzes.length === 0) {
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
                        placeholder="Search quizzes by title or description"
                        className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-adminDark-accent-green"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-gray-500" />
                </div>

                <div className="relative flex justify-end">
                    {/* Tombol Tambah Kuis */}
                    <button
                        onClick={openAddQuizModal}
                        className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center min-w-[40px] h-[40px] dark:bg-adminDark-accent-green dark:hover:bg-green-700"
                        title="Add New Quiz"
                    >
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto dark:bg-adminDark-bg-tertiary dark:shadow-none">
                {/* Loading overlay saat operasi CRUD berlangsung */}
                {loading && quizzes.length > 0 && (
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
                            <th className="px-6 py-3 text-left">Description</th>
                            <th className="px-6 py-3 text-left">Type</th>
                            <th className="px-6 py-3 text-left">Max Attempts</th>
                            <th className="px-6 py-3 text-left">Pass Score</th>
                            <th className="px-6 py-3 text-left">Created At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 dark:bg-adminDark-bg-tertiary dark:divide-gray-700">
                        {quizzes.length > 0 ? (
                            quizzes.map((quiz) => (
                                <tr key={quiz.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold dark:text-white">{quiz.title}</td>
                                    <td className="px-6 py-4 text-gray-700 max-w-xs truncate dark:text-gray-300">{quiz.description || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap capitalize text-gray-700 dark:text-gray-300">{quiz.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{quiz.max_attempts}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{quiz.pass_score}%</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {new Date(quiz.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button
                                            onClick={() => openManageQuestionsModal(quiz)}
                                            className="text-indigo-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                            title="Manage Questions"
                                        >
                                            <ListBulletIcon className="h-5 w-5 inline mr-1" />Questions
                                        </button>
                                        <button
                                            onClick={() => openEditQuizModal(quiz)}
                                            className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                            title="Edit Quiz"
                                        >
                                            <PencilSquareIcon className="h-5 w-5 inline mr-1" />Edit
                                        </button>
                                        <button
                                            onClick={() => openDeleteConfirm(quiz)}
                                            className="text-red-600 hover:underline dark:text-red-500 dark:hover:text-red-400"
                                            title="Delete Quiz"
                                        >
                                            <TrashIcon className="h-5 w-5 inline mr-1" />Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4 text-gray-500 dark:text-gray-400">No quizzes found.</td>
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

            {/* --- Modal Tambah Kuis (Create) --- */}
            {showAddQuizModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative dark:bg-adminDark-bg-tertiary dark:text-white">
                        <button onClick={closeAddQuizModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Add New Quiz</h2>
                        <form onSubmit={handleCreateQuiz}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-quiz-title">Title</label>
                                <input
                                    type="text"
                                    id="add-quiz-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newQuizData.title}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-quiz-description">Description</label>
                                <textarea
                                    id="add-quiz-description"
                                    name="description"
                                    rows="3"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newQuizData.description}
                                    onChange={handleQuizInputChange}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-quiz-type">Type</label>
                                <select
                                    id="add-quiz-type"
                                    name="type"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newQuizData.type}
                                    onChange={handleQuizInputChange}
                                >
                                    <option value="standard">Standard</option>
                                    <option value="practice">Practice</option>
                                    <option value="exam">Exam</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-quiz-max_attempts">Max Attempts</label>
                                <input
                                    type="number"
                                    id="add-quiz-max_attempts"
                                    name="max_attempts"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newQuizData.max_attempts}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-quiz-pass_score">Pass Score (%)</label>
                                <input
                                    type="number"
                                    id="add-quiz-pass_score"
                                    name="pass_score"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newQuizData.pass_score}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="add-quiz-file">Quiz Thumbnail Image (Optional)</label>
                                <input
                                    type="file"
                                    id="add-quiz-file"
                                    name="quizFile"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    onChange={handleQuizFileChange} 
                                />
                                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Upload an image for the quiz banner/thumbnail.</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-adminDark-accent-green dark:hover:bg-green-700"
                                    disabled={loading}
                                >
                                    {loading ? 'Adding...' : 'Add Quiz'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeAddQuizModal}
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

            {/* --- Modal Edit Kuis (Update) --- */}
            {showEditQuizModal && quizToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative dark:bg-adminDark-bg-tertiary dark:text-white">
                        <button onClick={closeEditQuizModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Edit Quiz</h2>
                        <form onSubmit={handleUpdateQuiz}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-quiz-title">Title</label>
                                <input
                                    type="text"
                                    id="edit-quiz-title"
                                    name="title"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newQuizData.title}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-quiz-description">Description</label>
                                <textarea
                                    id="edit-quiz-description"
                                    name="description"
                                    rows="3"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newQuizData.description}
                                    onChange={handleQuizInputChange}
                                ></textarea>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-quiz-type">Type</label>
                                <select
                                    id="edit-quiz-type"
                                    name="type"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newQuizData.type}
                                    onChange={handleQuizInputChange}
                                >
                                    <option value="standard">Standard</option>
                                    <option value="practice">Practice</option>
                                    <option value="exam">Exam</option>
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-quiz-max_attempts">Max Attempts</label>
                                <input
                                    type="number"
                                    id="edit-quiz-max_attempts"
                                    name="max_attempts"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newQuizData.max_attempts}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-quiz-pass_score">Pass Score (%)</label>
                                <input
                                    type="number"
                                    id="edit-quiz-pass_score"
                                    name="pass_score"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newQuizData.pass_score}
                                    onChange={handleQuizInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-300" htmlFor="edit-quiz-file">Quiz Thumbnail Image (Optional)</label>
                                {quizToEdit.image_url && (
                                    <div className="mb-2">
                                        <img src={quizToEdit.image_url} alt="Current Thumbnail" className="h-20 w-20 object-cover rounded-md" />
                                        <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Current: <a href={quizToEdit.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:underline">{quizToEdit.image_url.split('/').pop()}</a></p>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    id="edit-quiz-file"
                                    name="quizFile"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    onChange={handleQuizFileChange} 
                                />
                                <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Leave blank to keep current thumbnail. Upload new image to replace.</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-adminDark-accent-green dark:hover:bg-green-700"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Quiz'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeEditQuizModal}
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

            {/* --- Modal Konfirmasi Hapus Kuis (Delete) --- */}
            {showDeleteConfirmationModal && quizToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm relative text-center dark:bg-adminDark-bg-tertiary dark:text-white">
                        <button onClick={closeDeleteConfirm} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Confirm Deletion</h2>
                        <p className="mb-6 text-gray-700 dark:text-gray-300">
                            Are you sure you want to delete quiz "<span className="font-semibold">{quizToDelete.title}</span>"?
                            This action cannot be undone and will also delete all connected questions and answers.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDeleteQuiz}
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

            {/* --- Modal Manajemen Pertanyaan (Manage Questions) --- */}
            {showManageQuestionsModal && quizToManageQuestions && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl relative max-h-[90vh] overflow-y-auto dark:bg-adminDark-bg-tertiary dark:text-white">
                        <button onClick={closeManageQuestionsModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Manage Questions for "{quizToManageQuestions.title}"</h2>

                        {/* Form Tambah/Edit Pertanyaan */}
                        <div className="mb-6 border p-4 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                            <h3 className="text-xl font-semibold mb-4 dark:text-white">{editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}</h3>
                            <form onSubmit={handleAddUpdateQuestion}>
                                <div className="mb-3">
                                    <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-gray-300" htmlFor="question_text">Question Text</label>
                                    <textarea
                                        id="question_text"
                                        name="question_text"
                                        rows="3"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={newQuestionData.question_text}
                                        onChange={handleQuestionInputChange}
                                        required
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-gray-300" htmlFor="question_type">Question Type</label>
                                    <select
                                        id="question_type"
                                        name="question_type"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={newQuestionData.question_type}
                                        onChange={handleQuestionInputChange}
                                    >
                                        <option value="multiple_choice">Multiple Choice</option>
                                        <option value="short_answer">Short Answer</option>
                                        <option value="essay">Essay</option>
                                    </select>
                                </div>

                                {/* Conditional fields based on Question Type */}
                                {newQuestionData.question_type === 'multiple_choice' && (
                                    <div className="mb-3 border p-3 rounded bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-gray-300">Options</label>
                                        {newQuestionData.options.map((option, index) => (
                                            <div key={index} className="flex items-center mb-2">
                                                <input
                                                    type="text"
                                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    value={option}
                                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                                    placeholder={`Option ${index + 1}`}
                                                    required
                                                />
                                                <button type="button" onClick={() => handleRemoveOption(index)} className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500">
                                                    <XMarkIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={handleAddOption} className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm py-1 px-3 rounded mt-2 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">Add Option</button>

                                        <label className="block text-gray-700 text-sm font-bold mb-1 mt-3 dark:text-gray-300" htmlFor="correct_answer_index">Correct Answer (Index)</label>
                                        <input
                                            type="number"
                                            id="correct_answer_index"
                                            name="correct_answer_index"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={newQuestionData.correct_answer_index}
                                            onChange={handleQuestionInputChange}
                                            min="0"
                                            max={newQuestionData.options.length - 1}
                                            required
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">0-indexed. E.g., 0 for first option, 1 for second.</p>
                                    </div>
                                )}

                                {newQuestionData.question_type === 'short_answer' && (
                                    <div className="mb-3">
                                        <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-gray-300" htmlFor="correct_answer_text">Correct Answer Text</label>
                                        <input
                                            type="text"
                                            id="correct_answer_text"
                                            name="correct_answer_text"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={newQuestionData.correct_answer_text}
                                            onChange={handleQuestionInputChange}
                                            required
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Case-insensitive exact match will be graded correct.</p>
                                    </div>
                                )}

                                {newQuestionData.question_type === 'essay' && (
                                    <div className="mb-3">
                                        <p className="text-sm text-gray-600 italic dark:text-gray-400">Essay questions require manual grading by admin.</p>
                                        <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-gray-300" htmlFor="essay_guideline">Grading Guideline (Optional)</label>
                                        <textarea
                                            id="essay_guideline"
                                            name="correct_answer_text" // Menggunakan correct_answer_text untuk menyimpan panduan grading
                                            rows="2"
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={newQuestionData.correct_answer_text}
                                            onChange={handleQuestionInputChange}
                                            placeholder="e.g., Grading criteria: completeness, coherence, originality." // Teks bahasa Inggris
                                        ></textarea>
                                        <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">This will appear as a guideline for admin for manual grading.</p>
                                    </div>
                                )}
                                
                                <div className="mb-3">
                                    <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-gray-300" htmlFor="score_value">Score Value</label>
                                    <input
                                        type="number"
                                        id="score_value"
                                        name="score_value"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={newQuestionData.score_value}
                                        onChange={handleQuestionInputChange}
                                        required
                                    />
                                </div>
                                <div className="mb-6">
                                    <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-gray-300" htmlFor="question_file">Question Image (Optional)</label>
                                    {newQuestionData.image_url && ( // Tampilkan gambar yang ada saat edit
                                        <div className="mb-2">
                                            <img src={newQuestionData.image_url} alt="Current Question Image" className="h-16 w-auto object-cover rounded-md" />
                                            <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Current: <a href={newQuestionData.image_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:underline">{newQuestionData.image_url.split('/').pop()}</a></p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        id="question_file"
                                        name="questionFile"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        onChange={handleQuestionFileChange} 
                                    />
                                    <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Upload an image for the question.</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <button
                                        type="submit"
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-adminDark-accent-green dark:hover:bg-green-700"
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
                                                    questionFile: null 
                                                });
                                            }}
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                                            disabled={loading}
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Daftar Pertanyaan */}
                        <div className="bg-white p-4 rounded-lg shadow-md dark:bg-adminDark-bg-tertiary dark:shadow-none">
                            <h3 className="text-xl font-semibold mb-4 dark:text-white">Questions List</h3>
                            {currentQuizQuestions.length > 0 ? (
                                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {currentQuizQuestions.map((question, index) => (
                                        <li key={question.id} className="py-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-semibold text-gray-800 dark:text-white">Q{question.order_in_quiz}: {question.question_text}</p>
                                                    <p className="text-sm text-gray-600 capitalize dark:text-gray-300">Type: {question.question_type.replace('_', ' ')} (Score: {question.score_value})</p>
                                                    {question.image_url && (
                                                        <img src={question.image_url} alt="Question Image" className="mt-2 max-h-24 object-cover rounded-md" />
                                                    )}
                                                    {question.question_type === 'multiple_choice' && (
                                                        <div className="text-xs text-gray-700 mt-1 dark:text-gray-300">
                                                            Options:
                                                            <ol className="list-decimal list-inside ml-2">
                                                                {typeof question.options === 'string' ? JSON.parse(question.options).map((opt, i) => (
                                                                    <li key={i} className={question.correct_answer_index === i ? 'font-bold text-green-700 dark:text-green-500' : ''}>{opt}</li>
                                                                )) : question.options.map((opt, i) => ( // Handle already parsed options
                                                                    <li key={i} className={question.correct_answer_index === i ? 'font-bold text-green-700 dark:text-green-500' : ''}>{opt}</li>
                                                                ))}
                                                            </ol>
                                                        </div>
                                                    )}
                                                    {question.question_type === 'short_answer' && (
                                                        <p className="text-sm text-gray-700 mt-1 dark:text-gray-300">Correct Answer: <span className="font-bold">{question.correct_answer_text}</span></p>
                                                    )}
                                                    {question.question_type === 'essay' && (
                                                        <p className="text-sm text-gray-700 mt-1 italic dark:text-gray-300">Grading Guideline: {question.correct_answer_text || '-'}</p>
                                                    )}
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button onClick={() => handleEditQuestion(question, index)} className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"><PencilSquareIcon className="h-4 w-4 inline" /></button>
                                                    <button onClick={() => handleDeleteQuestion(question.id, question.image_url)} className="text-red-600 hover:underline dark:text-red-500 dark:hover:text-red-400"><TrashIcon className="h-4 w-4 inline" /></button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic dark:text-gray-400">No questions added yet for this quiz.</p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={closeManageQuestionsModal}
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