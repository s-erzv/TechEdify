// frontend/src/pages/SettingsPage.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { AuthContext } from '../context/AuthContext';
import {
    Cog6ToothIcon, UserCircleIcon, KeyIcon, SunIcon, MoonIcon,
    CheckCircleIcon as SolidCheckCircleIcon, PhotoIcon, IdentificationIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
    const { user, profile, setProfile } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // State for profile form
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');

    // State for avatar upload
    const [avatarFile, setAvatarFile] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef(null);

    // State for change password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // State for theme (fetched from localStorage)
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') === 'dark';
        }
        return false;
    });

    // Function to fetch full user profile data
    const fetchUserProfile = async () => {
        if (!user) return;
        try {
            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (fetchError) throw fetchError;
            if (setProfile) {
                setProfile(data);
            } else {
                // Fallback for local state if setProfile is not available
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
                setUsername(data.username || '');
            }
        } catch (err) {
            console.error('Error fetching profile:', err.message);
            setError('Failed to load profile: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (profile) {
            setFirstName(profile.first_name || '');
            setLastName(profile.last_name || '');
            setUsername(profile.username || '');
            setLoading(false);
        } else if (user) {
            fetchUserProfile();
        } else {
            setLoading(false);
            setError('You must be logged in to view settings.');
        }
    }, [user, profile, setProfile]);

    // Effect to manage theme
    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (isDarkMode) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }
    }, [isDarkMode]);

    const handleAvatarUpload = async (event) => {
        if (!user) {
            setError('You must be logged in to upload an avatar.');
            return;
        }
        const file = event.target.files[0];
        if (!file) return;

        setUploadingAvatar(true);
        setSuccessMessage('');
        setError(null);

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`; 
        const filePath = `avatars/${fileName}`; 

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { cacheControl: '3600', upsert: true });

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const newAvatarUrl = publicUrlData.publicUrl;

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: newAvatarUrl, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await fetchUserProfile();
            setSuccessMessage('Avatar updated successfully!');

        } catch (err) {
            console.error('Error uploading avatar:', err.message);
            setError('Failed to upload avatar: ' + err.message);
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage('');

        if (!user) {
            setError('You must be logged in to update your profile.');
            setLoading(false);
            return;
        }

        try {
            const updates = {
                first_name: firstName,
                last_name: lastName,
                username: username,
                updated_at: new Date().toISOString(),
            };

            const { error: updateError } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            if (updateError) throw updateError;

            await fetchUserProfile();

            setSuccessMessage('Profile updated successfully!');

        } catch (err) {
            console.error('Error updating profile:', err.message);
            setError('Failed to update profile: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmNewPassword) {
            setPasswordError('New password and confirm password do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters long.');
            return;
        }

        try {
            const { data, error: passwordUpdateError } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (passwordUpdateError) throw passwordUpdateError;

            setPasswordSuccess('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');

        } catch (err) {
            console.error('Error changing password:', err.message);
            setPasswordError('Failed to change password: ' + err.message);
        }
    };

    const handleToggleDarkMode = () => {
        setIsDarkMode(prevMode => !prevMode);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-gray-300">
                    Loading settings...
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-red-600 text-xl dark:text-red-400">
                    Error: {error}
                </div>
            </MainLayout>
        );
    }

    const displayFullName = profile?.full_name || [firstName, lastName].filter(Boolean).join(' ');
    const displayUsername = profile?.username || username;
    const userEmail = user?.email || 'N/A';
    // const userRole = profile?.role || 'Unknown'; // Role removed
    const userBonusPoint = profile?.bonus_point !== undefined ? profile.bonus_point : 'N/A';


    return (
        <MainLayout>
            <div className="flex-grow p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)] dark:bg-gray-900 transition-colors duration-300">
                <header className="mb-8 p-4 bg-white rounded-xl shadow-sm flex items-center justify-between dark:bg-gray-800">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center dark:text-white">
                        <Cog6ToothIcon className="h-8 w-8 mr-3 text-purple-600" /> Account Settings
                    </h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Card 1: Profile Information */}
                    <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center dark:text-white">
                            <UserCircleIcon className="h-7 w-7 mr-2 text-blue-500" /> Profile Information
                        </h2>
                        {successMessage && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 dark:bg-green-700 dark:border-green-600 dark:text-white" role="alert">
                                <SolidCheckCircleIcon className="inline h-5 w-5 mr-2" /> {successMessage}
                            </div>
                        )}
                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                            {/* Avatar Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Profile Picture</label>
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-purple-300 shadow-md" />
                                        ) : (
                                            <UserCircleIcon className="h-20 w-20 text-gray-400" />
                                        )}
                                    </div>
                                    <label htmlFor="avatar-upload" className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition-colors duration-200">
                                        {uploadingAvatar ? (
                                            'Uploading...'
                                        ) : (
                                            <>
                                                <PhotoIcon className="h-5 w-5 mr-2" /> Upload Photo
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            disabled={uploadingAvatar}
                                            ref={fileInputRef}
                                        />
                                    </label>
                                </div>
                                {uploadingAvatar && <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">Uploading, please wait...</p>}
                            </div>

                            {/* Basic Profile Info */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Email (Cannot be changed)</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 cursor-not-allowed"
                                    value={user?.email || ''}
                                    disabled
                                />
                            </div>
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">First Name</label>
                                <input
                                    type="text"
                                    id="firstName"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Last Name</label>
                                <input
                                    type="text"
                                    id="lastName"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || uploadingAvatar}
                                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 dark:bg-purple-700 dark:hover:bg-purple-800"
                            >
                                {loading ? 'Saving...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>

                    <div className="space-y-6">
                        {/* Card 3: Student Card */}
                        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white font-sans relative overflow-hidden">
                            <IdentificationIcon className="absolute -right-5 -bottom-5 h-32 w-32 opacity-20 transform rotate-[-20deg]" />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <h2 className="text-2xl font-bold">Student Card</h2>
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md" />
                                ) : (
                                    <UserCircleIcon className="h-16 w-16 text-gray-300 border-2 border-white rounded-full" />
                                )}
                            </div>
                            <div className="space-y-2 relative z-10">
                                <div>
                                    <p className="text-sm opacity-80">Full Name</p>
                                    <p className="text-lg font-semibold">{displayFullName || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-sm opacity-80">Username</p>
                                    <p className="text-lg font-semibold">{displayUsername || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p className="text-sm opacity-80">Email</p>
                                    <p className="text-lg font-semibold">{userEmail}</p>
                                </div>
                                {/* Role removed from Student Card */}
                                {profile?.role === 'student' && (
                                    <div>
                                        <p className="text-sm opacity-80">Bonus Points</p>
                                        <p className="text-lg font-semibold">{userBonusPoint}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card 2: App Theme Settings */}
                        <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between dark:bg-gray-800">
                            <h2 className="text-2xl font-semibold text-gray-800 flex items-center dark:text-white">
                                {isDarkMode ? <MoonIcon className="h-7 w-7 mr-2 text-indigo-500" /> : <SunIcon className="h-7 w-7 mr-2 text-yellow-500" />}
                                App Theme
                            </h2>
                            <button
                                onClick={handleToggleDarkMode}
                                className={`px-5 py-2 rounded-lg font-semibold transition-colors duration-300 flex items-center ${
                                    isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                }`}
                            >
                                {isDarkMode ? (
                                    <>
                                        <SunIcon className="h-5 w-5 mr-2" /> Light Mode
                                    </>
                                ) : (
                                    <>
                                        <MoonIcon className="h-5 w-5 mr-2" /> Dark Mode
                                    </>
                                )}
                            </button>
                        </div>


                        {/* Card 4: Change Password */}
                        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-gray-800">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center dark:text-white">
                                <KeyIcon className="h-7 w-7 mr-2 text-red-500" /> Change Password
                            </h2>
                            {passwordError && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-700 dark:border-red-600 dark:text-white" role="alert">
                                    <strong className="font-bold">Error!</strong>
                                    <span className="block sm:inline"> {passwordError}</span>
                                </div>
                            )}
                            {passwordSuccess && (
                                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 dark:bg-green-700 dark:border-green-600 dark:text-white" role="alert">
                                    <SolidCheckCircleIcon className="inline h-5 w-5 mr-2" /> {passwordSuccess}
                                </div>
                            )}
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div>
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Current Password</label>
                                    <input
                                        type="password"
                                        id="currentPassword"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">New Password</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1 dark:text-gray-300">Confirm New Password</label>
                                    <input
                                        type="password"
                                        id="confirmNewPassword"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || uploadingAvatar}
                                    className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
                                >
                                    {loading ? 'Changing...' : 'Change Password'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}