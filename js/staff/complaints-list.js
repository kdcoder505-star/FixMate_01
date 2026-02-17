
/* --- COMPLAINTS LIST CONTROLLER --- */

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabaseClient) return;
    const sb = window.supabaseClient;

    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // Elements
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const tbody = document.getElementById('complaintsTableBody');
    const showingText = document.getElementById('showingText');
    const paginationControls = document.getElementById('paginationControls');

    // Load Data
    await fetchData();

    // filters
    setupFilters();

    async function fetchData() {
        try {
            // Fetch complaints
            const { data, error } = await sb.from('complaints').select('*');
            if (error) {
                console.error('Error fetching complaints:', error);
                allData = [];
            } else {
                allData = data || [];
                allData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
            applyFilters();
        } catch (e) {
            console.error('Exception fetching data:', e);
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-danger">Error loading data.</td></tr>';
        }
    }

    function setupFilters() {
        searchInput.addEventListener('input', () => { applyFilters(); });
        categoryFilter.addEventListener('change', () => { applyFilters(); });
        statusFilter.addEventListener('change', () => { applyFilters(); });
        priorityFilter.addEventListener('change', () => { applyFilters(); });
    }

    function applyFilters() {
        const query = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const status = statusFilter.value;
        const priority = priorityFilter.value;

        filteredData = allData.filter(item => {
            const matchSearch = !query ||
                (item.title && (item.title.toLowerCase().includes(query) || item.title.includes(query))) ||
                (item.id && (item.id.toLowerCase().includes(query) || item.id.includes(query))) ||
                (item.student_name && (item.student_name.toLowerCase().includes(query) || item.student_name.includes(query)));

            const matchCat = category === 'All' || item.category === category;
            const matchStatus = status === 'All' || item.status === status;
            const matchPri = priority === 'All' || item.priority === priority;

            return matchSearch && matchCat && matchStatus && matchPri;
        });

        currentPage = 1;
        renderPagination();
        renderTable();
    }

    function renderTable() {
        tbody.innerHTML = '';

        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-muted">No issues found matching criteria.</td></tr>';
            showingText.innerText = 'Showing 0 results';
            paginationControls.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = 1;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = filteredData.slice(start, end);

        pageData.forEach(item => {
            const date = new Date(item.created_at).toLocaleDateString();

            // Priority Badge
            let priClass = 'bg-secondary text-white';
            if (item.priority === 'High') priClass = 'badge bg-danger-subtle text-danger border border-danger-subtle';
            if (item.priority === 'Medium') priClass = 'badge bg-warning-subtle text-warning border border-warning-subtle';
            if (item.priority === 'Low') priClass = 'badge bg-success-subtle text-success border border-success-subtle';

            // Status Badge -> Now Dropdown
            const isPending = item.status === 'Pending' ? 'selected' : '';
            const inProgress = item.status === 'In Progress' ? 'selected' : '';
            const isResolved = item.status === 'Resolved' ? 'selected' : '';

            // Student Avatar
            const initials = (item.student_name || 'U').substring(0, 2).toUpperCase();

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold text-dark text-xs text-uppercase font-monospace">#${item.id.substring(0, 6)}</td>
                <td>
                    <div class="fw-medium text-dark text-sm text-truncate" style="max-width: 240px;">${item.title}</div>
                    <div class="text-secondary text-xs">${item.category}</div>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="avatar-circle bg-light text-primary border-0 text-xs shadow-sm" style="width: 28px; height: 28px;">${initials}</div>
                        <span class="text-sm text-dark fw-medium">${item.student_name || 'Unknown'}</span>
                    </div>
                </td>
                <td><span class="${priClass} rounded-pill text-xs px-2">${item.priority}</span></td>
                <td>
                    <select class="form-select form-select-sm shadow-sm" style="width: 140px; font-size: 0.85rem;" onchange="updateStatus('${item.id}', this.value)">
                        <option value="Pending" ${isPending}>Pending</option>
                        <option value="In Progress" ${inProgress}>In Progress</option>
                        <option value="Resolved" ${isResolved}>Resolved</option>
                    </select>
                </td>
                <td class="text-secondary text-xs fw-medium">${date}</td>
                <td class="text-end">
                    <a href="complaint-details.html?id=${item.id}" class="btn btn-sm btn-white border shadow-sm text-primary fw-medium"><i class="fas fa-eye"></i></a>
                     <button class="btn btn-sm btn-white border text-danger shadow-sm ms-1" title="Delete" onclick="deleteComplaint('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        showingText.innerText = `Showing ${start + 1} to ${Math.min(end, filteredData.length)} of ${filteredData.length} entries`;
        renderPagination(totalPages);
    }

    // Export Update Function
    window.updateStatus = async function (id, newStatus) {
        const confirmed = await window.showDialog({
            title: 'Confirm Status Change',
            message: `Are you sure you want to mark this issue as "${newStatus}"?`,
            type: 'confirm'
        });

        if (!confirmed) {
            renderTable();
            return;
        }
        try {
            const { error } = await sb.from('complaints').update({ status: newStatus }).eq('id', id);
            if (error) throw error;
            showToast(`Status updated to ${newStatus}`, 'success');
            console.log(`Status updated to ${newStatus}`);
            // Optional: Reload data to ensure consistency if needed, but UI is already updated by Select
        } catch (e) {
            console.error('Status Update Failed:', e);
            showToast('Failed to update status: ' + e.message, 'error');
        }
    };

    window.deleteComplaint = async function (id) {
        const confirmed = await window.showDialog({
            title: 'Delete Issue',
            message: 'Are you sure you want to permanently delete this issue?',
            type: 'confirm'
        });

        if (!confirmed) return;
        try {
            const { error } = await sb.from('complaints').delete().eq('id', id);
            if (error) throw error;
            showToast('Deleted successfully', 'success');
            await fetchData(); // Reload
        } catch (e) {
            console.error('Delete Failed:', e);
            showToast('Failed to delete: ' + e.message, 'error');
        }
    };

    function renderPagination(totalPages) {
        let html = '';
        if (totalPages > 1) {
            html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
            for (let i = 1; i <= totalPages; i++) {
                html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
            }
            html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
        }
        paginationControls.innerHTML = html;
    }

    window.goToPage = function (page) {
        if (page < 1) return;
        currentPage = page;
        renderTable();
    };

    window.exportData = function () {
        showToast("Exporting data to CSV...", 'info');
    };
});
