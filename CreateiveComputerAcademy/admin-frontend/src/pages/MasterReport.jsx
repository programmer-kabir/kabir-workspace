import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMasterReport } from '../hooks/useMasterReport';
import MasterHeaderBar from '../components/MasterReport/MasterHeaderBar';
import MasterKpiCards from '../components/MasterReport/MasterKpiCards';
import MasterTopPerformers from '../components/MasterReport/MasterTopPerformers';
import MasterStaffFilterBar from '../components/MasterReport/MasterStaffFilterBar';
import MasterStaffTable from '../components/MasterReport/MasterStaffTable';
import { FiAlertCircle } from 'react-icons/fi';

const MasterReport = () => {
  const navigate = useNavigate();

  const {
    API_BASE,
    MONTH_NAMES,
    AVAILABLE_YEARS,
    filterType,
    setFilterType,
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    loading,
    setLoading,
    reportData,
    setReportData,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    selectedDept,
    setSelectedDept,
    sortBy,
    setSortBy,
    expandedStaffId,
    setExpandedStaffId,
    activeDateRange,
    fetchReport,
    departmentOptions,
    filteredStaff,
    topPerformers,
    toggleExpand,
    handleExportExcel,
    handleExportPDF,
    handleExportCSV
  } = useMasterReport();

  return (
    <div className="pb-12 animate-in fade-in zoom-in-95 duration-300">

      {/* ──────── Header Title, Controls, Date Filter & Exports ──────── */}
      <MasterHeaderBar
        loading={loading}
        reportData={reportData}
        filterType={filterType}
        setFilterType={setFilterType}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        customStart={customStart}
        setCustomStart={setCustomStart}
        customEnd={customEnd}
        setCustomEnd={setCustomEnd}
        activeDateRange={activeDateRange}
        fetchReport={fetchReport}
        handleExportExcel={handleExportExcel}
        handleExportPDF={handleExportPDF}
        handleExportCSV={handleExportCSV}
        MONTH_NAMES={MONTH_NAMES}
        AVAILABLE_YEARS={AVAILABLE_YEARS}
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 text-red-700 dark:text-red-400 text-sm font-semibold flex items-center gap-2 mb-8">
          <FiAlertCircle size={20} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ──────── KPI SUMMARY CARDS ──────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">Aggregating Comprehensive Workforce Metrics...</p>
        </div>
      ) : reportData && (
        <div className="space-y-8 animate-in fade-in duration-300">

          {/* 1. Global KPIs */}
          <MasterKpiCards
            summary={reportData.company_summary}
            period={reportData.period}
          />

          {/* 2. Top Performers Podium & Department Intelligence */}
          <MasterTopPerformers
            topPerformers={topPerformers}
            toggleExpand={toggleExpand}
            departmentStats={reportData.department_stats}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            API_BASE={API_BASE}
          />

          {/* 3. Search, Filter & Sorter Controls */}
          <MasterStaffFilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            departmentOptions={departmentOptions}
            selectedDept={selectedDept}
            setSelectedDept={setSelectedDept}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          {/* 4. Multi-Dimensional Master Directory Table */}
          <MasterStaffTable
            filteredStaff={filteredStaff}
            expandedStaffId={expandedStaffId}
            toggleExpand={toggleExpand}
            navigate={navigate}
            API_BASE={API_BASE}
          />
        </div>
      )}

    </div>
  );
};

export default MasterReport;
