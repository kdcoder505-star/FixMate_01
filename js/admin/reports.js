let allComplaints = [];
let filteredComplaints = [];
let trendChart, categoryChart;

document.addEventListener('DOMContentLoaded', async () => {
    initDateRangePicker();
    await loadInitialData();
    initExportListeners();
});

async function loadInitialData() {
    const sb = window.supabaseClient;
    if (!sb) {
        console.error("Supabase client not found");
        return;
    }

    try {
        const { data, error } = await sb.from('complaints').select('*');
        if (error) throw error;
        allComplaints = data || [];

        // Initial filter based on default 30-day range
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        filterByDateRange(start, end);

    } catch (e) {
        console.error("Error loading data:", e);
    }
}

function initDateRangePicker() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    flatpickr("#dateRangePicker", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: [start, end],
        onChange: function (selectedDates, dateStr) {
            if (selectedDates.length === 2) {
                document.getElementById('selectedDateText').innerText =
                    selectedDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + " - " +
                    selectedDates[1].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                filterByDateRange(selectedDates[0], selectedDates[1]);
            }
        }
    });

    // Set initial text
    document.getElementById('selectedDateText').innerText =
        start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + " - " +
        end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function filterByDateRange(start, end) {
    const startTime = new Date(start).setHours(0, 0, 0, 0);
    const endTime = new Date(end).setHours(23, 59, 59, 999);

    filteredComplaints = allComplaints.filter(c => {
        if (!c.created_at) return false;

        let cDate;
        if (c.created_at.toDate) { // Firebase Timestamp
            cDate = c.created_at.toDate().getTime();
        } else {
            cDate = new Date(c.created_at).getTime();
        }

        return cDate >= startTime && cDate <= endTime;
    });

    updateDashboard();
}

function updateDashboard() {
    updateStats();
    renderCharts();
    updateTable();
}

function updateStats() {
    // Total Issues
    const totalEl = document.querySelectorAll('.admin-card .fs-2')[0];
    if (totalEl) totalEl.innerText = filteredComplaints.length;

    // Resolution Rate
    const resolvedCount = filteredComplaints.filter(c => c.status === 'resolved' || c.status === 'Resolved').length;
    const rate = filteredComplaints.length ? ((resolvedCount / filteredComplaints.length) * 100).toFixed(1) : 0;
    const rateEl = document.querySelectorAll('.admin-card .fs-2')[1];
    if (rateEl) rateEl.innerText = rate + '%';
}

function renderCharts() {
    // Midnight Gold Palette
    const midnightBlue = '#0f172a';
    const champagneGold = '#d4af37';
    const slateGray = '#475569';

    // 1. Trend Chart
    const ctxTrend = document.getElementById('trendChart').getContext('2d');
    if (trendChart) trendChart.destroy();

    // Get range from Flatpickr
    const fp = document.getElementById('dateRangePicker')._flatpickr;
    let labels = [];
    let data = [];

    if (fp && fp.selectedDates.length === 2) {
        let current = new Date(fp.selectedDates[0]);
        const end = new Date(fp.selectedDates[1]);

        while (current <= end) {
            const dateStr = current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(dateStr);

            // Count for this day
            const dayStart = new Date(current).setHours(0, 0, 0, 0);
            const dayEnd = new Date(current).setHours(23, 59, 59, 999);

            const count = filteredComplaints.filter(c => {
                const ts = (c.created_at && c.created_at.toDate) ? c.created_at.toDate().getTime() : new Date(c.created_at).getTime();
                return ts >= dayStart && ts <= dayEnd;
            }).length;

            data.push(count);
            current.setDate(current.getDate() + 1);
        }
    } else {
        labels = ['No Range Selected'];
        data = [0];
    }

    trendChart = new Chart(ctxTrend, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Issues Reported',
                data: data,
                borderColor: champagneGold,
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: midnightBlue,
                pointRadius: data.length > 31 ? 0 : 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: true, beginAtZero: true, ticks: { stepSize: 1, color: slateGray, font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { color: slateGray, font: { size: 10 }, maxRotation: 45, autoSkip: true } }
            }
        }
    });

    // 2. Category Chart
    const ctxCat = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();

    const categories = ['Classroom', 'Lab', 'Veranda', 'Wi-Fi', 'Restroom'];
    const catData = categories.map(cat => {
        return filteredComplaints.filter(c => (c.category || '').toLowerCase() === cat.toLowerCase()).length;
    });

    categoryChart = new Chart(ctxCat, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                data: catData,
                backgroundColor: midnightBlue,
                hoverBackgroundColor: champagneGold,
                borderRadius: 4,
                barThickness: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false, beginAtZero: true },
                x: { display: false }
            }
        }
    });
}

function updateTable() {
    const tbody = document.querySelector('table tbody');
    if (!tbody) return;

    tbody.innerHTML = filteredComplaints.slice(0, 10).map(c => {
        let dateStr;
        if (c.created_at && c.created_at.toDate) {
            dateStr = c.created_at.toDate().toLocaleDateString();
        } else {
            dateStr = new Date(c.created_at).toLocaleDateString();
        }

        return `
        <tr>
            <td class="fw-bold text-dark">#${c.id ? c.id.substring(0, 8) : 'N/A'}</td>
            <td><span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill">${c.category || 'Other'}</span></td>
            <td class="text-muted text-truncate" style="max-width: 200px;">${c.description || 'No description'}</td>
            <td class="fw-medium text-dark">${dateStr}</td>
            <td class="text-end">
                <span class="badge ${(c.status || '').toLowerCase() === 'resolved' ? 'bg-success' : 'bg-warning'} text-white">
                    ${c.status || 'Pending'}
                </span>
            </td>
        </tr>
    `}).join('');
}

function initExportListeners() {
    document.getElementById('exportPDF').addEventListener('click', exportToPDF);
    document.getElementById('exportExcel').addEventListener('click', exportToExcel);
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("FixMate - Analytics Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Issues: ${filteredComplaints.length}`, 14, 38);

    const head = [['Case ID', 'Category', 'Status', 'Date']];
    const body = filteredComplaints.map(c => [
        `#${c.id.substring(0, 8)}`,
        c.category,
        c.status,
        new Date(c.created_at).toLocaleDateString()
    ]);

    doc.autoTable({
        startY: 45,
        head: head,
        body: body,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] } // Midnight Blue
    });

    doc.save(`FixMate_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

function exportToExcel() {
    const data = filteredComplaints.map(c => ({
        'Case ID': c.id,
        'Category': c.category,
        'Description': c.description,
        'Status': c.status,
        'Created At': new Date(c.created_at).toLocaleString(),
        'Student ID': c.student_id
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Complaints");
    XLSX.writeFile(workbook, `FixMate_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}
