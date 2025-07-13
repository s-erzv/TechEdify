import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { SidebarContext } from '../components/mainLayout'; // Import SidebarContext
import { BookOpenIcon, MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline'; // Import Bars3Icon

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { toggleSidebar } = useContext(SidebarContext); // Dapatkan toggleSidebar dari Context

  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('quizzes')
          .select('id, title, description, created_at, quiz_questions(count)');

        if (error) throw error;
        if (!data) throw new Error("No quizzes found.");

        const quizzesWithQuestionCount = data.map(quiz => ({
          ...quiz,
          question_count: quiz.quiz_questions[0]?.count || 0
        }));

        setQuizzes(quizzesWithQuestionCount);
        console.log("Fetched quizzes:", quizzesWithQuestionCount);
      } catch (err) {
        console.error('Error fetching quizzes:', err.message);
        setError('Failed to load quiz list: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleStartQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (quiz.description && quiz.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        Loading quiz list...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-grow flex justify-center items-center text-red-600 text-xl dark:text-red-400">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="flex-grow p-4 sm:p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)] dark:bg-dark-bg-secondary">
      <header className="mb-6 p-2 sm:p-4 bg-white rounded-xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between dark:bg-dark-bg-tertiary">
        <div className="flex items-center mb-4 md:mb-0">
          <button onClick={toggleSidebar} className="md:hidden p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2" aria-label="Toggle sidebar">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center dark:text-dark-text-light">
            <BookOpenIcon className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-purple-600 dark:text-dark-accent-purple" /> Quizzes List
          </h1>
        </div>
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search quizzes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-dark-accent-purple"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-text-dark" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.length > 0 ? (
          filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 flex flex-col dark:bg-dark-bg-tertiary dark:border-gray-700"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-2 dark:text-dark-text-light">{quiz.title}</h2>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow dark:text-dark-text-medium">{quiz.description || "No description available."}</p>
              <div className="text-sm text-gray-500 mb-4 dark:text-dark-text-dark">
                Number of Questions: <span className="font-medium text-gray-700 dark:text-dark-text-light">{quiz.question_count}</span>
              </div>
              <button
                onClick={() => handleStartQuiz(quiz.id)}
                className="mt-auto px-5 py-2 bg-purple-600 text-white rounded-md font-semibold hover:bg-purple-700 transition-colors self-start dark:bg-dark-accent-purple dark:hover:bg-purple-800"
              >
                Start Quiz
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center text-gray-600 text-lg py-10 dark:text-dark-text-medium">
            {searchQuery ? "No quizzes match your search." : "No quizzes available yet."}
          </div>
        )}
      </div>
    </div>
  );
}