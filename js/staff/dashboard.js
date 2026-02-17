
/* --- ADMIN DASHBOARD CONTROLLER --- */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth & Init
    if (!window.supabaseClient) return;
    const sb = window.supabaseClient;

    // State
    let allComplaints = [];
    let filteredComplaints = [];
    let currentPage = 1;
    const itemsPerPage = 8; // Adjust for dashboard view

    // Filters
    let activeCategory = 'All';
    let activePriority = 'All';
    let searchQuery = '';

    // Load Data
    await loadDashboard();

    // Event Listeners
    setupSearch();

    async function loadDashboard() {
        try {
            // Stats
            await loadStats();

            // Table Data
            const { data, error } = await sb.from('complaints').select('*');
            if (error) throw error;

            allComplaints = data || [];
            // Sort manually
            allComplaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            applyFilters();

        } catch (e) {
            console.error('Dashboard Load Error:', e);
        }
    }

    async function loadStats() {
        // Simple mock stats
        const { data: all } = await sb.from('complaints').select('status');
        if (all) {
            document.getElementById('statTotal').innerText = all.length;
            document.getElementById('statPending').innerText = all.filter(c => c.status === 'Pending').length;
            document.getElementById('statProgress').innerText = all.filter(c => c.status === 'In Progress').length;
            document.getElementById('statResolved').innerText = all.filter(c => c.status === 'Resolved').length;
        }
    }

    /* --- FILTER LOGIC --- */
    window.filterTable = function (type, value) {
        if (type === 'category') activeCategory = value;
        if (type === 'priority') activePriority = value;
        applyFilters();
    };

    function setupSearch() {
        const input = document.getElementById('searchInput');
        if (input) {
            input.addEventListener('input', (e) => {
                searchQuery = e.target.value.toLowerCase();
                applyFilters();
            });
        }
    }

    function applyFilters() {
        filteredComplaints = allComplaints.filter(c => {
            const matchCat = activeCategory === 'All' || c.category === activeCategory;
            const matchPri = activePriority === 'All' || c.priority === activePriority;
            const matchSearch = !searchQuery ||
                (c.title && c.title.toLowerCase().includes(searchQuery)) ||
                (c.student_name && c.student_name.toLowerCase().includes(searchQuery)) ||
                (c.category && c.category.toLowerCase().includes(searchQuery));
            return matchCat && matchPri && matchSearch;
        });

        currentPage = 1;
        renderTable();
        renderPagination();
    }

    /* --- RENDER --- */
    function renderTable() {
        const tbody = document.getElementById('complaintsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (filteredComplaints.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-muted">No records found matching your filters.</td></tr>';
            document.getElementById('showingText').innerText = 'Showing 0 results';
            document.getElementById('paginationControls').innerHTML = '';
            return;
        }

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = filteredComplaints.slice(start, end);

        pageData.forEach(c => {
            const date = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            // Priority Style
            let priClass = 'bg-secondary text-white';
            if (c.priority === 'High') priClass = 'bg-danger-subtle text-danger border border-danger-subtle';
            if (c.priority === 'Medium') priClass = 'bg-warning-subtle text-warning border border-warning-subtle';
            if (c.priority === 'Low') priClass = 'bg-success-subtle text-success border border-success-subtle';

            // Status Style
            let statusBadge = `<span class="badge bg-secondary rounded-pill">${c.status}</span>`;
            if (c.status === 'Resolved') statusBadge = `<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill"><i class="fas fa-check-circle me-1"></i> Resolved</span>`;
            if (c.status === 'In Progress') statusBadge = `<span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill"><i class="fas fa-spinner me-1 fa-spin"></i> In Progress</span>`;
            if (c.status === 'Pending') statusBadge = `<span class="badge bg-warning-subtle text-warning border border-warning-subtle rounded-pill"><i class="fas fa-clock me-1"></i> Pending</span>`;

            // Student (Mock)
            const studentName = c.student_name || 'Unknown';
            const initials = studentName.substring(0, 2).toUpperCase();

            const row = document.createElement('tr');

            // Status Select
            const isPending = c.status === 'Pending' ? 'selected' : '';
            const inProgress = c.status === 'In Progress' ? 'selected' : '';
            const isResolved = c.status === 'Resolved' ? 'selected' : '';

            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <div class="avatar-circle bg-light text-primary border-0 text-xs shadow-sm">
                            ${initials}
                        </div>
                        <div>
                            <div class="fw-bold text-dark text-sm">${studentName}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="text-dark fw-medium text-sm">${c.category}</span>
                </td>
                <td>
                    <span class="badge ${priClass} rounded-pill text-xs px-2">${c.priority}</span>
                </td>
                <td>
                    <select class="form-select form-select-sm shadow-sm" style="width: 140px; font-size: 0.85rem;" onchange="updateStatus('${c.id}', this.value)">
                        <option value="Pending" ${isPending}>Pending</option>
                        <option value="In Progress" ${inProgress}>In Progress</option>
                        <option value="Resolved" ${isResolved}>Resolved</option>
                    </select>
                </td>
                <td class="text-secondary text-sm fw-medium">${date}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-white border text-primary shadow-sm me-1" title="View Details" onclick="window.location.href='complaint-details.html?id=${c.id}'">
                        <i class="fas fa-eye"></i>
                    </button>
                    <!-- Delete Button Logic -->
                    <button class="btn btn-sm btn-white border text-danger shadow-sm" title="Delete" onclick="deleteComplaint('${c.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Update Footer
        document.getElementById('showingText').innerText = `Showing ${start + 1} to ${Math.min(end, filteredComplaints.length)} of ${filteredComplaints.length} results`;
        renderPagination();
    }

    // New Function to Update Status
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

            // Log history for tracking (Optional but good UX)
            const { data: { user } } = await sb.auth.getUser();
            if (user) {
                await sb.from('complaint_history').insert({
                    complaint_id: id,
                    status: newStatus,
                    updated_by: user.id
                });
            }

            // Reload stats to reflect changes (e.g. pending count drops)
            await loadStats();

        } catch (e) {
            console.error('Status Update Failed:', e);
            showToast('Failed to update status: ' + e.message, 'error');
        }
    };

    function renderPagination() {
        const container = document.getElementById('paginationControls');
        if (!container) return;

        const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);

        // Simple Next/Prev
        let html = `
            <button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled style="opacity:0.5; pointer-events:none"' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        }

        html += `
            <button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled style="opacity:0.5; pointer-events:none"' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        container.innerHTML = html;
    }

    window.changePage = function (page) {
        if (page < 1 || page > Math.ceil(filteredComplaints.length / itemsPerPage)) return;
        currentPage = page;
        renderTable();
    };

    window.deleteComplaint = async function (id) {
        console.log("Delete requested for ID:", id);
        const confirmed = await window.showDialog({
            title: 'Delete Issue',
            message: 'Are you sure you want to permanently delete this issue?',
            type: 'confirm'
        });

        if (!confirmed) return;

        try {
            // Explicitly delete from Firestore via Adapter
            const { error } = await sb.from('complaints').delete().eq('id', id);

            if (error) {
                console.error("Database Delete Error:", error);
                throw error;
            }

            showToast('Issue deleted successfully from the database.', 'success');
            await loadDashboard(); // Reload data to reflect changes
        } catch (e) {
            console.error("Delete Operation Failed:", e);
            showToast("Failed to delete complaint: " + (e.message || "Unknown error"), 'error');
        }
    };

    window.exportData = function () {
        showToast('Exporting data feature is simulated.', 'info');
    };
});
