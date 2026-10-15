import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ChartCard = ({ title, data }) => {
  return (
    <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-800">
      <p className="text-gray-400 text-sm mb-2">{title}</p>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#22c55e" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
export default ChartCard;