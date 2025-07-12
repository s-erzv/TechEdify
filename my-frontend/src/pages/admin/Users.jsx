// frontend/src/pages/AdminManageUsers.jsx atau Users.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient'; // Pastikan path ini benar
import AdminLayout from '../../components/AdminLayout'; // Jika Anda menggunakan AdminLayout di sini
import {
    MagnifyingGlassIcon,
    ChevronDownIcon,
    // UserCircleIcon, // Tidak digunakan langsung di sini
    ArrowLeftIcon,
    ArrowRightIcon,
    BellIcon,
    PlusIcon, // Untuk tombol tambah
    XMarkIcon // Untuk tombol close di modal
} from '@heroicons/react/24/outline'; // Pastikan semua ikon diimpor

export default function AdminManageUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [usersPerPage] = useState(10);
    const [totalUsersCount, setTotalUsersCount] = useState(0);

    // --- State untuk operasi CRUD ---
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
    const [userToEdit, setUserToEdit] = useState(null); // Menyimpan data user yang akan diedit
    const [userToDelete, setUserToDelete] = useState(null); // Menyimpan data user yang akan dihapus

    // State untuk form tambah/edit user
    const [newUserData, setNewUserData] = useState({
        email: '',
        password: '', // Hanya untuk tambah user
        first_name: '',
        last_name: '',
        username: '',
        role: 'student', // Default role
    });

    // Data dummy admin user untuk header (ini harusnya dari AuthContext Anda)
    const adminUser = {
        user_metadata: {
            first_name: "Admin", // Ganti dengan nama admin aktual dari AuthContext jika ada
            avatar_url: "/default-avatar.jpg" // Ganti dengan avatar admin aktual
        },
        email: "techedifysma@gmail.com" // Ganti dengan email admin aktual
    };
    const adminUserName = adminUser?.user_metadata?.first_name || adminUser?.email?.split('@')[0] || 'Admin';

    
    // --- Fungsi untuk Fetch Pengguna (Read) ---
    const fetchUsers = async () => {
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
    };

    useEffect(() => {
        fetchUsers();
    }, [searchTerm, filterRole, currentPage, usersPerPage]);

    const totalPages = Math.ceil(totalUsersCount / usersPerPage);

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- Fungsi CRUD: Create (Tambah Pengguna) ---
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
        setLoading(true); // Aktifkan loading untuk operasi ini
        setError(null); // Reset error

        try {
            // 1. Buat user di Supabase Auth (admin API)
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: newUserData.email,
                password: newUserData.password,
                email_confirm: true, // Auto-confirm email untuk user admin
                user_metadata: {
                    first_name: newUserData.first_name,
                    last_name: newUserData.last_name,
                    username: newUserData.username,
                },
            });

            if (authError) throw authError;

            // Kita akan berasumsi trigger backend Anda yang mengisi profiles.
            // Jadi, setelah user dibuat di auth, kita tinggal refresh list.

            alert('Pengguna berhasil ditambahkan!');
            closeAddModal();
            fetchUsers(); // Refresh daftar pengguna
        } catch (err) {
            setError('Gagal menambahkan pengguna: ' + err.message);
            alert('Gagal menambahkan pengguna: ' + err.message);
        } finally {
            setLoading(false); // Nonaktifkan loading
        }
    };


    // --- Fungsi CRUD: Update (Edit Pengguna) ---
    const openEditModal = (user) => {
        setUserToEdit(user);
        // Isi form edit dengan data user yang dipilih
        setNewUserData({
            email: user.email,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            username: user.username || '',
            role: user.role,
            password: '', // Password tidak diedit di sini, hanya untuk tambilan
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

        // Hitung full_name berdasarkan input terbaru
        const updatedFullName = `${newUserData.first_name || ''} ${newUserData.last_name || ''}`.trim();

        try {
            // Perbarui tabel profiles
            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({
                    first_name: newUserData.first_name,
                    last_name: newUserData.last_name,
                    username: newUserData.username,
                    role: newUserData.role,
                    full_name: updatedFullName // <=== PERUBAHAN DI SINI: Kirim updatedFullName ke DB
                })
                .eq('id', userToEdit.id);

            if (profileUpdateError) throw profileUpdateError;

            // Perbarui state 'users' secara langsung
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === userToEdit.id
                        ? {
                              ...user,
                              first_name: newUserData.first_name,
                              last_name: newUserData.last_name,
                              username: newUserData.username,
                              role: newUserData.role,
                              full_name: updatedFullName // <=== PERUBAHAN DI SINI: Perbarui state lokal dengan updatedFullName
                          }
                        : user
                )
            );

            alert('Pengguna berhasil diperbarui!');
            closeEditModal();
            // fetchUsers(); // Baris ini bisa dihapus karena state sudah diperbarui secara langsung
        } catch (err) {
            setError('Gagal memperbarui pengguna: ' + err.message);
            alert('Gagal memperbarui pengguna: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Fungsi CRUD: Delete (Hapus Pengguna) ---
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
            // Hapus user dari Supabase Auth menggunakan admin API
            // Ini akan menghapus user dari auth.users dan, jika Anda punya trigger/foreign key cascade,
            // akan otomatis menghapus dari tabel profiles juga.
            const { error: deleteError } = await supabase.auth.admin.deleteUser(userToDelete.id);

            if (deleteError) throw deleteError;

            // Perbarui state 'users' secara langsung dengan menghapus pengguna
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
            // Juga kurangi totalUsersCount jika ini adalah satu-satunya sumber count
            setTotalUsersCount(prevCount => prevCount - 1);


            alert('Pengguna berhasil dihapus!');
            closeDeleteConfirm();
            // fetchUsers(); // Baris ini bisa dihapus karena state sudah diperbarui secara langsung
        } catch (err) {
            setError('Gagal menghapus pengguna: ' + err.message);
            alert('Gagal menghapus pengguna: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Rendering UI ---
    if (loading && users.length === 0) { // Hanya tampilkan loading screen penuh jika belum ada data
        return (
            <div className="flex-grow h-screen flex justify-center items-center text-gray-700 text-xl">
                <i className="fas fa-spinner fa-spin mr-2"></i> Memuat daftar pengguna...
            </div>
        );
    }

    if (error && users.length === 0) { // Tampilkan error screen penuh jika ada error dan belum ada data
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
                        placeholder="Search users by name, email, or username"
                        className="w-full py-2 pl-10 pr-4 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>

                <div className="relative flex space-x-4"> {/* Tambahkan flex dan space-x */}
                    <select
                        className="w-full py-2 pl-4 pr-10 rounded-full bg-gray-100 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 cursor-pointer appearance-none"
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
                    <ChevronDownIcon className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    
                    {/* Tombol Tambah Pengguna */}
                    <button
                        onClick={openAddModal}
                        className="bg-purple-600 text-white rounded-full p-2 hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center min-w-[40px] h-[40px]"
                        title="Add New User"
                    >
                        <PlusIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
                {/* Loading overlay saat operasi CRUD berlangsung */}
                {loading && users.length > 0 && ( // Tampilkan loading overlay hanya jika sudah ada data awal
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
                            <th className="px-6 py-3 text-left">User</th>
                            <th className="px-6 py-3 text-left">Email</th>
                            <th className="px-6 py-3 text-left">Role</th>
                            <th className="px-6 py-3 text-left">Registered</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-3">
                                        <img
                                            className="h-10 w-10 rounded-full object-cover"
                                            src={user.avatar_url || '/default-user-avatar.jpg'}
                                            alt={user.first_name || 'User'}
                                        />
                                        <div>
                                            <div className="text-sm font-semibold text-gray-800 capitalize">
                                                {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500">{user.username || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-700">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        {/* <Link to={`/admin/users/${user.id}`} className="text-blue-600 hover:underline">View</Link> */}
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => openDeleteConfirm(user)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-500">No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalUsersCount > usersPerPage && (
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

            {/* --- Modal Tambah Pengguna (Create) --- */}
            {showAddUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button onClick={closeAddModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Tambah Pengguna Baru</h2>
                        <form onSubmit={handleCreateUser}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-email">Email</label>
                                <input
                                    type="email"
                                    id="add-email"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newUserData.email}
                                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-password">Password</label>
                                <input
                                    type="password"
                                    id="add-password"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newUserData.password}
                                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-first_name">Nama Depan</label>
                                <input
                                    type="text"
                                    id="add-first_name"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newUserData.first_name}
                                    onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-last_name">Nama Belakang</label>
                                <input
                                    type="text"
                                    id="add-last_name"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newUserData.last_name}
                                    onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-username">Username</label>
                                <input
                                    type="text"
                                    id="add-username"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newUserData.username}
                                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="add-role">Role</label>
                                <select
                                    id="add-role"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    {loading ? 'Menambahkan...' : 'Tambah Pengguna'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeAddModal}
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

            {/* --- Modal Edit Pengguna (Update) --- */}
            {showEditUserModal && userToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md relative">
                        <button onClick={closeEditModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Pengguna</h2>
                        <form onSubmit={handleUpdateUser}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-email">Email</label>
                                <input
                                    type="email"
                                    id="edit-email"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newUserData.email} // Gunakan newUserData karena diisi dari userToEdit
                                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                    disabled // Email biasanya tidak bisa diedit via profiles table, harus via auth.admin API
                                />
                            </div>
                            {/* Password tidak ditampilkan di form edit karena admin API untuk password lebih kompleks dan butuh konfirmasi */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-first_name">Nama Depan</label>
                                <input
                                    type="text"
                                    id="edit-first_name"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newUserData.first_name}
                                    onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-last_name">Nama Belakang</label>
                                <input
                                    type="text"
                                    id="edit-last_name"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newUserData.last_name}
                                    onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-username">Username</label>
                                <input
                                    type="text"
                                    id="edit-username"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    value={newUserData.username}
                                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="edit-role">Role</label>
                                <select
                                    id="edit-role"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    disabled={loading}
                                >
                                    {loading ? 'Memperbarui...' : 'Perbarui Pengguna'}
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

            {/* --- Modal Konfirmasi Hapus (Delete) --- */}
            {showDeleteConfirmationModal && userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm relative text-center">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Konfirmasi Penghapusan</h2>
                        <p className="mb-6 text-gray-700">
                            Apakah Anda yakin ingin menghapus pengguna <span className="font-semibold">{userToDelete.email}</span>?
                            Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={confirmDeleteUser}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                disabled={loading}
                            >
                                {loading ? 'Menghapus...' : 'Hapus'}
                            </button>
                            <button
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
        </div>
    );
}