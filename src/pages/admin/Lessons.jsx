import React, { useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AdminSidebarContext } from '../../components/AdminLayout';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  DocumentIcon,
  PhotoIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  FolderPlusIcon,
  Bars3Icon // Import Bars3Icon
} from '@heroicons/react/24/outline';

export default function AdminManageLessons() {
  const { toggleSidebar } = useContext(AdminSidebarContext);

  const [lessons, setLessons] = useState([]);
  const [modules, setModules] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModuleId, setFilterModuleId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lessonsPerPage] = useState(10);
  const [totalLessonsCount, setTotalLessonsCount] = useState(0);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [showAddLessonForm, setShowAddLessonForm] = useState(false);
  const [lessonToEdit, setLessonToEdit] = useState(null);
  const [lessonToDelete, setLessonToDelete] = useState(null);

  const [newLessonData, setNewLessonData] = useState({
    title: '',
    module_id: '',
    pdf_url: '',
    associated_materials: [],
    order_in_module: 0,
  });

  const [showNewMaterialOnFlyForm, setShowNewMaterialOnFlyForm] = useState(false);
  const [newMaterialOnFlyData, setNewMaterialOnFlyData] = useState({
    title: '',
    description: '',
    content_type: 'text',
    content_url: '',
    content_text: '',
    file: null,
  });

  const fetchLessons = useCallback(async () => {
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
    } catch (err) {
      setError('Failed to load lessons list: ' + err.message);
      setLessons([]);
      setTotalLessonsCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterModuleId, currentPage, lessonsPerPage]);

  const fetchModules = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('modules').select('id, title, courses (title)');
      if (error) throw error;
      setModules(data || []);
    } catch (err) {
      console.error("Error fetching modules for dropdown:", err.message);
    }
  }, []);

  const fetchMaterialsList = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('materials').select('id, title, content_type');
      if (error) throw error;
      setMaterialsList(data || []);
    } catch (err) {
      console.error("Error fetching materials for dropdown:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchModules();
    fetchMaterialsList();
    fetchLessons();
  }, [fetchModules, fetchMaterialsList, fetchLessons]);

  const totalPages = Math.ceil(totalLessonsCount / lessonsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewLessonData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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

  const createMaterialOnTheFly = async (e) => {
    e.preventDefault();
    setLoading(true);
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

      const { data: materialDataArray, error: insertError } = await supabase.from('materials').insert({
          title: newMaterialOnFlyData.title,
          description: newMaterialOnFlyData.description,
          content_type: newMaterialOnFlyData.content_type,
          content_url: finalContentUrl,
          content_text: newMaterialOnFlyData.content_text,
      }).select('id');

      if (insertError) throw insertError;
      if (!materialDataArray || materialDataArray.length === 0) {
        throw new Error("Material creation returned no data.");
      }

      // alert('New material successfully created!'); // Dihapus alert sukses
      fetchMaterialsList();
      setShowNewMaterialOnFlyForm(false);
      setNewMaterialOnFlyData({
          title: '', description: '', content_type: 'text', content_url: '', content_text: '', file: null
      });
      
      return materialDataArray[0].id;
    } catch (err) {
      setError('Failed to create new material: ' + err.message);
      alert('Failed to create new material: ' + err.message);
      return null;
    } finally {
        setLoading(false);
    }
  };

  const handleAddAssociatedMaterial = (newlyCreatedMaterialId = null) => {
    const materialIdToAdd = newlyCreatedMaterialId || (materialsList.length > 0 ? materialsList[0].id : null);

    if (!materialIdToAdd) {
        setError('No material selected or created to associate. Please create one or ensure materials list is not empty.');
        alert('No material selected or created to associate. Please create one or ensure materials list is not empty.');
        return;
    }

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

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: lessonData, error: insertLessonError } = await supabase.from('lessons').insert({
        title: newLessonData.title,
        module_id: newLessonData.module_id,
        pdf_url: newLessonData.pdf_url,
        order_in_module: newLessonData.order_in_module,
      }).select('id').single();

      if (insertLessonError) throw insertLessonError;

      const newLessonId = lessonData.id;

      if (newLessonData.associated_materials.length > 0) {
        const lessonMaterialsToInsert = newLessonData.associated_materials.map(item => ({
          lesson_id: newLessonId,
          material_id: item.material_id,
          order_in_lesson: item.order_in_lesson
        }));
        const { error: insertAssociatedError } = await supabase.from('lesson_materials').insert(lessonMaterialsToInsert);
        if (insertAssociatedError) throw insertAssociatedError;
      }

      alert('Lesson successfully added!');
      setShowAddLessonForm(false);
      setNewLessonData({
        title: '',
        module_id: '',
        pdf_url: '',
        associated_materials: [],
        order_in_module: 0,
      });
      fetchLessons();
    } catch (err) {
      setError('Failed to add lesson: ' + err.message);
      alert('Failed to add lesson: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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

      const currentAssociatedMaterials = lessonToEdit.lesson_materials.map(lm => ({
        material_id: lm.material_id,
        order_in_lesson: lm.order_in_lesson
      }));

      const newAssociatedMaterials = newLessonData.associated_materials;

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

      alert('Lesson successfully updated!');
      closeEditModal();
      fetchLessons();
    } catch (err) {
      setError('Failed to update lesson: ' + err.message);
      alert('Failed to update lesson: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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

      alert('Lesson successfully deleted!');
      closeDeleteConfirm();
      fetchLessons();
    } catch (err) {
      setError('Failed to delete lesson: ' + err.message);
      alert('Failed to delete lesson: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'image': return <PhotoIcon className="h-5 w-5" />;
      case 'video_url': return <PlayCircleIcon className="h-5 w-5" />;
      case 'text': return <DocumentTextIcon className="h-5 w-5" />;
      case 'script': return <CodeBracketIcon className="h-5 w-5" />;
      case 'pdf': return <DocumentIcon className="h-5 w-5" />;
      default: return <BookOpenIcon className="h-5 w-5" />;
    }
  };

  if (loading && lessons.length === 0 && modules.length === 0 && materialsList.length === 0) {
    return (
      <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700 dark:text-dark-text-medium" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading lesson data...
      </div>
    );
  }

  if (error && (lessons.length === 0 || !loading) && (modules.length === 0 || !loading) && (materialsList.length === 0 || !loading)) {
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
    <div className="flex-grow h-[95vh] scrollbar-hide overflow-y-auto rounded-xl p-6 bg-[#F9F9FB] dark:bg-admin-dark-secondary">
      <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-6 dark:text-dark-text-light">Manage Lessons</h1>

      <div className="bg-white p-4 mb-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 items-center dark:bg-admin-dark-tertiary">
        <div className="relative">
          <input
            type="text"
            placeholder="Search lessons by title or PDF URL"
            className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-admin-accent-green"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-dark-text-dark" />
        </div>

        <div className="relative flex space-x-4">
          <div className='relative flex-grow'>
            <select
              className="w-full py-2 pl-4 pr-10 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 cursor-pointer appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-admin-accent-green"
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
            <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none dark:text-dark-text-dark" />
          </div>
          <button
            onClick={() => setShowAddLessonForm(!showAddLessonForm)}
            className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center min-w-[40px] h-[40px] dark:bg-admin-accent-green dark:hover:bg-green-700"
            title={showAddLessonForm ? "Hide Add Lesson Form" : "Add New Lesson"}
          >
            {showAddLessonForm ? <XMarkIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {showAddLessonForm && (
        <div className="bg-white p-6 mb-6 rounded-xl shadow-md dark:bg-admin-dark-tertiary">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text-light">Add New Lesson</h2>
          <form onSubmit={handleCreateLesson}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-title">Title</label>
              <input
                type="text"
                id="add-title"
                name="title"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                value={newLessonData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-module_id">Module</label>
              <select
                id="add-module_id"
                name="module_id"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
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

            <div className="mb-4 border p-3 rounded-md bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium">Associated Materials</label>
              {newLessonData.associated_materials.map((item, index) => {
                const material = materialsList.find(mat => mat.id === item.material_id);
                return (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <select
                      className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
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
                      className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-20 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                      placeholder="Order"
                      value={item.order_in_lesson}
                      onChange={(e) => handleUpdateAssociatedMaterial(index, 'order_in_lesson', parseInt(e.target.value) || 0)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAssociatedMaterial(index)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={handleAddAssociatedMaterial}
                className="mt-2 bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded dark:bg-admin-accent-green dark:hover:bg-green-700"
              >
                Add Existing Material
              </button>
              {/* Button to show "Create New Material" form */}
              <button
                type="button"
                onClick={() => setShowNewMaterialOnFlyForm(true)}
                className="mt-2 ml-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-1 px-3 rounded flex items-center dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <FolderPlusIcon className="h-4 w-4 mr-1" /> Create New Material
              </button>
            </div>

            {/* New Material On The Fly Form */}
            {showNewMaterialOnFlyForm && (
                <div className="mb-4 p-4 border rounded-md bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text-light">Create New Material On The Fly</h3>
                    <form onSubmit={createMaterialOnTheFly}>
                        <div className="mb-2">
                            <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-dark-text-medium" htmlFor="new-mat-title">Title</label>
                            <input type="text" id="new-mat-title" name="title" value={newMaterialOnFlyData.title} onChange={handleMaterialOnFlyInputChange} required
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text-light" />
                        </div>
                        <div className="mb-2">
                            <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-dark-text-medium" htmlFor="new-mat-desc">Description</label>
                            <textarea id="new-mat-desc" name="description" value={newMaterialOnFlyData.description} onChange={handleMaterialOnFlyInputChange} rows="3"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text-light"></textarea>
                        </div>
                        <div className="mb-2">
                            <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-dark-text-medium" htmlFor="new-mat-type">Content Type</label>
                            <select id="new-mat-type" name="content_type" value={newMaterialOnFlyData.content_type} onChange={handleMaterialOnFlyInputChange} required
                                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text-light">
                                <option value="text">Text</option>
                                <option value="video_url">Video URL</option>
                                <option value="image">Image</option>
                                <option value="pdf">PDF</option>
                                <option value="script">Script</option>
                            </select>
                        </div>
                        {(newMaterialOnFlyData.content_type === 'video_url' || newMaterialOnFlyData.content_type === 'image' || newMaterialOnFlyData.content_type === 'pdf') && (
                            <div className="mb-2">
                                <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-dark-text-medium" htmlFor="new-mat-url">Content URL</label>
                                <input type="url" id="new-mat-url" name="content_url" value={newMaterialOnFlyData.content_url} onChange={handleMaterialOnFlyInputChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text-light" />
                            </div>
                        )}
                        {(newMaterialOnFlyData.content_type === 'text' || newMaterialOnFlyData.content_type === 'script') && (
                            <div className="mb-2">
                                <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-dark-text-medium" htmlFor="new-mat-text">Content Text/Script</label>
                                <textarea id="new-mat-text" name="content_text" value={newMaterialOnFlyData.content_text} onChange={handleMaterialOnFlyInputChange} rows="3"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text-light"></textarea>
                            </div>
                        )}
                        {(newMaterialOnFlyData.content_type === 'image' || newMaterialOnFlyData.content_type === 'pdf') && (
                            <div className="mb-2">
                                <label className="block text-gray-700 text-sm font-bold mb-1 dark:text-dark-text-medium" htmlFor="new-mat-file">Upload File</label>
                                <input type="file" id="new-mat-file" name="file" onChange={handleMaterialOnFlyFileChange}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-800 dark:border-gray-600 dark:text-dark-text-light" />
                            </div>
                        )}
                        <div className="flex justify-end space-x-2 mt-4">
                            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded dark:bg-admin-accent-green dark:hover:bg-green-700" disabled={loading}>
                                {loading ? 'Creating...' : 'Save Material'}
                            </button>
                            <button type="button" onClick={() => setShowNewMaterialOnFlyForm(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-dark-text-light" disabled={loading}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-pdf_url">PDF URL (Legacy / Supplemental)</label>
              <input
                type="url"
                id="add-pdf_url"
                name="pdf_url"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                value={newLessonData.pdf_url}
                onChange={handleInputChange}
              />
              <p className="text-xs text-gray-500 mt-1 dark:text-dark-text-dark">Optional: Provide a direct PDF URL if not using a material.</p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-order_in_module">Order in Module</label>
              <input
                type="number"
                id="add-order_in_module"
                name="order_in_module"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                value={newLessonData.order_in_module}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-admin-accent-green dark:hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Lesson'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddLessonForm(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-dark-text-light"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto dark:bg-admin-dark-tertiary">
        {loading && lessons.length > 0 && (
          <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-20 rounded-xl dark:bg-gray-900 dark:bg-opacity-75">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-admin-accent-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        )}
        {error && (lessons.length === 0 || !loading) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-700 dark:border-red-600 dark:text-dark-text-light" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {lessons.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-300 text-sm dark:divide-gray-700">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider dark:bg-gray-800 dark:text-dark-text-medium">
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
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-admin-dark-tertiary dark:divide-gray-700">
              {lessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold dark:text-dark-text-light">{lesson.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-dark-text-medium">{lesson.modules ? lesson.modules.title : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-dark-text-medium">{lesson.modules && lesson.modules.courses ? lesson.modules.courses.title : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-dark-text-medium">{lesson.order_in_module}</td>
                  <td className="px-6 py-4 text-gray-700 max-w-xs dark:text-dark-text-medium">
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
                  <td className="px-6 py-4 text-blue-600 hover:underline max-w-xs truncate dark:text-blue-400 dark:hover:text-blue-300">
                    {lesson.pdf_url ? <a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer">{lesson.pdf_url.split('/').pop()}</a> : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-dark-text-dark">
                    {new Date(lesson.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(lesson)}
                      className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      title="Edit Lesson"
                    >
                      <PencilSquareIcon className="h-5 w-5 inline mr-1" />Edit
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(lesson)}
                      className="text-red-600 hover:underline dark:text-red-500 dark:hover:text-red-400"
                      title="Delete Lesson"
                    >
                      <TrashIcon className="h-5 w-5 inline mr-1" />Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-dark-text-dark">No lessons found.</div>
        )}

        {totalLessonsCount > lessonsPerPage && (
          <nav className="flex items-center justify-center mt-6 space-x-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-l-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-dark-text-medium dark:hover:bg-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 inline" /> Prev
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`px-4 py-2 text-sm border ${
                    currentPage === i + 1
                      ? 'bg-purple-600 text-white border-purple-600 dark:bg-admin-accent-green dark:text-white dark:border-admin-accent-green'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-dark-text-medium dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-r-lg hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-dark-text-medium dark:hover:bg-gray-700"
            >
              Next <ArrowRightIcon className="h-4 w-4 inline" />
            </button>
          </nav>
        )}
      </div>

      {showEditModal && lessonToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative dark:bg-admin-dark-tertiary dark:text-dark-text-light">
            <button
              onClick={closeEditModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-dark-text-medium dark:hover:text-dark-text-light"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text-light">Edit Lesson</h2>
            <form onSubmit={handleUpdateLesson}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-title">Title</label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newLessonData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-module_id">Module</label>
                <select
                  id="edit-module_id"
                  name="module_id"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
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

              <div className="mb-4 border p-3 rounded-md bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium">Associated Materials</label>
                {newLessonData.associated_materials.map((item, index) => {
                  const material = materialsList.find(mat => mat.id === item.material_id);
                  return (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <select
                        className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
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
                        className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-20 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                        placeholder="Order"
                        value={item.order_in_lesson}
                        onChange={(e) => handleUpdateAssociatedMaterial(index, 'order_in_lesson', parseInt(e.target.value) || 0)}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveAssociatedMaterial(index)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={handleAddAssociatedMaterial}
                  className="mt-2 bg-green-500 hover:bg-green-600 text-white text-sm py-1 px-3 rounded dark:bg-admin-accent-green dark:hover:bg-green-700"
                >
                  Add Existing Material
                </button>
                <button
                  type="button"
                  onClick={async () => {
                      setLoading(true);
                      const newMaterialId = await createMaterialOnTheFly();
                      if (newMaterialId) {
                          handleAddAssociatedMaterial(newMaterialId);
                      }
                      setLoading(false);
                  }}
                  className="mt-2 ml-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm py-1 px-3 rounded flex items-center dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <FolderPlusIcon className="h-4 w-4 mr-1" /> Create New Material
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-pdf_url">PDF URL (Legacy / Supplemental)</label>
                <input
                  type="url"
                  id="edit-pdf_url"
                  name="pdf_url"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newLessonData.pdf_url}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-gray-500 mt-1 dark:text-dark-text-dark">Optional: Provide a direct PDF URL if not using a material.</p>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-order_in_module">Order in Module</label>
                <input
                  type="number"
                  id="edit-order_in_module"
                  name="order_in_module"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newLessonData.order_in_module}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-admin-accent-green dark:hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Lesson'}
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-dark-text-light"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirmationModal && lessonToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative dark:bg-admin-dark-tertiary dark:text-dark-text-light">
            <button
              onClick={closeDeleteConfirm}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-dark-text-medium dark:hover:text-dark-text-light"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text-light">Confirm Deletion</h2>
            <p className="mb-6 text-gray-700 dark:text-dark-text-medium">
              Are you sure you want to delete lesson "<span className="font-semibold">{lessonToDelete.title}</span>"?
              This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmDeleteLesson}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded dark:bg-red-700 dark:hover:bg-red-800"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-dark-text-light"
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