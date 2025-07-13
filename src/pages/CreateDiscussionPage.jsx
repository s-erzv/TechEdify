import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { SidebarContext } from '../components/mainLayout'; // Import SidebarContext
import { ArrowLeftIcon, PlusCircleIcon, Bars3Icon } from '@heroicons/react/24/outline'; // Import Bars3Icon

export default function CreateDiscussionPage() {
  const { user } = useContext(AuthContext);
  const { toggleSidebar } = useContext(SidebarContext); // Dapatkan toggleSidebar dari Context
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [successMessage, setSuccessMessage] = useState(''); // Dihapus

  useEffect(() => {
    const fetchCoursesAndModules = async () => {
      setError(null);
      try {
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, title');
        if (coursesError) throw coursesError;
        setCourses(coursesData);

        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('id, title, course_id');
        if (modulesError) throw modulesError;
        setModules(modulesData);

      } catch (err) {
        console.error('Error fetching courses/modules:', err.message);
        setError('Failed to load course/module list: ' + err.message);
      }
    };

    fetchCoursesAndModules();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // setSuccessMessage(''); // Dihapus

    if (!user) {
      setError('You must be logged in to create a discussion.');
      setLoading(false);
      return;
    }

    if (!title.trim() || !content.trim()) {
      setError('Discussion Title and Content cannot be empty.');
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
          course_id: selectedCourse || null,
          module_id: selectedModule || null,
        })
        .select();

      if (insertError) throw insertError;

      // setSuccessMessage('Discussion created successfully!'); // Dihapus
      setTitle('');
      setContent('');
      setSelectedCourse('');
      setSelectedModule('');

      setTimeout(() => {
        navigate(`/discussions/${data[0].id}`);
      }, 500); // Mengurangi timeout sedikit untuk navigasi yang lebih cepat

    } catch (err) {
      console.error('Error creating discussion:', err.message);
      setError('Failed to create discussion: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = selectedCourse
    ? modules.filter(module => module.course_id === selectedCourse)
    : modules;

  return (
    <div className="flex-grow p-4 sm:p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)] dark:bg-dark-bg-secondary">
      <header className="mb-6 p-2 sm:p-4 bg-white rounded-xl shadow-sm flex items-center dark:bg-dark-bg-tertiary">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
          aria-label="Toggle sidebar"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <button onClick={() => navigate('/discussions')} className="mr-4 text-gray-700 hover:text-gray-900 dark:text-dark-text-medium dark:hover:text-dark-text-light">
          <ArrowLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center dark:text-dark-text-light">
          <PlusCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-purple-600 dark:text-dark-accent-purple" /> Create New Discussion
        </h1>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-md dark:bg-dark-bg-tertiary">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-700 dark:border-red-600 dark:text-dark-text-light" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          {/* {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative dark:bg-green-700 dark:border-green-600 dark:text-dark-text-light" role="alert">
              <strong className="font-bold">Success!</strong>
              <span className="block sm:inline"> {successMessage}</span>
            </div>
          )} */}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2 dark:text-dark-text-medium">Discussion Title</label>
            <input
              type="text"
              id="title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-dark-accent-purple"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your discussion title"
              required
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2 dark:text-dark-text-medium">Discussion Content</label>
            <textarea
              id="content"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-y min-h-[150px] dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-dark-accent-purple"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your discussion content here..."
              rows="6"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2 dark:text-dark-text-medium">Select Course (Optional)</label>
              <select
                id="course"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-dark-accent-purple"
                value={selectedCourse}
                onChange={(e) => {
                  setSelectedCourse(e.target.value);
                  setSelectedModule('');
                }}
              >
                <option value="">-- Select Course --</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="module" className="block text-sm font-medium text-gray-700 mb-2 dark:text-dark-text-medium">Select Module (Optional)</label>
              <select
                id="module"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-dark-accent-purple"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                disabled={!selectedCourse}
              >
                <option value="">-- Select Module --</option>
                {filteredModules.map(module => (
                  <option key={module.id} value={module.id}>{module.title}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !title.trim() || !content.trim()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full dark:bg-dark-accent-purple dark:hover:bg-purple-800"
          >
            {loading ? 'Creating Discussion...' : (
              <>
                <PlusCircleIcon className="h-5 w-5 mr-2" /> Create Discussion
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}