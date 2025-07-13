import React, { useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AuthContext } from '../context/AuthContext';
import { SidebarContext } from '../components/mainLayout';
import {
  Cog6ToothIcon, UserCircleIcon, KeyIcon, SunIcon, MoonIcon, Bars3Icon,
  CheckCircleIcon as SolidCheckCircleIcon, PhotoIcon, IdentificationIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { user, profile, setProfile } = useContext(AuthContext);
  const { toggleSidebar } = useContext(SidebarContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

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
        console.log('Profile data set to Context:', data);
        console.log('Avatar URL from Context after fetch:', data.avatar_url);
      } else {
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
      console.log('Profile from AuthContext in useEffect:', profile);
      console.log('Avatar URL from AuthContext in useEffect:', profile.avatar_url);
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
    const filePath = `${user.id}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

    console.log('File path to upload:', filePath);

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
      <div className="flex-grow flex justify-center items-center text-gray-700 text-xl dark:text-dark-text-medium">
        Loading settings...
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

  const displayFullName = profile?.full_name || [firstName, lastName].filter(Boolean).join(' ');
  const displayUsername = profile?.username || username;
  const userEmail = user?.email || 'N/A';
  const userBonusPoint = profile?.bonus_point !== undefined ? profile.bonus_point : 'N/A';


  return (
    <div className="flex-grow p-4 sm:p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)] dark:bg-dark-bg-secondary transition-colors duration-300">
      <header className="mb-6 p-2 sm:p-4 bg-white rounded-xl shadow-sm flex items-center justify-between dark:bg-dark-bg-tertiary">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="md:hidden p-2 rounded-full bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-dark-text-light focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2" aria-label="Toggle sidebar">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center dark:text-dark-text-light">
            <Cog6ToothIcon className="h-7 w-7 sm:h-8 sm:w-8 mr-3 text-purple-600 dark:text-dark-accent-purple" /> Account Settings
          </h1>
        </div>

        {/* Karena tidak ada ikon lain di kanan, kita bisa membiarkan ini kosong atau menambahkan elemen spacer jika diperlukan */}
        {/* <div className="flex items-center gap-3">
          </div> */}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Profile Information */}
        <div className="bg-white p-6 rounded-xl shadow-md dark:bg-dark-bg-tertiary">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 flex items-center dark:text-dark-text-light">
            <UserCircleIcon className="h-7 w-7 sm:h-8 sm:w-8 mr-2 text-blue-500 dark:text-blue-400" /> Profile Information
          </h2>
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 dark:bg-green-700 dark:border-green-600 dark:text-dark-text-light" role="alert">
              <SolidCheckCircleIcon className="inline h-5 w-5 mr-2" /> {successMessage}
            </div>
          )}
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {/* Avatar Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-dark-text-medium">Profile Picture</label>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-2 border-purple-300 shadow-md dark:border-dark-accent-purple" />
                  ) : (
                    <UserCircleIcon className="h-20 w-20 text-gray-400 dark:text-dark-text-dark" />
                  )}
                </div>
                <label htmlFor="avatar-upload" className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center transition-colors duration-200 dark:bg-dark-accent-purple dark:hover:bg-purple-800">
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
              {uploadingAvatar && <p className="text-sm text-gray-500 mt-2 dark:text-dark-text-dark">Uploading, please wait...</p>}
            </div>

            {/* Basic Profile Info */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 dark:text-dark-text-medium">Email (Cannot be changed)</label>
              <input
                type="email"
                id="email"
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-dark cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
            </div>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1 dark:text-dark-text-medium">First Name</label>
              <input
                type="text"
                id="firstName"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-dark-accent-purple"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1 dark:text-dark-text-medium">Last Name</label>
              <input
                type="text"
                id="lastName"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-dark-accent-purple"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1 dark:text-dark-text-medium">Username</label>
              <input
                type="text"
                id="username"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-dark-accent-purple"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading || uploadingAvatar}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 dark:bg-dark-accent-purple dark:hover:bg-purple-800"
            >
              {loading ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {/* Card 3: Student Card */}
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-xl shadow-lg text-white font-sans relative overflow-hidden dark:bg-dark-bg-tertiary dark:shadow-none">
            <IdentificationIcon className="absolute -right-5 -bottom-5 h-32 w-32 opacity-20 transform rotate-[-20deg]" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <h2 className="text-2xl font-bold dark:text-dark-text-light">Student Card</h2>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md dark:border-gray-600" />
              ) : (
                <UserCircleIcon className="h-16 w-16 text-gray-300 border-2 border-white rounded-full dark:text-dark-text-dark dark:border-gray-600" />
              )}
            </div>
            <div className="space-y-2 relative z-10">
              <div>
                <p className="text-sm opacity-80 dark:text-dark-text-dark">Full Name</p>
                <p className="text-lg font-semibold dark:text-dark-text-light">{displayFullName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm opacity-80 dark:text-dark-text-dark">Username</p>
                <p className="text-lg font-semibold dark:text-dark-text-light">{displayUsername || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm opacity-80 dark:text-dark-text-dark">Email</p>
                <p className="text-lg font-semibold dark:text-dark-text-light">{userEmail}</p>
              </div>
              {profile?.role === 'student' && (
                <div>
                    <p className="text-sm opacity-80 dark:text-dark-text-dark">Bonus Points</p>
                    <p className="text-lg font-semibold dark:text-dark-text-light">{userBonusPoint}</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: App Theme Settings */}
          <div className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between dark:bg-dark-bg-tertiary">
            <h2 className="text-2xl font-semibold text-gray-800 flex items-center dark:text-dark-text-light">
              {isDarkMode ? <MoonIcon className="h-7 w-7 mr-2 text-indigo-500 dark:text-dark-accent-purple" /> : <SunIcon className="h-7 w-7 mr-2 text-yellow-500 dark:text-yellow-400" />}
              App Theme
            </h2>
            <button
              onClick={handleToggleDarkMode}
              className={`px-5 py-2 rounded-lg font-semibold transition-colors duration-300 flex items-center ${
                  isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-dark-accent-purple dark:text-dark-text-light dark:hover:bg-purple-800' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-dark-text-light dark:hover:bg-gray-600'
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
          <div className="bg-white p-6 rounded-xl shadow-md dark:bg-dark-bg-tertiary">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center dark:text-dark-text-light">
              <KeyIcon className="h-7 w-7 sm:h-8 sm:w-8 mr-2 text-red-500 dark:text-red-400" /> Change Password
            </h2>
            {passwordError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 dark:bg-red-700 dark:border-red-600 dark:text-dark-text-light" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {passwordError}</span>
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 dark:bg-green-700 dark:border-green-600 dark:text-dark-text-light" role="alert">
                <SolidCheckCircleIcon className="inline h-5 w-5 mr-2" /> {passwordSuccess}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1 dark:text-dark-text-medium">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-dark-accent-purple"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1 dark:text-dark-text-medium">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-dark-text-light dark:focus:ring-dark-accent-purple"
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
  );
}