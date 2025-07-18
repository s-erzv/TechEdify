import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { AdminSidebarContext } from '../../components/AdminLayout'; // Menggunakan AdminSidebarContext
import { AuthContext } from '../../context/AuthContext'; // Tidak perlu signOut lagi di sini jika sudah di AdminLayout

import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  UserGroupIcon,
  Bars3Icon // Tambahkan Bars3Icon jika untuk tombol hamburger lokal (seharusnya tidak diperlukan lagi di sini)
} from '@heroicons/react/24/outline';


export default function AdminManageCourses() {

  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublished, setFilterPublished] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [coursesPerPage] = useState(10);
  const [totalCoursesCount, setTotalCoursesCount] = useState(0);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [courseToView, setCourseToView] = useState(null);


  const [newCourseData, setNewCourseData] = useState({
    title: '',
    description: '',
    instructor_id: '',
    is_published: false,
    file: null,
  });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('courses').select(`
          *,
          profiles (
              full_name
          )
      `, { count: 'exact' });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (filterPublished !== '') {
        query = query.eq('is_published', filterPublished === 'true');
      }

      const startIndex = (currentPage - 1) * coursesPerPage;
      const endIndex = startIndex + coursesPerPage - 1;
      query = query.range(startIndex, endIndex).order('created_at', { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setCourses(data || []);
      setTotalCoursesCount(count || 0);
      console.log("Fetched courses data:", data);
      console.log("Total count from Supabase:", count);
    } catch (err) {
      setError('Failed to load courses list: ' + err.message);
      setCourses([]);
      setTotalCoursesCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterPublished, currentPage, coursesPerPage]);

  const fetchInstructors = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('id, full_name, role').in('role', ['admin', 'instructor']);
      if (error) throw error;
      setInstructors(data || []);
    } catch (err) {
      console.error("Error fetching instructors for dropdown:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
    fetchCourses();
  }, [fetchInstructors, fetchCourses]);

  const totalPages = Math.ceil(totalCoursesCount / coursesPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewCourseData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setNewCourseData(prev => ({ ...prev, file: e.target.files[0] }));
  };

  const openAddModal = () => {
    setNewCourseData({
      title: '',
      description: '',
      thumbnail_url: '',
      instructor_id: instructors.length > 0 ? instructors[0].id : '',
      is_published: false,
      file: null,
    });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalThumbnailUrl = '';

      if (newCourseData.file) {
        const fileExtension = newCourseData.file.name.split('.').pop();
        const filePath = `course_thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, newCourseData.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        
        const { data: publicURLData } = supabase.storage
          .from('materials')
          .getPublicUrl(filePath);

        finalThumbnailUrl = publicURLData.publicUrl;
      }

      const { error: insertError } = await supabase.from('courses').insert({
        title: newCourseData.title,
        description: newCourseData.description,
        thumbnail_url: finalThumbnailUrl,
        instructor_id: newCourseData.instructor_id,
        is_published: newCourseData.is_published,
      });

      if (insertError) throw insertError;

      alert('Course successfully added!');
      closeAddModal();
      fetchCourses();
    } catch (err) {
      setError('Failed to add course: ' + err.message);
      alert('Failed to add course: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (course) => {
    setCourseToEdit(course);
    setNewCourseData({
      title: course.title,
      description: course.description,
      thumbnail_url: course.thumbnail_url || '',
      instructor_id: course.instructor_id || '',
      is_published: course.is_published,
      file: null,
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCourseToEdit(null);
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!courseToEdit) return;

    try {
      let finalThumbnailUrl = newCourseData.thumbnail_url;
      let oldFilePath = null;

      if (newCourseData.file) {
        const fileExtension = newCourseData.file.name.split('.').pop();
        const filePath = `course_thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, newCourseData.file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from('materials')
          .getPublicUrl(filePath);

        finalThumbnailUrl = publicURLData.publicUrl;

        if (courseToEdit.thumbnail_url &&
            courseToEdit.thumbnail_url.includes(supabase.storage.from('materials').getPublicUrl('').publicUrl.split('?')[0])
        ) {
          oldFilePath = courseToEdit.thumbnail_url.split('course_thumbnails/').pop();
        }
      }

      const { error: updateError } = await supabase
        .from('courses')
        .update({
          title: newCourseData.title,
          description: newCourseData.description,
          thumbnail_url: finalThumbnailUrl,
          instructor_id: newCourseData.instructor_id,
          is_published: newCourseData.is_published,
        })
        .eq('id', courseToEdit.id);

      if (updateError) throw updateError;

      if (oldFilePath) {
        const { error: deleteOldError } = await supabase.storage
          .from('materials')
          .remove([`course_thumbnails/${oldFilePath}`]);

        if (deleteOldError) console.error("Error deleting old thumbnail file:", deleteOldError.message);
      }

      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.id === courseToEdit.id
            ? { ...course,
                title: newCourseData.title,
                description: newCourseData.description,
                thumbnail_url: finalThumbnailUrl,
                instructor_id: newCourseData.instructor_id,
                is_published: newCourseData.is_published,
                profiles: instructors.find(i => i.id === newCourseData.instructor_id) || course.profiles
              }
            : course
        )
      );

      alert('Course successfully updated!');
      closeEditModal();
    } catch (err) {
      setError('Failed to update course: ' + err.message);
      alert('Failed to update course: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirm = (course) => {
    setCourseToDelete(course);
    setShowDeleteConfirmationModal(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirmationModal(false);
    setCourseToDelete(null);
  };

  const confirmDeleteCourse = async () => {
    setLoading(true);
    setError(null);

    if (!courseToDelete) return;

    try {
      if (courseToDelete.thumbnail_url &&
          courseToDelete.thumbnail_url.includes(supabase.storage.from('materials').getPublicUrl('').publicUrl.split('?')[0])
      ) {
        const filePathToDelete = courseToDelete.thumbnail_url.split('course_thumbnails/').pop();
        if (filePathToDelete) {
          const { error: storageDeleteError } = await supabase.storage
            .from('materials')
            .remove([`course_thumbnails/${filePathToDelete}`]);

          if (storageDeleteError) console.error("Error deleting old thumbnail file from storage:", storageDeleteError.message);
        }
      }

      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete.id);

      if (deleteError) throw deleteError;

      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseToDelete.id));
      setTotalCoursesCount(prevCount => prevCount - 1);

      alert('Course successfully deleted!');
      closeDeleteConfirm();
    } catch (err) {
      setError('Failed to delete course: ' + err.message);
      alert('Failed to delete course: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetailsForView = useCallback(async (courseId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('courses').select(`
          *,
          profiles (full_name, email),
          modules (
            *,
            lessons (
              *,
              lesson_materials (
                order_in_lesson,
                materials (id, title, content_type, content_url, content_text)
              )
            )
          )
        `).eq('id', courseId).single();

      if (error) throw error;

       const sortedModulesWithLessons = data.modules ? data.modules.sort((a, b) => a.order_in_course - b.order_in_course)
         .map(module => {
             const sortedLessons = module.lessons ? module.lessons.sort((a, b) => a.order_in_module - b.order_in_module) : [];
             const lessonsWithSortedMaterials = sortedLessons.map(lesson => ({
                 ...lesson,
                 lesson_materials: lesson.lesson_materials ? lesson.lesson_materials.sort((a, b) => a.order_in_lesson - b.order_in_lesson) : []
             }));
             return { ...module, lessons: lessonsWithSortedMaterials };
         }) : [];


      setCourseToView({ ...data, modules: sortedModulesWithLessons });
      setShowViewModal(true);
    } catch (err) {
      console.error('Error fetching course details for view:', err.message);
      setError('Failed to load course details: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const openViewModal = (course) => {
    fetchCourseDetailsForView(course.id);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setCourseToView(null);
    setError(null);
  };

  return (
    <div className="flex-grow h-[95vh] scrollbar-hide overflow-y-auto rounded-xl p-6 bg-[#F9F9FB] dark:bg-admin-dark-secondary">
      {/* HEADER UMUM UNTUK HALAMAN ADMIN */}
      {/* Header ini sekarang diambil dari AdminLayout.jsx */}
      <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-6 dark:text-dark-text-light">Manage Courses</h1>

      <div className="bg-white p-4 mb-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 items-center dark:bg-admin-dark-tertiary">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search courses by title or description"
            className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-admin-accent-green"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 dark:text-dark-text-dark" />
        </div>

        <div className="relative flex flex-col sm:flex-row gap-4 sm:gap-2 justify-end">
          <div className="relative flex-grow sm:flex-grow-0">
            <select
              className="w-full sm:w-auto py-2 pl-4 pr-10 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 cursor-pointer appearance-none dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-admin-accent-green"
              value={filterPublished}
              onChange={(e) => {
                setFilterPublished(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
            </select>
            <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none dark:text-dark-text-dark" />
          </div>

          <button
            onClick={openAddModal}
            className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center min-w-[40px] h-[40px] px-4 sm:px-5 dark:bg-admin-accent-green dark:hover:bg-green-700"
            title="Add New Course"
          >
            <PlusIcon className="h-5 w-5 mr-0 sm:mr-2" /> <span className="hidden sm:inline">Add Course</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md relative overflow-x-auto dark:bg-admin-dark-tertiary">
        {loading && courses.length > 0 && (
          <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-20 rounded-xl dark:bg-gray-900 dark:bg-opacity-75">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-admin-accent-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        )}
        {error && courses.length === 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-700 dark:border-red-600 dark:text-dark-text-light" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {courses.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-300 text-sm dark:divide-gray-700">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider dark:bg-gray-800 dark:text-dark-text-medium">
              <tr>
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Description</th>
                <th className="px-6 py-3 text-left">Instructor</th>
                <th className="px-6 py-3 text-left">Thumbnail</th>
                <th className="px-6 py-3 text-left">Published</th>
                <th className="px-6 py-3 text-left">Created At</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-admin-dark-tertiary dark:divide-gray-700">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold dark:text-dark-text-light">{course.title}</td>
                  <td className="px-6 py-4 text-gray-700 max-w-xs truncate dark:text-dark-text-medium">{course.description || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-dark-text-medium">{course.profiles ? course.profiles.full_name : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt="Thumbnail" className="h-10 w-10 object-cover rounded-md" />
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        course.is_published ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                    }`}>
                      {course.is_published ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-dark-text-dark">
                    {new Date(course.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openViewModal(course)}
                      className="text-indigo-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      title="View Details"
                    >
                      <EyeIcon className="h-5 w-5 inline mr-1" />View
                    </button>
                    <button
                      onClick={() => openEditModal(course)}
                      className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                      title="Edit Course"
                    >
                      <PencilSquareIcon className="h-5 w-5 inline mr-1" />Edit
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(course)}
                      className="text-red-600 hover:underline dark:text-red-500 dark:hover:text-red-400"
                      title="Delete Course"
                    >
                      <TrashIcon className="h-5 w-5 inline mr-1" />Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-dark-text-dark">No courses found.</div>
        )}

        {totalCoursesCount > coursesPerPage && (
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

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative dark:bg-admin-dark-tertiary dark:text-dark-text-light">
            <button onClick={closeAddModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-dark-text-medium dark:hover:text-dark-text-light">
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text-light">Add New Course</h2>
            <form onSubmit={handleCreateCourse}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-title">Title</label>
                <input
                  type="text"
                  id="add-title"
                  name="title"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newCourseData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-description">Description</label>
                <textarea
                  id="add-description"
                  name="description"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newCourseData.description}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-file">Thumbnail Image</label>
                <input
                  type="file"
                  id="add-file"
                  name="file"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  onChange={handleFileChange}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-instructor_id">Instructor</label>
                <select
                  id="add-instructor_id"
                  name="instructor_id"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newCourseData.instructor_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select an Instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>{instructor.full_name || instructor.email}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-is_published">
                  <input
                    type="checkbox"
                    id="add-is_published"
                    name="is_published"
                    className="mr-2 leading-tight"
                    checked={newCourseData.is_published}
                    onChange={handleInputChange}
                  />
                  <span className="text-sm">Is Published</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-admin-accent-green dark:hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add Course'}
                </button>
                <button
                  type="button"
                  onClick={closeAddModal}
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

      {showEditModal && courseToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative dark:bg-admin-dark-tertiary dark:text-dark-text-light">
            <button onClick={closeEditModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-dark-text-medium dark:hover:text-dark-text-light">
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text-light">Edit Course</h2>
            <form onSubmit={handleUpdateCourse}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-title">Title</label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newCourseData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-description">Description</label>
                <textarea
                  id="edit-description"
                  name="description"
                  rows="3"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newCourseData.description}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-file">Thumbnail Image</label>
                {courseToEdit.thumbnail_url && (
                    <div className="mb-2">
                        <img src={courseToEdit.thumbnail_url} alt="Current Thumbnail" className="h-20 w-20 object-cover rounded-md" />
                        <p className="text-xs text-gray-500 mt-1 dark:text-dark-text-dark">Current: <a href={courseToEdit.thumbnail_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline dark:text-blue-400 dark:hover:underline">{courseToEdit.thumbnail_url.split('/').pop()}</a></p>
                    </div>
                )}
                <input
                  type="file"
                  id="edit-file"
                  name="file"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-gray-500 mt-1 dark:text-dark-text-dark">Leave blank to keep current thumbnail. Upload new image to replace.</p>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-instructor_id">Instructor</label>
                <select
                  id="edit-instructor_id"
                  name="instructor_id"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newCourseData.instructor_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select an Instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>{instructor.full_name || instructor.email}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-is_published">
                  <input
                    type="checkbox"
                    id="edit-is_published"
                    name="is_published"
                    className="mr-2 leading-tight"
                    checked={newCourseData.is_published}
                    onChange={handleInputChange}
                  />
                  <span className="text-sm">Is Published</span>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-admin-accent-green dark:hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Course'}
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

      {showDeleteConfirmationModal && courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm relative text-center dark:bg-admin-dark-tertiary dark:text-dark-text-light">
            <button onClick={closeDeleteConfirm} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-dark-text-medium dark:hover:text-dark-text-light">
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text-light">Confirm Deletion</h2>
            <p className="mb-6 text-gray-700 dark:text-dark-text-medium">
              Are you sure you want to delete course "<span className="font-semibold">{courseToDelete.title}</span>"?
              This action cannot be undone. This will also delete modules, lessons, and quizzes connected to this course.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmDeleteCourse}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-red-700 dark:hover:bg-red-800"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-dark-text-light"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && courseToView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl relative max-h-[95vh] overflow-y-auto dark:bg-admin-dark-tertiary dark:text-dark-text-light">
            <button onClick={closeViewModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-dark-text-medium dark:hover:text-dark-text-light">
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-dark-text-light">{courseToView.title}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-dark-text-light">Course Details</h3>
                <p className="text-gray-700 mb-2 dark:text-dark-text-medium"><strong>Description:</strong> {courseToView.description || 'No description available.'}</p>
                <p className="text-gray-700 mb-2 dark:text-dark-text-medium"><strong>Instructor:</strong> {courseToView.profiles ? courseToView.profiles.full_name : 'N/A'}</p>
                <p className="text-gray-700 mb-2 dark:text-dark-text-medium"><strong>Published:</strong> {courseToView.is_published ? 'Yes' : 'No'}</p>
                <p className="text-gray-700 mb-2 dark:text-dark-text-medium"><strong>Created At:</strong> {new Date(courseToView.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                {courseToView.thumbnail_url && (
                    <div className="mt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-1 dark:text-dark-text-light">Thumbnail:</h4>
                        <img src={courseToView.thumbnail_url} alt="Course Thumbnail" className="max-w-xs h-auto rounded-lg shadow-sm" />
                    </div>
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 dark:text-dark-text-light">Modules</h3>
                {courseToView.modules && courseToView.modules.length > 0 ? (
                    <div className="space-y-4">
                        {courseToView.modules.map(module => (
                            <div key={module.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                                <h4 className="text-lg font-semibold text-gray-800 dark:text-dark-text-light">{module.title} (Order: {module.order_in_course})</h4>
                                <p className="text-sm text-gray-600 mb-2 dark:text-dark-text-medium">{module.description || 'No description available.'}</p>
                                <p className="text-sm text-gray-600 dark:text-dark-text-medium">Status: {module.is_active ? 'Active' : 'Inactive'}</p>
                                
                                {module.lessons && module.lessons.length > 0 && (
                                    <div className="mt-3 ml-2 border-l pl-3 dark:border-gray-700">
                                        <h5 className="text-base font-semibold text-gray-700 mb-2 dark:text-dark-text-medium">Lessons:</h5>
                                        <ul className="space-y-2">
                                            {module.lessons.map(lesson => (
                                                <li key={lesson.id} className="bg-white p-3 rounded-md shadow-sm dark:bg-gray-700 dark:shadow-none">
                                                    <p className="font-medium text-gray-800 dark:text-dark-text-light">{lesson.title} (Order: {lesson.order_in_module})</p>
                                                    {lesson.pdf_url && <p className="text-xs text-blue-600 truncate dark:text-blue-400"><a href={lesson.pdf_url} target="_blank" rel="noopener noreferrer">PDF: {lesson.pdf_url.split('/').pop()}</a></p>}
                                                    
                                                    {lesson.lesson_materials && lesson.lesson_materials.length > 0 && (
                                                        <div className="mt-2 text-xs">
                                                            <h6 className="font-semibold text-gray-700 mb-1 dark:text-dark-text-medium">Materials:</h6>
                                                            <ul className="list-disc list-inside text-gray-600 dark:text-dark-text-dark">
                                                                {lesson.lesson_materials.map(lm => (
                                                                    <li key={lm.material_id}>
                                                                        {lm.materials ? (
                                                                            <span>{lm.materials.title} ({lm.materials.content_type.replace('_', ' ')})</span>
                                                                        ) : (
                                                                            'Unknown Material'
                                                                        )}
                                                                        {lm.order_in_lesson ? ` (Order: ${lm.order_in_lesson})` : ''}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600 italic dark:text-dark-text-medium">No modules found for this course.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    onClick={closeViewModal}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-dark-text-light"
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