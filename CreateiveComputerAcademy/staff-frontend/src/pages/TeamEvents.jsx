import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiTerminal } from 'react-icons/fi';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import TeamEventsTopBar from '../components/TeamEvents/TeamEventsTopBar';
import EventInfoBanner from '../components/TeamEvents/EventInfoBanner';
import EventLedgerSection from '../components/TeamEvents/EventLedgerSection';
import EventParticipantsList from '../components/TeamEvents/EventParticipantsList';
import EventExpensesBoard from '../components/TeamEvents/EventExpensesBoard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function roundTwo(num) {
    return Math.round((Number(num) || 0) * 100) / 100;
}

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
            {/* Top Banner & Horizontal Event Selector */}
            <TeamEventsTopBar
                isDeveloper={isDeveloper}
                events={events}
                selectedEventId={selectedEventId}
                setSelectedEventId={setSelectedEventId}
                API_BASE={API_BASE}
            />

            {selectedEventId && currentEvent ? (
                <div className="space-y-6">
                    {/* 1. Main Info Card & Pending Invitation Alert */}
                    <EventInfoBanner
                        currentEvent={currentEvent}
                        rsvpState={rsvpState}
                        handleRsvp={handleRsvp}
                        submittingRsvp={submittingRsvp}
                        setPreviewImage={setPreviewImage}
                        API_BASE={API_BASE}
                    />

                    {/* 2. User's RSVP & Personal Ledger Section */}
                    <EventLedgerSection
                        rsvpState={rsvpState}
                        setRsvpState={setRsvpState}
                        handleRsvp={handleRsvp}
                        submittingRsvp={submittingRsvp}
                        currentEvent={currentEvent}
                        paymentForm={paymentForm}
                        setPaymentForm={setPaymentForm}
                        handlePaymentSubmit={handlePaymentSubmit}
                        submittingPayment={submittingPayment}
                        myHeads={myHeads}
                        myTotalPaid={myTotalPaid}
                        myCalculatedShare={myCalculatedShare}
                        myBalance={myBalance}
                    />

                    {/* 3. Who's Joining & Guests List */}
                    <EventParticipantsList
                        participants={participants}
                        API_BASE={API_BASE}
                    />

                    {/* 4. Real-time Transparency & Expense Vouchers */}
                    <EventExpensesBoard
                        expenses={expenses}
                        setPreviewImage={setPreviewImage}
                        API_BASE={API_BASE}
                    />
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

export default TeamEvents;
