import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FiCalendar, FiPlus, FiDollarSign, FiUsers, FiCheckCircle,
    FiXCircle, FiClock, FiMapPin, FiFileText, FiTrash2,
    FiExternalLink, FiUploadCloud, FiAlertCircle, FiRefreshCw, FiCheck
} from 'react-icons/fi';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const TeamEvents = () => {
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
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
            const res = await axios.get(`${API_BASE}api/events/get_events.php`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                const evList = res.data.data || [];
                setEvents(evList);
                if (evList.length > 0 && !selectedEventId) {
                    setSelectedEventId(evList[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to load events', err);
            toast.error('Failed to load team events');
        } finally {
            setLoading(false);
        }
    };

    // Fetch single event details
    const fetchEventDetails = async (id) => {
        if (!id) return;
        try {
            setDetailsLoading(true);
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
            const res = await axios.get(`${API_BASE}api/events/get_event_details.php?id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                setEventData(res.data);
            }
        } catch (err) {
            console.error('Failed to load event details', err);
            toast.error('Failed to load event details');
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
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
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
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
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
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
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
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
            const res = await axios.post(`${API_BASE}api/events/upload_event_file.php`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            if (res.data.status === 'success') {
                setTargetUrl(res.data.file_url);
                toast.success('File voucher uploaded successfully!');
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
        if (!createForm.title.trim()) {
            toast.error('Please enter an event title');
            return;
        }
        try {
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
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
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
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
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
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
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
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
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
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
            const token = localStorage.getItem('cca_admin_token') || localStorage.getItem('cca_token');
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
        <div className="p-4 sm:p-6  mx-auto space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Team Feasts & Tours</span>
                        <span className="text-xl">🎉</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Organize academy tours, biryani feasts, track real-world cash & bKash collections and auto-split expenses.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
                    >
                        <FiPlus size={16} />
                        <span>Create New Event</span>
                    </button>
                </div>
            </div>

            {/* Events Selector Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {events.map((ev) => (
                    <button
                        key={ev.id}
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left shrink-0 transition-all ${selectedEventId === ev.id
                            ? 'bg-blue-50 border-blue-500 text-blue-900 dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-200 shadow-xs'
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
                                <span className="capitalize px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 font-medium text-[10px]">
                                    {ev.status}
                                </span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Selected Event Details Area */}
            {selectedEventId && currentEvent ? (
                <div className="space-y-6">
                    {/* Executive Overview Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                            <span className="text-xs text-slate-400 font-medium">Total Collected (চাঁদা)</span>
                            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                                ৳{summary.total_collected?.toLocaleString() || '0'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Cash & Mobile Wallet</div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                            <span className="text-xs text-slate-400 font-medium">Total Spent (মোট খরচ)</span>
                            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                                ৳{summary.total_spent?.toLocaleString() || '0'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Approved vouchers</div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                            <span className="text-xs text-slate-400 font-medium">Cash in Hand (হাতে জমা)</span>
                            <div className={`text-xl sm:text-2xl font-black mt-1 ${summary.cash_in_hand >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'
                                }`}>
                                ৳{summary.cash_in_hand?.toLocaleString() || '0'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                                {summary.cash_in_hand >= 0 ? 'Surplus Available' : 'Deficit / Shortage'}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
                            <span className="text-xs text-slate-400 font-medium">Active Heads (লোকসংখ্যা)</span>
                            <div className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400 mt-1">
                                {summary.active_heads || 0}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                                {summary.confirmed_staff || 0} Staff + {summary.total_guests || 0} Guests
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 lg:col-span-1">
                            <span className="text-xs text-slate-400 font-medium">Per Head Cost (জনপ্রতি)</span>
                            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                                ৳{summary.actual_per_head || '0'}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                                Target: ৳{currentEvent.target_per_head || 0}
                            </div>
                        </div>
                    </div>

                    {/* Event Instructions Banner */}
                    <div className="bg-linear-to-r from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            {currentEvent.banner_image && (
                                <img
                                    src={currentEvent.banner_image.startsWith('http') ? currentEvent.banner_image : `${API_BASE}${currentEvent.banner_image}`}
                                    alt={currentEvent.title}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border-2 border-white/30 shadow-md cursor-pointer hover:opacity-90"
                                    onClick={() => setPreviewImage(currentEvent.banner_image.startsWith('http') ? currentEvent.banner_image : `${API_BASE}${currentEvent.banner_image}`)}
                                />
                            )}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-white/20 text-xs rounded-md font-bold uppercase tracking-wider">
                                        {currentEvent.event_type}
                                    </span>
                                    <span className="text-xs opacity-80">📍 {currentEvent.location || 'Creative Computer Academy'}</span>
                                    <span className="text-xs opacity-80">📅 {currentEvent.event_date}</span>
                                </div>
                                <h2 className="text-xl font-bold">{currentEvent.title}</h2>
                                {currentEvent.collection_number && (
                                    <div className="text-xs font-semibold bg-white/10 px-3 py-1.5 rounded-lg inline-block mt-1">
                                        📱 Official Collection Number: <span className="font-bold underline">{currentEvent.collection_number}</span> {currentEvent.collection_note && `(${currentEvent.collection_note})`}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={() => setShowExpenseModal(true)}
                                className="px-3.5 py-2 bg-white text-blue-800 hover:bg-blue-50 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                            >
                                <FiPlus size={14} />
                                <span>+ Log Expense</span>
                            </button>

                            <button
                                onClick={() => {
                                    setPaymentForm(prev => ({ ...prev, user_id: currentUser?.id }));
                                    setShowPaymentModal(true);
                                }}
                                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                            >
                                <FiDollarSign size={14} />
                                <span>+ Record Payment</span>
                            </button>

                            <button
                                onClick={() => handleSettleEvent(false)}
                                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                                title="Calculate per-head split & balances"
                            >
                                <FiRefreshCw size={14} />
                                <span>Auto-Split Math</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-sm font-semibold">
                        {[
                            { key: 'overview', label: `Staff & RSVP (${participants.length})` },
                            { key: 'expenses', label: `Expense Ledger (৳${summary.total_spent || 0})` },
                            { key: 'contributions', label: `Payments & TrxID (৳${summary.total_collected || 0})` },
                            { key: 'settlement', label: 'Final Settlement Sheet' }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`py-3 border-b-2 transition-colors cursor-pointer ${activeTab === tab.key
                                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* TAB 1: OVERVIEW & PARTICIPANTS */}
                    {activeTab === 'overview' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">Staff Attendance & Invitations</h3>
                                    <p className="text-[11px] text-slate-400">Total Confirmed: {summary.confirmed_staff} • Invited: {participants.length}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        fetchEventStaffStatus(selectedEventId);
                                        setShowInviteModal(true);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs self-start sm:self-auto cursor-pointer"
                                >
                                    <FiUsers size={14} />
                                    <span>Manage Invites (কাকে কাকে নিবেন)</span>
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold">
                                        <tr>
                                            <th className="p-3.5">Staff Name</th>
                                            <th className="p-3.5">RSVP Status</th>
                                            <th className="p-3.5">Guests</th>
                                            <th className="p-3.5">Total Paid (চাঁদা)</th>
                                            <th className="p-3.5 text-right">Quick Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {participants.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs uppercase">
                                                        {p.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div>{p.name}</div>
                                                        <div className="text-[11px] text-slate-400">{p.phone || p.email}</div>
                                                    </div>
                                                </td>
                                                <td className="p-3.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.rsvp_status === 'going'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                        : p.rsvp_status === 'not_going'
                                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                        }`}>
                                                        {p.rsvp_status === 'going' ? 'Going 😋' : p.rsvp_status === 'not_going' ? 'Not Going' : 'Invited ⏳'}
                                                    </span>
                                                </td>
                                                <td className="p-3.5 text-slate-600 dark:text-slate-400">
                                                    {p.guest_count > 0 ? `${p.guest_count} (${p.guest_names || 'Guest'})` : '0'}
                                                </td>
                                                <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                                                    ৳{p.total_paid || 0}
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
                                        ))}
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
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
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

                                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                                {ex.receipt_url ? (
                                                    <button
                                                        onClick={() => setPreviewImage(ex.receipt_url.startsWith('http') ? ex.receipt_url : `${API_BASE}${ex.receipt_url}`)}
                                                        className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                                    >
                                                        <FiFileText size={13} />
                                                        <span>View Voucher</span>
                                                    </button>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px] italic">No receipt attached</span>
                                                )}

                                                <button
                                                    onClick={() => handleDeleteExpense(ex.id)}
                                                    className="text-rose-500 hover:text-rose-700 p-1 rounded-md"
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

                    {/* TAB 3: CONTRIBUTIONS & TRXID VERIFICATION */}
                    {activeTab === 'contributions' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Collection Ledger & Mobile Banking Submissions</h3>
                                <button
                                    onClick={() => {
                                        setPaymentForm(prev => ({ ...prev, user_id: currentUser?.id }));
                                        setShowPaymentModal(true);
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                                >
                                    <FiPlus size={14} />
                                    <span>+ Record Payment</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold">
                                        <tr>
                                            <th className="p-3.5">Staff Name</th>
                                            <th className="p-3.5">Amount</th>
                                            <th className="p-3.5">Method</th>
                                            <th className="p-3.5">Sender Number & TrxID</th>
                                            <th className="p-3.5">Status</th>
                                            <th className="p-3.5 text-right">Action</th>
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
                                                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                    <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                                                        {c.user_name}
                                                    </td>
                                                    <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                                                        ৳{parseFloat(c.amount).toLocaleString()}
                                                    </td>
                                                    <td className="p-3.5 uppercase text-xs font-bold">
                                                        <span className={`px-2 py-0.5 rounded-md ${c.payment_method === 'cash'
                                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                            : 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300'
                                                            }`}>
                                                            {c.payment_method}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-slate-600 dark:text-slate-400">
                                                        {c.sender_number ? (
                                                            <div>
                                                                <span className="font-semibold">{c.sender_number}</span>
                                                                {c.transaction_id && <div className="text-[11px] font-mono text-slate-400">TrxID: {c.transaction_id}</div>}
                                                            </div>
                                                        ) : (
                                                            <span className="italic text-slate-400">Cash in Hand</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${c.status === 'verified'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : c.status === 'rejected'
                                                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-right">
                                                        {c.status === 'pending' ? (
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => handleVerifyContribution(c.id, 'verify')}
                                                                    className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                                                                    title="Approve & Verify"
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
                            <div className="p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-amber-900 dark:text-amber-200 text-base">
                                        Automated Split Math & Refund/Due Ledger
                                    </h3>
                                    <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                                        Total Spent ৳{summary.total_spent} divided among {summary.active_heads} active heads = <strong>৳{summary.actual_per_head}</strong> per head.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleSettleEvent(false)}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                                    >
                                        Recalculate
                                    </button>
                                    <button
                                        onClick={() => handleSettleEvent(true)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                                    >
                                        Mark Event Closed
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs sm:text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold">
                                            <tr>
                                                <th className="p-3.5">Staff Member</th>
                                                <th className="p-3.5">Heads (Self + Guests)</th>
                                                <th className="p-3.5">Total Paid (চাঁদা)</th>
                                                <th className="p-3.5">Calculated Share</th>
                                                <th className="p-3.5">Settlement Verdict</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {participants.filter(p => p.rsvp_status === 'going').map(p => {
                                                const heads = 1 + (p.guest_count || 0);
                                                const calcShare = roundTwo(summary.actual_per_head * heads);
                                                const balance = roundTwo((p.total_paid || 0) - calcShare);

                                                return (
                                                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                                                        <td className="p-3.5 font-medium text-slate-800 dark:text-slate-200">
                                                            {p.name}
                                                        </td>
                                                        <td className="p-3.5 text-slate-600 dark:text-slate-400">
                                                            {heads} {heads > 1 ? `(${p.guest_count} guests)` : ''}
                                                        </td>
                                                        <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                                                            ৳{p.total_paid || 0}
                                                        </td>
                                                        <td className="p-3.5 font-bold text-slate-600 dark:text-slate-400">
                                                            ৳{calcShare}
                                                        </td>
                                                        <td className="p-3.5">
                                                            {balance > 0 ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                    <span>Refund Due: +৳{balance}</span>
                                                                </span>
                                                            ) : balance < 0 ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                                    <span>Shortage / Due: -৳{Math.abs(balance)}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                                    Settled (৳0)
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : events.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-3xl">
                        🎉
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        No Team Events Created Yet
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                        Ready for an academy outing or biryani feast? Click "+ Create Event" above to create an event and invite staff.
                    </p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 inline-flex items-center gap-2 cursor-pointer transition-all"
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
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Create Team Event / Feast</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
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
                                        <option value="sports">Sports / Match 🏏</option>
                                        <option value="celebration">Celebration 🎉</option>
                                        <option value="other">Other</option>
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

                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Venue / Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g. CCA Academy Lounge / Cox's Bazar"
                                    value={createForm.location}
                                    onChange={e => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Target Budget (৳)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 15000"
                                        value={createForm.estimated_budget}
                                        onChange={e => setCreateForm(prev => ({ ...prev, estimated_budget: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    />
                                </div>

                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Target Per Head (৳)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 800"
                                        value={createForm.target_per_head}
                                        onChange={e => setCreateForm(prev => ({ ...prev, target_per_head: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                                    Collection bKash / Nagad Number
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 017xxxxxxxx (bKash Personal / Send Money)"
                                    value={createForm.collection_number}
                                    onChange={e => setCreateForm(prev => ({ ...prev, collection_number: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold mb-1.5 text-slate-700 dark:text-slate-300">
                                    Event Cover Photo / Picture 📸
                                </label>
                                
                                {createForm.banner_image ? (
                                    <div className="relative group w-full h-36 rounded-2xl overflow-hidden border-2 border-dashed border-blue-400 dark:border-blue-600/60 bg-slate-900 shadow-sm">
                                        <img
                                            src={createForm.banner_image.startsWith('http') ? createForm.banner_image : `${API_BASE}${createForm.banner_image}`}
                                            alt="Event Banner"
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40 pointer-events-none"></div>

                                        <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/90 text-white text-[11px] font-bold backdrop-blur-xs shadow-xs">
                                            <FiCheck size={13} />
                                            <span>Cover Photo Ready</span>
                                        </div>

                                        <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
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
                                            ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 animate-pulse'
                                            : 'border-slate-300 hover:border-blue-500 dark:border-slate-700 dark:hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30 dark:bg-slate-800/40 dark:hover:bg-slate-800/80'
                                    }`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploadingFile}
                                            onChange={e => handleFileUpload(e, url => setCreateForm(prev => ({ ...prev, banner_image: url })))}
                                        />
                                        {uploadingFile ? (
                                            <div className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400">
                                                <FiRefreshCw className="animate-spin" size={24} />
                                                <span className="text-xs font-bold">Uploading Cover Photo...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center text-center gap-1.5 pointer-events-none">
                                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
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
                                        ? 'Everyone will receive an instant invitation notification with Accept/Decline buttons.'
                                        : 'Only you can see this event initially. You can invite specific staff members later from the "Manage Invites" tab.'}
                                </p>
                            </div>

                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Notes / Instructions</label>
                                <textarea
                                    rows="2"
                                    placeholder="Any guidelines, dress code or menu details..."
                                    value={createForm.description}
                                    onChange={e => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
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
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Record Event Expense</h3>
                            <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs sm:text-sm">
                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Expense Item *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 15 Packets Kachchi Biryani, Water Bottles, Bus Fare"
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
                                        <option value="transport">Transport / Bus 🚌</option>
                                        <option value="accommodation">Resort / Hotel 🏨</option>
                                        <option value="snacks">Snacks & Tea ☕</option>
                                        <option value="misc">Miscellaneous</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Amount (৳) *</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 4500"
                                        value={expenseForm.amount}
                                        onChange={e => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Who Paid This Expense?</label>
                                <select
                                    value={expenseForm.paid_by}
                                    onChange={e => setExpenseForm(prev => ({ ...prev, paid_by: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                >
                                    {participants.map(p => (
                                        <option key={p.user_id} value={p.user_id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Attach Voucher / Bill Photo</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleFileUpload(e, url => setExpenseForm(prev => ({ ...prev, receipt_url: url })))}
                                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/50 dark:file:text-blue-300"
                                />
                                {uploadingFile && <span className="text-xs text-blue-500">Uploading photo...</span>}
                                {expenseForm.receipt_url && <span className="text-xs text-emerald-500 font-semibold block mt-1">✓ Voucher uploaded</span>}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowExpenseModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadingFile}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                >
                                    Save Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RECORD PAYMENT MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Record Staff Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs sm:text-sm">
                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Staff Member</label>
                                <select
                                    value={paymentForm.user_id}
                                    onChange={e => setPaymentForm(prev => ({ ...prev, user_id: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                >
                                    {participants.map(p => (
                                        <option key={p.user_id} value={p.user_id}>{p.name} ({p.phone || p.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Method</label>
                                    <select
                                        value={paymentForm.payment_method}
                                        onChange={e => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    >
                                        <option value="cash">Cash in Hand 💵</option>
                                        <option value="bkash">bKash 📱</option>
                                        <option value="nagad">Nagad 📱</option>
                                        <option value="rocket">Rocket 📱</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Amount (৳) *</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 1000"
                                        value={paymentForm.amount}
                                        onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                        required
                                    />
                                </div>
                            </div>

                            {paymentForm.payment_method !== 'cash' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Sender Number</label>
                                        <input
                                            type="text"
                                            placeholder="017xxxxxxxx"
                                            value={paymentForm.sender_number}
                                            onChange={e => setPaymentForm(prev => ({ ...prev, sender_number: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                        />
                                    </div>

                                    <div>
                                        <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">TrxID</label>
                                        <input
                                            type="text"
                                            placeholder="BL19XXXXXX"
                                            value={paymentForm.transaction_id}
                                            onChange={e => setPaymentForm(prev => ({ ...prev, transaction_id: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
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
                                                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xs uppercase">
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
                            className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

function roundTwo(num) {
    return Math.round((Number(num) || 0) * 100) / 100;
}

export default TeamEvents;