import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import {
  FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiX, FiAlertTriangle,
  FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiBriefcase, FiLock,
  FiCheckCircle, FiClock, FiAlertCircle, FiAward, FiActivity,
  FiCalendar, FiCheckSquare, FiFilter, FiRefreshCw, FiUsers,
  FiCheck, FiUserCheck
} from 'react-icons/fi';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  phone: '',
  designation: 'Senior QA Reviewer',
  employment_type: 'Full-time',
  employment_status: 'Active',
  status: 'active',
  joining_date: new Date().toISOString().split('T')[0],
  shift_start: '09:00:00',
  shift_end: '17:00:00',
};

const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />}
      {children}
    </div>
  </div>
);

export default function ReviewerDirectory() {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState('existing'); // 'existing' | 'new'
  const [allStaffList, setAllStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  
  const [selectedReviewer, setSelectedReviewer] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Team Management State
  const [teamStaffList, setTeamStaffList] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState(new Set());
  const [staffSearch, setStaffSearch] = useState('');

  const fetchStaffList = async () => {
    try {
      const res = await axios.get(`${API_BASE}api/admin/staff/get_all_staff.php`);
      if (res.data?.status === 'success') {
        setAllStaffList(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
    }
  };

  const fetchReviewers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}api/admin/reviewer/get_all_reviewers.php`);
      if (res.data?.status === 'success') {
        setReviewers(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching reviewers:', err);
      toast.error('Failed to load reviewers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviewers();
    fetchStaffList();
  }, []);

  const filteredReviewers = reviewers.filter(r => {
    const matchSearch =
      (r.name && r.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.reviewer_code && r.reviewer_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.email && r.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.designation && r.designation.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    const accStatus = (r.status || 'active').toLowerCase();
    const empStatus = (r.employment_status || 'active').toLowerCase();

    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return accStatus === 'active' && empStatus === 'active';
    if (statusFilter === 'inactive') return accStatus === 'inactive' || empStatus === 'inactive';
    if (statusFilter === 'probation') return empStatus === 'probation';
    return true;
  });

  // Open Create
  const handleOpenCreate = () => {
    setFormData(EMPTY_FORM);
    setSelectedStaffId('');
    setCreateMode('existing');
    setFormError('');
    setCreateOpen(true);
    fetchStaffList();
  };

  // Submit Create (Supports both Existing Staff and New User)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (createMode === 'existing') {
      if (!selectedStaffId) {
        setFormError('Please select a staff member to assign as reviewer.');
        return;
      }

      setActionLoading(true);
      try {
        const payload = {
          existing_user_id: selectedStaffId,
          designation: formData.designation || 'Senior QA Reviewer',
          shift_start: formData.shift_start || '09:00:00',
          shift_end: formData.shift_end || '17:00:00',
          employment_status: formData.status === 'active' ? 'Active' : 'Suspended',
          employment_type: formData.employment_type || 'Full-time',
          joining_date: formData.joining_date || new Date().toISOString().split('T')[0]
        };

        const res = await axios.post(`${API_BASE}api/admin/reviewer/create_reviewer.php`, payload);
        if (res.data?.status === 'success') {
          toast.success(res.data.message || 'Staff assigned as Reviewer successfully!');
          setCreateOpen(false);
          await fetchReviewers();
        } else {
          setFormError(res.data?.message || 'Failed to assign reviewer.');
        }
      } catch (err) {
        setFormError(err.response?.data?.message || 'Server error assigning reviewer.');
      } finally {
        setActionLoading(false);
      }
      return;
    }

    // New user mode
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Name, email, and password are required.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/reviewer/create_reviewer.php`, formData);
      if (res.data?.status === 'success') {
        toast.success(`Reviewer ${formData.name} created successfully!`);
        setCreateOpen(false);
        await fetchReviewers();
      } else {
        setFormError(res.data?.message || 'Failed to create reviewer.');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Server error creating reviewer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit
  const handleOpenEdit = (reviewer) => {
    setSelectedReviewer(reviewer);
    setFormData({
      user_id: reviewer.id,
      name: reviewer.name || '',
      email: reviewer.email || '',
      password: '',
      phone: reviewer.phone || '',
      designation: reviewer.designation || 'Senior QA Reviewer',
      employment_type: reviewer.employment_type || 'Full-time',
      employment_status: reviewer.employment_status || 'Active',
      status: reviewer.status || 'active',
      joining_date: reviewer.joining_date || '',
      shift_start: reviewer.shift_start || '09:00:00',
      shift_end: reviewer.shift_end || '17:00:00',
    });
    setFormError('');
    setEditOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.name || !formData.email) {
      setFormError('Name and email are required.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/reviewer/update_reviewer.php`, {
        ...formData,
        user_id: selectedReviewer.id
      });
      if (res.data?.status === 'success') {
        toast.success(`Reviewer ${formData.name} updated successfully!`);
        setEditOpen(false);
        await fetchReviewers();
      } else {
        setFormError(res.data?.message || 'Failed to update reviewer.');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Server error updating reviewer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Team Management Modal
  const handleOpenTeamModal = async (reviewer) => {
    setSelectedReviewer(reviewer);
    setTeamModalOpen(true);
    setTeamLoading(true);
    setStaffSearch('');

    try {
      const res = await axios.get(`${API_BASE}api/admin/reviewer/get_reviewer_team.php?reviewer_user_id=${reviewer.id}`);
      if (res.data?.status === 'success') {
        const list = res.data.data || [];
        setTeamStaffList(list);

        // Pre-select currently assigned staff
        const initialSelected = new Set();
        list.forEach(staff => {
          if (staff.is_assigned == 1) {
            initialSelected.add(staff.user_id);
          }
        });
        setSelectedStaffIds(initialSelected);
      }
    } catch (err) {
      console.error('Error fetching reviewer team:', err);
      toast.error('Failed to load team members.');
    } finally {
      setTeamLoading(false);
    }
  };

  // Toggle Staff in Team Selection
  const toggleStaffSelection = (userId) => {
    setSelectedStaffIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  // Save Team Assignments
  const handleSaveTeam = async () => {
    if (!selectedReviewer) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/reviewer/assign_reviewer_team.php`, {
        reviewer_user_id: selectedReviewer.id,
        staff_user_ids: Array.from(selectedStaffIds)
      });
      if (res.data?.status === 'success') {
        toast.success(`Team updated! Assigned ${res.data.assigned_count} staff member(s) to ${selectedReviewer.name}.`);
        setTeamModalOpen(false);
        await fetchReviewers();
      } else {
        toast.error(res.data?.message || 'Failed to assign team.');
      }
    } catch (err) {
      toast.error('Server error saving team assignments.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Reviewer
  const handleOpenDelete = (reviewer) => {
    setSelectedReviewer(reviewer);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedReviewer) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/reviewer/delete_reviewer.php`, {
        user_id: selectedReviewer.id
      });
      if (res.data?.status === 'success') {
        toast.success('Reviewer account deleted.');
        setDeleteOpen(false);
        await fetchReviewers();
      } else {
        toast.error(res.data?.message || 'Delete failed.');
      }
    } catch (err) {
      toast.error('Server error deleting reviewer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered staff inside team modal
  const filteredStaffForTeam = teamStaffList.filter(s => {
    const term = staffSearch.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(term)) ||
      (s.employee_code && s.employee_code.toLowerCase().includes(term)) ||
      (s.designation && s.designation.toLowerCase().includes(term)) ||
      (s.department_name && s.department_name.toLowerCase().includes(term))
    );
  });

  // Stats
  const totalCount = reviewers.length;
  const activeCount = reviewers.filter(r => (r.status || 'active').toLowerCase() === 'active').length;
  const totalCompletedReviews = reviewers.reduce((sum, r) => sum + (parseInt(r.completed_reviews_count) || 0), 0);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FiAward size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Reviewer Directory
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage QA reviewers, assign team staff members, and track evaluation output.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReviewers}
            className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-2xl transition-all shadow-xs"
            title="Refresh list"
          >
            <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-950/20 flex items-center gap-2 active:scale-95"
          >
            <FiUserPlus size={16} />
            <span>Add New Reviewer</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Reviewers</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <FiUser size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Reviewers</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <FiCheckCircle size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Reviews Evaluated</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalCompletedReviews}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
            <FiCheckSquare size={22} />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name, code (REV-), email..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Reviewers' },
            { id: 'active', label: 'Active' },
            { id: 'probation', label: 'Probation' },
            { id: 'inactive', label: 'Inactive' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reviewer Cards Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <div className="w-10 h-10 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">Loading Reviewers...</p>
        </div>
      ) : filteredReviewers.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700">
          <FiAward className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No Reviewers Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm ? 'No reviewer matched your search criteria.' : 'No reviewer accounts have been created yet. Click "Add New Reviewer" above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReviewers.map(rev => {
            const isActive = (rev.status || 'active').toLowerCase() === 'active';
            const assignedStaffCount = parseInt(rev.assigned_staff_count) || 0;

            return (
              <div
                key={rev.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-emerald-950/20 shrink-0">
                        {rev.name ? rev.name.charAt(0).toUpperCase() : 'R'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {rev.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                            {rev.reviewer_code || `REV-${rev.id}`}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isActive ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {isActive ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(rev)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Edit Reviewer"
                      >
                        <FiEdit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(rev)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete Reviewer"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Info details */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Designation:</span>
                      <span className="font-semibold">{rev.designation || 'Senior Reviewer'}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-mono text-[11px] truncate max-w-[180px]">{rev.email}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Shift Hours:</span>
                      <span className="font-semibold">{rev.shift_start?.substring(0, 5)} - {rev.shift_end?.substring(0, 5)}</span>
                    </div>
                  </div>

                  {/* Assigned Team Staff Badge & Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                      onClick={() => handleOpenTeamModal(rev)}
                      className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-xl flex items-center justify-between transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <FiUsers size={13} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600">
                          {assignedStaffCount} Staff Assigned
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                        Manage Team →
                      </span>
                    </button>
                  </div>
                </div>

                {/* Bottom Stats */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Approved</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {rev.completed_reviews_count || 0}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Rejected</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                      {rev.rejected_reviews_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Manage Team Assignment Modal ── */}
      {teamModalOpen && selectedReviewer && createPortal(
        <div 
          className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden relative z-10">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    <FiUsers size={16} />
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    Assign Staff Team to {selectedReviewer.name}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select the staff members whose task submissions will go directly to this reviewer.
                </p>
              </div>

              <button
                onClick={() => setTeamModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Search & Quick Actions */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 bg-white dark:bg-slate-800">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={e => setStaffSearch(e.target.value)}
                  placeholder="Search staff by name, code, department..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const allIds = new Set(teamStaffList.map(s => s.user_id));
                    setSelectedStaffIds(allIds);
                  }}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStaffIds(new Set())}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-bold rounded-lg transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Modal Body / Staff List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2">
              {teamLoading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-400">Loading staff list...</p>
                </div>
              ) : filteredStaffForTeam.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No staff found matching "{staffSearch}".
                </div>
              ) : (
                filteredStaffForTeam.map(staff => {
                  const isSelected = selectedStaffIds.has(staff.user_id);
                  const hasOtherManager = staff.reporting_manager_id && staff.reporting_manager_id != selectedReviewer.id;

                  return (
                    <div
                      key={staff.user_id}
                      onClick={() => toggleStaffSelection(staff.user_id)}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-600/50 shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                        }`}>
                          {isSelected && <FiCheck size={12} strokeWidth={3} />}
                        </div>

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                          {staff.name ? staff.name.charAt(0).toUpperCase() : 'S'}
                        </div>

                        {/* Staff Info */}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {staff.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="font-mono">{staff.employee_code || 'STA'}</span>
                            {staff.designation && <span>• {staff.designation}</span>}
                            {staff.department_name && <span>• {staff.department_name}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Current assignment status badge */}
                      <div className="shrink-0 text-right">
                        {isSelected ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold inline-flex items-center gap-1">
                            <FiUserCheck size={10} /> Assigned
                          </span>
                        ) : hasOtherManager ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-[10px] font-medium">
                            Under: {staff.current_manager_name || 'Other Reviewer'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Selected: <span className="text-emerald-600 font-black">{selectedStaffIds.size}</span> staff member(s)
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTeamModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTeam}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {actionLoading ? 'Saving Team...' : 'Save Team Assignments'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Create / Edit Modal ── */}
      {(createOpen || editOpen) && createPortal(
        <div 
          className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700 overflow-hidden relative z-10">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {editOpen ? 'Edit Reviewer Account' : 'Add New Reviewer Account'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {editOpen ? 'Update reviewer credentials, timing, and status.' : 'Reviewers have direct access to evaluate submissions.'}
                </p>
              </div>
              <button
                onClick={() => { setCreateOpen(false); setEditOpen(false); }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={editOpen ? handleEditSubmit : handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Mode Switcher (Only on Create) */}
              {createOpen && !editOpen && (
                <div className="flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => { setCreateMode('existing'); setFormError(''); }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      createMode === 'existing'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <FiUsers size={14} />
                    <span>Select Existing Staff</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCreateMode('new'); setFormError(''); }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      createMode === 'new'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <FiUserPlus size={14} />
                    <span>Create New User</span>
                  </button>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs rounded-xl border border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
                  <FiAlertCircle size={15} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* ── EXISTING STAFF SELECTION MODE ── */}
              {createOpen && !editOpen && createMode === 'existing' ? (
                <>
                  <Field label="Choose Staff Member *" icon={FiUser}>
                    <select
                      required
                      value={selectedStaffId}
                      onChange={e => {
                        const sid = e.target.value;
                        setSelectedStaffId(sid);
                        const s = allStaffList.find(item => String(item.id) === String(sid));
                        if (s) {
                          setFormData(prev => ({
                            ...prev,
                            designation: s.designation || 'Senior QA Reviewer',
                            shift_start: s.shift_start || '09:00:00',
                            shift_end: s.shift_end || '17:00:00',
                          }));
                        }
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Select an active staff member --</option>
                      {allStaffList.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.employee_code || `STA-${s.id}`}) — {s.department_name || 'Staff'} ({s.designation || 'Employee'})
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <FiCheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
                      Dual Role Assignment
                    </p>
                    <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400/90 leading-relaxed">
                      This staff member will now have access to both the <strong>Staff Portal</strong> (to submit tasks) and the <strong>Reviewer Portal</strong> (to review deliverables) using their existing login password.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Reviewer Designation" icon={FiBriefcase}>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="Senior QA Reviewer"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </Field>

                    <Field label="Account Status">
                      <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value, employment_status: e.target.value === 'active' ? 'Active' : 'Suspended' })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Shift Start Time" icon={FiClock}>
                      <input
                        type="time"
                        value={formData.shift_start}
                        onChange={e => setFormData({ ...formData, shift_start: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </Field>

                    <Field label="Shift End Time" icon={FiClock}>
                      <input
                        type="time"
                        value={formData.shift_end}
                        onChange={e => setFormData({ ...formData, shift_end: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </Field>
                  </div>
                </>
              ) : (
                /* ── NEW USER OR EDIT FORM ── */
                <>
                  <Field label="Full Name *" icon={FiUser}>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Email Address *" icon={FiMail}>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="reviewer@academy.com"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </Field>

                    <Field label="Phone Number" icon={FiPhone}>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+880 1700-000000"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </Field>
                  </div>

                  <Field
                    label={editOpen ? "Password (leave blank to keep current)" : "Password *"}
                    icon={FiLock}
                  >
                    <input
                      type={showPass ? "text" : "password"}
                      required={!editOpen}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editOpen ? "••••••••" : "Minimum 6 characters"}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                    </button>
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Designation" icon={FiBriefcase}>
                      <input
                        type="text"
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="Senior QA Reviewer"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </Field>

                    <Field label="Status">
                      <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value, employment_status: e.target.value === 'active' ? 'Active' : 'Suspended' })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Joining Date">
                      <input
                        type="date"
                        value={formData.joining_date}
                        onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </Field>

                    <Field label="Shift Start">
                      <input
                        type="time"
                        value={formData.shift_start}
                        onChange={e => setFormData({ ...formData, shift_start: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </Field>

                    <Field label="Shift End">
                      <input
                        type="time"
                        value={formData.shift_end}
                        onChange={e => setFormData({ ...formData, shift_end: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </Field>
                  </div>
                </>
              )}

              {/* Modal Footer inside form */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setCreateOpen(false); setEditOpen(false); }}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {actionLoading ? 'Saving...' : (editOpen ? 'Update Reviewer' : (createMode === 'existing' ? 'Assign Reviewer Role' : 'Create Reviewer'))}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteOpen && selectedReviewer && createPortal(
        <div 
          className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 dark:border-slate-700">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white text-center">
              Delete Reviewer Account?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1.5">
              Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-slate-200">{selectedReviewer.name}</span> ({selectedReviewer.reviewer_code})? This action cannot be undone.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {actionLoading ? 'Deleting...' : 'Delete Reviewer'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
