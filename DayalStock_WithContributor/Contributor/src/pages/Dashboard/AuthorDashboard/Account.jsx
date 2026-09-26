import { useEffect, useState, useRef } from "react";
import { User, Shield, Camera } from "lucide-react";
import useAuth from "../../../utlis/Hooks/useAuth";
import { toast } from "react-toastify";
import useAuthorByEmail from "../../../utlis/Hooks/useAuthorByEmail";

const Account = () => {
  const { user, updateUserProfile } = useAuth();


  const { data: author } = useAuthorByEmail(user?.email);
  console.log(author)
  const currentUser = author
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  useEffect(() => {
    if (!currentUser) return;

    // eslint-disable-next-line
    setDisplayName(currentUser.name || currentUser.author_name || "");
    setBio(currentUser.bio || currentUser.author_bio || "");

    // API/DB তে ভুল করে "website " নাম আসলেও কাজ করবে
    setWebsite(currentUser.website || currentUser["website "] || currentUser.author_website || "");
  }, [currentUser]);
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateUserProfile({
        displayName: displayName,
      });

      const formData = new FormData();
      formData.append("email", user?.email);
      formData.append("name", displayName);
      formData.append("bio", bio);
      formData.append("website", website);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const apiUrl = import.meta.env.VITE_LOCALHOST_KEY || "https://api.dayalstock.com/api_v1";
      const token = await user.getIdToken();
      const response = await fetch(`${apiUrl}/author/update_author.php`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Profile details saved successfully!");
        setIsEditing(false);
      } else {
        toast.error("Failed to update DB: " + result.message);
      }
    } catch (error) {
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
      const fileExtension = file.name.split(".").pop().toLowerCase();
      const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

      if (!allowedExtensions.includes(fileExtension)) {
        toast.error("Avatar must be JPG, JPEG, PNG, or WEBP.");
        return;
      }
      if (file.size > MAX_AVATAR_SIZE) {
        toast.error("Avatar file size exceeds the 5MB limit.");
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setIsEditing(true); // Switch to edit mode automatically when picking an image
    }
  };
const authorWebsite =
  currentUser?.website ||
  currentUser?.["website "] ||
  currentUser?.author_website ||
  "";

  const imageBaseUrl =  "https://api.dayalstock.com/";

const rawAvatar = currentUser?.photo || currentUser?.avatar || "";
const authorAvatar = rawAvatar
  ? (rawAvatar.startsWith("http") ? rawAvatar : `${imageBaseUrl}${rawAvatar.replace(/^\/+/, "")}`)
  : "";

const profileAvatar = authorAvatar || user?.photoURL;
  return (
    <div className="space-y-6">

      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white">Account Settings</h2>
        <p className="text-sm text-gray-400">Manage your profile, public information, and security options</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

        {/* LEFT COLUMN: EDIT FORM */}
        <div className="lg:col-span-2 space-y-6">

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-bold text-white">
                <User size={18} className="text-[#6C4FE0]" />
                <span>Public Profile</span>
              </h3>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg bg-[#6C4FE0]/10 px-4 py-1.5 text-sm font-semibold text-[#6C4FE0] transition-all hover:bg-[#6C4FE0]/20"
                >
                  Edit Info
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">Display Name *</label>
                {!isEditing ? (
                  <p className="text-sm text-white px-4 py-3 bg-black/10 rounded-xl">{currentUser?.name || currentUser?.author_name || "N/A"}</p>
                ) : (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-[#6C4FE0]"
                    required
                  />
                )}
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">Email Address (Primary)</label>
                <p className="text-sm text-gray-500 px-4 py-3 bg-black/10 rounded-xl">{user?.email || "contributor@dayalstock.com"}</p>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">Short Biography</label>
                {!isEditing ? (
                  <p className="text-sm text-white px-4 py-3 bg-black/10 rounded-xl min-h-[4rem] whitespace-pre-wrap">
                    {currentUser?.bio || currentUser?.author_bio || "No biography provided."}
                  </p>
                ) : (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-white outline-none focus:border-[#6C4FE0] resize-none"
                  />
                )}
              </div>

              {/* Website URL */}
             <div className="space-y-1">
  <label className="text-xs font-semibold text-gray-400 uppercase">
    Personal Website
  </label>

  {!isEditing ? (
    <div className="text-sm text-white px-4 py-3 bg-black/10 rounded-xl">
      {authorWebsite ? (
        <a
          href={
            authorWebsite.startsWith("http")
              ? authorWebsite
              : `https://${authorWebsite}`
          }
          target="_blank"
          rel="noreferrer"
          className="text-[#6C4FE0] hover:underline break-all"
        >
          {authorWebsite}
        </a>
      ) : (
        "N/A"
      )}
    </div>
  ) : (
    <input
      type="url"
      value={website}
      onChange={(e) => setWebsite(e.target.value)}
      placeholder="https://yourwebsite.com"
      className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none focus:border-[#6C4FE0]"
    />
  )}
</div>

              {/* Submit */}
              {isEditing && (
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-12 w-full max-w-[200px] items-center justify-center rounded-xl bg-gradient-to-r from-[#6C4FE0] to-[#FF6B6B] font-bold text-white shadow-lg shadow-[#6C4FE0]/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setDisplayName(currentUser?.name || currentUser?.author_name || "");
                      setBio(currentUser?.author_bio || "");
                      setWebsite(currentUser?.author_website || "");
                    }}
                    disabled={submitting}
                    className="flex h-12 w-full max-w-[150px] items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              )}

            </form>
          </div>



        </div>

        {/* RIGHT COLUMN: AVATAR CHANGE */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center space-y-6">
          <h3 className="text-base font-bold text-white">Profile Photo</h3>

          <div className="relative mx-auto h-32 w-32 rounded-full border-2 border-white/10 p-1 bg-white/5">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-[#6C4FE0] to-[#FF6B6B] text-white overflow-hidden">
  {avatarPreview || profileAvatar ? (
    <img
      src={avatarPreview || profileAvatar}
      alt={currentUser?.name || user?.displayName || "Avatar"}
      className="h-full w-full object-cover"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <User size={48} />
  )}
</div>
            {/* Camera Overlay */}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-900 border border-gray-200 shadow-md hover:bg-gray-100 active:scale-[0.9] transition-transform"
            >
              <Camera size={16} />
            </button>
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">{user?.displayName || "Contributor"}</h4>
            <p className="text-xs text-gray-500">Joined June 2026</p>
          </div>

          <div className="rounded-xl border border-[#6C4FE0]/25 bg-[#6C4FE0]/5 p-4 flex gap-3 text-left text-xs text-gray-400">
            <Shield size={24} className="flex-shrink-0 text-[#6C4FE0]" />
            <span>Identity verified as **Contributor**. You will earn 45% royalties from downloads of premium vectors/photos.</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Account;
