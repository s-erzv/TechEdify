// frontend/src/pages/DiscussionDetailPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import MainLayout from '../components/mainLayout';
import { ArrowLeftIcon, ChatBubbleOvalLeftIcon, UserCircleIcon, PaperAirplaneIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { AuthContext } from '../context/AuthContext';

export default function DiscussionDetailPage() {
    const { discussionId } = useParams();
    const { user } = useContext(AuthContext); // Untuk mendapatkan user_id saat memposting balasan
    const navigate = useNavigate();

    const [discussion, setDiscussion] = useState(null);
    const [posts, setPosts] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submittingPost, setSubmittingPost] = useState(false);

    const fetchDiscussionDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            // Ambil detail diskusi utama
            const { data: discussionData, error: discussionError } = await supabase
                .from('discussions')
                .select(`
                    id,
                    title,
                    content,
                    image_url,
                    created_at,
                    user_id,
                    profiles ( username, full_name, avatar_url ),
                    courses ( title ),
                    modules ( title )
                `)
                .eq('id', discussionId)
                .single();

            if (discussionError) throw discussionError;
            if (!discussionData) throw new Error("Topik diskusi tidak ditemukan.");

            setDiscussion({
                ...discussionData,
                author_name: discussionData.profiles?.username || discussionData.profiles?.full_name || 'Pengguna Tidak Dikenal',
                author_avatar: discussionData.profiles?.avatar_url,
                course_title: discussionData.courses?.title,
                module_title: discussionData.modules?.title,
            });

            // Ambil posts/balasan untuk diskusi ini
            const { data: postsData, error: postsError } = await supabase
                .from('discussion_posts')
                .select(`
                    id,
                    content,
                    image_url,
                    created_at,
                    user_id,
                    parent_post_id,
                    profiles ( username, full_name, avatar_url )
                `)
                .eq('discussion_id', discussionId)
                .order('created_at', { ascending: true }); // Urutkan balasan dari yang terlama

            if (postsError) throw postsError;

            const formattedPosts = postsData.map(post => ({
                ...post,
                author_name: post.profiles?.username || post.profiles?.full_name || 'Pengguna Tidak Dikenal',
                author_avatar: post.profiles?.avatar_url,
            }));
            setPosts(formattedPosts);

        } catch (err) {
            console.error('Error fetching discussion details:', err.message);
            setError('Gagal memuat diskusi: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (discussionId) {
            fetchDiscussionDetails();
        }
    }, [discussionId]);

    const handlePostReply = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim() || !user) return;

        setSubmittingPost(true);
        try {
            const { error: insertError } = await supabase
                .from('discussion_posts')
                .insert({
                    discussion_id: discussionId,
                    user_id: user.id, // Ambil user ID dari AuthContext
                    content: newPostContent.trim(),
                    // image_url: '...', // Tambahkan ini jika Anda ingin fitur upload gambar
                    // parent_post_id: null, // Untuk balasan utama ke topik diskusi
                });

            if (insertError) throw insertError;

            setNewPostContent('');
            // Refresh data setelah berhasil memposting
            fetchDiscussionDetails(); 

        } catch (err) {
            console.error('Error posting reply:', err.message);
            alert('Gagal mengirim balasan: ' + err.message);
        } finally {
            setSubmittingPost(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl">
                    Memuat diskusi...
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-red-600 text-xl">
                    Error: {error}
                </div>
            </MainLayout>
        );
    }

    if (!discussion) {
        return (
            <MainLayout>
                <div className="flex-grow flex justify-center items-center text-gray-700 text-xl">
                    Topik diskusi tidak ditemukan.
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="flex-grow p-6 bg-[#F9F9FB] rounded-xl min-h-[calc(100vh-80px)]">
                <header className="mb-6 p-4 bg-white rounded-xl shadow-sm flex items-center">
                    <button onClick={() => navigate('/discussions')} className="mr-4 text-gray-700 hover:text-gray-900">
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900 truncate">{discussion.title}</h1>
                </header>

                <div className="bg-white p-6 rounded-xl shadow-md mb-6">
                    {/* Diskusi Utama */}
                    <div className="pb-4 border-b border-gray-200 mb-4">
                        <div className="flex items-center mb-3">
                            {discussion.author_avatar ? (
                                <img src={discussion.author_avatar} alt={discussion.author_name} className="h-10 w-10 rounded-full object-cover mr-3" />
                            ) : (
                                <UserCircleIcon className="h-10 w-10 text-gray-400 mr-3" />
                            )}
                            <div>
                                <p className="font-semibold text-gray-900">{discussion.author_name}</p>
                                <p className="text-sm text-gray-500 flex items-center">
                                    <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                    {new Date(discussion.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div className="ml-auto flex items-center space-x-2">
                                {discussion.course_title && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                        {discussion.course_title}
                                    </span>
                                )}
                                {discussion.module_title && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                        {discussion.module_title}
                                    </span>
                                )}
                            </div>
                        </div>
                        <p className="text-gray-800 mb-4">{discussion.content}</p>
                        {discussion.image_url && (
                            <img src={discussion.image_url} alt="Discussion Image" className="max-w-full h-auto rounded-lg shadow-sm" />
                        )}
                    </div>

                    {/* Daftar Balasan */}
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <ChatBubbleOvalLeftIcon className="h-6 w-6 mr-2 text-purple-600" /> Balasan ({posts.length})
                    </h3>
                    <div className="space-y-4">
                        {posts.length > 0 ? (
                            posts.map((post) => (
                                <div key={post.id} className="p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        {post.author_avatar ? (
                                            <img src={post.author_avatar} alt={post.author_name} className="h-8 w-8 rounded-full object-cover mr-3" />
                                        ) : (
                                            <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3" />
                                        )}
                                        <div>
                                            <p className="font-semibold text-gray-900">{post.author_name}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(post.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-gray-800 ml-11">{post.content}</p>
                                    {/* Handle child replies here if parent_post_id is used for threading */}
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-4">
                                Belum ada balasan. Jadilah yang pertama!
                            </div>
                        )}
                    </div>

                    {/* Form untuk Menambah Balasan Baru */}
                    <form onSubmit={handlePostReply} className="mt-6 p-4 border-t border-gray-200 pt-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Tambahkan Balasan Anda</h3>
                        <textarea
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 resize-y min-h-[100px]"
                            placeholder="Tulis balasan Anda di sini..."
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            rows="4"
                            required
                        ></textarea>
                        <button
                            type="submit"
                            disabled={!newPostContent.trim() || submittingPost}
                            className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {submittingPost ? 'Mengirim...' : (
                                <>
                                    <PaperAirplaneIcon className="h-5 w-5 mr-2 rotate-90" /> Kirim Balasan
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}