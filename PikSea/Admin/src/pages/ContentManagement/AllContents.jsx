import React, { useState } from "react";
import { Files, BadgeCheck, Zap, Star } from "lucide-react";
import useAllContents from "../../utils/Hooks/useAllContents";
import ContentPageLayout from "../../components/ContentPageLayout";

const AllContents = () => {
  const [page, setPage] = useState(1);
  const { data: result = {}, isLoading, isError } = useAllContents({ status: "all", page });

  const contents     = result.data        ?? [];
  const total        = result.total       ?? 0;
  const statusCounts = result.statusCounts ?? {};

  const publishedCount = statusCounts.published ?? total;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          {/* Total */}
          <div
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{ background: "rgba(108,79,224,0.12)", border: "1px solid rgba(108,79,224,0.2)" }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "rgba(108,79,224,0.2)" }}
            >
              <Files size={18} className="text-[#6C4FE0]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{total}</p>
              <p className="text-xs text-gray-400">Total Studio Assets</p>
            </div>
          </div>

          {/* Active / Published */}
          <div
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "rgba(16,185,129,0.2)" }}
            >
              <BadgeCheck size={18} className="text-[#10B981]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{publishedCount}</p>
              <p className="text-xs text-gray-400">Live & Published</p>
            </div>
          </div>

          {/* Instant Delivery */}
          <div
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.25)" }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "rgba(6,182,212,0.2)" }}
            >
              <Zap size={18} className="text-[#06B6D4]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-gray-400">Direct Studio Direct</p>
            </div>
          </div>

          {/* Studio Original */}
          <div
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "rgba(245,158,11,0.2)" }}
            >
              <Star size={18} className="text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">Verified</p>
              <p className="text-xs text-gray-400">Official Assets</p>
            </div>
          </div>

        </div>
      )}

      {/* Full content list */}
      <ContentPageLayout
        title="All Contents"
        subtitle="Complete library of all marketplace assets across all categories"
        icon={<Files size={22} />}
        accentColor="#6C4FE0"
        contents={contents}
        isLoading={isLoading}
        isError={isError}
        showActions={false}
        serverPage={page}
        setServerPage={setPage}
        serverTotalPages={result.totalPages ?? 1}
      />
    </div>
  );
};

export default AllContents;