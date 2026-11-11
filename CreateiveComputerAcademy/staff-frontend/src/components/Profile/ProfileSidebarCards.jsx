import React from 'react';
import { 
  FiUser, FiMail, FiPhone, FiHash, FiBriefcase, 
  FiClock, FiCalendar, FiCreditCard, FiEdit, FiBookOpen, FiAward,
  FiCheckCircle, FiXCircle 
} from 'react-icons/fi';

/**
 * ProfileSidebarCards
 * Displays contact details, employment status, and primary payout configuration.
 */
export default function ProfileSidebarCards({
  currentUser,
  payoutForm,
  onOpenPayoutSetup,
}) {
  return (
    <div className="space-y-6">
      
      {/* Contact Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2.5 mb-6">
          <span className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FiUser size={14} />
          </span>
          Contact Details
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">
              <FiHash size={16} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                Username
              </div>
              <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                @{currentUser?.username || 'Not set'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
              <FiMail size={16} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                Email Address
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                {currentUser?.email}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors shrink-0">
              <FiPhone size={16} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                Phone Number
              </div>
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {currentUser?.phone || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employment Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
        <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2.5 mb-6">
          <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FiBriefcase size={14} />
          </span>
          Employment
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
              <FiHash className="text-slate-400 dark:text-slate-500" /> Employee Code
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {currentUser?.employee_code || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
              <FiBriefcase className="text-slate-400 dark:text-slate-500" /> Designation
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {currentUser?.designation || 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
              <FiClock className="text-slate-400 dark:text-slate-500" /> Working Shift
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md text-xs">
              {currentUser?.shift_start
                ? `${currentUser.shift_start.slice(0, 5)} - ${currentUser.shift_end?.slice(0, 5)}`
                : 'N/A'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
              <FiCalendar className="text-slate-400 dark:text-slate-500" /> Date Joined
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {currentUser?.joining_date
                ? new Date(currentUser.joining_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Academic Status Card (if student or pending request) */}
      {(Boolean(currentUser?.is_student) || (currentUser?.student_status && currentUser?.student_status !== 'none')) && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <FiBookOpen size={14} />
              </span>
              Academic Status
            </h3>
            {currentUser?.student_status === 'approved' ? (
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <FiCheckCircle size={10} /> Approved
              </span>
            ) : currentUser?.student_status === 'rejected' ? (
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <FiXCircle size={10} /> Rejected
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Pending
              </span>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
              <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                <FiBookOpen className="text-slate-400 dark:text-slate-500" /> Institution Type
              </div>
              <span className="font-bold text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-md">
                {currentUser?.institution_type || 'College'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
              <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                <FiAward className="text-slate-400 dark:text-slate-500" /> Institution
              </div>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200 text-right truncate max-w-[180px]">
                {currentUser?.student_institution || 'Not specified'}
              </span>
            </div>
            {currentUser?.student_level && (
              <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-700/50">
                <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                  Class / Year
                </div>
                <span className="font-bold text-sm text-slate-800 dark:text-slate-200 text-right">
                  {currentUser.student_level}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-sm">
                Monthly Quota
              </div>
              <span className={`font-bold text-xs px-2 py-0.5 rounded-md ${
                currentUser?.student_status === 'approved'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                  : currentUser?.student_status === 'rejected'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
              }`}>
                {currentUser?.student_status === 'approved' 
                  ? `${currentUser?.student_leave_quota || 3} Days / Month`
                  : currentUser?.student_status === 'rejected'
                    ? '0 Days (Rejected)'
                    : 'Pending Approval'}
              </span>
            </div>
            {currentUser?.student_status === 'rejected' && currentUser?.student_rejection_reason && (
              <div className="pt-2 text-[11px] text-rose-600 dark:text-rose-400 font-medium bg-rose-50/60 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-900/50">
                <span className="font-bold">বাতিলের কারণ:</span> {currentUser.student_rejection_reason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payout & Payment Method Setup Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-[0_2px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FiCreditCard size={14} />
            </span>
            Payout Setup (উত্তোলন)
          </h3>
          <button
            type="button"
            onClick={onOpenPayoutSetup}
            className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <FiEdit size={12} /> {payoutForm?.account_number ? 'Edit Setup' : 'Setup Now'}
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Default Method:</span>
            <span className="font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-md">
              {payoutForm?.payment_method || 'bKash'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">Account / Phone:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {payoutForm?.account_number || 'Not Set'}
            </span>
          </div>
          {payoutForm?.bank_name && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Bank & Branch:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                {payoutForm.bank_name} {payoutForm.branch_name ? `(${payoutForm.branch_name})` : ''}
              </span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-400">
          Saved details auto-fill your withdrawal requests so you don't need to retype every time.
        </p>
      </div>

    </div>
  );
}

