import React from "react";
import { Link } from "react-router-dom";
import { FaCrown } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_IMG_KEY || "https://api.dayalstock.com";

const getPreviewImage = (item) => {
  const src =
    item?.preview_1200_url || item?.preview_600_url || item?.watermarked_preview_image || item?.preview_image || item?.image_url;
  if (!src) return "/placeholder.jpg";
  if (src.startsWith("http")) return src;
  return `${BASE_URL}/${src}`;
};

export default function ContentCard({ data }) {
  if (!data) return null;
  // Use category_slug from data if available, otherwise default to "explore"
  const category = data.category_slug || "explore"; 

  return (
    <Link
      to={`/${category}/${data.slug}`}
      className="group relative block w-full overflow-hidden rounded-lg bg-slate-100"
    >
      <img
        src={getPreviewImage(data)}
        alt={data?.title || "Stock image"}
        className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105"
      />

      {/* Badge */}
      {data?.is_premium ? (
        <span className="absolute top-2 left-2 flex items-center gap-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-10">
          <FaCrown className="text-[9px]" /> PRO
        </span>
      ) : (
        <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow z-10">
          FREE
        </span>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 transition-transform duration-300 group-hover:translate-y-0 z-10">
        <p className="text-sm font-semibold text-white line-clamp-2">
          {data?.title}
        </p>
      </div>
    </Link>
  );
}
