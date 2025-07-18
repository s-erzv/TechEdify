import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import { supabase } from '../../lib/supabaseClient';
import { AdminSidebarContext } from '../../components/AdminLayout';
import { AuthContext } from '../../context/AuthContext';

import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BellIcon,
  PlusIcon,
  XMarkIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';


export default function AdminManageUsers() {
  const { signOut, user, profile } = useContext(AuthContext);
  const { toggleSidebar } = useContext(AdminSidebarContext);
  const navigate = useNavigate(); // Dapatkan fungsi navigate

  console.log("AdminManageUsers: signOut from AuthContext:", signOut); // Debugging: Periksa nilai signOut

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    username: '',
    role: 'student',
  });

  const adminUserName = profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'Admin';
  const adminAvatarUrl = profile?.avatar_url || '/default-admin-avatar.jpg';


  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      if (searchTerm) {
        query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
      }

      if (filterRole) {
        query = query.eq('role', filterRole);
      }

      const startIndex = (currentPage - 1) * usersPerPage;
      const endIndex = startIndex + usersPerPage - 1;
      query = query.range(startIndex, endIndex).order('created_at', { ascending: false });

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setUsers(data || []);
      setTotalUsersCount(count || 0);
      console.log("Fetched users data:", data);
      console.log("Total count from Supabase:", count);
    } catch (err) {
      setError('Failed to load user list: ' + err.message);
      setUsers([]);
      setTotalUsersCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filterRole, currentPage, usersPerPage]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(totalUsersCount / usersPerPage);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openAddModal = () => {
    setNewUserData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      username: '',
      role: 'student',
    });
    setShowAddUserModal(true);
  };

  const closeAddModal = () => {
    setShowAddUserModal(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUserData.email,
        password: newUserData.password,
        email_confirm: true,
        user_metadata: {
          first_name: newUserData.first_name,
          last_name: newUserData.last_name,
          username: newUserData.username,
        },
      });

      if (authError) throw authError;

      alert('User successfully added!');
      closeAddModal();
      fetchUsers();
    } catch (err) {
      setError('Failed to add user: ' + err.message);
      alert('Failed to add user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const openEditModal = (user) => {
    setUserToEdit(user);
    setNewUserData({
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      role: user.role,
      password: '',
    });
    setShowEditUserModal(true);
  };

  const closeEditModal = () => {
    setShowEditUserModal(false);
    setUserToEdit(null);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!userToEdit) return;

    const updatedFullName = `${newUserData.first_name || ''} ${newUserData.last_name || ''}`.trim();

    try {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          first_name: newUserData.first_name,
          last_name: newUserData.last_name,
          username: newUserData.username,
          role: newUserData.role,
          full_name: updatedFullName
        })
        .eq('id', userToEdit.id);

      if (profileUpdateError) throw profileUpdateError;

      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userToEdit.id
            ? {
                ...user,
                first_name: newUserData.first_name,
                last_name: newUserData.last_name,
                username: newUserData.username,
                role: newUserData.role,
                full_name: updatedFullName
              }
            : user
        )
      );

      alert('User successfully updated!');
      closeEditModal();
    } catch (err) {
      setError('Failed to update user: ' + err.message);
      alert('Failed to update user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const openDeleteConfirm = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirmationModal(true);
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirmationModal(false);
    setUserToDelete(null);
  };

  const confirmDeleteUser = async () => {
    setLoading(true);
    setError(null);

    if (!userToDelete) return;

    try {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userToDelete.id);

      if (deleteError) throw deleteError;

      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
      setTotalUsersCount(prevCount => prevCount - 1);

      alert('User successfully deleted!');
      closeDeleteConfirm();
    } catch (err) {
      setError('Failed to delete user: ' + err.message);
      alert('Failed to delete user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi handleLogout baru
  const handleLogout = async () => {
    if (signOut) { // Pastikan signOut tidak undefined
      const { error } = await signOut();
      if (error) {
        console.error("Logout failed:", error.message);
        alert("Logout failed: " + error.message);
      } else {
        console.log("Logout successful.");
        navigate('/auth'); // Arahkan ke halaman login setelah logout
      }
    } else {
      console.error("signOut function is not available.");
      alert("Logout function not available.");
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700 dark:text-dark-text-medium" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading user list...
      </div>
    );
  }

  if (error && users.length === 0) {
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
      

      <div className="bg-white p-4 mb-6 rounded-xl shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 items-center dark:bg-admin-dark-tertiary">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search users by name, email, or username"
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
              value={filterRole}
              onChange={(e) => {
                setFilterRole(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Roles</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
            <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none dark:text-dark-text-dark" />
          </div>

          <button
            onClick={openAddModal}
            className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center min-w-[40px] h-[40px] px-4 sm:px-5 dark:bg-admin-accent-green dark:hover:bg-green-700"
            title="Add New User"
          >
            <PlusIcon className="h-5 w-5 mr-0 sm:mr-2" /> <span className="hidden sm:inline">Add User</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md relative overflow-x-auto dark:bg-admin-dark-tertiary">
        {loading && users.length > 0 && (
          <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75 z-20 rounded-xl dark:bg-gray-900 dark:bg-opacity-75">
            <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-admin-accent-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        )}
        {error && users.length === 0 && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-700 dark:border-red-600 dark:text-dark-text-light" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {users.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-300 text-sm dark:divide-gray-700">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wider dark:bg-gray-800 dark:text-dark-text-medium">
              <tr>
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Role</th>
                <th className="px-6 py-3 text-left">Registered</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-admin-dark-tertiary dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-3">
                    <img
                      className="h-10 w-10 rounded-full object-cover border-2 border-purple-300 dark:border-admin-accent-green"
                      src={user.avatar_url || '/default-user-avatar.jpg'}
                      alt={user.first_name || 'User'}
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-800 capitalize dark:text-dark-text-light">
                        {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-dark-text-dark">{user.username || 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 dark:text-dark-text-medium">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100' : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 dark:text-dark-text-dark">
                    {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(user)}
                      className="text-red-600 hover:underline dark:text-red-500 dark:hover:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-10 text-gray-500 dark:text-dark-text-dark">No users found.</div>
        )}

        {totalUsersCount > usersPerPage && (
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

      {/* --- Modals for CRUD operations --- */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative dark:bg-admin-dark-tertiary dark:text-dark-text-light">
            <button onClick={closeAddModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-dark-text-medium dark:hover:text-dark-text-light">
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text-light">Add New User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-email">Email</label>
                <input
                  type="email"
                  id="add-email"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-password">Password</label>
                <input
                  type="password"
                  id="add-password"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-first_name">First Name</label>
                <input
                  type="text"
                  id="add-first_name"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newUserData.first_name}
                  onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-last_name">Last Name</label>
                <input
                  type="text"
                  id="add-last_name"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newUserData.last_name}
                  onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-username">Username</label>
                <input
                  type="text"
                  id="add-username"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="add-role">Role</label>
                <select
                  id="add-role"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-admin-accent-green dark:hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add User'}
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

      {showEditUserModal && userToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative dark:bg-admin-dark-tertiary dark:text-dark-text-light">
            <button onClick={closeEditModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-dark-text-medium dark:hover:text-dark-text-light">
              <XMarkIcon className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-dark-text-light">Edit User</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-email">Email</label>
                <input
                  type="email"
                  id="edit-email"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-dark"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  disabled
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-first_name">First Name</label>
                <input
                  type="text"
                  id="edit-first_name"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newUserData.first_name}
                  onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-last_name">Last Name</label>
                <input
                  type="text"
                  id="edit-last_name"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newUserData.last_name}
                  onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-username">Username</label>
                <input
                  type="text"
                  id="edit-username"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newUserData.username}
                  onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2 dark:text-dark-text-medium" htmlFor="edit-role">Role</label>
                <select
                  id="edit-role"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light"
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline dark:bg-admin-accent-green dark:hover:bg-green-700"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update User'}
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

      {showDeleteConfirmationModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 dark:bg-opacity-75">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm relative text-center dark:bg-admin-dark-tertiary dark:text-dark-text-light">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-dark-text-light">Confirm Deletion</h2>
            <p className="mb-6 text-gray-700 dark:text-dark-text-medium">
              Are you sure you want to delete user <span className="font-semibold">{userToDelete.email}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmDeleteUser}
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
    </div>
  );
}