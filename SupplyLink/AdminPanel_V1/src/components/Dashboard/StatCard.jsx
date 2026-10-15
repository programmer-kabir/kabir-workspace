const StatCard = ({ title, value }) => {
  return (
    <>
    
    <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800">
      <p className="text-gray-400 text-xs">{title}</p>
      <h2 className="text-xl font-bold text-green-400">
        ৳{value.toLocaleString()}
      </h2>
    </div>
    </>
  );
};
export default StatCard;