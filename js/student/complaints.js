
let allComplaints = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Check
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return; // nav.js handles redirect usually

    // 2. Fetch Data
    await fetchComplaints(user.id);

    // 3. Setup Filters
    setupFilters();
});

async function fetchComplaints(userId) {
    const container = document.getElementById('complaintsContainer');

    // Show spinner
    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted mt-2">Loading your tickets...</p>
        </div>
    `;

    try {
        const { data, error } = await window.supabaseClient
            .from('complaints')
            .select('*')
            .eq('student_id', userId);

        if (error) throw error;

        allComplaints = data || [];
        allComplaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        renderComplaints(allComplaints);

    } catch (error) {
        console.error('Error fetching complaints:', error);
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="text-danger mb-2"><i class="fas fa-exclamation-circle fa-2x"></i></div>
                <h5 class="text-muted">Failed to load complaints</h5>
                <p class="small text-muted">Please try refreshing the page.</p>
            </div>
        `;
    }
}

function renderComplaints(complaints) {
    const container = document.getElementById('complaintsContainer');
    container.innerHTML = '';

    if (complaints.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="text-light mb-3" style="font-size: 3rem;"><i class="fas fa-folder-open"></i></div>
                <h5 class="text-muted">No complaints found</h5>
                <p class="small text-muted">You haven't reported any issues yet.</p>
                <a href="new-complaint.html" class="btn btn-primary btn-sm mt-3 px-4 rounded-pill">Create New Complaint</a>
            </div>
        `;
        return;
    }

    complaints.forEach(c => {
        const date = new Date(c.created_at).toLocaleDateString();

        // Status Badge Logic
        let statusClass = 'pending';
        let statusIcon = '<i class="fas fa-clock"></i>';

        if (c.status === 'In Progress') {
            statusClass = 'progress';
            statusIcon = '<i class="fas fa-spinner fa-spin-pulse"></i>';
        }
        else if (c.status === 'Resolved') {
            statusClass = 'resolved';
            statusIcon = '<i class="fas fa-check-circle"></i>';
        }
        else if (c.status === 'Rejected') {
            statusClass = 'pending'; // Or specific rejected class
            statusIcon = '<i class="fas fa-times-circle"></i>';
        }

        // Icons based on Category
        let iconClass = 'fa-file-alt';
        let iconColor = '#6b7280'; // gray
        let iconBg = '#f3f4f6';

        if (c.category === 'Wi-Fi') { iconClass = 'fa-wifi'; iconColor = '#d97706'; iconBg = '#fef3c7'; } // Amber
        if (c.category === 'Classroom') { iconClass = 'fa-chalkboard'; iconColor = '#059669'; iconBg = '#d1fae5'; } // Green
        if (c.category === 'Lab') { iconClass = 'fa-desktop'; iconColor = '#7c3aed'; iconBg = '#ede9fe'; } // Purple
        if (c.category === 'Veranda') { iconClass = 'fa-archway'; iconColor = '#9333ea'; iconBg = '#f3e8ff'; } // Purple-ish
        if (c.category === 'Restroom') { iconClass = 'fa-restroom'; iconColor = '#db2777'; iconBg = '#fce7f3'; } // Pink
        if (c.category === 'Other') { iconClass = 'fa-question-circle'; iconColor = '#6b7280'; iconBg = '#f3f4f6'; }

        const html = `
            <div class="complaint-card-new shadow-sm border" onclick="window.location.href='progress.html?id=${c.id}'">
                <div class="card-left-section">
                    <div class="card-icon-box" style="background-color: ${iconBg}; color: ${iconColor};">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="card-info">
                        <h3 class="text-truncate" style="max-width: 500px;">${c.title}</h3>
                        <div class="card-meta">
                            <span class="meta-tag">${c.category.toUpperCase()}</span>
                            <span><i class="far fa-calendar me-1"></i> ${date}</span>
                            <span><i class="fas fa-hashtag me-1"></i> ${c.id.substring(0, 8)}</span>
                        </div>
                    </div>
                </div>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <div class="status-badge ${statusClass}">
                        ${statusIcon} ${c.status}
                    </div>
                    <div class="text-secondary opacity-50">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

function setupFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const resetBtn = document.getElementById('resetBtn');

    if (!searchInput) return;

    function filterData() {
        const query = searchInput.value.toLowerCase();
        const status = statusFilter.value;
        const category = categoryFilter.value;

        const filtered = allComplaints.filter(c => {
            const matchesSearch = (c.title && c.title.toLowerCase().includes(query)) || (c.id && c.id.toLowerCase().includes(query));
            const matchesStatus = status === 'All' || c.status === status;
            const matchesCategory = category === 'All' || c.category === category;
            return matchesSearch && matchesStatus && matchesCategory;
        });

        renderComplaints(filtered);
    }

    searchInput.addEventListener('input', filterData);
    statusFilter.addEventListener('change', filterData);
    categoryFilter.addEventListener('change', filterData);

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            statusFilter.value = 'All';
            categoryFilter.value = 'All';
            renderComplaints(allComplaints);
        });
    }
}
