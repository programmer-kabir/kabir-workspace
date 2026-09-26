import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiSearch, FiUserPlus, FiEdit2, FiTrash2, FiX, FiAlertTriangle,
  FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiBriefcase, FiLock,
  FiCheckCircle, FiClock, FiAlertCircle, FiXCircle, FiCalendar, FiTarget, FiActivity, FiMapPin, FiHash, FiClock as FiShift
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '',
  role: 'staff', department_id: '', designation: '', employment_type: 'Full-time',
  employment_status: 'active', status: 'active',
  joining_date: '', resignation_date: '',
  shift_start: '09:00:00', shift_end: '17:00:00', allocated_break_minutes: 60,
  has_tiffin_break: 1, tiffin_start_time: '13:20', tiffin_end_time: '14:00', tiffin_duration_minutes: 40,
};

// ── Role badge ───────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const styles = {
    staff:      'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    manager:    'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    instructor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${styles[role] || 'bg-slate-100 text-slate-600'}`}>
      {role || 'staff'}
    </span>
  );
};

// ── Status badge ─────────────────────────────────────────────────────────────
const EmploymentStatusBadge = ({ status, accountStatus }) => {
  const s = (status || 'active').toLowerCase();
  let badgeStyle = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30';
  let label = 'Active';

  if (s === 'probation') {
    badgeStyle = 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-500/30';
    label = 'Probation';
  } else if (s === 'resigned') {
    badgeStyle = 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30';
    label = 'Resigned';
  } else if (s === 'terminated') {
    badgeStyle = 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/30';
    label = 'Terminated';
  } else if (s === 'on_leave') {
    badgeStyle = 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/30';
    label = 'On Leave';
  } else if (s === 'suspended') {
    badgeStyle = 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-500/30';
    label = 'Suspended';
  } else if (s === 'inactive' || accountStatus === 'inactive' || accountStatus === 'suspended') {
    badgeStyle = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600';
    label = s === 'inactive' ? 'Inactive' : 'Suspended';
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${badgeStyle}`}>
      {label}
    </span>
  );
};

// ── Input helper ─────────────────────────────────────────────────────────────
const Field = ({ label, icon: Icon, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />}
      {children}
    </div>
  </div>
);

// ── Staff Form Modal ──────────────────────────────────────────────────────────
const StaffModal = ({ mode, formData, setFormData, departments, onClose, onSubmit, loading }) => {
  const [showPass, setShowPass] = useState(false);
  const isEdit = mode === 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {isEdit ? 'Update staff profile, job status, and tenure.' : 'Fill in the details to create a new staff account.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">

            {/* Name */}
            <Field label="Full Name *" icon={FiUser}>
              <input
                type="text" required value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </Field>

            {/* Email */}
            <Field label="Email Address *" icon={FiMail}>
              <input
                type="email" required value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </Field>

            {/* Password */}
            <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'} icon={FiLock}>
              <input
                type={showPass ? 'text' : 'password'}
                required={!isEdit}
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder={isEdit ? '••••••••' : 'Min 6 characters'}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                {showPass ? <FiEyeOff size={14} /> : <FiEye size={14} />}
              </button>
            </Field>

            {/* Phone */}
            <Field label="Phone Number" icon={FiPhone}>
              <input
                type="text" value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+880 1XXXXXXXXX"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </Field>

            {/* Role */}
            <Field label="Role *" icon={FiBriefcase}>
              <select
                required value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="instructor">Instructor</option>
              </select>
            </Field>

            {/* Department */}
            <Field label="Department">
              <select
                value={formData.department_id}
                onChange={e => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">— None —</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>

            {/* Designation */}
            <Field label="Designation">
              <input
                type="text" value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Senior Designer"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </Field>

            {/* Employment Type */}
            <Field label="Employment Type">
              <select
                value={formData.employment_type}
                onChange={e => setFormData({ ...formData, employment_type: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Intern</option>
              </select>
            </Field>

            {/* Employment Status */}
            <Field label="Employment Status">
              <select
                value={formData.employment_status || 'active'}
                onChange={e => {
                  const val = e.target.value;
                  const sLower = val.toLowerCase();
                  const autoInactive = (sLower === 'resigned' || sLower === 'terminated' || sLower === 'inactive' || sLower === 'suspended');
                  setFormData({
                    ...formData,
                    employment_status: val,
                    status: autoInactive ? 'inactive' : (formData.status === 'inactive' ? 'active' : formData.status)
                  });
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="Active">Active (Working)</option>
                <option value="Probation">Probation (Trial Period)</option>
                <option value="Resigned">Resigned (Left Job)</option>
                <option value="Terminated">Terminated (Discharged)</option>
                <option value="On Leave">On Leave</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </Field>

            {/* Account Status (Login Access) */}
            <Field label="Account Login Status">
              <select
                value={formData.status || 'active'}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="active">Active (Can Log In)</option>
                <option value="inactive">Inactive / Suspended (Login Blocked)</option>
              </select>
            </Field>

            {/* Joining Date */}
            <Field label="Joining Date">
              <input
                type="date" value={formData.joining_date || ''}
                onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              />
            </Field>

            {/* Resignation / End Date */}
            <Field label="End Date / Resignation Date">
              <input
                type="date" value={formData.resignation_date || ''}
                onChange={e => setFormData({ ...formData, resignation_date: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              />
            </Field>

            {/* Shift Start Time */}
            <Field label="Shift Start">
              <input
                type="time" value={formData.shift_start}
                onChange={e => setFormData({ ...formData, shift_start: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              />
            </Field>

            {/* Shift End Time */}
            <Field label="Shift End">
              <input
                type="time" value={formData.shift_end}
                onChange={e => setFormData({ ...formData, shift_end: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
              />
            </Field>

            {/* Allocated Break Minutes */}
            <Field label="Break Limit (Mins)">
              <input
                type="number" min="0" value={formData.allocated_break_minutes}
                onChange={e => setFormData({ ...formData, allocated_break_minutes: e.target.value })}
                placeholder="e.g. 60"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </Field>

            {/* Tiffin Break Setting */}
            <Field label="Has Tiffin Break?">
              <select
                value={formData.has_tiffin_break}
                onChange={e => setFormData({ ...formData, has_tiffin_break: parseInt(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              >
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
            </Field>

            {formData.has_tiffin_break === 1 && (
              <>
                {/* Tiffin Start Time */}
                <Field label="Tiffin Start">
                  <input
                    type="time" value={formData.tiffin_start_time}
                    onChange={e => setFormData({ ...formData, tiffin_start_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                  />
                </Field>

                {/* Tiffin End Time */}
                <Field label="Tiffin End">
                  <input
                    type="time" value={formData.tiffin_end_time}
                    onChange={e => setFormData({ ...formData, tiffin_end_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                  />
                </Field>

                {/* Tiffin Duration */}
                <Field label="Tiffin Duration (Mins)">
                  <input
                    type="number" min="0" value={formData.tiffin_duration_minutes}
                    onChange={e => setFormData({ ...formData, tiffin_duration_minutes: e.target.value })}
                    placeholder="e.g. 40"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </Field>
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-8 py-5 border-t border-slate-100">
          <button
            type="button" onClick={onClose}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
            ) : (isEdit ? 'Save Changes' : 'Create Staff Account')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
const DeleteModal = ({ staff, onClose, onConfirm, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
      <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <FiAlertTriangle className="text-red-600" size={24} />
      </div>
      <h2 className="text-xl font-black text-slate-900 text-center mb-2">Delete Staff Member?</h2>
      <p className="text-slate-500 text-center text-sm mb-8">
        You are about to permanently delete <strong className="text-slate-800">{staff?.name}</strong>.
        This will remove their account, roles, and all associated tokens. This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onClose}
          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting...</> : 'Yes, Delete'}
        </button>
      </div>
    </div>
  </div>
);

// ── Main StaffDirectory ───────────────────────────────────────────────────────
const StaffDirectory = () => {
  const [staffList, setStaffList]     = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');

  // Modal state
  const [createOpen, setCreateOpen]   = useState(false);
  const [editOpen, setEditOpen]       = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState('');

  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      const [staffRes, deptRes] = await Promise.all([
        axios.get(`${API_BASE}api/admin/staff/get_all_staff.php`),
        axios.get(`${API_BASE}api/admin/departments/get_departments.php`),
      ]);
      if (staffRes.data.status === 'success') setStaffList(staffRes.data.data);
      if (deptRes.data.status  === 'success') setDepartments(deptRes.data.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const [statusFilter, setStatusFilter] = useState('all');

  const filteredStaff = staffList.filter(s => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.employee_code && s.employee_code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchSearch) return false;

    const empStatus = (s.employment_status || 'active').toLowerCase();
    const accStatus = (s.status || 'active').toLowerCase();

    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return empStatus === 'active' && accStatus === 'active';
    if (statusFilter === 'probation') return empStatus === 'probation';
    if (statusFilter === 'resigned') return empStatus === 'resigned';
    if (statusFilter === 'terminated') return empStatus === 'terminated';
    if (statusFilter === 'on_leave') return empStatus === 'on_leave' || empStatus === 'on leave';
    if (statusFilter === 'inactive') return empStatus === 'inactive' || empStatus === 'suspended' || accStatus === 'inactive' || accStatus === 'suspended';
    return true;
  });

  // ── Create ────────────────────────────────────────────────────────────────
  const openCreate = () => { setFormData(EMPTY_FORM); setFormError(''); setCreateOpen(true); };

  const handleCreate = async () => {
    setFormError('');
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Name, email, and password are required.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/staff/create_staff.php`, formData);
      if (res.data.status === 'success') {
        await fetchAll();
        setCreateOpen(false);
      } else {
        setFormError(res.data.message);
      }
    } catch (err) {
      setFormError('Server error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────
  const openEdit = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      password: '',
      phone: staff.phone || '',
      role: staff.role || 'staff',
      department_id: staff.department_id || '',
      designation: staff.designation || '',
      employment_type: staff.employment_type || 'Full-time',
      employment_status: staff.employment_status || 'active',
      status: staff.status || 'active',
      joining_date: staff.joining_date || '',
      resignation_date: staff.resignation_date || '',
      shift_start: staff.shift_start || '09:00:00',
      shift_end: staff.shift_end || '17:00:00',
      allocated_break_minutes: staff.allocated_break_minutes !== undefined ? staff.allocated_break_minutes : 60,
      has_tiffin_break: staff.has_tiffin_break !== undefined ? staff.has_tiffin_break : 1,
      tiffin_start_time: staff.tiffin_start_time ? staff.tiffin_start_time.substring(0, 5) : '13:20',
      tiffin_end_time: staff.tiffin_end_time ? staff.tiffin_end_time.substring(0, 5) : '14:00',
      tiffin_duration_minutes: staff.tiffin_duration_minutes !== undefined ? staff.tiffin_duration_minutes : 40,
    });
    setFormError('');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    setFormError('');
    if (!formData.name || !formData.email) {
      setFormError('Name and email are required.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/staff/update_staff.php`, {
        ...formData,
        user_id: selectedStaff.id,
      });
      if (res.data.status === 'success') {
        await fetchAll();
        setEditOpen(false);
      } else {
        setFormError(res.data.message);
      }
    } catch {
      setFormError('Server error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const openDelete = (staff) => { setSelectedStaff(staff); setDeleteOpen(true); };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_BASE}api/admin/staff/delete_staff.php`, {
        user_id: selectedStaff.id,
      });
      if (res.data.status === 'success') {
        await fetchAll();
        setDeleteOpen(false);
      } else {
        alert(res.data.message);
      }
    } catch {
      alert('Delete failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Staff Directory</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage all organizational personnel, employment status, and access. <span className="font-bold text-slate-700 dark:text-slate-300">{staffList.length} total members</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Search staff..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-56 md:w-64 shadow-sm transition-colors"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md transition-colors"
          >
            <FiUserPlus />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
        {[
          { id: 'all', label: 'All Staff', count: staffList.length },
          { id: 'active', label: 'Active', count: staffList.filter(s => (s.employment_status || 'active').toLowerCase() === 'active' && s.status === 'active').length },
          { id: 'probation', label: 'Probation', count: staffList.filter(s => (s.employment_status || '').toLowerCase() === 'probation').length },
          { id: 'resigned', label: 'Resigned / Left', count: staffList.filter(s => (s.employment_status || '').toLowerCase() === 'resigned').length },
          { id: 'terminated', label: 'Terminated', count: staffList.filter(s => (s.employment_status || '').toLowerCase() === 'terminated').length },
          { id: 'on_leave', label: 'On Leave', count: staffList.filter(s => (s.employment_status || '').toLowerCase() === 'on_leave' || (s.employment_status || '').toLowerCase() === 'on leave').length },
          { id: 'inactive', label: 'Inactive / Suspended', count: staffList.filter(s => (s.employment_status || '').toLowerCase() === 'inactive' || (s.employment_status || '').toLowerCase() === 'suspended' || s.status === 'inactive' || s.status === 'suspended').length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 active:scale-95 ${
              statusFilter === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 shadow-2xs'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${statusFilter === tab.id ? 'bg-blue-800 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error under form */}
      {formError && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 px-4 py-3 rounded-2xl text-sm font-medium">
          {formError}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs transition-colors">
          <FiUser className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={40} />
          <p className="text-slate-600 dark:text-slate-300 font-bold">No staff members found.</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Try adjusting your search or filter options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStaff.map((staff) => (
            <div 
              key={staff.id} 
              onClick={() => navigate('/staff/' + staff.employee_code)} 
              className="group relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-2xl hover:shadow-blue-500/10 hover:border-blue-400/50 dark:hover:border-blue-500/40 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
              style={{
                boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.04), 0 12px 24px -6px rgba(0, 0, 0, 0.03)'
              }}
            >
              {/* Subtle top light sheen on hover */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* Cover */}
              <div
                className="h-28 bg-cover bg-center relative"
                style={{ backgroundImage: staff.cover_picture ? `url(${API_BASE}${staff.cover_picture})` : 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
              >
                <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
                <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 z-10">
                  <EmploymentStatusBadge status={staff.employment_status} accountStatus={staff.status} />
                </div>
                <div className="absolute -bottom-10 left-6 z-10">
                  <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 p-1 shadow-xl border border-slate-200/60 dark:border-slate-700 transition-transform group-hover:scale-105 duration-300">
                    {staff.profile_picture ? (
                      <img src={`${API_BASE}${staff.profile_picture}`} alt={staff.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-2xl uppercase">
                        {staff.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="pt-12 px-6 pb-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {staff.name}
                    </h3>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">{staff.designation || 'Staff Member'}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <RoleBadge role={staff.role} />
                      {staff.status === 'inactive' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                          Login Blocked
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEdit(staff); }} 
                    className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all active:scale-90 shadow-2xs"
                    title="Edit Profile"
                  >
                    <FiEdit2 size={15} />
                  </button>
                </div>

                <div className="space-y-2 mt-auto pt-2">
                  {[
                    ['Employee ID', staff.employee_code || 'N/A'],
                    ['Department',  staff.department_name || 'N/A'],
                    ['Type',        staff.employment_type || 'N/A'],
                    ['Joined',      staff.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'],
                    ...(staff.resignation_date ? [['Left / End Date', new Date(staff.resignation_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })]] : []),
                    ['Email',       staff.email],
                    ['Phone',       staff.phone || 'N/A'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 dark:text-slate-400 font-bold">{label}</span>
                      <span className="text-slate-700 dark:text-slate-200 font-bold truncate max-w-[170px]" title={value}>{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors uppercase tracking-wider">
                  <span>View Full Profile</span>
                  <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {createOpen && (
        <StaffModal
          mode="create" formData={formData} setFormData={setFormData}
          departments={departments} onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate} loading={actionLoading}
        />
      )}
      {editOpen && (
        <StaffModal
          mode="edit" formData={formData} setFormData={setFormData}
          departments={departments} onClose={() => setEditOpen(false)}
          onSubmit={handleEdit} loading={actionLoading}
        />
      )}
      {deleteOpen && (
        <DeleteModal
          staff={selectedStaff} onClose={() => setDeleteOpen(false)}
          onConfirm={handleDelete} loading={actionLoading}
        />
      )}

          </div>
  );
};

export default StaffDirectory;
