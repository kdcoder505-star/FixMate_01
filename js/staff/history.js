
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabaseClient) return;
    const sb = window.supabaseClient;

    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    const itemsPerPage = 8;

    // Elements
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const tbody = document.getElementById('complaintsTableBody');
    const showingText = document.getElementById('showingText');
    const paginationControls = document.getElementById('paginationControls');

    await fetchData();
    setupFilters();

    async function fetchData() {
        try {
            // Fetch ONLY Resolved and Rejected
            const { data, error } = await sb.from('complaints').select('*').in('status', ['Resolved', 'Rejected']);
            if (error) throw error;
            allData = data || [];
            allData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            applyFilters();
        } catch (e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-danger">Error loading history.</td></tr>';
        }
    }

    function setupFilters() {
        searchInput.addEventListener('input', applyFilters);
        categoryFilter.addEventListener('change', applyFilters);
    }

    function applyFilters() {
        const query = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        filteredData = allData.filter(item => {
            const matchSearch = !query ||
                (item.title && item.title.toLowerCase().includes(query)) ||
                (item.id && item.id.toLowerCase().includes(query)) ||
                (item.student_name && item.student_name.toLowerCase().includes(query));

            const matchCat = category === 'All' || item.category === category;
            return matchSearch && matchCat;
        });

        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        tbody.innerHTML = '';
        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-5 text-muted">No history found.</td></tr>';
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
            const initials = (item.student_name || 'U').substring(0, 2).toUpperCase();

            let statusBadge = `<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill">Resolved</span>`;
            if (item.status === 'Rejected') statusBadge = `<span class="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill">Rejected</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-monospace text-xs fw-bold">#${item.id.substring(0, 6)}</td>
                <td class="fw-medium text-dark text-sm text-truncate" style="max-width: 200px;">${item.title}</td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                         <div class="avatar-circle bg-light text-primary border-0 text-xs shadow-sm" style="width: 24px; height: 24px;">${initials}</div>
                         <span class="text-sm">${item.student_name || 'Unknown'}</span>
                    </div>
                </td>
                <td class="text-sm">${item.category}</td>
                <td class="text-sm text-secondary">${date}</td>
                <td>${statusBadge}</td>
                <td class="text-end">
                    <a href="complaint-details.html?id=${item.id}" class="btn btn-sm btn-white border shadow-sm text-primary"><i class="fas fa-eye"></i></a>
                    <button class="btn btn-sm btn-white border text-danger shadow-sm ms-1" onclick="deleteHistory('${item.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `; // Note: Admin might want to 'Reopen' issue too, but for now Keep it simple.
            tbody.appendChild(tr);
        });

        showingText.innerText = `Showing ${start + 1} to ${Math.min(end, filteredData.length)} of ${filteredData.length}`;
        renderPagination(totalPages);
    }

    window.deleteHistory = async function (id) {
        const confirmed = await window.showDialog({
            title: 'Delete History',
            message: 'Permanently delete this history record?',
            type: 'confirm'
        });

        if (!confirmed) return;
        try {
            await sb.from('complaints').delete().eq('id', id);
            fetchData();
        } catch (e) { showToast('Error: ' + e.message, 'error'); }
    };

    function renderPagination(totalPages) {
        let html = '';
        if (totalPages > 1) {
            html += `<button class="page-btn" onclick="goToPage(${currentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
            for (let i = 1; i <= totalPages; i++) {
                html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
            }
            html += `<button class="page-btn" onclick="goToPage(${currentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
        }
        paginationControls.innerHTML = html;
    }

    window.goToPage = (p) => {
        if (p < 1 || p > Math.ceil(filteredData.length / itemsPerPage)) return;
        currentPage = p;
        renderTable();
    }
});
