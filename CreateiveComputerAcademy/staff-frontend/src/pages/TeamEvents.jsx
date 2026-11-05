import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
    FiCalendar, FiDollarSign, FiUsers,
    FiXCircle, FiCheck, FiSend, FiFileText,
    FiTerminal, FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

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

    const isDeveloper = currentUser?.roles &&
        currentUser.roles.some(r => ['developer', 'admin'].includes(r));

    // Fetch all events user has access to
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

    // Fetch event details
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

    // Handle RSVP (Going / Not Going)
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
                toast.success(res.data.message);
                if (status === 'not_going') {
                    toast.success('Invitation declined. Event removed from your list.');
                    setSelectedEventId(null);
                    fetchEvents();
                } else {
                    fetchEventDetails(selectedEventId);
                    fetchEvents();
                }
            }
        } catch (err) {
            toast.error('Failed to update attendance');
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
            const res = await axios.post(`${API_BASE}api/events/submit_payment.php`, {
                ...paymentForm,
                event_id: selectedEventId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.status === 'success') {
                toast.success(res.data.message || 'Payment submitted! Admin will verify.');
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
            toast.error('Failed to submit payment details');
        } finally {
            setSubmittingPayment(false);
        }
    };

    const currentEvent = eventData?.event;
    const summary = eventData?.summary || {};
    const participants = eventData?.participants || [];
    const expenses = eventData?.expenses || [];

    const myParticipant = participants.find(p => p.user_id === currentUser?.id);
    const myTotalPaid = myParticipant?.total_paid || 0;
    const myGuestCount = myParticipant?.guest_count || 0;
    const myHeads = 1 + myGuestCount;
    const myCalculatedShare = roundTwo((summary.actual_per_head || 0) * myHeads);
    const myBalance = roundTwo(myTotalPaid - myCalculatedShare);

    return (
        <div className="p-4 sm:p-6 mx-auto space-y-6 animate-fadeIn">
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

                {isDeveloper && (
                    <div className="relative z-10 flex items-center gap-2">
                        <Link
                            to="/developer/events"
                            className="px-4 py-2.5 bg-slate-950/80 hover:bg-slate-950 text-cyan-400 hover:text-cyan-300 text-xs font-black rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer border border-cyan-400/40 backdrop-blur-xs"
                            title="Go to Developer Console to create events, manage invites and approve collections"
                        >
                            <FiTerminal size={14} className="text-cyan-400" />
                            <span>Dev Console &bull; Event Manager →</span>
                        </Link>
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
                                <span className="capitalize">{ev.event_type}</span>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {selectedEventId && currentEvent ? (
                <div className="space-y-6">
                    {/* Main Info Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                            {currentEvent.banner_image && (
                                <img
                                    src={currentEvent.banner_image.startsWith('http') ? currentEvent.banner_image : `${API_BASE}${currentEvent.banner_image}`}
                                    alt={currentEvent.title}
                                    className="w-full sm:w-36 h-28 rounded-2xl object-cover shrink-0 border border-slate-200 dark:border-slate-800 shadow-sm cursor-pointer hover:opacity-95"
                                    onClick={() => setPreviewImage(currentEvent.banner_image.startsWith('http') ? currentEvent.banner_image : `${API_BASE}${currentEvent.banner_image}`)}
                                />
                            )}
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

                    {/* Pending Invitation Alert for Staff */}
                    {rsvpState.rsvp_status === 'invited' && (
                        <div className="bg-linear-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-300 dark:border-amber-700/60 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-md shrink-0">
                                    💌
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>You are Invited! 🎉</span>
                                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-bold">Action Required</span>
                                    </h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                        Admin has invited you to <strong>{currentEvent.title}</strong> ({currentEvent.event_date}). Will you join the feast/tour?
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => handleRsvp('going')}
                                    disabled={submittingRsvp}
                                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <FiCheck size={15} />
                                    <span>Accept & Join (Going 😋)</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm("Are you sure you can't make it? This event will be removed from your dashboard.")) {
                                            handleRsvp('not_going');
                                        }
                                    }}
                                    disabled={submittingRsvp}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl transition-all cursor-pointer"
                                >
                                    <span>Decline / Reject</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* User's RSVP & Personal Ledger Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. RSVP Box */}
                        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Your Attendance</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${rsvpState.rsvp_status === 'going'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : rsvpState.rsvp_status === 'not_going'
                                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    }`}>
                                    {rsvpState.rsvp_status === 'going' ? 'Going 😋' : rsvpState.rsvp_status === 'not_going' ? 'Not Going' : 'Invited ⏳'}
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
                                    onClick={() => {
                                        if (window.confirm("Are you sure you can't make it? This event will be removed from your dashboard.")) {
                                            handleRsvp('not_going');
                                        }
                                    }}
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
                                            className="w-full py-1 text-xs font-semibold text-blue-600 hover:underline text-right cursor-pointer"
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

                    {/* Who's Joining & Guests List */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    <span>👥 Who's Joining & Guests</span>
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        {participants.filter(p => p.rsvp_status === 'going').length} Going ({participants.reduce((sum, p) => p.rsvp_status === 'going' ? sum + 1 + (Number(p.guest_count) || 0) : sum, 0)} Total Heads)
                                    </span>
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    List of academy team members and guests confirmed for this feast/tour.
                                </p>
                            </div>
                        </div>

                        {/* Participants Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {participants.filter(p => p.rsvp_status === 'going').length === 0 ? (
                                <div className="col-span-full p-6 text-center text-slate-400 text-xs">
                                    No one has confirmed attendance yet. Be the first to click "I am Going!"
                                </div>
                            ) : (
                                participants
                                    .filter(p => p.rsvp_status === 'going')
                                    .map(p => (
                                        <div
                                            key={p.user_id}
                                            className="p-3 rounded-2xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 transition-all flex items-center justify-between gap-3"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                                    {p.profile_picture ? (
                                                        <img src={p.profile_picture.startsWith('http') ? p.profile_picture : `${API_BASE}${p.profile_picture}`} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        p.name?.charAt(0) || 'U'
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                                        {p.name}
                                                    </div>
                                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                                        Going {p.guest_count > 0 ? `(+${p.guest_count} guest)` : ''}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                {parseFloat(p.total_paid || 0) > 0 ? (
                                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                        ৳{parseFloat(p.total_paid)}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        ৳0
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            )}
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
            ) : events.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-3xl">
                        🎉
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        No Active Events Right Now
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                        When Admin or Lead organizes an academy tour or feast and invites you, it will appear here.
                    </p>
                    {isDeveloper && (
                        <Link
                            to="/developer/events"
                            className="mt-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 inline-flex items-center gap-2 cursor-pointer transition-all"
                        >
                            <FiTerminal size={16} />
                            <span>Create Event in Dev Console →</span>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-400 font-medium">Select an event above to view details.</p>
                </div>
            )}

            {/* PHOTO PREVIEW MODAL */}
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
