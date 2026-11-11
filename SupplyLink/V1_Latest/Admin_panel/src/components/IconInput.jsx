import React from "react";

const IconInput = ({
  label,
  icon: Icon,
  register,
  name,
  type = "text",
  placeholder,
  textarea = false,
  rows = 2,
  children,
  ...rest
}) => {
  const inputWrapper =
    "flex items-center gap-3 bg-[#091122] border border-white/10 rounded-xl px-3.5 py-2.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner";

  const inputClass =
    "w-full text-sm bg-transparent text-white focus:outline-none placeholder:text-slate-500";

  const iconClass = "text-slate-400 shrink-0";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-semibold tracking-wide text-slate-300 flex items-center gap-1.5">
          {label}
        </label>
      )}

      {/* TEXTAREA */}
      {textarea ? (
        <div className="relative bg-[#091122] border border-white/10 rounded-xl focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-inner">
          {Icon && <Icon className="absolute left-3.5 top-3.5 text-slate-400" />}
          <textarea
            {...register(name)}
            rows={rows}
            placeholder={placeholder}
            {...rest}
            className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-transparent text-white focus:outline-none placeholder:text-slate-500 resize-none"
          />
        </div>
      ) : (
        <div className={inputWrapper}>
          {Icon && <Icon className={iconClass} />}
          {children ? (
            children
          ) : (
            <input
              type={type}
              {...register(name)}
              placeholder={placeholder}
              {...rest}
              className={inputClass}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default IconInput;
