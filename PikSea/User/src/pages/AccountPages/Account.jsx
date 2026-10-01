import { Edit3, Mail, MapPin, ShieldCheck, X, LogOut } from "lucide-react"
import { FaGoogle } from "react-icons/fa"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { toast } from "react-toastify"
import useAuth from "../../utlis/Hooks/useAuth"

const Account = ({ userData, setActiveTab }) => {
    const { user, logOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        try {
            await logOut();
            toast.success("Successfully signed out!");
            navigate('/');
        } catch (error) {
            console.error(error);
            toast.error("Failed to sign out");
        }
    };
    const profile = userData || user;

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        name: profile?.name || profile?.displayName || '',
        username: profile?.username || profile?.email?.split('@')[0] || '',
        location: profile?.country || '',
        photo: null
    });

    const [previewImage, setPreviewImage] = useState(
        profile?.photo ? (profile.photo.startsWith('http') ? profile.photo : `${import.meta.env.VITE_IMG_KEY || ''}/${profile.photo}`) : null
    );

    useEffect(() => {
        const p = userData || user;
        setEditForm({
            name: p?.name || p?.displayName || '',
            username: p?.username || p?.email?.split('@')[0] || '',
            location: p?.country || '',
            photo: null
        });
        setPreviewImage(
            p?.photo ? (p.photo.startsWith('http') ? p.photo : `${import.meta.env.VITE_IMG_KEY || ''}/${p?.photo}`) : null
        );
    }, [userData, user]);

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        if (!user) return;
        
        try {
            const token = localStorage.getItem('dayalstock_token') || (await user?.getIdToken?.());
            const formData = new FormData();
            formData.append("name", editForm.name);
            formData.append("username", editForm.username);
            formData.append("location", editForm.location);
            if (editForm.photo) {
                formData.append("photo", editForm.photo);
            }

            const res = await axios.post(`${import.meta.env.VITE_LOCALHOST_KEY}/users/update_profile.php`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': import.meta.env.VITE_APP_SECRET,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.data.success) {
                toast.success("Profile updated successfully!");
                setIsEditModalOpen(false);
                setTimeout(() => window.location.reload(), 800);
            } else {
                toast.error(res.data.message || "Failed to update profile");
            }
        } catch (error) {
            console.error(error);
            toast.error("Error updating profile");
        }
    };

    return (
        <>
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-gray-200 dark:border-white/5 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit">My Profile</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Update your personal details and public profile.</p>
                </div>
                <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="w-full sm:w-auto flex justify-center items-center gap-2 bg-[#00D4FF] text-[#050505] px-5 py-2.5 rounded-xl font-semibold hover:bg-[#33DEFF] transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                >
                    <Edit3 size={16} />
                    Edit Profile
                </button>
            </div>

            {/* Profile Details Card */}
            <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-gray-200 dark:border-white/5 overflow-hidden transition-colors">
                <div className="p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                        {/* Avatar */}
                        <div className="relative">
                            {profile?.photo ? (
                                <img
                                    src={profile.photo.startsWith('http') ? profile.photo : `${import.meta.env.VITE_IMG_KEY || ''}/${profile?.photo}`}
                                    alt="Profile"
                                    className="w-28 h-28 rounded-full object-cover border-4 border-gray-100 dark:border-[#111] shadow-[0_0_20px_rgba(0,212,255,0.2)]"
                                />
                            ) : (
                                <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-[#222] flex items-center justify-center border-4 border-gray-100 dark:border-[#111] shadow-[0_0_20px_rgba(0,212,255,0.2)] text-4xl font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase">
                                    {profile?.name?.charAt(0) || profile?.displayName?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                                </div>
                            )}

                            <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white dark:border-[#111]" title="Online"></div>
                        </div>

                        {/* Info Grid */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <label className="text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider">Full Name</label>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{profile?.name || profile?.displayName || 'Add your name'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider">Email Address</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Mail size={16} className="text-gray-500 dark:text-gray-400" />
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">{profile?.email || 'No email'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider">Username</label>
                                <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">@{profile?.username || profile?.email?.split('@')[0] || 'user'}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#0088b3] dark:text-[#00D4FF] uppercase tracking-wider">Location</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                                    <p className="text-lg font-medium text-gray-900 dark:text-white">{profile?.country && profile.country !== 'NULL' ? profile.country : 'Not specified'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connected Accounts */}
            <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-gray-200 dark:border-white/5 p-6 sm:p-8 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Connected Accounts</h3>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-transparent shrink-0">
                            <FaGoogle className="text-red-500 text-xl" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 dark:text-white">Account Email</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{profile?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-full text-sm font-semibold">
                        <ShieldCheck size={16} />
                        Verified
                    </div>
                </div>
            </div>

            {/* Sign Out */}
            <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm dark:shadow-[0_0_20px_rgba(255,255,255,0.02)] border border-red-200 dark:border-red-500/20 p-6 sm:p-8 transition-colors">
                <h3 className="text-lg font-bold text-red-500 dark:text-red-400 mb-2">Sign Out</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">Sign out of your account on this device.</p>
                <button 
                    onClick={handleSignOut}
                    className="flex items-center gap-2 bg-red-500/10 text-red-400 px-6 py-3 rounded-xl font-semibold hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 shadow-lg shadow-red-500/10"
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </div>

        </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/5">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                            <button 
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-5">
                            <div className="flex flex-col items-center gap-4 mb-2">
                                <div className="relative w-24 h-24 rounded-full border-4 border-gray-100 dark:border-[#222] overflow-hidden bg-gray-100 dark:bg-[#222] flex items-center justify-center">
                                    {previewImage ? (
                                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-3xl font-bold text-gray-400 dark:text-gray-500">
                                            {editForm.name?.charAt(0) || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <input 
                                        type="file" 
                                        id="photo-upload" 
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setEditForm({ ...editForm, photo: file });
                                                setPreviewImage(URL.createObjectURL(file));
                                            }
                                        }}
                                    />
                                    <label 
                                        htmlFor="photo-upload" 
                                        className="text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 transition-colors inline-block"
                                    >
                                        Change Photo
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                <input 
                                    type="text" 
                                    name="name"
                                    value={editForm.name}
                                    onChange={handleEditChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#00D4FF]/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Username</label>
                                <input 
                                    type="text" 
                                    name="username"
                                    value={editForm.username}
                                    onChange={handleEditChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#00D4FF]/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="Enter your username"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Location</label>
                                <input 
                                    type="text" 
                                    name="location"
                                    value={editForm.location}
                                    onChange={handleEditChange}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-[#00D4FF]/50 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder="City, Country"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 px-5 py-3 rounded-xl font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-5 py-3 rounded-xl font-semibold text-[#050505] bg-[#00D4FF] hover:bg-[#33DEFF] transition-all shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
export default Account