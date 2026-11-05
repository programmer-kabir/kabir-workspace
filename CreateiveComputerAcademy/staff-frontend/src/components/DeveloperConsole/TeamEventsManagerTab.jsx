import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FiCalendar, FiPlus, FiDollarSign, FiUsers, FiCheckCircle,
    FiXCircle, FiClock, FiMapPin, FiFileText, FiTrash2,
    FiExternalLink, FiUploadCloud, FiAlertCircle, FiRefreshCw, FiCheck
} from 'react-icons/fi';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const TeamEventsManagerTab = () => {
    const { currentUser } = useAuth();
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // overview, expenses, contributions, settlement

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [eventStaffList, setEventStaffList] = useState([]);
    const [loadingStaffList, setLoadingStaffList] = useState(false);
    const [inviteSearch, setInviteSearch] = useState('');
    const [selectedToInvite, setSelectedToInvite] = useState([]);
    const [selectedUserForPay, setSelectedUserForPay] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    // Form states
    const [createForm, setCreateForm] = useState({
        title: '',
        event_type: 'feast',
        event_date: new Date().toISOString().split('T')[0],
        location: '',
        description: '',
        estimated_budget: '',
        target_per_head: '',
        collection_number: '',
        collection_note: '',
        allow_guest: 1,
        guest_fee: '',
        banner_image: '',
        invite_scope: 'all'
    });

    const [expenseForm, setExpenseForm] = useState({
        item_name: '',
        category: 'food',
        amount: '',
        paid_by: currentUser?.id || '',
        notes: '',
        receipt_url: '',
        is_self_vouched: 0
    });

    const [paymentForm, setPaymentForm] = useState({
        user_id: '',
        amount: '',
        payment_method: 'cash',
        sender_number: '',
        transaction_id: '',
        notes: '',
        is_verified: true
    });

    const [uploadingFile, setUploadingFile] = useState(false);

    // Fetch all events
    const fetchEvents = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.get(`${API_BASE}api/events/get_events.php`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                const data = res.data.data || [];
                setEvents(data);
                if (!selectedEventId && data.length > 0) {
                    setSelectedEventId(data[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to load events', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Event Details
    const fetchEventDetails = async (eventId) => {
        if (!eventId) return;
        try {
            setDetailsLoading(true);
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.get(`${API_BASE}api/events/get_event_details.php?id=${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                setEventData(res.data);
            }
        } catch (err) {
            console.error('Failed to load event details', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (selectedEventId) {
            fetchEventDetails(selectedEventId);
        }
    }, [selectedEventId]);

    // Fetch staff with invite status
    const fetchEventStaffStatus = async (eventId) => {
        if (!eventId) return;
        try {
            setLoadingStaffList(true);
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.get(`${API_BASE}api/events/manage_invites.php?action=get_event_staff_status&event_id=${eventId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                setEventStaffList(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to load staff list for invite', err);
        } finally {
            setLoadingStaffList(false);
        }
    };

    // Send invitations
    const handleSendInvitations = async (userIds) => {
        if (!selectedEventId || !userIds || userIds.length === 0) return;
        try {
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/manage_invites.php`, {
                action: 'invite_staff',
                event_id: selectedEventId,
                user_ids: userIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                toast.success(res.data.message || 'Invitations sent!');
                setSelectedToInvite([]);
                fetchEventStaffStatus(selectedEventId);
                fetchEventDetails(selectedEventId);
            } else {
                toast.error(res.data.message || 'Failed to send invites');
            }
        } catch (err) {
            toast.error('Failed to send invitations');
        }
    };

    // Uninvite staff
    const handleUninvite = async (userId) => {
        if (!window.confirm('Remove this staff member from the event?')) return;
        try {
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/manage_invites.php`, {
                action: 'uninvite_staff',
                event_id: selectedEventId,
                user_id: userId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                toast.success(res.data.message);
                fetchEventStaffStatus(selectedEventId);
                fetchEventDetails(selectedEventId);
            } else {
                toast.error(res.data.message || 'Failed to uninvite');
            }
        } catch (err) {
            toast.error('Failed to uninvite staff member');
        }
    };

    // Handle Voucher Upload
    const handleFileUpload = async (e, setTargetUrl) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploadingFile(true);
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/upload_event_file.php`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.data.status === 'success') {
                setTargetUrl(res.data.file_url);
                toast.success('File uploaded successfully!');
            } else {
                toast.error(res.data.message || 'Upload failed');
            }
        } catch (err) {
            toast.error('File upload failed');
        } finally {
            setUploadingFile(false);
        }
    };

    // Create Event
    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!createForm.title) {
            toast.error('Event title is required');
            return;
        }
        try {
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/create_event.php`, createForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                toast.success('Event created successfully!');
                setShowCreateModal(false);
                setCreateForm({
                    title: '',
                    event_type: 'feast',
                    event_date: new Date().toISOString().split('T')[0],
                    location: '',
                    description: '',
                    estimated_budget: '',
                    target_per_head: '',
                    collection_number: '',
                    collection_note: '',
                    allow_guest: 1,
                    guest_fee: '',
                    banner_image: '',
                    invite_scope: 'all'
                });
                await fetchEvents();
                if (res.data.event_id) {
                    setSelectedEventId(res.data.event_id);
                }
            } else {
                toast.error(res.data.message || 'Creation failed');
            }
        } catch (err) {
            toast.error('Failed to create event');
        }
    };

    // Log Expense
    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expenseForm.item_name || !expenseForm.amount) {
            toast.error('Item name and amount are required');
            return;
        }
        try {
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/log_expense.php`, {
                ...expenseForm,
                event_id: selectedEventId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                toast.success('Expense recorded successfully!');
                setShowExpenseModal(false);
                setExpenseForm({
                    item_name: '',
                    category: 'food',
                    amount: '',
                    paid_by: currentUser?.id || '',
                    notes: '',
                    receipt_url: '',
                    is_self_vouched: 0
                });
                fetchEventDetails(selectedEventId);
            }
        } catch (err) {
            toast.error('Failed to record expense');
        }
    };

    // Delete Expense
    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm('Are you sure you want to delete this expense record?')) return;
        try {
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/delete_expense.php`, {
                expense_id: expenseId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                toast.success('Expense deleted');
                fetchEventDetails(selectedEventId);
            }
        } catch (err) {
            toast.error('Failed to delete expense');
        }
    };

    // Record Payment
    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!paymentForm.amount) {
            toast.error('Amount is required');
            return;
        }
        try {
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/record_payment.php`, {
                ...paymentForm,
                event_id: selectedEventId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                toast.success(res.data.message);
                setShowPaymentModal(false);
                setPaymentForm({
                    user_id: '',
                    amount: '',
                    payment_method: 'cash',
                    sender_number: '',
                    transaction_id: '',
                    notes: '',
                    is_verified: true
                });
                fetchEventDetails(selectedEventId);
            }
        } catch (err) {
            toast.error('Failed to record payment');
        }
    };

    // Verify Contribution
    const handleVerifyContribution = async (contributionId, action) => {
        try {
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/verify_payment.php`, {
                contribution_id: contributionId,
                action
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                toast.success(res.data.message);
                fetchEventDetails(selectedEventId);
            }
        } catch (err) {
            toast.error('Failed to update contribution status');
        }
    };

    // Settle Event
    const handleSettleEvent = async (markClosed = false) => {
        if (!window.confirm(markClosed ? 'Complete and lock this event settlement?' : 'Recalculate financial breakdown for this event?')) return;
        try {
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/settle_event.php`, {
                event_id: selectedEventId,
                mark_closed: markClosed
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                toast.success(res.data.message);
                fetchEventDetails(selectedEventId);
                fetchEvents();
            } else {
                toast.error(res.data.message || 'Settlement failed');
            }
        } catch (err) {
            toast.error('Settlement calculation failed');
        }
    };

    const currentEvent = eventData?.event;
    const summary = eventData?.summary || {};
    const participants = eventData?.participants || [];
    const expenses = eventData?.expenses || [];
    const contributions = eventData?.contributions || [];

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Developer Suite Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-950 dark:via-cyan-950/40 dark:to-slate-950 p-6 rounded-3xl border border-cyan-500/30 shadow-xl text-white">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/40 text-cyan-400 text-xs font-black uppercase tracking-wider mb-2">
                        <FiCalendar className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                        <span>Event & Feast Management &bull; Admin Suite</span>
                    </div>
                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <span>Team Feasts & Tours Controller</span>
                        <span>🍗🏖️</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                        Create academy tours, invite staff members selectively, approve bKash collections, log itemized expenses, and auto-settle balances.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
                    >
                        <FiPlus size={16} />
                        <span>+ Create New Event</span>
                    </button>
                </div>
            </div>

            {/* Events Selector Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {events.map((ev) => (
                    <button
                        key={ev.id}
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${selectedEventId === ev.id
                            ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-md font-bold'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                            }`}
                    >
                        {ev.banner_image ? (
                            <img
                                src={ev.banner_image.startsWith('http') ? ev.banner_image : `${API_BASE}${ev.banner_image}`}
                                alt={ev.title}
                                className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
                            />
                        ) : (
                            <span className="text-2xl">
                                {ev.event_type === 'tour' ? '🏖️' : ev.event_type === 'feast' ? '🍗' : '🎉'}
                            </span>
                        )}
                        <div>
                            <div className="text-sm font-bold truncate max-w-[180px]">{ev.title}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{ev.event_date}</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] capitalize ${ev.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'}`}>
                                    {ev.status}
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {selectedEventId && currentEvent ? (
                <div className="space-y-6">
                    {/* Event Banner & Quick Metrics */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                            {currentEvent.banner_image ? (
                                <img
                                    src={currentEvent.banner_image.startsWith('http') ? currentEvent.banner_image : `${API_BASE}${currentEvent.banner_image}`}
                                    alt={currentEvent.title}
                                    className="w-full sm:w-36 h-28 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:opacity-95"
                                    onClick={() => setPreviewImage(currentEvent.banner_image.startsWith('http') ? currentEvent.banner_image : `${API_BASE}${currentEvent.banner_image}`)}
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-3xl font-bold shrink-0">
                                    {currentEvent.event_type === 'tour' ? '🏖️' : '🍗'}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 capitalize font-bold">
                                        {currentEvent.event_type}
                                    </span>
                                    <span>📅 {currentEvent.event_date}</span>
                                    <span>📍 {currentEvent.location || 'CCA Campus'}</span>
                                    <span>👤 Lead: <strong>{currentEvent.lead_name || 'Admin'}</strong></span>
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                    {currentEvent.title}
                                </h2>
                                {currentEvent.description && (
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                                        {currentEvent.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Top Financial Pill Counters */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                                <div className="text-[11px] font-bold text-slate-400 uppercase">Total Collected</div>
                                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                    ৳{summary.total_collected || 0}
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                                <div className="text-[11px] font-bold text-slate-400 uppercase">Total Spent</div>
                                <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                                    ৳{summary.total_spent || 0}
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                                <div className="text-[11px] font-bold text-slate-400 uppercase">Cash In Hand</div>
                                <div className={`text-lg font-black ${(summary.cash_in_hand || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600'}`}>
                                    ৳{summary.cash_in_hand || 0}
                                </div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-center">
                                <div className="text-[11px] font-bold text-slate-400 uppercase">Confirmed Heads</div>
                                <div className="text-lg font-black text-purple-600 dark:text-purple-400">
                                    {summary.active_heads || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Tabs Navigation */}
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'overview'
                                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-black'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                        >
                            Staff & RSVP ({participants.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('expenses')}
                            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'expenses'
                                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-black'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                        >
                            Expenses & Vouchers ({expenses.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('contributions')}
                            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'contributions'
                                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-black'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                        >
                            Contributions & bKash ({contributions.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('settlement')}
                            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'settlement'
                                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-black'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                        >
                            Final Settlement & Math
                        </button>
                    </div>

                    {/* TAB 1: OVERVIEW & PARTICIPANTS */}
                    {activeTab === 'overview' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-base">
                                        Staff Attendance & Contribution Status
                                    </h3>
                                    <p className="text-xs text-slate-400">
                                        Target per head: <strong>৳{currentEvent.target_per_head || 0}</strong> &bull; Total participants: {participants.length}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            fetchEventStaffStatus(selectedEventId);
                                            setShowInviteModal(true);
                                        }}
                                        className="px-4 py-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all"
                                    >
                                        <FiUsers size={14} />
                                        <span>+ Manage Invites (কাকে কাকে নিবেন)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                        <tr>
                                            <th className="p-3.5">Staff Member</th>
                                            <th className="p-3.5">RSVP Status</th>
                                            <th className="p-3.5">Guests</th>
                                            <th className="p-3.5">Total Paid</th>
                                            <th className="p-3.5">Settlement Balance</th>
                                            <th className="p-3.5 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {participants.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="p-8 text-center text-slate-400">
                                                    No participants added yet. Click "+ Manage Invites" to invite staff members.
                                                </td>
                                            </tr>
                                        ) : (
                                            participants.map(p => (
                                                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                    <td className="p-3.5 flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs uppercase">
                                                            {p.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                                                            <div className="text-[11px] text-slate-400">{p.phone || p.email}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            p.rsvp_status === 'going'
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : p.rsvp_status === 'not_going'
                                                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                        }`}>
                                                            {p.rsvp_status === 'going' ? 'Going 😋' : p.rsvp_status === 'not_going' ? 'Not Going ✕' : 'Invited ⏳'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5">
                                                        {p.guest_count > 0 ? (
                                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">+{p.guest_count} guest</span>
                                                        ) : (
                                                            <span className="text-slate-400">None</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                                                        ৳{p.total_paid || 0}
                                                    </td>
                                                    <td className="p-3.5">
                                                        {parseFloat(p.balance) > 0 ? (
                                                            <span className="text-emerald-600 font-bold">+৳{p.balance} (Refund)</span>
                                                        ) : parseFloat(p.balance) < 0 ? (
                                                            <span className="text-rose-600 font-bold">-৳{Math.abs(p.balance)} (Due)</span>
                                                        ) : (
                                                            <span className="text-slate-400 font-medium">৳0</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 text-right space-x-2">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUserForPay(p.user_id);
                                                                setPaymentForm(prev => ({ ...prev, user_id: p.user_id, amount: currentEvent.target_per_head || '' }));
                                                                setShowPaymentModal(true);
                                                            }}
                                                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            + Record Cash
                                                        </button>
                                                        {p.user_id !== currentEvent.created_by && (!p.total_paid || parseFloat(p.total_paid) === 0) && (
                                                            <button
                                                                onClick={() => handleUninvite(p.user_id)}
                                                                className="px-2 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                                                title="Uninvite"
                                                            >
                                                                Uninvite
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: EXPENSE LEDGER */}
                    {activeTab === 'expenses' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 dark:text-white">Itemized Vouchers & Cost Log</h3>
                                <button
                                    onClick={() => setShowExpenseModal(true)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <FiPlus size={14} />
                                    <span>Add Expense</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {expenses.length === 0 ? (
                                    <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
                                        No expense records added yet. Click "+ Add Expense" to log biryani, transport, or groceries.
                                    </div>
                                ) : (
                                    expenses.map(ex => (
                                        <div key={ex.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                            {ex.category}
                                                        </span>
                                                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{ex.item_name}</h4>
                                                        <p className="text-xs text-slate-400">Paid by: <span className="font-medium text-slate-700 dark:text-slate-300">{ex.paid_by_name}</span></p>
                                                    </div>
                                                    <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                                                        ৳{parseFloat(ex.amount).toLocaleString()}
                                                    </div>
                                                </div>
                                                {ex.notes && (
                                                    <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mt-2">
                                                        {ex.notes}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                                {ex.receipt_url ? (
                                                    <button
                                                        onClick={() => setPreviewImage(ex.receipt_url.startsWith('http') ? ex.receipt_url : `${API_BASE}${ex.receipt_url}`)}
                                                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                                    >
                                                        <FiFileText size={13} />
                                                        <span>View Receipt 📸</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400 italic">No receipt attached</span>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteExpense(ex.id)}
                                                    className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                                    title="Delete Expense"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 3: CONTRIBUTIONS */}
                    {activeTab === 'contributions' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 dark:text-white">bKash, Nagad & Cash Contributions</h3>
                                <div className="text-xs text-slate-400">
                                    Total Collected: <strong className="text-emerald-600">৳{summary.total_collected || 0}</strong>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                                        <tr>
                                            <th className="p-3.5">Contributor</th>
                                            <th className="p-3.5">Method</th>
                                            <th className="p-3.5">Amount</th>
                                            <th className="p-3.5">TrxID / Number</th>
                                            <th className="p-3.5">Status</th>
                                            <th className="p-3.5 text-right">Verify</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {contributions.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="p-8 text-center text-slate-400">
                                                    No payments recorded yet.
                                                </td>
                                            </tr>
                                        ) : (
                                            contributions.map(c => (
                                                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                                    <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                                                        {c.user_name}
                                                    </td>
                                                    <td className="p-3.5 uppercase font-bold text-slate-600 dark:text-slate-300 text-xs">
                                                        {c.payment_method}
                                                    </td>
                                                    <td className="p-3.5 font-bold text-emerald-600">
                                                        ৳{c.amount}
                                                    </td>
                                                    <td className="p-3.5 text-slate-500 font-mono text-xs">
                                                        {c.transaction_id || c.sender_number || '-'}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                            c.status === 'verified'
                                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : c.status === 'rejected'
                                                                    ? 'bg-rose-100 text-rose-800'
                                                                    : 'bg-amber-100 text-amber-800'
                                                        }`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-right">
                                                        {c.status === 'pending' ? (
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => handleVerifyContribution(c.id, 'verify')}
                                                                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                                                    title="Verify"
                                                                >
                                                                    <FiCheck size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleVerifyContribution(c.id, 'reject')}
                                                                    className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
                                                                    title="Reject"
                                                                >
                                                                    <FiXCircle size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">
                                                                Verified by {c.verified_by_name || 'Admin'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: FINAL SETTLEMENT SHEET */}
                    {activeTab === 'settlement' && (
                        <div className="space-y-4">
                            <div className="p-5 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-cyan-900 dark:text-cyan-200 text-base">
                                        Automated Split Math & Refund/Due Ledger
                                    </h3>
                                    <p className="text-xs text-cyan-700 dark:text-cyan-300/80 mt-0.5">
                                        Total Spent ৳{summary.total_spent} divided among {summary.active_heads} active heads = <strong>৳{summary.actual_per_head}</strong> per head.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleSettleEvent(false)}
                                        className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-cyan-300 text-cyan-700 dark:text-cyan-300 text-xs font-bold hover:bg-cyan-50 shadow-xs cursor-pointer"
                                    >
                                        Recalculate Math
                                    </button>
                                    <button
                                        onClick={() => handleSettleEvent(true)}
                                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black shadow-md cursor-pointer"
                                    >
                                        Finalize & Close Event
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                                        <tr>
                                            <th className="p-3.5">Staff</th>
                                            <th className="p-3.5">Heads</th>
                                            <th className="p-3.5">Paid Amount</th>
                                            <th className="p-3.5">Share Cost</th>
                                            <th className="p-3.5">Status / Balance</th>
                                            <th className="p-3.5">Action Plan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {participants.filter(p => p.rsvp_status === 'going').map(p => {
                                            const heads = 1 + parseInt(p.guest_count || 0);
                                            const targetCost = Math.round(heads * (summary.actual_per_head || 0));
                                            const diff = (parseFloat(p.total_paid || 0)) - targetCost;

                                            return (
                                                <tr key={p.id}>
                                                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                                                        {p.name}
                                                    </td>
                                                    <td className="p-3.5">{heads}</td>
                                                    <td className="p-3.5 font-semibold text-emerald-600">
                                                        ৳{p.total_paid || 0}
                                                    </td>
                                                    <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                                                        ৳{targetCost}
                                                    </td>
                                                    <td className="p-3.5">
                                                        {diff > 0 ? (
                                                            <span className="text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                                                                Refund ৳{diff}
                                                            </span>
                                                        ) : diff < 0 ? (
                                                            <span className="text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg">
                                                                Due ৳{Math.abs(diff)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 font-bold">Settled (৳0)</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 text-xs text-slate-500">
                                                        {diff > 0
                                                            ? `Organizer must refund ৳${diff} to ${p.name}`
                                                            : diff < 0
                                                                ? `${p.name} owes ৳${Math.abs(diff)} to Organizer`
                                                                : 'Balanced'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : events.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto text-3xl">
                        🎉
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        No Team Events Created Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                        Ready for an academy outing or biryani feast? Click "+ Create New Event" above to create an event and invite staff.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 inline-flex items-center gap-2 cursor-pointer transition-all"
                    >
                        <FiPlus size={16} />
                        <span>Create Your First Event</span>
                    </button>
                </div>
            ) : (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 font-medium">Select an event above to view full details.</p>
                </div>
            )}

            {/* CREATE EVENT MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Create Team Event / Feast</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs sm:text-sm">
                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Event Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Grand Kacchi Biryani Party 🍗 or Sajek Tour 🏖️"
                                    value={createForm.title}
                                    onChange={e => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Event Type</label>
                                    <select
                                        value={createForm.event_type}
                                        onChange={e => setCreateForm(prev => ({ ...prev, event_type: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    >
                                        <option value="feast">Feast / Biryani Party 🍗</option>
                                        <option value="tour">Tour / Outing 🏖️</option>
                                        <option value="sports">Sports Match 🏏</option>
                                        <option value="celebration">Celebration 🎉</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Date</label>
                                    <input
                                        type="date"
                                        value={createForm.event_date}
                                        onChange={e => setCreateForm(prev => ({ ...prev, event_date: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Target Per Head (৳)</label>
                                    <input
                                        type="number"
                                        placeholder="800"
                                        value={createForm.target_per_head}
                                        onChange={e => setCreateForm(prev => ({ ...prev, target_per_head: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Venue / Location</label>
                                    <input
                                        type="text"
                                        placeholder="CCA Lounge"
                                        value={createForm.location}
                                        onChange={e => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Collection bKash/Nagad Number</label>
                                <input
                                    type="text"
                                    placeholder="017xxxxxxxx (bKash Personal / Send Money)"
                                    value={createForm.collection_number}
                                    onChange={e => setCreateForm(prev => ({ ...prev, collection_number: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                />
                            </div>

                            {/* BANNER / COVER PHOTO DROPZONE */}
                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                    Event Cover Photo / Picture 📷
                                </label>
                                {createForm.banner_image ? (
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm group">
                                        <img
                                            src={createForm.banner_image.startsWith('http') ? createForm.banner_image : `${API_BASE}${createForm.banner_image}`}
                                            alt="Cover Preview"
                                            className="w-full h-32 object-cover"
                                        />
                                        <div className="absolute top-2 left-2 bg-emerald-500/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs flex items-center gap-1">
                                            <FiCheck size={12} />
                                            <span>Cover Photo Ready</span>
                                        </div>
                                        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                                            <label className="cursor-pointer px-2.5 py-1 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold rounded-lg shadow-sm backdrop-blur-xs transition-all flex items-center gap-1.5">
                                                <FiUploadCloud size={13} />
                                                <span>Change</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={e => handleFileUpload(e, url => setCreateForm(prev => ({ ...prev, banner_image: url })))}
                                                />
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setCreateForm(prev => ({ ...prev, banner_image: '' }))}
                                                className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg shadow-sm backdrop-blur-xs transition-all cursor-pointer"
                                                title="Remove Image"
                                            >
                                                <FiTrash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className={`relative flex flex-col items-center justify-center w-full h-32 px-4 py-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                                        uploadingFile
                                            ? 'border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20 animate-pulse'
                                            : 'border-slate-300 hover:border-cyan-500 dark:border-slate-700 dark:hover:border-cyan-400 bg-slate-50/70 hover:bg-cyan-50/30 dark:bg-slate-800/40 dark:hover:bg-slate-800/80'
                                    }`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploadingFile}
                                            onChange={e => handleFileUpload(e, url => setCreateForm(prev => ({ ...prev, banner_image: url })))}
                                        />
                                        {uploadingFile ? (
                                            <div className="flex flex-col items-center gap-2 text-cyan-600 dark:text-cyan-400">
                                                <FiRefreshCw className="animate-spin" size={24} />
                                                <span className="text-xs font-bold">Uploading Cover Photo...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-center gap-1.5 pointer-events-none">
                                                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs">
                                                    <FiUploadCloud size={20} />
                                                </div>
                                                <div>
                                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                        Click to upload cover photo / banner
                                                    </span>
                                                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                                        PNG, JPG, WEBP (e.g. Biryani feast or Tour landscape)
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </label>
                                )}
                            </div>

                            {/* INVITATION SCOPE */}
                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                    Invitation Scope (কাদের ইনভাইট করবেন?) 👥
                                </label>
                                <select
                                    value={createForm.invite_scope}
                                    onChange={e => setCreateForm(prev => ({ ...prev, invite_scope: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                >
                                    <option value="all">Invite All Active Staff (সবাইকে ইনভাইট পাঠানো হবে)</option>
                                    <option value="none">Only Me / Creator (পরে বেছে বেছে ইনভাইট করবো)</option>
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    {createForm.invite_scope === 'all'
                                        ? 'Everyone will receive an instant invitation notification with Accept/Decline options.'
                                        : 'Only you can see this event initially. You can invite specific staff members later via "Manage Invites".'}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black cursor-pointer shadow-md"
                                >
                                    Create Event
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LOG EXPENSE MODAL */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Record Event Expense</h3>
                            <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs sm:text-sm">
                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Item Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 15 Packets Biryani, Bus Advance"
                                    value={expenseForm.item_name}
                                    onChange={e => setExpenseForm(prev => ({ ...prev, item_name: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Category</label>
                                    <select
                                        value={expenseForm.category}
                                        onChange={e => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    >
                                        <option value="food">Food & Drinks 🍗</option>
                                        <option value="transport">Transport 🚌</option>
                                        <option value="snacks">Snacks & Tea ☕</option>
                                        <option value="misc">Miscellaneous</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Amount (৳) *</label>
                                    <input
                                        type="number"
                                        placeholder="4500"
                                        value={expenseForm.amount}
                                        onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Receipt File */}
                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Receipt Photo (Voucher)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleFileUpload(e, url => setExpenseForm(prev => ({ ...prev, receipt_url: url })))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                />
                                {expenseForm.receipt_url && (
                                    <div className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                        <FiCheck /> Receipt Uploaded
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowExpenseModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                                >
                                    Save Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RECORD CASH PAYMENT MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Record Cash Contribution</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-3 text-xs sm:text-sm">
                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Staff Member</label>
                                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-white">
                                    {participants.find(p => p.user_id === selectedUserForPay)?.name || 'Selected Staff'}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Amount (৳) *</label>
                                    <input
                                        type="number"
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Method</label>
                                    <select
                                        value={paymentForm.payment_method}
                                        onChange={e => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    >
                                        <option value="cash">Cash (In Hand)</option>
                                        <option value="bkash">bKash</option>
                                        <option value="nagad">Nagad</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Notes (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Paid in office"
                                    value={paymentForm.notes}
                                    onChange={e => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                                >
                                    Confirm & Record
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MANAGE INVITES MODAL */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Manage Event Invitations</span>
                                    <span className="text-sm font-normal text-slate-400">(কাকে কাকে নিবেন)</span>
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Send personal invitations & notifications for <strong>{currentEvent?.title}</strong>
                                </p>
                            </div>
                            <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                        </div>

                        {/* Search & Bulk Actions */}
                        <div className="flex items-center justify-between gap-3">
                            <input
                                type="text"
                                placeholder="Search staff by name or designation..."
                                value={inviteSearch}
                                onChange={e => setInviteSearch(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                            />
                            {selectedToInvite.length > 0 && (
                                <button
                                    onClick={() => handleSendInvitations(selectedToInvite)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shrink-0 shadow-xs transition-all cursor-pointer"
                                >
                                    Send {selectedToInvite.length} Invite(s)
                                </button>
                            )}
                        </div>

                        {/* Staff List */}
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-2 max-h-96">
                            {loadingStaffList ? (
                                <div className="p-8 text-center text-slate-400 text-xs">Loading staff list...</div>
                            ) : eventStaffList.filter(s => s.name.toLowerCase().includes(inviteSearch.toLowerCase()) || (s.designation || '').toLowerCase().includes(inviteSearch.toLowerCase())).length === 0 ? (
                                <div className="p-8 text-center text-slate-400 text-xs">No matching staff found.</div>
                            ) : (
                                eventStaffList
                                    .filter(s => s.name.toLowerCase().includes(inviteSearch.toLowerCase()) || (s.designation || '').toLowerCase().includes(inviteSearch.toLowerCase()))
                                    .map(s => {
                                        const isAlreadyInvited = Boolean(s.is_invited && s.is_invited !== '0' && s.is_invited !== 0);
                                        const isSelected = selectedToInvite.includes(s.id);

                                        return (
                                            <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                                                <div className="flex items-center gap-3">
                                                    {!isAlreadyInvited && (
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={e => {
                                                                if (e.target.checked) {
                                                                    setSelectedToInvite(prev => [...prev, s.id]);
                                                                } else {
                                                                    setSelectedToInvite(prev => prev.filter(id => id !== s.id));
                                                                }
                                                            }}
                                                            className="w-4 h-4 rounded text-blue-600"
                                                        />
                                                    )}
                                                    <div className="w-9 h-9 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                        {s.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{s.name}</div>
                                                        <div className="text-[11px] text-slate-400">{s.designation} {s.employee_code ? `• ${s.employee_code}` : ''}</div>
                                                    </div>
                                                </div>

                                                <div>
                                                    {isAlreadyInvited ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                                s.rsvp_status === 'going'
                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                                    : s.rsvp_status === 'not_going'
                                                                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                            }`}>
                                                                {s.rsvp_status === 'going' ? 'Going 😋' : s.rsvp_status === 'not_going' ? 'Declined ✕' : 'Invited ⏳'}
                                                            </span>
                                                            {(!s.total_paid || parseFloat(s.total_paid) === 0) && (
                                                                <button
                                                                    onClick={() => handleUninvite(s.id)}
                                                                    className="text-xs text-rose-500 hover:underline cursor-pointer ml-1"
                                                                >
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleSendInvitations([s.id])}
                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white dark:bg-blue-950 dark:hover:bg-blue-600 dark:text-blue-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
                                                        >
                                                            + Send Invite
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <span className="text-slate-400">
                                Staff who are not invited will not see this event on their portal.
                            </span>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VOUCHER PHOTO PREVIEW MODAL */}
            {previewImage && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={() => setPreviewImage(null)}>
                    <div className="max-w-2xl w-full bg-white dark:bg-slate-900 p-2 rounded-2xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <img src={previewImage} alt="Voucher" className="w-full h-auto max-h-[80vh] object-contain rounded-xl" />
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 cursor-pointer"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamEventsManagerTab;

