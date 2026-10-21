import React from "react";
import { Link, useLocation, useRouteError } from "react-router-dom";
import { FiAlertTriangle, FiRefreshCw, FiHome } from "react-icons/fi";

export default function ErrorPage({
  title = "Something went wrong",
  message = "We couldn't load this page right now. Please try again.",
}) {
  const location = useLocation();
  const error = useRouteError();
  console.error("🔥 React Router Caught Error:", error);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <section className="min-h-screen bg-black text-white px-6">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center">
        <div className="w-full text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/40 bg-blue-500/10">
            <FiAlertTriangle className="text-4xl text-blue-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-300">
            {title}
          </h1>

          {/* Message */}
          <p className="mx-auto mt-3 max-w-xl text-sm md:text-base text-blue-200/80">
            {message}
          </p>

          {/* Small detail */}
          <p className="mt-4 text-xs text-white/50">
            Path:{" "}
            <span className="text-white/70">{location?.pathname || "/"}</span>
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-950/60 border border-red-500/30 rounded-lg text-left text-xs font-mono text-red-300 max-h-48 overflow-auto">
              <p className="font-bold mb-1">Error: {error?.message || String(error)}</p>
              {error?.stack && <pre className="text-[10px] text-red-400/80 whitespace-pre-wrap">{error.stack}</pre>}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={handleReload}
              className="inline-flex items-center gap-2 rounded-lg border border-blue-400 px-5 py-2.5
                         text-blue-300 shadow hover:border-transparent hover:bg-blue-500 hover:text-white hover:shadow-lg"
            >
              <FiRefreshCw />
              Retry
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5
                         text-white/80 hover:bg-white/10"
            >
              <FiHome />
              Back to Home
            </Link>
          </div>

          {/* Extra help */}
          <div className="mt-10 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
            <p className="text-sm font-semibold text-blue-300">Quick tips</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-white/70 space-y-1">
              <li>Check your internet connection.</li>
              <li>Refresh the page or try again later.</li>
              <li>If the problem continues, contact support.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
