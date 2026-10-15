import React from "react";
import useAllWorkSessions from "../../../../utils/Hooks/EmployerWorkSessions/useAllWorkSessions";
import { useAuth } from "../../../../Provider/AuthProvider";
import useUsers from "../../../../utils/Hooks/useUsers";

const EmployerAttendanceLogs = () => {
  const { allData, loading } = useAllWorkSessions();
  const { user } = useAuth();
const {isUsersError,isUsersLoading,refetch,users} = useUsers()
  // 🔥 client side safety filter (optional but good)
  const visibleData = user?.role?.includes("staff")
    ? allData.filter((item) => item.employee_id === user.id)
    : allData;
const getUserName = (id) => {
  const found = users?.find((u) => u.id === id);
  return found ? found.name : "Unknown";
};
  if (loading) {
    return <div className="text-white p-5">Loading...</div>;
  }
const formatTime12 = (time) => {
  if (!time) return "-";

  const [hour, minute, second] = time.split(":");
  let h = parseInt(hour);
  const ampm = h >= 12 ? "PM" : "AM";

  h = h % 12 || 12;

  return `${h}:${minute}:${second} ${ampm}`;
};
const calculateHours = (checkIn, checkOut, employeeId) => {
  if (!checkIn) return { total: "-", overtime: "-" };

  const now = new Date();

  const inTime = new Date(`1970-01-01T${checkIn}`);
  const outTime = checkOut
    ? new Date(`1970-01-01T${checkOut}`)
    : new Date(`1970-01-01T${now.toTimeString().slice(0, 8)}`);

  let diffMinutes = (outTime - inTime) / (1000 * 60);

  if (diffMinutes < 0) diffMinutes = 0; // safety

  // 🔥 dynamic limit
  const limitHours = employeeId === 215 ? 10 : 8;
  const limitMinutes = limitHours * 60;

  const totalH = Math.floor(diffMinutes / 60);
  const totalM = Math.floor(diffMinutes % 60);

  if (diffMinutes <= limitMinutes) {
    return {
      total: `${totalH} ঘণ্টা ${totalM} মিনিট`,
      overtime: "0 মিনিট",
    };
  } else {
    const overtime = diffMinutes - limitMinutes;

    const otH = Math.floor(overtime / 60);
    const otM = Math.floor(overtime % 60);

    return {
      total: `${limitHours} ঘণ্টা 0 মিনিট`,
      overtime: `${otH} ঘণ্টা ${otM} মিনিট`,
    };
  }
};

  return (
    <div className="p-5 text-white">
      <h2 className="text-xl font-semibold mb-4">Attendance Logs</h2>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0B1220]">
        <table className="min-w-full text-sm">
          
          {/* HEADER */}
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Employer Name</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Check In</th>
              <th className="px-4 py-3 text-left">Check Out</th>
              <th className="px-4 py-3 text-left">Hours</th>
<th className="px-4 py-3 text-left">Overtime</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Activity</th>
            </tr>
          </thead>

          {/* BODY */}
         <tbody className="divide-y divide-white/10">
  {visibleData.length > 0 ? (
    visibleData.map((item, index) => {
      
const hoursData = calculateHours(
  item.check_in,
  item.check_out,
  item.employee_id
);
      return (
        <tr key={item.id} className="hover:bg-white/5 transition">
          <td className="px-4 py-3">{index + 1}</td>

          <td className="px-4 py-3 text-slate-300">
            <div className="flex flex-col">
              <span>{getUserName(item.employee_id)}</span>
              <span className="text-xs text-slate-500">
                ID: {item.employee_id}
              </span>
            </div>
          </td>

          <td className="px-4 py-3 text-slate-300">
            {item.work_date}
          </td>

          <td className="px-4 py-3 text-emerald-400">
            {formatTime12(item.check_in)}
          </td>

          <td className="px-4 py-3 text-red-400">
            {formatTime12(item.check_out)}
          </td>

          <td className="px-4 py-3 text-emerald-400">
            {hoursData.total}
          </td>

          <td className="px-4 py-3 text-yellow-400">
            {hoursData.overtime}
          </td>

          <td className="px-4 py-3">
            <span className="bg-slate-700 px-2 py-1 rounded text-xs">
              {item.status}
            </span>
          </td>

          <td className="px-4 py-3">
            <span
              className={`px-2 py-1 rounded text-xs ${
                item.activity_status === "active"
                  ? "bg-emerald-600"
                  : "bg-red-600"
              }`}
            >
              {item.activity_status}
            </span>
          </td>
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan="9" className="text-center py-5 text-slate-400">
        No data found
      </td>
    </tr>
  )}
</tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployerAttendanceLogs;