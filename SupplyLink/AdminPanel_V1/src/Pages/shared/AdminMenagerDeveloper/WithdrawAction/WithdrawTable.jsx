const WithdrawTable = ({ data = [], investorMap,handleReject,handleApprove }) => {
  return (
    <div className="overflow-x-auto ">
      <table className="min-w-full text-sm text-left text-gray-200">
        {/* ================= Table Head ================= */}
        <thead className="bg-gradient-to-r from-slate-800 to-slate-900 text-xs uppercase">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Image</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Card ID</th>
            <th className="px-4 py-3">Request Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-center">Action</th>
          </tr>
        </thead>

        {/* ================= Table Body ================= */}
        <tbody className="divide-y divide-slate-700 bg-slate-900">
          {data.map((item, index) => {
            const user = investorMap[item.investor_id];
            const avatar = user?.photo
              ? `https://biniyog.supplylinkbd.com/${user.photo}`
              : "/avatar.png";

            return (
              <tr key={item.id} className="hover:bg-slate-800 transition">
                {/* # */}
                <td className="px-4 py-3">{index + 1}</td>

                {/* Image */}
                <td className="px-4 py-3">
                  <img
                    src={avatar}
                    alt="user"
                    className="w-9 h-9 rounded-full object-cover border border-slate-600"
                  />
                </td>

                {/* Name */}
                <td className="px-4 py-3 font-medium">
                  {user?.name || "Unknown"}
                </td>

                {/* Card ID */}
                <td className="px-4 py-3">{item.card_id}</td>

                {/* Request Date */}
                <td className="px-4 py-3">{item?.requested_at}</td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${
                        item.action_name === "pending"
                          ? "bg-yellow-900 text-yellow-400"
                          : item.action_name === "accept"
                          ? "bg-green-900 text-green-400"
                          : "bg-red-900 text-red-400"
                      }
                    `}
                  >
                    {item.action_name}
                  </span>
                </td>

                {/* Action */}
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={()=>handleApprove(item)}
                      className="px-3 py-1 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs"
                    >
                      Approve
                    </button>

                    <button
                      onClick={()=>handleReject(item)}
                      className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Empty */}
      {data.length === 0 && (
        <div className="text-center py-6 text-gray-400">
          No withdraw requests found
        </div>
      )}
    </div>
  );
};

export default WithdrawTable;
