import React, { useState } from "react";
import { Files, Clock, BadgeCheck, FileX2 } from "lucide-react";
import useAllContents from "../../utils/Hooks/useAllContents";
import ContentPageLayout from "../../components/ContentPageLayout";

const STATS = [
  { key: "pending",   label: "Pending Review", icon: Clock,      color: "#F59E0B" },
  { key: "published", label: "Published",       icon: BadgeCheck, color: "#10B981" },
  { key: "rejected",  label: "Rejected",        icon: FileX2,     color: "#EF4444" },
];

const AllContents = () => {
  const [page, setPage] = useState(1);
  const { data: result = {}, isLoading, isError } = useAllContents({ status: "all", page });

  const contents     = result.data        ?? [];
  const total        = result.total       ?? 0;
  const statusCounts = result.statusCounts ?? {};

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
              <p className="text-xs text-gray-400">Total Contents</p>
            </div>
          </div>

          {/* Pending / Published / Rejected */}
          {STATS.map(({ key, label, icon: Icon, color }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-2xl p-4"
              style={{
                background: `${color}12`,
                border: `1px solid ${color}28`,
              }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ background: `${color}20` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {statusCounts[key] ?? 0}
                </p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            </div>
          ))}

        </div>
      )}

      {/* Full content list */}
      <ContentPageLayout
        title="All Contents"
        subtitle="Complete library of all contributor uploads across all statuses"
        icon={<Files size={22} />}
        accentColor="#6C4FE0"
        contents={contents}
        isLoading={isLoading}
        isError={isError}
        showActions={true}
        serverPage={page}
        setServerPage={setPage}
        serverTotalPages={result.totalPages ?? 1}
      />
    </div>
  );
};

export default AllContents;