import React, { useState, useEffect } from "react";
import { MapPin, Share2, LayoutGrid, UserCheck, Search, ThumbsUp, CreditCard, History, FileText, LogOut, User, Settings } from "lucide-react";
import { toast } from "react-toastify";
import PublicCollectionsDashboard from "./PublicCollectionsDashboard";
import FollowingDashboard from "./FollowingDashboard";
import { useParams, useNavigate } from "react-router-dom";

const MemberPage = () => {
      const { username } = useParams();
    const [activeTab, setActiveTab] = useState("collections");
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!username) return;
        const fetchUserData = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/users/get_user_details_by_username.php?username=${username}`);
                const data = await res.json();

                if (data.success) {
                    setUserData(data.data);
                } else {
                    navigate("/404", { replace: true });
                }
            } catch (err) {
                console.error("Error fetching user data:", err);
                navigate("/404", { replace: true });
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, [username, navigate]);

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    const avatarUrl = userData?.photo
        ? (userData.photo.startsWith('http') ? userData.photo : `${import.meta.env.VITE_IMG_KEY}/${userData.photo}`)
        : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

    const handleShare = () => {
        const shareUrl = `https://dayalstock.com/member/${userData?.username}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success("Profile link copied!");
    };

    console.log(userData)

    const tabs = [
        { id: "collections", label: "Collections", icon: LayoutGrid },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-[#050505] transition-colors">
            <div className="mx-auto px-5 lg:px-10 pt-16">

                {/* Profile Header */}
                <div className="flex items-center gap-6 md:gap-8 mb-12">
                    {/* Avatar */}
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-[#111] border border-gray-200 dark:border-white/10 shrink-0">
                        <img
                            src={avatarUrl}
                            alt={userData?.name || "User"}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                {userData?.name || "User"}
                            </h1>
                            <button 
                                onClick={handleShare}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors w-fit"
                            >
                                <Share2 size={14} />
                                Share
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm font-medium">
                            <MapPin size={16} className="text-gray-400 dark:text-gray-500" />
                            <span>{userData?.country || "NULL"}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-white/10 transition-colors">
                    <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 py-4 border-b-2 font-semibold text-[15px] transition-colors whitespace-nowrap ${activeTab === tab.id
                                            ? "border-orange-500 dark:border-[#00D4FF] text-orange-500 dark:text-[#00D4FF]"
                                            : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                                        }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="py-8">
                    {activeTab === "collections" && (
                        <PublicCollectionsDashboard username={username} />
                    )}
                    {activeTab === "following" && (
                        <FollowingDashboard />
                    )}


                </div>

            </div>
        </div>
    );
};

export default MemberPage;