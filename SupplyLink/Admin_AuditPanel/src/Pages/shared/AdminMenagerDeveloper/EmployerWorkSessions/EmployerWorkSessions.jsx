import React, { useState } from "react";
import { useAuth } from "../../../../Provider/AuthProvider";
import useTodayWorkSessions from "../../../../utils/Hooks/EmployerWorkSessions/useTodayWorkSessions";
import { FiSend } from "react-icons/fi";
import { toast } from "react-toastify";

const EmployerWorkSessions = () => {
  const { todayData, refetch } = useTodayWorkSessions();
  const { user } = useAuth();
  const [form, setForm] = useState({
    target: "",
    achievement: "",
    incomplete: "",
    note: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const inputStyle =
    "w-full bg-[#020617] border border-slate-700 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition";
  const today = new Date();

  const todayBn = today.toLocaleDateString("bn-BD", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Dhaka",
  });
  const handleCheckIn = async () => {
    const now = new Date();

    const bdTime = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Dhaka",
    });

    const today = now.toISOString().split("T")[0];
    console.log(user.id);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_LOCALHOST_KEY}/EmployerAttendance/checkin.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employee_id: user?.id,
            work_date: today,
            check_in: bdTime,
            // status: "present",
            // activity_status: "active",
          }),
        },
      );

      const text = await res.text();
      console.log(text);

      const data = JSON.parse(text);

      if (data.success) {
        refetch(); // 🔥 instantly UI update
        toast.success("Check In Successfully")
      } else {
        toast.error(data.error || "Check-in failed");
      }
    } catch (err) {
      toast.error(err);
    }
  };
  const handleCheckOut = async () => {
  const now = new Date();

  const bdTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Dhaka",
  });

  const today = now.toISOString().split("T")[0];

  try {
    const res = await fetch(
      `${import.meta.env.VITE_LOCALHOST_KEY}/EmployerAttendance/checkout.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: user?.id,
          work_date: today,
          check_out: bdTime,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      refetch(); // 🔥 UI instantly update
      toast.success("Check Out Successfully")
    } else {
      toast.error(data.error || "Check-out failed");
    }
  } catch (err) {
  toast.error(err);
  }
};
const handleSendNote = async () => {
  if (!form.note.trim()) return;

  const today = new Date().toISOString().split("T")[0];

  try {
    const res = await fetch(
      `${import.meta.env.VITE_LOCALHOST_KEY}/EmployerAttendance/save_note.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: user?.id,
          work_date: today,
          note: form.note,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      refetch(); // 🔥 instantly UI update
      setForm({ ...form, note: "" });
      toast.success("Note Send Successfully")
    } else {
      toast.error(data.error || "Note save failed");
    }
  } catch (err) {
   toast.error(err);
  }
};
  return (
    <div className="bg-[#0b1220] text-slate-200 flex justify-center px-4">
      <div className="w-full max-w-4xl">
        {/* HEADER */}
        <div className="mb-6">
          <p className="text-emerald-400 text-sm">দৈনিক কাজের রেকর্ড</p>

          <h1 className="text-3xl font-bold text-slate-100">
            আজকের কাজের উপস্থিতি
          </h1>

          <p className="text-slate-400 text-sm">
            সকাল থেকে দিনের শেষ পর্যন্ত কাজের তথ্য লিখুন
          </p>
        </div>
        {/* CARD */}
        <div className="bg-[#0B1120] border border-slate-700 rounded-2xl shadow-xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-slate-400 text-sm">আজকের তারিখ</p>
              <h2 className="text-lg font-semibold text-slate-100">
                {todayBn}
              </h2>
            </div>

           <div className={`flex items-center gap-2 text-sm 
  ${
    todayData?.check_out
      ? "text-red-400"
      : todayData?.check_in
      ? "text-emerald-400"
      : "text-slate-400"
  }
`}>
  <span
    className={`w-2 h-2 rounded-full 
      ${
        todayData?.check_out
          ? "bg-red-400"
          : todayData?.check_in
          ? "bg-emerald-400"
          : "bg-slate-400"
      }
    `}
  ></span>

  {
    todayData?.check_out
      ? "আজকের কাজ শেষ হয়েছে"
      : todayData?.check_in
      ? "কাজ চলছে..."
      : "আজকের কাজ এখনো শুরু হয়নি"
  }
</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#020617] border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm">আজকের কাজের শুরু সময়</p>
              <h3 className="text-slate-200 font-semibold">
                {todayData?.check_in ? todayData?.check_in : "এখনো শুরু হয়নি"}
              </h3>
            </div>

            <div className="bg-[#020617] border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm">আজকের কাজের শেষ সময়</p>
            <h3 className="text-slate-200 font-semibold">
  {todayData?.check_out || "এখনো শেষ হয়নি"}
</h3>
            </div>
          </div>


 <div>
  <label className="text-sm text-slate-300 mb-1 block">
    কোনো সমস্যা বা বাড়তি নোট
  </label>

  <div className="relative">
    <textarea
      name="note"
      value={form.note}
      onChange={handleChange}
      placeholder="বিশেষ নোট লিখুন..."
      rows={3}
      className={`${inputStyle} pr-12`} // 👉 right padding add
    />

    <button
      onClick={handleSendNote}
      className="absolute bottom-3 right-2 bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded shadow-md flex items-center gap-2.5"
    >
      <FiSend size={16} />
      Send Note
    </button>
  </div>
</div>


          <div className="flex gap-4 pt-2">
            <button
              onClick={handleCheckIn}
              disabled={!!todayData?.check_in}
              className={`flex-1 rounded-xl px-6 py-3 transition shadow-md 
    ${
      todayData?.check_in
        ? "bg-slate-600 cursor-not-allowed opacity-60"
        : "bg-emerald-600 hover:bg-emerald-700 text-white"
    }
  `}
            >
              {todayData?.check_in
                ? "✔️ কাজ শুরু হয়েছে"
                : "✅ আজকের কাজ শুরু করুন"}
            </button>

          <button
  onClick={handleCheckOut}
  disabled={!todayData?.check_in || todayData?.check_out}
  className={`flex-1 rounded-xl px-6 py-3 transition
    ${
      todayData?.check_out
        ? "bg-slate-600 cursor-not-allowed opacity-60"
        : todayData?.check_in
        ? "bg-red-600 hover:bg-red-700 text-white"
        : "bg-slate-700 text-white"
    }
  `}
>
  {todayData?.check_out
    ? "✔️ কাজ শেষ হয়েছে"
    : todayData?.check_in
    ? "🔴 কাজ শেষ করুন"
    : "আগে কাজ শুরু করুন"}
</button>
          </div>

          <p className="text-xs text-slate-500">
            নোট: কাজ শুরু করার পর সময় অটোমেটিক ট্র্যাক হবে।
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployerWorkSessions;
