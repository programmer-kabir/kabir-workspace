import { useEffect, useState } from "react";
import {
  Camera,
  KeyRound,
  Loader2,
  Save,
  UserRound,
  Phone,
  MapPin,
  IdCard,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../../../Provider/AuthProvider";
import useUsers from "../../../utils/Hooks/useUsers";

const API = import.meta.env.VITE_LOCALHOST_KEY;

const Account = () => {
  const { user } = useAuth();
  const { isUsersLoading, refetch, users = [] } = useUsers();

  const currentUser = users.find((u) => String(u?.id) === String(user?.id));

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    address: "",
    photo: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser?.name || "",
        mobile: currentUser?.mobile || "",
        address: currentUser?.address || "",
        photo: currentUser?.photo || "",
      });
      setImageFailed(false);
    }
  }, [currentUser]);

  const resolvePhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
      return photoPath;
    }
    const cleanPath = photoPath.replace(/^uploads\//, "");
    const base = (
      import.meta.env.VITE_IMG_KEY || "http://localhost/supplylink/uploads"
    ).replace(/\/+$/, "");
    return `${base}/${cleanPath}`;
  };

  const handleProfileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("শুধুমাত্র ছবি আপলোড করা যাবে (JPG/PNG/WEBP)");
      return;
    }

    setUploadingPhoto(true);
    const uploadForm = new FormData();
    uploadForm.append("photo", file);
    uploadForm.append("user_id", currentUser?.id);

    try {
      const res = await fetch(`${API}/users/uploadProfilePhoto.php`, {
        method: "POST",
        body: uploadForm,
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "ছবি আপলোড করা যায়নি");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        photo: data.photo,
      }));
      setImageFailed(false);

      toast.success("প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে 🎉");
      refetch();
    } catch (error) {
      toast.error("ছবি আপলোড করতে সমস্যা হয়েছে");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return toast.error("নাম দেওয়া আবশ্যক");
    }

    if (!formData.mobile.trim()) {
      return toast.error("মোবাইল নম্বর দেওয়া আবশ্যক");
    }

    setSavingProfile(true);

    try {
      const res = await fetch(`${API}/users/updateProfile.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUser?.id,
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          address: formData.address.trim(),
          photo: formData.photo,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        toast.error(data.message || "প্রোফাইল আপডেট করা যায়নি");
        return;
      }

      toast.success("প্রোফাইল সফলভাবে আপডেট হয়েছে 🎉");
      refetch();
    } catch (error) {
      toast.error("প্রোফাইল আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      return toast.error("বর্তমান পাসওয়ার্ড দিন");
    }

    if (passwordData.newPassword.length < 6) {
      return toast.error("নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে");
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("নতুন দুটি পাসওয়ার্ড মিলছে না");
    }

    setSavingPassword(true);

    try {
      const res = await fetch(`${API}/users/changePassword.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        return toast.error(data.message || "পাসওয়ার্ড পরিবর্তন করা যায়নি");
      }

      toast.success(data.message || "পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে 🎉");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে");
    } finally {
      setSavingPassword(false);
    }
  };

  if (isUsersLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-orange-500" size={38} />
        <p className="text-slate-400 text-sm">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl bg-[#0f1b2d] border border-white/10 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-3">
          <UserRound size={24} />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          ইউজার পাওয়া যায়নি
        </h3>
        <p className="text-sm text-slate-400">
          আপনার অ্যাকাউন্ট ইনফরমেশন খুঁজে পাওয়া যাচ্ছে না। পুনরায় লগইন করে চেষ্টা করুন।
        </p>
      </div>
    );
  }

  const photoUrl = resolvePhotoUrl(formData.photo);
  const userInitial = currentUser?.name?.trim()?.charAt(0) || "U";

  return (
    <div className="mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-orange-400 mb-1">
            <Sparkles size={14} />
            <span>ACCOUNT SETTINGS</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            My Account
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            আপনার ব্যক্তিগত তথ্য এবং সিকিউরিটি পাসওয়ার্ড এখান থেকে পরিচালনা করুন।
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Account
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Profile Card */}
        <div className="bg-[#0f1b2d] border border-white/10 rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Ambient card top gradient */}
          <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent pointer-events-none" />

          <div className="p-6 relative z-10 flex flex-col items-center text-center">
            {/* Profile Avatar with Glowing Border */}
            <div className="relative mt-2">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-orange-500/20 border-2 border-orange-500/40 bg-[#071025] flex items-center justify-center shadow-2xl">
                {!imageFailed && photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={currentUser?.name}
                    className="w-full h-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white text-3xl font-extrabold select-none">
                    {userInitial}
                  </div>
                )}
              </div>

              {/* Upload photo trigger */}
              <label
                title="Change Photo"
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/40 cursor-pointer hover:scale-105 active:scale-95 transition-all"
              >
                {uploadingPhoto ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <Camera size={16} />
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                />
              </label>
            </div>

            {/* Name & Mobile */}
            <h2 className="mt-4 text-xl font-bold text-white tracking-wide">
              {currentUser?.name}
            </h2>
            <p className="text-sm text-slate-400 font-mono mt-0.5 flex items-center justify-center gap-1.5">
              <Phone size={13} className="text-orange-400/80" />
              {currentUser?.mobile}
            </p>

            {/* Roles Badges */}
            <div className="flex flex-wrap justify-center gap-1.5 mt-3.5">
              {currentUser?.roles?.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 text-xs font-semibold rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 capitalize tracking-wider"
                >
                  {role}
                </span>
              ))}
            </div>

            {/* Quick Metadata Stats */}
            <div className="w-full grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/10 text-left">
              <div className="bg-[#071025]/70 border border-white/5 rounded-xl p-3">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  User ID
                </span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block">
                  #{currentUser?.id}
                </span>
              </div>

              <div className="bg-[#071025]/70 border border-white/5 rounded-xl p-3">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  ID Number
                </span>
                <span className="text-base font-bold text-white font-mono mt-0.5 block">
                  {currentUser?.id_number || "-"}
                </span>
              </div>
            </div>

            {/* Address preview */}
            {currentUser?.address && (
              <div className="w-full mt-3 bg-[#071025]/40 border border-white/5 rounded-xl p-3 text-left flex items-start gap-2">
                <MapPin size={15} className="text-orange-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300 line-clamp-2">
                  {currentUser?.address}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <form
            onSubmit={handleProfileSubmit}
            className="bg-[#0f1b2d] border border-white/10 rounded-2xl shadow-xl p-5 md:p-6 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                  <UserRound size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Profile Information
                  </h2>
                  <p className="text-xs text-slate-400">
                    আপনার ব্যক্তিগত বিবরণ আপডেট করুন
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UserRound size={13} className="text-orange-400" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleProfileChange}
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all outline-none"
                  placeholder="আপনার পূর্ণ নাম লিখুন"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone size={13} className="text-orange-400" />
                  Mobile Number
                </label>
                <input
                  type="text"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleProfileChange}
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 text-sm font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all outline-none"
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <MapPin size={13} className="text-orange-400" />
                  Address
                </label>
                <textarea
                  rows="3"
                  name="address"
                  value={formData.address}
                  onChange={handleProfileChange}
                  className="w-full bg-[#071025] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-500 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all outline-none resize-none"
                  placeholder="আপনার ঠিকানা লিখুন"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <IdCard size={13} className="text-slate-500" />
                  User ID (Read Only)
                </label>
                <input
                  value={currentUser?.id || ""}
                  disabled
                  className="w-full bg-[#071025]/50 border border-white/5 rounded-xl px-4 py-2.5 text-slate-400 text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <IdCard size={13} className="text-slate-500" />
                  ID Number (Read Only)
                </label>
                <input
                  value={currentUser?.id_number || ""}
                  disabled
                  className="w-full bg-[#071025]/50 border border-white/5 rounded-xl px-4 py-2.5 text-slate-400 text-sm font-mono cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                disabled={savingProfile}
                type="submit"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-orange-500/25 transition-all cursor-pointer text-sm"
              >
                {savingProfile ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Save size={17} />
                )}
                Save Profile
              </button>
            </div>
          </form>

          {/* Password Form */}
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-[#0f1b2d] border border-white/10 rounded-2xl shadow-xl p-5 md:p-6 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Change Password
                  </h2>
                  <p className="text-xs text-slate-400">
                    অ্যাকাউন্ট সুরক্ষিত রাখতে শক্তিশালী পাসওয়ার্ড ব্যবহার করুন
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck size={15} className="text-emerald-400" />
                <span>Min 6 characters</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Current Password */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 block">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-[#071025] border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-white placeholder:text-slate-500 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all outline-none"
                    placeholder="বর্তমান পাসওয়ার্ড"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 block">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-[#071025] border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-white placeholder:text-slate-500 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all outline-none"
                    placeholder="কমপক্ষে ৬ অক্ষর"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full bg-[#071025] border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-white placeholder:text-slate-500 text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all outline-none"
                    placeholder="পুনরায় লিখুন"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                disabled={savingPassword}
                type="submit"
                className="inline-flex items-center gap-2 bg-[#1b263b] hover:bg-[#25334d] border border-white/10 active:scale-95 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg transition-all cursor-pointer text-sm"
              >
                {savingPassword ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <KeyRound size={17} />
                )}
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Account;