import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";

const parentBtnClass = (active) =>
  `w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-sm transition-all duration-200 ${
    active
      ? "bg-gradient-to-r from-indigo-600/25 via-indigo-600/10 to-transparent text-white font-semibold border-l-2 border-indigo-400"
      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
  }`;

const childLinkClass = ({ isActive }) =>
  `px-3 py-2 rounded-lg flex items-center gap-2.5 transition-all text-xs font-medium ${
    isActive
      ? "bg-indigo-600/25 text-white font-semibold shadow-sm border border-indigo-500/30"
      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
  }`;

const CollapsibleMenu = ({
  label,
  icon: Icon,
  children = [],
  onLinkClick,
  pendingCashApproval = 0,
}) => {
  const location = useLocation();

  // Child active check
  const hasActiveChild = useMemo(() => {
    return children.some((c) => c.path && location.pathname.startsWith(c.path));
  }, [children, location.pathname]);

  const [open, setOpen] = useState(false);

  // Auto open if a child route is active
  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild]);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={parentBtnClass(hasActiveChild)}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 shrink-0 opacity-80" />
          <span className="text-left truncate">{label}</span>
        </div>
        <span className="shrink-0 text-slate-500 transition-transform duration-200">
          {open ? <IoChevronUp className="w-4 h-4 text-indigo-400" /> : <IoChevronDown className="w-4 h-4" />}
        </span>
      </button>

      <div
        className={`ml-5 mt-1 pl-3 border-l border-white/[0.08] overflow-hidden transition-all duration-200 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col gap-1 py-1">
          {children.map((item, i) => (
            <NavLink
              key={i}
              to={item.path}
              className={childLinkClass}
              onClick={onLinkClick}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                  <item.icon className="w-4 h-4 shrink-0 opacity-75" />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.path === "/cash/cash-report-approval" &&
                  pendingCashApproval > 0 && (
                    <span className="relative flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm shadow-rose-500/50">
                      <span className="absolute -inset-0.5 animate-ping rounded-full bg-rose-400 opacity-50"></span>
                      <span className="relative">{pendingCashApproval}</span>
                    </span>
                  )}
              </div>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleMenu;
