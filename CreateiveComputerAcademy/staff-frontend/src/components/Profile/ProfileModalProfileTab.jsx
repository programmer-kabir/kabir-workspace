import React, { useRef } from 'react';
import { 
  FiCheckCircle, FiImage, FiXCircle, FiCamera, 
  FiBookOpen, FiAward, FiInfo, FiCheck 
} from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';

/**
 * ProfileModalProfileTab
 * Tab for updating basic profile info, pictures, and academic / student metadata.
 */
export default function ProfileModalProfileTab({
  profileMessage,
  onSelectImageFile,
  username,
  setUsername,
  name,
  setName,
  phone,
  setPhone,
  isStudent,
  setIsStudent,
  studentStatus = 'none',
  studentRejectionReason = null,
  institutionType,
  setInstitutionType,
  studentInstitution,
  setStudentInstitution,
  studentLevel,
  setStudentLevel,
  profileLoading,
  onProfileUpdate,
}) {
  const { t, language } = useLanguage();
  const isBn = language === 'bn';
  const profilePicRef = useRef(null);
  const coverPicRef = useRef(null);

  const institutionTypes = [
    { id: 'College', labelEn: 'College', labelBn: 'কলেজ' },
    { id: 'School', labelEn: 'School', labelBn: 'স্কুল' },
    { id: 'University', labelEn: 'University', labelBn: 'বিশ্ববিদ্যালয়' },
    { id: 'Polytechnic', labelEn: 'Polytechnic Institute', labelBn: 'পলিটেকনিক ইনস্টিটিউট' },
    { id: 'Madrasa', labelEn: 'Madrasa', labelBn: 'মাদ্রাসা' },
    { id: 'Other', labelEn: 'Other', labelBn: 'অন্যান্য' },
  ];

  // Dynamic institution label based on chosen type
  const getInstitutionLabel = () => {
    switch (institutionType) {
      case 'School':
        return isBn ? 'স্কুলের নাম' : 'School Name';
      case 'College':
        return isBn ? 'কলেজের নাম' : 'College Name';
      case 'University':
        return isBn ? 'বিশ্ববিদ্যালয়ের নাম' : 'University Name';
      case 'Polytechnic':
        return isBn ? 'পলিটেকনিক ইনস্টিটিউটের নাম' : 'Polytechnic Institute Name';
      case 'Madrasa':
        return isBn ? 'মাদ্রাসার নাম' : 'Madrasa Name';
      default:
        return isBn ? 'শিক্ষা প্রতিষ্ঠানের নাম' : 'Institution Name';
    }
  };

  const getInstitutionPlaceholder = () => {
    switch (institutionType) {
      case 'School':
        return isBn ? 'যেমন: কুমিল্লা জিলা স্কুল' : 'e.g. Dhaka Residential Model School';
      case 'College':
        return isBn ? 'যেমন: ঢাকা সিটি কলেজ / সরকারি বিজ্ঞান কলেজ' : 'e.g. Dhaka City College / Govt. Science College';
      case 'University':
        return isBn ? 'যেমন: ঢাকা বিশ্ববিদ্যালয় / ব্র্যাক ইউনিভার্সিটি' : 'e.g. University of Dhaka / BRAC University';
      case 'Polytechnic':
        return isBn ? 'যেমন: ঢাকা পলিটেকনিক ইনস্টিটিউট' : 'e.g. Dhaka Polytechnic Institute';
      case 'Madrasa':
        return isBn ? 'যেমন: তামিরুল মিল্লাত কামিল মাদ্রাসা' : 'e.g. Tamirul Millat Kamil Madrasa';
      default:
        return isBn ? 'প্রতিষ্ঠানের নাম লিখুন' : 'Enter institution name';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {profileMessage && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm font-bold flex items-start gap-3 ${
            profileMessage.type === 'success' || profileMessage.type === 'info'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
          }`}
        >
          {profileMessage.type === 'success' ? (
            <FiCheckCircle className="mt-0.5 text-lg shrink-0" />
          ) : profileMessage.type === 'info' ? (
            <FiImage className="mt-0.5 text-lg shrink-0" />
          ) : (
            <FiXCircle className="mt-0.5 text-lg shrink-0" />
          )}
          {profileMessage.text}
        </div>
      )}

      {/* Picture Upload Selectors */}
      <div className="mb-6 space-y-4">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
              <FiCamera />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isBn ? 'প্রোফাইল ছবি' : 'Profile Picture'}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isBn ? 'ইন্টারেক্টিভ ১:১ ক্রপ' : 'Interactive 1:1 circle cropper'}
              </p>
            </div>
          </div>
          <input
            ref={profilePicRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onSelectImageFile(file, 'profile');
                e.target.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={() => profilePicRef.current?.click()}
            className="cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {isBn ? 'আপলোড করুন' : 'Adjust & Upload'}
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400">
              <FiImage />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isBn ? 'কভার ছবি' : 'Cover Picture'}
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isBn ? 'ওয়াইড ব্যানার ফরম্যাট' : 'Wide banner crop format'}
              </p>
            </div>
          </div>
          <input
            ref={coverPicRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onSelectImageFile(file, 'cover');
                e.target.value = '';
              }
            }}
          />
          <button
            type="button"
            onClick={() => coverPicRef.current?.click()}
            className="cursor-pointer bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {isBn ? 'আপলোড করুন' : 'Adjust & Upload'}
          </button>
        </div>
      </div>

      <form onSubmit={onProfileUpdate} className="space-y-5">
        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
            {isBn ? 'ইউজারনেম' : 'Username'}{' '}
            <span className="text-[11px] font-semibold text-indigo-500 lowercase">
              ({isBn ? 'সহজ লগইনের জন্য' : 'for instant login'})
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              @
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))
              }
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-4 pl-9 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-mono"
              placeholder="e.g. sonia_akter"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isBn 
              ? 'ছোট হাতের অক্ষর (a-z), সংখ্যা (0-9), ডট (.) এবং আন্ডারস্কোর (_) ব্যবহার করা যাবে।'
              : 'Lowercase letters, numbers, dot (.) and underscore (_) only.'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
            {isBn ? 'পুরো নাম' : 'Full Name'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-4 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder={isBn ? 'আপনার পুরো নাম লিখুন' : 'Enter full name'}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2.5">
            {isBn ? 'ফোন নম্বর' : 'Phone Number'}
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-4 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
            placeholder={isBn ? 'ফোন নম্বর লিখুন' : 'Enter phone number'}
          />
        </div>

        {/* ── ACADEMIC / STUDENT INFORMATION SECTION ── */}
        <div className="pt-5 border-t border-slate-200 dark:border-slate-700/80">
          <div className="bg-gradient-to-br from-indigo-50/60 via-blue-50/40 to-slate-50/50 dark:from-indigo-950/20 dark:via-blue-950/15 dark:to-slate-900/40 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 shadow-sm space-y-4">
            
            {/* Header with Student Toggle */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FiBookOpen size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    {t('academic_info')}
                    {isStudent && (
                      studentStatus === 'approved' ? (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FiCheck size={10} /> {isBn ? 'অনুমোদিত' : 'Approved'}
                        </span>
                      ) : studentStatus === 'rejected' ? (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FiXCircle size={10} /> {isBn ? 'বাতিল' : 'Rejected'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> {isBn ? 'অনুমোদনের অপেক্ষায়' : 'Pending Approval'}
                        </span>
                      )
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('are_you_student')}
                  </p>
                </div>
              </div>

              {/* iOS Style Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={Boolean(isStudent)}
                  onChange={(e) => setIsStudent(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Approval / Benefit Notice */}
            {isStudent && studentStatus === 'pending' ? (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <FiInfo className="text-amber-600 mt-0.5 shrink-0" size={15} />
                <div>
                  <p className="font-bold">{isBn ? 'অ্যাডমিন অনুমোদনের অপেক্ষায় (Pending Verification)' : 'Awaiting Admin Approval'}</p>
                  <p className="mt-0.5 leading-relaxed">{t('student_pending_notice')}</p>
                </div>
              </div>
            ) : isStudent && studentStatus === 'rejected' ? (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2.5">
                <FiXCircle className="text-rose-600 mt-0.5 shrink-0" size={15} />
                <div>
                  <p className="font-bold">{isBn ? 'শিক্ষার্থী অনুমোদন বাতিল হয়েছে' : 'Student Status Rejected'}</p>
                  {studentRejectionReason && (
                    <p className="mt-0.5 text-rose-700 dark:text-rose-300 font-semibold">
                      {isBn ? 'কারণ: ' : 'Reason: '} {studentRejectionReason}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-rose-600/90 dark:text-rose-400">
                    {isBn ? 'সঠিক তথ্য আপডেট করে সেভ করলে তা আবার অ্যাডমিন পর্যালোচনায় পাঠানো হবে।' : 'Update your academic details and save to resubmit for review.'}
                  </p>
                </div>
              </div>
            ) : isStudent && studentStatus === 'approved' ? (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
                <FiCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={15} />
                <div>
                  <p className="font-bold">{isBn ? 'শিক্ষার্থী স্ট্যাটাস অনুমোদিত ও সক্রিয়' : 'Student Status Approved & Active'}</p>
                  <p className="mt-0.5 leading-relaxed">{t('student_approved_notice')}</p>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 leading-relaxed bg-white/70 dark:bg-slate-800/60 p-2.5 rounded-xl border border-indigo-100/60 dark:border-indigo-900/30">
                <FiInfo className="text-indigo-500 shrink-0" size={14} />
                <span>{t('student_leave_benefit')}</span>
              </p>
            )}

            {/* Expanded Academic Fields when isStudent is TRUE */}
            {isStudent && (
              <div className="space-y-4 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 animate-in fade-in slide-in-from-top-2 duration-250">
                
                {/* Institution Type Selector */}
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                    {t('institution_type')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {institutionTypes.map((item) => {
                      const isSelected = institutionType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setInstitutionType(item.id)}
                          className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                          }`}
                        >
                          <span>{isBn ? item.labelBn : item.labelEn}</span>
                          {isSelected && <FiCheck className="shrink-0 text-white" size={13} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Institution Name */}
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                    {getInstitutionLabel()} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentInstitution}
                    onChange={(e) => setStudentInstitution(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3.5 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xs"
                    placeholder={getInstitutionPlaceholder()}
                    required={isStudent}
                  />
                </div>

                {/* Class / Year / Semester */}
                <div>
                  <label className="block text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                    {t('academic_level_class')}
                  </label>
                  <input
                    type="text"
                    value={studentLevel}
                    onChange={(e) => setStudentLevel(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block p-3.5 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xs"
                    placeholder={t('enter_academic_level')}
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isBn 
                      ? 'ছুটির আবেদনে এডমিন আপনার প্রাতিষ্ঠানিক তথ্য দেখতে পাবেন।' 
                      : 'Admin will see your academic institution on your leave requests.'}
                  </p>
                </div>

              </div>
            )}

          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
          <button
            type="submit"
            disabled={profileLoading || !name}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {profileLoading ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              isBn ? 'প্রোফাইল তথ্য সেভ করুন' : 'Save Profile Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
