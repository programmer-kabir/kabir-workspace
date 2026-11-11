import React, { createContext, useContext, useEffect, useState } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

const dictionary = {
  en: {
    dashboard: "Dashboard",
    tasks: "Tasks",
    attendance: "Attendance",
    leave: "Leave",
    reports: "Reports",
    profile: "Profile",
    settings: "Settings",
    logout: "Logout",
    welcome: "Welcome back",
    activeTasks: "Active Tasks",
    completed: "Completed",
    inReview: "In Review",
    credits_wallet: "Credit Wallet",
    message: "Message",
    brand_kit: "Brand Kit",
    breaks_log: "Breaks Log",
    academy_feed: "Academy Feed",
    community_wall: "Community Wall",
    team_events: "Team Feasts & Tours",
    desktop_app: "Desktop App & Updates",
    mango_tree: "Mango Break Tree",
    content_studio: "Content Studio",
    payroll_wallet: "Work Wallet & Salary",
    dev_suite: "Dev Console",
    dev_overview: "Overview",
    dev_events: "Team Events & Feasts",
    dev_mango_vault: "Mango Vault & Leaves 🥭",
    dev_impersonate: "User Impersonator",
    dev_logs: "System Logs",
    dev_api_tester: "API & Sockets",
    dev_crons: "Crons & Auto",
    dev_database: "Database",
    dev_editor: "Server Code Editor",
    staggered_roadmap_title: "1-Year Staggered Career Roadmap",
    staggered_roadmap_subtitle: "Your annual contract progresses through 4 quarterly milestone tiers. Past months remain permanently locked at their exact rate.",
    active_quarter: "Active Quarter",
    quarter_milestones: "Quarterly Milestones",
    quarter_completed: "Completed",
    quarter_active: "Active Now",
    quarter_upcoming: "Upcoming",
    academic_info: "Academic & Student Information",
    are_you_student: "Are you currently an enrolled student?",
    student_leave_benefit: "Enables up to 3 days of student academic leaves per month for exams and classes.",
    institution_type: "Institution Type",
    school: "School",
    college: "College",
    university: "University",
    polytechnic: "Polytechnic Institute",
    madrasa: "Madrasa",
    other_institution: "Other Institution",
    institution_name: "Institution Name",
    school_name: "School Name",
    college_name: "College Name",
    university_name: "University Name",
    academic_level_class: "Class / Year / Semester",
    enter_institution_name: "e.g. Govt. Science College",
    enter_academic_level: "e.g. Class 10, HSC 2nd Year, 4th Semester",
    student_status_approved: "Approved & Active",
    student_status_pending: "Verification Pending (Awaiting Admin Approval)",
    student_status_rejected: "Verification Rejected",
    student_pending_notice: "Your academic info has been submitted. Academic leave quota (up to 3 days/month) will activate once approved by Admin.",
    student_rejected_notice: "Admin has rejected your student status verification.",
    student_approved_notice: "Student status is approved. You can apply for up to 3 days of student academic leaves each month.",
  },
  bn: {
    dashboard: "ড্যাশবোর্ড",
    tasks: "টাস্ক সমূহ",
    attendance: "উপস্থিতি",
    leave: "ছুটি",
    reports: "রিপোর্টস",
    profile: "প্রোফাইল",
    settings: "সেটিংস",
    logout: "লগআউট",
    welcome: "স্বাগতম",
    activeTasks: "সচল টাস্ক",
    completed: "সম্পন্ন",
    inReview: "রিভিউ চলছে",
    credits_wallet: "ক্রেডিট ওয়ালেট",
    message: "মেসেজ",
    brand_kit: "ব্র্যান্ড কিট",
    breaks_log: "ব্রেক লগ",
    academy_feed: "অ্যাকাডেমি ফিড",
    community_wall: "কমিউনিটি ওয়াল",
    team_events: "টিম ফিস্ট ও ট্যুর 🎉",
    desktop_app: "ডেস্কটপ অ্যাপ ও আপডেট",
    mango_tree: "ম্যাঙ্গো ব্রেক ট্রি",
    content_studio: "কনটেন্ট স্টুডিও",
    payroll_wallet: "ওয়ার্ক ওয়ালেট ও বেতন",
    dev_suite: "ডেভ কনসোল",
    dev_overview: "ওভারভিউ",
    dev_events: "টিম ইভেন্ট ও ফিস্ট",
    dev_mango_vault: "ম্যাঙ্গো ভল্ট ও লিভস 🥭",
    dev_impersonate: "ইউজার ইমপার্সনেটর",
    dev_logs: "সিস্টেম লগ",
    dev_api_tester: "API ও সকেট",
    dev_crons: "ক্রন ও অটোমেশন",
    dev_database: "ডাটাবেজ",
    dev_editor: "সার্ভার কোড এডিটর",
    staggered_roadmap_title: "১ বছরের ধাপভিত্তিক ক্যারিয়ার রোডম্যাপ",
    staggered_roadmap_subtitle: "আপনার বার্ষিক চুক্তি ৪টি ত্রৈমাসিক ধাপে বিভক্ত। পেছনের মাসগুলো স্থায়ীভাবে সেই ধাপের রেটেই সংরক্ষিত থাকে।",
    active_quarter: "বর্তমান সক্রিয় ধাপ",
    quarter_milestones: "ত্রৈমাসিক ধাপসমূহ",
    quarter_completed: "সম্পন্ন",
    quarter_active: "বর্তমান সক্রিয়",
    quarter_upcoming: "আসন্ন",
    academic_info: "শিক্ষাগত ও শিক্ষার্থী তথ্য",
    are_you_student: "আপনি কি বর্তমানে শিক্ষার্থী?",
    student_leave_benefit: "পরীক্ষা ও ক্লাসের জন্য মাসে সর্বোচ্চ ৩ দিন পর্যন্ত স্টুডেন্ট একাডেমিক ছুটির সুবিধা চালু থাকবে।",
    institution_type: "প্রতিষ্ঠানের ধরন",
    school: "স্কুল",
    college: "কলেজ",
    university: "বিশ্ববিদ্যালয়",
    polytechnic: "পলিটেকনিক ইনস্টিটিউট",
    madrasa: "মাদ্রাসা",
    other_institution: "অন্যান্য প্রতিষ্ঠান",
    institution_name: "প্রতিষ্ঠানের নাম",
    school_name: "স্কুলের নাম",
    college_name: "কলেজের নাম",
    university_name: "বিশ্ববিদ্যালয়ের নাম",
    academic_level_class: "শ্রেণি / শিক্ষাবর্ষ / সেমিস্টার",
    enter_institution_name: "যেমন: সরকারি বিজ্ঞান কলেজ",
    enter_academic_level: "যেমন: ১০ম শ্রেণি, এইচএসসি ২য় বর্ষ, ৪র্থ সেমিস্টার",
    student_status_approved: "অনুমোদিত ও সক্রিয়",
    student_status_pending: "অনুমোদনের অপেক্ষায় (অ্যাডমিন ভেরিফিকেশন চলছে)",
    student_status_rejected: "অনুরোধ বাতিল করা হয়েছে",
    student_pending_notice: "আপনার শিক্ষার্থী তথ্য সংরক্ষিত হয়েছে। অ্যাডমিন অনুমোদন করার পর ৩ দিনের অ্যাকাডেমিক ছুটির কোটা চালু হবে।",
    student_rejected_notice: "অ্যাডমিন আপনার শিক্ষার্থী স্ট্যাটাস অনুমোদন করেননি।",
    student_approved_notice: "শিক্ষার্থী স্ট্যাটাস অনুমোদিত। আপনি প্রতি মাসে সর্বোচ্চ ৩ দিন পর্যন্ত স্টুডেন্ট অ্যাকাডেমিক ছুটি নিতে পারবেন।",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('cca_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('cca_language', language);
    // Optionally set html lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    if (!key) return '';
    return dictionary[language]?.[key] || dictionary['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
