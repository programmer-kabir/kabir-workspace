import React from "react";
import { Link } from "react-router-dom";
import { FiHome, FiAlertCircle, FiArrowLeft } from "react-icons/fi";

const NotFound = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-slate-50">
      <div className="max-w-md w-full text-center bg-white p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100">
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
          <FiAlertCircle className="text-4xl" />
        </div>

        <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 rounded-full mb-3">
          Error 404
        </span>

        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          পৃষ্ঠাটি খুঁজে পাওয়া যায়নি
        </h1>

        <p className="text-sm md:text-base text-slate-500 mb-8 leading-relaxed">
          আপনি যে লিংকটিতে প্রবেশের চেষ্টা করেছেন তা বর্তমানে বিদ্যমান নেই অথবা সরানো হয়েছে।
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-200 transition duration-200"
          >
            <FiHome className="text-lg" />
            হোম পেজে যান
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition duration-200"
          >
            <FiArrowLeft className="text-lg" />
            পেছনে যান
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
