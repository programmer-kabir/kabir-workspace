import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FiCalendar, FiPlus, FiDollarSign, FiUsers, FiCheckCircle,
    FiXCircle, FiClock, FiMapPin, FiFileText, FiUploadCloud,
    FiAlertCircle, FiRefreshCw, FiCheck, FiSend, FiInfo
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
    const [submittingRsvp, setSubmittingRsvp] = useState(false);
    const [submittingPayment, setSubmittingPayment] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);

    // Modals for Dev / Admin accessing from Staff Portal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [uploadingVoucher, setUploadingVoucher] = useState(false);

    // Forms
    const [rsvpState, setRsvpState] = useState({
        rsvp_status: 'going',
        guest_count: 0,
        guest_names: ''
    });

    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        payment_method: 'bkash',
        sender_number: '',
        transaction_id: '',
        receipt_url: '',
        notes: ''
    });

    const [expenseForm, setExpenseForm] = useState({
        item_name: '',
        category: 'food',
        amount: '',
        receipt_url: '',
        notes: ''
    });

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
        guest_fee: ''
    });

    const isManager = currentUser?.roles &&
        currentUser.roles.some(r => ['developer', 'admin'].includes(r));

    // Fetch all events
    const fetchEvents = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.get(`${API_BASE}api/events/get_events.php`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                const list = res.data.data || [];
                setEvents(list);
                if (list.length > 0 && !selectedEventId) {
                    setSelectedEventId(list[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to load events', err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch details
    const fetchEventDetails = async (id) => {
        if (!id) return;
        try {
            setDetailsLoading(true);
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.get(`${API_BASE}api/events/get_event_details.php?id=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                setEventData(res.data);
                const myP = (res.data.participants || []).find(p => p.user_id === currentUser?.id);
                if (myP) {
                    setRsvpState({
                        rsvp_status: myP.rsvp_status || 'going',
                        guest_count: myP.guest_count || 0,
                        guest_names: myP.guest_names || ''
                    });
                }
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

    // Handle RSVP
    const handleRsvp = async (status) => {
        try {
            setSubmittingRsvp(true);
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/update_rsvp.php`, {
                event_id: selectedEventId,
                rsvp_status: status,
                guest_count: rsvpState.guest_count,
                guest_names: rsvpState.guest_names
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                toast.success(status === 'going' ? 'Attending confirmed! See you there! 🍗' : 'RSVP updated.');
                setRsvpState(prev => ({ ...prev, rsvp_status: status }));
                fetchEventDetails(selectedEventId);
                fetchEvents();
            }
        } catch (err) {
            toast.error('Failed to update RSVP');
        } finally {
            setSubmittingRsvp(false);
        }
    };

    // Handle Payment Submit
    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!paymentForm.amount) {
            toast.error('Please enter payment amount');
            return;
        }
        try {
            setSubmittingPayment(true);
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/record_payment.php`, {
                ...paymentForm,
                event_id: selectedEventId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                toast.success(res.data.message);
                setPaymentForm({
                    amount: '',
                    payment_method: 'bkash',
                    sender_number: '',
                    transaction_id: '',
                    receipt_url: '',
                    notes: ''
                });
                fetchEventDetails(selectedEventId);
            }
        } catch (err) {
            toast.error('Payment submission failed');
        } finally {
            setSubmittingPayment(false);
        }
    };

    // Handle Create Event (for Dev / Admin)
    const handleCreateEvent = async (e) => {
        e.preventDefault();
        if (!createForm.title.trim()) {
            toast.error('Event title is required');
            return;
        }
        try {
            const token = localStorage.getItem('cca_token') || localStorage.getItem('cca_admin_token');
            const res = await axios.post(`${API_BASE}api/events/create_event.php`, createForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.status === 'success') {
                toast.success('Team event created successfully!');
                setShowCreateModal(false);
                await fetchEvents();
                if (res.data.event_id) setSelectedEventId(res.data.event_id);
            }
        } catch (err) {
            toast.error('Failed to create event');
        }
    };

    // Handle Log Expense (for Dev / Admin or Staff reimbursable)
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
                event_id: selectedEventId,
                paid_by: currentUser?.id
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
                    receipt_url: '',
                    notes: ''
                });
                fetchEventDetails(selectedEventId);
            }
        } catch (err) {
            toast.error('Failed to record expense');
        }
    };

    const currentEvent = eventData?.event;
    const summary = eventData?.summary || {};
    const participants = eventData?.participants || [];
    const expenses = eventData?.expenses || [];
    const contributions = eventData?.contributions || [];

    const myParticipant = participants.find(p => p.user_id === currentUser?.id);
    const myTotalPaid = myParticipant?.total_paid || 0;
    const myGuestCount = myParticipant?.guest_count || 0;
    const myHeads = 1 + myGuestCount;
    const myCalculatedShare = roundTwo((summary.actual_per_head || 0) * myHeads);
    const myBalance = roundTwo(myTotalPaid - myCalculatedShare);

    return (
        <div className="p-4 sm:p-6  mx-auto space-y-6">
            {/* Top Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r from-amber-500 via-orange-500 to-rose-600 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 uppercase tracking-wider backdrop-blur-xs">
                            CCA Social Hub
                        </span>
                        <span className="text-xs opacity-90">Tours, Dinners & Biryani Feasts</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                        Team Feasts & Tours 🎉
                    </h1>
                    <p className="text-xs sm:text-sm text-white/90 max-w-xl">
                        Live transparency board for all academy outings, biryani parties, contributions, and real-time expense vouchers.
                    </p>
                </div>

                {isManager && (
                    <div className="relative z-10 flex items-center gap-2">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-50 text-xs font-black rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <FiPlus size={15} />
                            <span>Create Event (Dev/Admin)</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Events Selector Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {events.map((ev) => (
                    <button
                        key={ev.id}
                        onClick={() => setSelectedEventId(ev.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-left shrink-0 transition-all cursor-pointer ${selectedEventId === ev.id
                                ? 'bg-orange-50 border-orange-500 text-orange-950 dark:bg-orange-950/40 dark:border-orange-500 dark:text-orange-200 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                            }`}
                    >
                        <span className="text-2xl">
                            {ev.event_type === 'tour' ? '🏖️' : ev.event_type === 'feast' ? '🍗' : '🎉'}
                        </span>
                        <div>
                            <div className="text-sm font-bold truncate max-w-[170px]">{ev.title}</div>
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

            {selectedEventId && currentEvent ? (
                <div className="space-y-6">
                    {/* Main Info Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 capitalize">
                                    {currentEvent.event_type}
                                </span>
                                <span>📅 {currentEvent.event_date}</span>
                                <span>📍 {currentEvent.location || 'CCA Campus'}</span>
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

                        {/* Collection Account Card */}
                        {currentEvent.collection_number && (
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 shrink-0 md:max-w-xs space-y-1">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Payment Account
                                </div>
                                <div className="text-sm font-black text-slate-900 dark:text-white select-all">
                                    {currentEvent.collection_number}
                                </div>
                                {currentEvent.collection_note && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {currentEvent.collection_note}
                                    </p>
                                )}
                                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold pt-1">
                                    Target: ৳{currentEvent.target_per_head || 0} per head
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User's RSVP & Personal Ledger Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. RSVP Box */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Your Attendance</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${rsvpState.rsvp_status === 'going'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    }`}>
                                    {rsvpState.rsvp_status === 'going' ? 'Going 😋' : 'Not Going'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleRsvp('going')}
                                    disabled={submittingRsvp}
                                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${rsvpState.rsvp_status === 'going'
                                            ? 'bg-emerald-600 text-white shadow-xs'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                >
                                    <FiCheck size={14} />
                                    <span>I am Going!</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleRsvp('not_going')}
                                    disabled={submittingRsvp}
                                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${rsvpState.rsvp_status === 'not_going'
                                            ? 'bg-rose-600 text-white shadow-xs'
                                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                        }`}
                                >
                                    <FiXCircle size={14} />
                                    <span>Can't Make It</span>
                                </button>
                            </div>

                            {currentEvent.allow_guest ? (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <label className="font-semibold text-slate-700 dark:text-slate-300">Bringing Guests?</label>
                                        <select
                                            value={rsvpState.guest_count}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 0;
                                                setRsvpState(prev => ({ ...prev, guest_count: val }));
                                            }}
                                            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                                        >
                                            <option value="0">None (Just Me)</option>
                                            <option value="1">+1 Guest</option>
                                            <option value="2">+2 Guests</option>
                                            <option value="3">+3 Guests</option>
                                        </select>
                                    </div>
                                    {rsvpState.guest_count > 0 && (
                                        <input
                                            type="text"
                                            placeholder="Guest names (e.g. Brother, Friend)"
                                            value={rsvpState.guest_names}
                                            onChange={e => setRsvpState(prev => ({ ...prev, guest_names: e.target.value }))}
                                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                                        />
                                    )}
                                    {rsvpState.guest_count > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRsvp('going')}
                                            className="w-full py-1 text-xs font-semibold text-blue-600 hover:underline text-right"
                                        >
                                            Update Guest List →
                                        </button>
                                    )}
                                </div>
                            ) : null}
                        </div>

                        {/* 2. Personal Contribution Box */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Send Contribution</h3>
                                <span className="text-xs text-slate-400 font-medium">bKash / Nagad</span>
                            </div>

                            <form onSubmit={handlePaymentSubmit} className="space-y-2.5 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Method</label>
                                        <select
                                            value={paymentForm.payment_method}
                                            onChange={e => setPaymentForm(prev => ({ ...prev, payment_method: e.target.value }))}
                                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                                        >
                                            <option value="bkash">bKash</option>
                                            <option value="nagad">Nagad</option>
                                            <option value="rocket">Rocket</option>
                                            <option value="cash">Cash (Give to Organizer)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Amount (৳)</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 800"
                                            value={paymentForm.amount}
                                            onChange={e => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                                            required
                                        />
                                    </div>
                                </div>

                                {paymentForm.payment_method !== 'cash' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Your Number</label>
                                            <input
                                                type="text"
                                                placeholder="017xxxxxxxx"
                                                value={paymentForm.sender_number}
                                                onChange={e => setPaymentForm(prev => ({ ...prev, sender_number: e.target.value }))}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">TrxID</label>
                                            <input
                                                type="text"
                                                placeholder="BL98XXXXXX"
                                                value={paymentForm.transaction_id}
                                                onChange={e => setPaymentForm(prev => ({ ...prev, transaction_id: e.target.value }))}
                                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submittingPayment}
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <FiSend size={13} />
                                    <span>Submit Payment Details</span>
                                </button>
                            </form>
                        </div>

                        {/* 3. Personal Settlement Status Box */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
                            <div>
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Your Ledger Balance</h3>
                                    <span className="text-xs text-slate-400">Heads: {myHeads}</span>
                                </div>

                                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                    <div className="flex justify-between">
                                        <span>You Paid (Confirmed):</span>
                                        <strong className="text-emerald-600 dark:text-emerald-400">৳{myTotalPaid}</strong>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Calculated Share:</span>
                                        <strong>৳{myCalculatedShare}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                                {myBalance > 0 ? (
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center">
                                        <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                                            Refund Due to You
                                        </div>
                                        <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                            +৳{myBalance}
                                        </div>
                                        <p className="text-[10px] text-emerald-700/80 mt-0.5">Collect via Cash or bKash from Organizer</p>
                                    </div>
                                ) : myBalance < 0 ? (
                                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-center">
                                        <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase">
                                            Shortage / Due from You
                                        </div>
                                        <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                                            -৳{Math.abs(myBalance)}
                                        </div>
                                        <p className="text-[10px] text-rose-700/80 mt-0.5">Please send remaining amount</p>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center text-xs font-semibold text-slate-500">
                                        Accounts Settled (৳0) ✓
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Real-time Transparency Board */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>Live Transparency & Expense Vouchers</span>
                                    <span className="text-sm font-normal text-slate-400">(খাতে খাতে খরচের হিসাব)</span>
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Every food packet, bus fare, or grocery cost verified with photo receipts.
                                </p>
                            </div>

                            {isManager && (
                                <button
                                    onClick={() => setShowExpenseModal(true)}
                                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                                >
                                    <FiPlus size={14} />
                                    <span>+ Log Expense</span>
                                </button>
                            )}
                        </div>

                        {/* Expenses Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {expenses.length === 0 ? (
                                <div className="col-span-full p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
                                    No expenses recorded yet. Once food or bus tickets are purchased, they will appear here with receipts.
                                </div>
                            ) : (
                                expenses.map(ex => (
                                    <div key={ex.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                        {ex.category}
                                                    </span>
                                                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                                                        {ex.item_name}
                                                    </h4>
                                                    <p className="text-xs text-slate-400">
                                                        Purchased by: <strong className="text-slate-700 dark:text-slate-300">{ex.paid_by_name}</strong>
                                                    </p>
                                                </div>
                                                <div className="text-base font-black text-rose-600 dark:text-rose-400">
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
                                                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                                                >
                                                    <FiFileText size={13} />
                                                    <span>View Receipt Photo 📸</span>
                                                </button>
                                            ) : (
                                                <span className="text-slate-400 text-[11px] italic">No receipt attached</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 font-medium">Select an event above to view details.</p>
                </div>
            )}

            {/* CREATE EVENT MODAL FOR DEV / ADMIN */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Create Team Event / Feast</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs sm:text-sm">
                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Event Title *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Grand Kachchi Biryani Feast 🍗"
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

                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Collection bKash / Nagad Number</label>
                                <input
                                    type="text"
                                    placeholder="017xxxxxxxx (bKash Personal / Send Money)"
                                    value={createForm.collection_number}
                                    onChange={e => setCreateForm(prev => ({ ...prev, collection_number: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                />
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
                                        placeholder="CCA Academy Lounge"
                                        value={createForm.location}
                                        onChange={e => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                    />
                                </div>
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
                                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
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
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Record Expense</h3>
                            <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs sm:text-sm">
                            <div>
                                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Item Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 15 Packets Biryani, Mineral Water"
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
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PHOTO PREVIEW */}
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

function roundTwo(num) {
    return Math.round((Number(num) || 0) * 100) / 100;
}

export default TeamEvents;