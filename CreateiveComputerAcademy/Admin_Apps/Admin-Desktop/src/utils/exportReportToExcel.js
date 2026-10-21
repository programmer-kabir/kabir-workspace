export const handleExportPDF = ({ selectedStaffInfo, startDate, endDate, attReport, taskReport }) => {
    if (!selectedStaffInfo) return;

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
        window.print();
        return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CCA Staff Report - ${selectedStaffInfo.name} (${startDate} to ${endDate})</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          body {
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 10px;
            font-size: 11px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 900;
            color: #1e3a8a;
            margin: 0;
          }
          .staff-card {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 14px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
          }
          .sec-title {
            font-size: 13px;
            font-weight: 800;
            color: #1e293b;
            margin: 14px 0 8px 0;
            border-left: 3px solid #2563eb;
            padding-left: 8px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
            margin-bottom: 16px;
          }
          th {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: 800;
            text-transform: uppercase;
            padding: 6px 8px;
            text-align: left;
            border: 1px solid #334155;
          }
          td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            color: #334155;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .text-center { text-align: center; }
          .badge-p { background: #dcfce7; color: #166534; padding: 2px 5px; border-radius: 4px; font-weight: 800; }
          .badge-l { background: #fef3c7; color: #92400e; padding: 2px 5px; border-radius: 4px; font-weight: 800; }
          .badge-a { background: #fee2e2; color: #991b1b; padding: 2px 5px; border-radius: 4px; font-weight: 800; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-title">Creative Computer Academy</h1>
            <p style="margin:4px 0 0 0; color:#64748b; font-size:11px;">Individual Staff Performance & Attendance Report</p>
          </div>
          <div style="text-align:right; font-size:11px; color:#475569;">
            <p style="margin:0;"><strong>Period:</strong> ${startDate} to ${endDate}</p>
            <p style="margin:3px 0 0 0;"><strong>Generated:</strong> ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })} (UTC+6)</p>
          </div>
        </div>

        <div class="staff-card">
          <div>
            <h2 style="margin:0; font-size:15px; color:#0f172a;">${selectedStaffInfo.name}</h2>
            <p style="margin:3px 0 0 0; font-size:11px; color:#64748b;">${selectedStaffInfo.designation || 'Staff'} • <strong>${selectedStaffInfo.department_name || 'N/A'}</strong></p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0; font-size:11px;"><strong>Duty Expected:</strong> ${attReport?.summary?.total_expected || '-'}</p>
            <p style="margin:3px 0 0 0; font-size:11px;"><strong>Hours Worked:</strong> ${attReport?.summary?.total_worked || '-'}</p>
          </div>
        </div>

        <div class="sec-title">1. Daily Attendance Record</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Status</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Working Hours</th>
              <th>Break</th>
              <th>Overtime / Short</th>
            </tr>
          </thead>
          <tbody>
            ${(attReport?.history || []).map(r => `
              <tr>
                <td><strong>${new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></td>
                <td><span class="${r.status === 'Present' ? 'badge-p' : r.status === 'Late' ? 'badge-l' : 'badge-a'}">${r.status}</span></td>
                <td>${r.check_in || '-'}</td>
                <td>${r.check_out || '-'}</td>
                <td>${r.total_hours || '-'}</td>
                <td>${r.total_break_minutes > 0 ? r.total_break_minutes + 'm' : '-'}</td>
                <td>${r.overtime || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="sec-title">2. Task Deliverables Record</div>
        <table>
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Category</th>
              <th>Status</th>
              <th>Assign Date</th>
              <th>Submission</th>
              <th>Delayed</th>
            </tr>
          </thead>
          <tbody>
            ${(taskReport?.tasks || []).map(t => `
              <tr>
                <td><strong>${t.title}</strong></td>
                <td>${t.category || 'General'}</td>
                <td>${t.status}</td>
                <td>${new Date(t.assign_date || t.created_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short' })}</td>
                <td>${t.submission_link ? 'Submitted' : '-'}</td>
                <td>${t.was_delayed ? 'Yes' : 'No'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
}


export const handleExportExcel = ({ selectedStaffInfo, startDate, endDate, attReport, taskReport }) => {
    if (!selectedStaffInfo) return;
    const filename = `${selectedStaffInfo.name.replace(/\s+/g, '_')}_Performance_Report_${startDate}_to_${endDate}.xls`;

    const htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Calibri, Arial, sans-serif; }
            .header-title { font-size: 16pt; font-weight: bold; color: #1e3a8a; }
            .main-table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            .main-th { background-color: #1e293b; color: #ffffff; padding: 8px 12px; font-weight: bold; border: 1px solid #334155; }
            .main-td { padding: 8px 12px; border: 1px solid #cbd5e1; }
          </style>
        </head>
        <body>
          <p class="header-title">Staff Performance Report: ${selectedStaffInfo.name} (${selectedStaffInfo.designation || 'Employee'})</p>
          <p><strong>Department:</strong> ${selectedStaffInfo.department_name || 'N/A'} | <strong>Period:</strong> ${startDate} to ${endDate}</p>
          <br />
  
          <h3>1. Attendance Record</h3>
          <table class="main-table">
            <thead>
              <tr>
                <th class="main-th">Date</th>
                <th class="main-th">Status</th>
                <th class="main-th">Check In</th>
                <th class="main-th">Check Out</th>
                <th class="main-th">Working Hours</th>
                <th class="main-th">Break Minutes</th>
                <th class="main-th">Overtime/Short</th>
              </tr>
            </thead>
            <tbody>
              ${(attReport?.history || []).map(r => `
                <tr>
                  <td class="main-td">${r.date}</td>
                  <td class="main-td">${r.status}</td>
                  <td class="main-td">${r.check_in || '-'}</td>
                  <td class="main-td">${r.check_out || '-'}</td>
                  <td class="main-td">${r.total_hours || '-'}</td>
                  <td class="main-td">${r.total_break_minutes || 0}m</td>
                  <td class="main-td">${r.overtime || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
  
          <h3>2. Task Deliverables Record</h3>
          <table class="main-table">
            <thead>
              <tr>
                <th class="main-th">Title</th>
                <th class="main-th">Status</th>
                <th class="main-th">Category</th>
                <th class="main-th">Assign Date</th>
                <th class="main-th">Submission Link</th>
                <th class="main-th">Delayed</th>
                <th class="main-th">Resubmissions</th>
              </tr>
            </thead>
            <tbody>
              ${(taskReport?.tasks || []).map(t => `
                <tr>
                  <td class="main-td"><strong>${t.title}</strong></td>
                  <td class="main-td">${t.status}</td>
                  <td class="main-td">${t.category || 'General'}</td>
                  <td class="main-td">${t.assign_date || t.created_at}</td>
                  <td class="main-td">${t.submission_link || '-'}</td>
                  <td class="main-td">${t.was_delayed ? 'Yes' : 'No'}</td>
                  <td class="main-td">${t.resubmit_count || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const downloadCSV = (filename, contentArray) => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
        + contentArray.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const handleExportCSV = ({ selectedStaffInfo, activeTab, attReport, taskReport }) => {
    if (!selectedStaffInfo) return;
    if (activeTab === 'attendance') {
        if (!attReport || !attReport.history || attReport.history.length === 0) return;
        const headers = ['Date', 'Status', 'Check In', 'Check Out', 'Total Hours', 'Break Time', 'Overtime/Short'];
        const rows = attReport.history.map(row => [
            row.date,
            row.status,
            row.check_in || '-',
            row.check_out || '-',
            row.total_hours || '-',
            row.total_break_minutes ? `${row.total_break_minutes}m` : '-',
            row.overtime || '-'
        ]);
        downloadCSV(`${selectedStaffInfo.name}_attendance_report.csv`, [headers, ...rows]);
    } else if (activeTab === 'tasks') {
        if (!taskReport || !taskReport.tasks || taskReport.tasks.length === 0) return;
        const headers = ['Title', 'Status', 'Category', 'Assign Date', 'Submission Link', 'Delayed', 'Resubmitted', 'Rejection Reason'];
        const rows = taskReport.tasks.map(t => [
            t.title,
            t.status,
            t.category || '-',
            t.assign_date || t.created_at,
            t.submission_link || '-',
            t.was_delayed ? 'Yes' : 'No',
            t.was_resubmitted ? 'Yes' : 'No',
            t.admin_note || '-'
        ]);
        downloadCSV(`${selectedStaffInfo.name}_task_report.csv`, [headers, ...rows]);
    }
};