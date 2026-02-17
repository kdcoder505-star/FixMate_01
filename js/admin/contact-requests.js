document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabaseClient) return;
    const sb = window.supabaseClient;

    let allRequests = [];
    let filteredRequests = [];
    let currentPage = 1;
    const itemsPerPage = 8;

    const tbody = document.getElementById('requestsTableBody');
    const searchInput = document.getElementById('searchInput');
    const showingText = document.getElementById('showingText');
    const paginationControls = document.getElementById('paginationControls');

    await fetchRequests();
    setupFilters();

    async function fetchRequests() {
        try {
            const { data, error } = await sb.from('contact_requests').select('*');
            if (error) throw error;

            allRequests = data || [];
            allRequests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            applyFilters();
        } catch (e) {
            console.error('Error fetching requests:', e);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-danger">Error loading requests.</td></tr>';
        }
    }

    function setupFilters() {
        searchInput.addEventListener('input', applyFilters);
    }

    function applyFilters() {
        const query = searchInput.value.toLowerCase();
        filteredRequests = allRequests.filter(req =>
            req.full_name?.toLowerCase().includes(query) ||
            req.message?.toLowerCase().includes(query)
        );
        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        tbody.innerHTML = '';
        if (filteredRequests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-5 text-muted">No requests found.</td></tr>';
            showingText.innerText = 'Showing 0 results';
            paginationControls.innerHTML = '';
            return;
        }

        const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = filteredRequests.slice(start, end);

        pageData.forEach(req => {
            const date = new Date(req.created_at).toLocaleString();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="fw-bold text-dark">${req.full_name}</td>
                <td><span class="badge bg-light text-primary border">${req.course}</span></td>
                <td><div class="text-truncate text-secondary" style="max-width: 300px;" title="${req.message}">${req.message}</div></td>
                <td class="text-secondary small">${date}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-white border shadow-sm text-primary" onclick="viewRequest('${req.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-white border text-danger shadow-sm ms-1" onclick="deleteRequest('${req.id}')"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        showingText.innerText = `Showing ${start + 1} to ${Math.min(end, filteredRequests.length)} of ${filteredRequests.length}`;
        renderPagination(totalPages);
    }

    window.viewRequest = (id) => {
        const req = allRequests.find(r => r.id === id);
        if (!req) return;

        window.showDialog({
            title: `Message from ${req.full_name}`,
            message: `<strong>Course:</strong> ${req.course}<br><br><strong>Message:</strong><br>${req.message}`,
            type: 'info'
        });
    };

    window.deleteRequest = async (id) => {
        const confirmed = await window.showDialog({
            title: 'Delete Request',
            message: 'Are you sure you want to permanently delete this contact request?',
            type: 'confirm'
        });

        if (!confirmed) return;

        try {
            const { error } = await sb.from('contact_requests').delete().eq('id', id);
            if (error) throw error;
            window.showToast('Request deleted successfully', 'success');
            await fetchRequests();
        } catch (e) {
            console.error('Delete Request Error:', e);
            window.showToast('Failed to delete request.', 'error');
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

    window.goToPage = (p) => {
        if (p < 1 || p > Math.ceil(filteredRequests.length / itemsPerPage)) return;
        currentPage = p;
        renderTable();
    };
});
