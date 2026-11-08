import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { soundFx } from '../utils/soundFx';
import BreakWidget from '../components/BreakWidget';
import AttendanceDisputeModal from '../components/AttendanceDisputeModal';
import useServerTime from '../hooks/useServerTime';
import { useSearch } from '../context/SearchContext';
import { parseDeviceInfo, getUserLocation } from '../utils/deviceFingerprint';

// Subcomponents & utilities
import { calculateWorkTime, processAttendanceHistory } from '../components/Attendance/attendanceUtils';
import AttendanceMetricsHeader from '../components/Attendance/AttendanceMetricsHeader';
import AttendancePunchCard from '../components/Attendance/AttendancePunchCard';
import AttendanceShiftTracker from '../components/Attendance/AttendanceShiftTracker';
import AttendanceHistoryTable from '../components/Attendance/AttendanceHistoryTable';
import WatchdogAuditModal from '../components/Attendance/WatchdogAuditModal';

const Attendance = () => {
  const { currentUser } = useAuth();
  const { searchTerm } = useSearch();
  const [loading, setLoading] = useState(true);
  const time = useServerTime() || new Date();

  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [shiftHours, setShiftHours] = useState(8);
  const [totalBreakMinutes, setTotalBreakMinutes] = useState(0);
  const [actionError, setActionError] = useState('');

  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [selectedDisputeDate, setSelectedDisputeDate] = useState(null);
  const [disputeSuccessMsg, setDisputeSuccessMsg] = useState('');
  const [isManualBreak, setIsManualBreak] = useState(false);
  const [todayIdleSummary, setTodayIdleSummary] = useState({ incidents: 0, totalMinutes: 0, alerts: [] });
  const [showIdleModal, setShowIdleModal] = useState(false);
  const [isPunching, setIsPunching] = useState(false);

  const fetchIdleStatus = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}api/attendance/get_my_idle_status.php?user_id=${currentUser.id}`);
      if (res.data?.status === 'success' && res.data?.data) {
        setTodayIdleSummary({
          incidents: res.data.data.today_incidents_count || 0,
          totalMinutes: res.data.data.today_total_minutes || 0,
          alerts: res.data.data.today_alerts || []
        });
      }
    } catch {
      // non-blocking
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/attendance/get_attendance.php', {
        user_id: currentUser.id
      });
      if (response.data.status === 'success') {
        setTodayStatus(response.data.today);
        setHistory(response.data.history || []);
        if (response.data.shift_hours) setShiftHours(response.data.shift_hours);
        if (response.data.total_break_minutes !== undefined) setTotalBreakMinutes(response.data.total_break_minutes);
        if (response.data.is_manual_break !== undefined) {
          setIsManualBreak(Boolean(response.data.is_manual_break));
        }
      }
    } catch (err) {
      console.error('Failed to fetch attendance', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchAttendance();
      fetchIdleStatus();
    }
  }, [currentUser]);

  const handleCheckIn = async () => {
    if (Number(currentUser?.id) !== 2) return;

    setActionError('');
    setIsPunching(true);
    try {
      const deviceInfo = await parseDeviceInfo();
      const location = await getUserLocation();

      const response = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/attendance/check_in.php', {
        user_id: currentUser.id,
        device_info: deviceInfo,
        location: location
      });
      if (response.data.status === 'success') {
        soundFx.playPunchIn();
        fetchAttendance();
      } else {
        setActionError(response.data.message || 'Failed to check in.');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'An error occurred during check-in. Make sure you are within office premises.');
    } finally {
      setIsPunching(false);
    }
  };

  const handleCheckOut = async () => {
    if (Number(currentUser?.id) !== 2) return;

    setActionError('');
    setIsPunching(true);
    try {
      const deviceInfo = await parseDeviceInfo();
      const location = await getUserLocation();

      const response = await axios.post((import.meta.env.VITE_API_BASE_URL) + 'api/attendance/check_out.php', {
        user_id: currentUser.id,
        device_info: deviceInfo,
        location: location
      });
      if (response.data.status === 'success') {
        soundFx.playPunchOut();
        fetchAttendance();
      } else {
        setActionError(response.data.message || 'Failed to check out.');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'An error occurred during check-out.');
    } finally {
      setIsPunching(false);
    }
  };

  const workTimeData = todayStatus && !todayStatus.check_out ? calculateWorkTime(todayStatus.check_in, time, shiftHours) : null;
  const processedHistory = processAttendanceHistory(history, shiftHours);

  const displayHistory = processedHistory.filter((record) => {
    if (!searchTerm || !searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    return (
      (record.date || '').toLowerCase().includes(term) ||
      (record.status || '').toLowerCase().includes(term) ||
      (record.check_in || '').toLowerCase().includes(term) ||
      (record.check_out || '').toLowerCase().includes(term) ||
      (record.total_hours || '').toLowerCase().includes(term)
    );
  });

  const totalDays = history.length;
  const presentDays = history.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  const leaveDays = history.filter((r) => r.status === 'Leave').length;
  const absentDays = history.filter((r) => r.status === 'Absent').length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const totalOvertimeSec = processedHistory.reduce((acc, curr) => acc + (curr.rawOverSec || 0), 0);
  const totalGapSec = processedHistory.reduce((acc, curr) => acc + (curr.rawShortSec || 0), 0);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const showBreakWidget = isManualBreak || currentUser?.is_manual_break || currentUser?.has_tiffin_break === 0 || (Number(currentUser?.allocated_break_minutes) > 0 && currentUser?.has_tiffin_break === 0);

  return (
    <div className="pb-10 animate-in fade-in zoom-in-95 duration-300">
      <AttendanceMetricsHeader
        presentDays={presentDays}
        leaveDays={leaveDays}
        absentDays={absentDays}
        attendanceRate={attendanceRate}
        totalGapSec={totalGapSec}
        totalOvertimeSec={totalOvertimeSec}
        totalBreakMinutes={totalBreakMinutes}
        todayIdleSummary={todayIdleSummary}
        setShowIdleModal={setShowIdleModal}
        actionError={actionError}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AttendancePunchCard
          time={time}
          todayStatus={todayStatus}
          isPunching={isPunching}
          currentUser={currentUser}
          handleCheckIn={handleCheckIn}
          handleCheckOut={handleCheckOut}
        />
        <AttendanceShiftTracker
          workTimeData={workTimeData}
          shiftHours={shiftHours}
        />
      </div>

      {showBreakWidget && (
        <div className="mb-8">
          <BreakWidget />
        </div>
      )}

      <AttendanceHistoryTable
        displayHistory={displayHistory}
        setSelectedDisputeDate={setSelectedDisputeDate}
        setIsDisputeModalOpen={setIsDisputeModalOpen}
        setDisputeSuccessMsg={setDisputeSuccessMsg}
        disputeSuccessMsg={disputeSuccessMsg}
      />

      <WatchdogAuditModal
        showIdleModal={showIdleModal}
        setShowIdleModal={setShowIdleModal}
        todayIdleSummary={todayIdleSummary}
      />

      <AttendanceDisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        selectedDate={selectedDisputeDate}
        onSuccess={(msg) => {
          setDisputeSuccessMsg(msg);
          setTimeout(() => setDisputeSuccessMsg(''), 5000);
        }}
      />
    </div>
  );
};

export default Attendance;
