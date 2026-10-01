import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

const BackButton = ({ text = "Back", className = "", to }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white text-xs font-semibold shadow-lg shadow-black/20 backdrop-blur-xl transition-all duration-200 cursor-pointer active:scale-95 ${className}`}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:-translate-x-0.5 transition-all duration-200 shadow-sm">
        <FiArrowLeft className="text-xs transition-transform duration-200 group-hover:-translate-x-0.5" />
      </div>
      <span className="tracking-wide">{text}</span>
    </button>
  );
};

export default BackButton;
