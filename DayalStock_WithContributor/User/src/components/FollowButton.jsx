import React from "react";
import { UserPlus, UserCheck, Loader2, UserMinus } from "lucide-react";
import { useFollowStatus, useToggleFollow } from "../utlis/Hooks/useFollow";
import useAuth from "../utlis/Hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function FollowButton({ authorId, className = "", variant = "primary" }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: statusData } = useFollowStatus(authorId);
  const { mutate: toggleFollow, isPending } = useToggleFollow();

  // If this is the user's own profile, don't show the follow button
  if (user && statusData?.is_own_profile) {
    return null;
  }

  const isFollowing = statusData?.is_following || false;

  const handleFollowClick = () => {
    if (!user) {
      toast.error("Please login to follow creators!");
      navigate("/login");
      return;
    }
    toggleFollow(authorId);
  };

  // Variants styling
  const baseClasses = "group flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300";
  
  let variantClasses = "";
  if (variant === "primary") {
    if (isFollowing) {
      variantClasses = "bg-green-50 text-green-600 hover:bg-red-50 hover:text-red-600 border border-green-100 hover:border-red-200";
    } else {
      variantClasses = "bg-gray-100 text-gray-800 hover:bg-gray-200 border border-transparent";
    }
  } else if (variant === "outline") {
    if (isFollowing) {
      variantClasses = "border border-gray-300 text-gray-700 hover:text-red-600 hover:border-red-300 hover:bg-red-50";
    } else {
      variantClasses = "border border-gray-300 text-gray-700 hover:bg-gray-50";
    }
  }

  return (
    <button 
      onClick={handleFollowClick}
      disabled={isPending}
      className={`${baseClasses} ${variantClasses} ${isPending ? 'opacity-70 cursor-not-allowed' : ''} ${className}`}
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck size={16} className="group-hover:hidden" />
          <UserMinus size={16} className="hidden group-hover:block" />
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus size={16} />
          <span>Follow</span>
        </>
      )}
    </button>
  );
}
