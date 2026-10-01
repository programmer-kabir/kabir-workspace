import { useState, useRef, useEffect } from "react";
import useUsers from "../../utils/Hooks/useUsers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { deleteUser, updateUserRole, updateUserStatus } from "../../api/userApi";
import DayalLoader from "../../components/Common/DayalLoader";
import {
  Search,
  MoreVertical,
  Shield,
  User as UserIcon,
  Calendar,
  Mail,
  RefreshCw,
  Star,
  Zap,
  Award,
  Edit2,
  Trash2,
  X
} from "lucide-react";

const IMG_BASE = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const getInitials = (name) => {
  if (!name) return "U";
  return name.charAt(0).toUpperCase();
};

const RoleBadge = ({ roles = [] }) => {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {roles.map((role) => {
        let bg = "bg-gray-500/10";
        let text = "text-gray-400";
        let border = "border-gray-500/20";
        let Icon = UserIcon;

        const roleLower = role.toLowerCase();

        if (roleLower === "admin") {
          bg = "bg-purple-500/10";
          text = "text-purple-400";
          border = "border-purple-500/20";
          Icon = Shield;
        } else if (roleLower === "manager") {
          bg = "bg-indigo-500/10";
          text = "text-indigo-400";
          border = "border-indigo-500/20";
          Icon = Shield;
        } else if (roleLower === "premium" || roleLower === "pro") {
          bg = "bg-amber-500/10";
          text = "text-amber-400";
          border = "border-amber-500/20";
          Icon = Star;
        } else if (roleLower === "user") {
          bg = "bg-blue-500/10";
          text = "text-blue-400";
          border = "border-blue-500/20";
          Icon = UserIcon;
        }

        return (
          <span
            key={role}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${bg} ${text} ${border}`}
          >
            <Icon size={12} />
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        );
      })}
    </div>
  );
};

const PlanBadge = ({ plan, roles = [] }) => {
  const isAdminOrManager = roles.some(
    (r) => r.toLowerCase() === "admin" || r.toLowerCase() === "manager"
  );

  if (isAdminOrManager) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border bg-purple-500/10 text-purple-400 border-purple-500/20">
        <Shield size={12} />
        Full Access
      </span>
    );
  }

  const planName = plan?.toLowerCase() || "free";
  
  let bg = "bg-gray-500/10";
  let text = "text-gray-400";
  let border = "border-gray-500/20";
  let Icon = UserIcon;

  if (planName === "pro") {
    bg = "bg-amber-500/10";
    text = "text-amber-400";
    border = "border-amber-500/20";
    Icon = Star;
  } else if (planName === "yearly pro") {
    bg = "bg-rose-500/10";
    text = "text-rose-400";
    border = "border-rose-500/20";
    Icon = Award;
  } else if (planName === "starter") {
    bg = "bg-cyan-500/10";
    text = "text-cyan-400";
    border = "border-cyan-500/20";
    Icon = Zap;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${bg} ${text} ${border}`}
    >
      {Icon && <Icon size={12} />}
      {planName === "free" ? "Free" : planName.charAt(0).toUpperCase() + planName.slice(1)}
    </span>
  );
};

const StatusBadge = ({ status = "active" }) => {
  const stLower = (status || "active").toLowerCase();
  let bg = "bg-emerald-500/10";
  let text = "text-emerald-400";
  let border = "border-emerald-500/20";
  let label = "Active";

  if (stLower === "suspended") {
    bg = "bg-purple-500/10";
    text = "text-purple-400";
    border = "border-purple-500/20";
    label = "Suspended";
  } else if (stLower === "banned") {
    bg = "bg-red-500/20";
    text = "text-red-400";
    border = "border-red-500/30";
    label = "Banned";
  } else if (stLower === "deactivated") {
    bg = "bg-gray-500/10";
    text = "text-gray-400";
    border = "border-gray-500/20";
    label = "Deactivated";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${bg} ${text} ${border}`}>
      ● {label}
    </span>
  );
};

const AllUsers = () => {
  const { data: users, isLoading, isError, refetch } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredUsers = (users || []).filter((user) => {
    const matchesSearch = 
      (user.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      
    const userPlan = (user.plan || "Free").toLowerCase();
    const matchesPlan = planFilter === "all" || userPlan === planFilter;

    const userStatus = (user.status || "active").toLowerCase();
    const matchesStatus = statusFilter === "all" || userStatus === statusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Action Menu State
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const dropdownRef = useRef(null);

  // Modals State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("active");

  const queryClient = useQueryClient();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("User deleted successfully");
      setDeleteModalOpen(false);
      queryClient.invalidateQueries(["users"]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete user");
    }
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, roles }) => updateUserRole(userId, roles),
    onSuccess: () => {
      toast.success("User roles updated successfully");
      setRoleModalOpen(false);
      queryClient.invalidateQueries(["users"]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update role");
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, status }) => updateUserStatus(userId, status),
    onSuccess: (data) => {
      toast.success(data.message || "User status updated successfully");
      setStatusModalOpen(false);
      queryClient.invalidateQueries(["users"]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    }
  });

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
    setOpenActionMenuId(null);
  };

  const handleChangeRoleClick = (user) => {
    setSelectedUser(user);
    setSelectedRoles(user.roles || []);
    setRoleModalOpen(true);
    setOpenActionMenuId(null);
  };

  const handleChangeStatusClick = (user) => {
    setSelectedUser(user);
    setSelectedStatus(user.status || "active");
    setStatusModalOpen(true);
    setOpenActionMenuId(null);
  };

  const handleRoleToggle = (role) => {
    setSelectedRoles((prev) => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg, rgba(108,79,224,0.15) 0%, transparent 100%)", border: "1px solid rgba(108,79,224,0.2)" }}>
        <div className="absolute top-[-50%] right-[-10%] h-[300px] w-[300px] rounded-full bg-[#6C4FE0]/20 blur-[100px] pointer-events-none" />
        
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6C4FE0]/20 text-[#6C4FE0]">
              <UserIcon size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">All Users</h1>
              <p className="mt-1 text-sm text-gray-400">
                Manage users and view their active subscription plans.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 rounded-2xl border border-[#6C4FE0]/30 bg-[#6C4FE0]/10 px-4 py-2 font-semibold text-white">
            <span className="text-[#6C4FE0] text-lg">{users?.length || 0}</span>
            <span className="text-gray-300 text-sm">Total Users</span>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-[#6C4FE0]/50 focus:ring-1 focus:ring-[#6C4FE0]/30"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#12121E] px-4 py-2.5 text-sm font-medium text-gray-300 outline-none transition-all focus:border-[#6C4FE0]/50"
          >
            <option value="all">All Subscriptions</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="yearly pro">Yearly Pro</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#12121E] px-4 py-2.5 text-sm font-medium text-gray-300 outline-none transition-all focus:border-[#6C4FE0]/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active 🟢</option>
            <option value="suspended">Suspended 🔴</option>
            <option value="banned">Banned ⛔</option>
            <option value="deactivated">Deactivated ⚪</option>
          </select>

          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition-all hover:bg-white/10 hover:text-white"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:block">Refresh</span>
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="rounded-2xl border border-white/5 bg-[#12121E] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="border-b border-white/10 bg-white/5 text-xs uppercase text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium tracking-wider">User</th>
                <th className="px-6 py-4 font-medium tracking-wider">Role</th>
                <th className="px-6 py-4 font-medium tracking-wider">Plan</th>
                <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium tracking-wider">Joined Date</th>
                <th className="px-6 py-4 font-medium tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <DayalLoader size="sm" text="Loading users..." />
                  </td>
                </tr>
              )}
              
              {isError && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-red-400">
                    Failed to load users. Please try again.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-500 mb-4">
                      <Search size={24} />
                    </div>
                    <p className="text-lg font-medium text-white">No users found</p>
                    <p className="text-gray-500 mt-1">We couldn't find anyone matching your search or filter.</p>
                  </td>
                </tr>
              )}

              {!isLoading && !isError && filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="group transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#6C4FE0]/40 to-[#FF6B6B]/40 p-0.5 shadow-lg">
                        {user.photo ? (
                          <>
                            <img
                              src={user.photo.startsWith('http') ? user.photo : `${IMG_BASE}${user.photo.startsWith('/') ? '' : '/'}${user.photo}`}
                              alt={user.name}
                              className="h-full w-full rounded-full object-cover border-2 border-[#12121E] bg-[#1a1a2e]"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                if (e.target.nextElementSibling) {
                                  e.target.nextElementSibling.style.display = 'flex';
                                }
                              }}
                            />
                            <div className="h-full w-full rounded-full border-2 border-[#12121E] bg-[#1a1a2e] items-center justify-center text-[#6C4FE0] font-bold" style={{ display: 'none' }}>
                              {getInitials(user.name)}
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center rounded-full border-2 border-[#12121E] bg-[#1a1a2e] text-[#6C4FE0] font-bold">
                            {getInitials(user.name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                          <Mail size={12} />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <RoleBadge roles={user.roles} />
                  </td>
                  <td className="px-6 py-4">
                    <PlanBadge plan={user.plan} roles={user.roles} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar size={14} className="text-gray-500" />
                      <span>
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left" ref={openActionMenuId === user.id ? dropdownRef : null}>
                      <button 
                        onClick={() => setOpenActionMenuId(openActionMenuId === user.id ? null : user.id)}
                        className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <MoreVertical size={18} />
                      </button>
                      
                      {openActionMenuId === user.id && (
                        <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-white/10 bg-[#1A1A2E] shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <button
                              onClick={() => handleChangeRoleClick(user)}
                              className="group flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                            >
                              <Edit2 size={16} className="mr-3 text-gray-400 group-hover:text-blue-400" />
                              Change Role
                            </button>
                            <button
                              onClick={() => handleChangeStatusClick(user)}
                              className="group flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                            >
                              <Shield size={16} className="mr-3 text-gray-400 group-hover:text-emerald-400" />
                              Change Status
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="group flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300"
                            >
                              <Trash2 size={16} className="mr-3 text-red-400 group-hover:text-red-300" />
                              Delete User
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121E] p-6 shadow-2xl relative">
            <button onClick={() => setDeleteModalOpen(false)} className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white">
              <X size={20} />
            </button>
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20 text-red-500">
                <Trash2 size={28} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Delete User?</h2>
              <p className="text-sm text-gray-400">
                Are you sure you want to delete <span className="text-white font-semibold">{selectedUser.name}</span>? This action cannot be undone and will remove all their associated data.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                disabled={deleteMutation.isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={() => deleteMutation.mutate(selectedUser.id)}
                className="flex-1 rounded-xl bg-red-500/20 py-3 text-sm font-semibold text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121E] p-6 shadow-2xl relative">
            <button onClick={() => setRoleModalOpen(false)} className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white">
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-2">Change Role</h2>
            <p className="text-sm text-gray-400 mb-6">
              Update role for <span className="text-white font-semibold">{selectedUser.name}</span>
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">Select Roles</label>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-2">
                {[
                  { id: 'user', label: 'User' },
                  { id: 'admin', label: 'Admin' },
                  { id: 'manager', label: 'Manager' },
                  { id: 'pro', label: 'Pro User' },
                  { id: 'premium', label: 'Premium User' }
                ].map((r) => (
                  <label key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={selectedRoles.includes(r.id)}
                      onChange={() => handleRoleToggle(r.id)}
                      className="w-4 h-4 rounded border-gray-500 text-[#6C4FE0] focus:ring-[#6C4FE0] focus:ring-offset-[#1A1A2E] bg-transparent"
                    />
                    <span className="text-sm font-medium text-white">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setRoleModalOpen(false)}
                className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                disabled={roleMutation.isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={() => roleMutation.mutate({ userId: selectedUser.id, roles: selectedRoles })}
                className="flex-1 rounded-xl bg-[#6C4FE0] py-3 text-sm font-semibold text-white hover:bg-[#5a41c2] transition-colors"
                disabled={roleMutation.isLoading || selectedRoles.length === 0}
              >
                {roleMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE STATUS MODAL */}
      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121E] p-6 shadow-2xl relative">
            <button onClick={() => setStatusModalOpen(false)} className="absolute top-4 right-4 rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white">
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-2">Change Status</h2>
            <p className="text-sm text-gray-400 mb-6">
              Update status for <span className="text-white font-semibold">{selectedUser.name}</span>
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">Select Status</label>
              <div className="space-y-2">
                {[
                  { id: 'active', label: 'Active 🟢' },
                  { id: 'suspended', label: 'Suspended 🔴' },
                  { id: 'banned', label: 'Banned ⛔' },
                  { id: 'deactivated', label: 'Deactivated ⚪' }
                ].map((s) => (
                  <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] cursor-pointer hover:bg-white/5 transition-colors">
                    <input 
                      type="radio" 
                      name="status"
                      value={s.id}
                      checked={selectedStatus === s.id}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-4 h-4 border-gray-500 text-[#6C4FE0] focus:ring-[#6C4FE0] focus:ring-offset-[#1A1A2E] bg-transparent"
                    />
                    <span className="text-sm font-medium text-white">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStatusModalOpen(false)}
                className="flex-1 rounded-xl bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                disabled={statusMutation.isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={() => statusMutation.mutate({ userId: selectedUser.id, status: selectedStatus })}
                className="flex-1 rounded-xl bg-[#6C4FE0] py-3 text-sm font-semibold text-white hover:bg-[#5a41c2] transition-colors"
                disabled={statusMutation.isLoading}
              >
                {statusMutation.isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;
