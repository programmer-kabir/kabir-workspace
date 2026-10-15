import React, { useEffect, useMemo, useState } from 'react';

const CompanyProfit = () => {

  const [profits, setProfits] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {

    fetch(`${import.meta.env.VITE_LOCALHOST_KEY}/profit_generator/get_fortified_profit.php`)
      .then(res => res.json())
      .then(data => {

        console.log(data);

        if (data?.success) {
            const fullData = data.data
           const companyProfit = fullData.filter(
  item => Number(item.beneficiary_id) === 1
);

console.log(companyProfit);
          setProfits(companyProfit || []);
        }

        setLoading(false);
      })
      .catch(err => {
        console.log(err);
        setLoading(false);
      });

  }, []);

  // all years
  const years = [...new Set(
    profits.map(item => item.profit_year)
  )];

  // all months
  const months = [...new Set(
    profits.map(item => item.profit_month)
  )];

  // filtered data
  const filteredProfits = useMemo(() => {

    return profits.filter(item => {

      const yearMatch = selectedYear
        ? Number(item.profit_year) === Number(selectedYear)
        : true;

      const monthMatch = selectedMonth
        ? Number(item.profit_month) === Number(selectedMonth)
        : true;

      return yearMatch && monthMatch;
    });

  }, [profits, selectedYear, selectedMonth]);

  // total profit
  const totalProfit = filteredProfits.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
console.log(totalProfit)
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
   <div className="p-6">

    {/* Header */}
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">

      <div>
        <h2 className="text-3xl font-bold text-white">
          Company Profit
        </h2>

        <p className="text-gray-400 mt-1">
          Company transferred forfeited profit history
        </p>
      </div>

      {/* Total Card */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 rounded-2xl shadow-lg min-w-[250px]">

        <p className="text-sm text-white/80 mb-1">
          Total Profit
        </p>

        <h2 className="text-3xl font-bold text-white">
          ৳ {totalProfit.toLocaleString()}
        </h2>

      </div>

    </div>

    {/* Filters */}
    <div className="bg-[#071028] border border-white/10 rounded-2xl p-4 mb-6">

      <div className="flex flex-col md:flex-row gap-4">

        {/* Year */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-[#0B1739] border border-white/10 text-white px-4 py-3 rounded-xl outline-none w-full md:w-[180px]"
        >
          <option value="">All Years</option>

          {
            years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))
          }

        </select>

        {/* Month */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#0B1739] border border-white/10 text-white px-4 py-3 rounded-xl outline-none w-full md:w-[180px]"
        >
          <option value="">All Months</option>

          {
            months.map(month => (
              <option key={month} value={month}>
                Month {month}
              </option>
            ))
          }

        </select>

      </div>

    </div>

    {/* Table */}
    <div className="bg-[#071028] border border-white/10 rounded-2xl overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-[#0B1739]">

            <tr>

              <th className="text-left px-5 py-4 text-gray-300 font-semibold">
                #
              </th>

              <th className="text-left px-5 py-4 text-gray-300 font-semibold">
                Investor
              </th>

              <th className="text-left px-5 py-4 text-gray-300 font-semibold">
                Card
              </th>

              <th className="text-left px-5 py-4 text-gray-300 font-semibold">
                Month
              </th>

              <th className="text-left px-5 py-4 text-gray-300 font-semibold">
                Year
              </th>

              <th className="text-left px-5 py-4 text-gray-300 font-semibold">
                Profit
              </th>

              <th className="text-left px-5 py-4 text-gray-300 font-semibold">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {
              filteredProfits.length > 0 ? (

                filteredProfits.map((item, index) => (

                  <tr
                    key={item.id}
                    className="border-t border-white/5 hover:bg-white/5 transition"
                  >

                    <td className="px-5 py-4 text-white">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4 text-white font-medium">
                      {item.investor_name}
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {item.card_name}
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {item.profit_month}
                    </td>

                    <td className="px-5 py-4 text-gray-300">
                      {item.profit_year}
                    </td>

                    <td className="px-5 py-4">

                      <span className="text-green-400 font-semibold">
                        ৳ {Number(item.amount).toLocaleString()}
                      </span>

                    </td>

                    <td className="px-5 py-4">

                      <span className="
                        bg-red-500/20
                        text-red-400
                        px-3
                        py-1
                        rounded-full
                        text-sm
                        font-medium
                      ">
                        {item.status}
                      </span>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="7"
                    className="text-center py-10 text-gray-400"
                  >
                    No Data Found
                  </td>

                </tr>

              )
            }

          </tbody>

        </table>

      </div>

    </div>

  </div>
  );
};

export default CompanyProfit;