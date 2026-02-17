
let currentUser = null;
let currentFilter = 'All';

document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;
    currentUser = user;

    // Initial Load
    await loadStats();

    // Check URL params for filter
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter') || 'All';
    await filterComplaints(filterParam);

    // Search Listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterComplaints(currentFilter, searchTerm);
        });
    }
});

async function loadStats() {
    const sb = window.supabaseClient;
    if (!currentUser) return;

    try {
        const { data: pending } = await sb.from('complaints').select('id').eq('student_id', currentUser.id).eq('status', 'Pending');
        const { data: inProgress } = await sb.from('complaints').select('id').eq('student_id', currentUser.id).eq('status', 'In Progress');
        const { data: resolved } = await sb.from('complaints').select('id').eq('student_id', currentUser.id).eq('status', 'Resolved');

        // Update UI
        if (document.getElementById('statPending')) document.getElementById('statPending').innerText = pending ? pending.length : 0;
        if (document.getElementById('statInProgress')) document.getElementById('statInProgress').innerText = inProgress ? inProgress.length : 0;
        if (document.getElementById('statResolved')) document.getElementById('statResolved').innerText = resolved ? resolved.length : 0;

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

window.filterComplaints = async function (status, searchTerm = '') {
    const sb = window.supabaseClient;
    if (!currentUser) return;

    currentFilter = status;
    const listContainer = document.getElementById('complaintListContainer');

    // Update Sidebar Active State
    document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('active'));
    let navId = 'nav-all';
    if (status === 'Pending') navId = 'nav-pending';
    if (status === 'In Progress') navId = 'nav-progress';
    if (status === 'Resolved') navId = 'nav-resolved';
    const navEl = document.getElementById(navId);
    if (navEl) navEl.classList.add('active');

    // Show Loading
    if (listContainer) {
        listContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="text-muted mt-3">Loading complaints...</p>
            </div>
        `;
    }

    try {
        let query = sb
            .from('complaints')
            .select('id, title, category, priority, status, created_at')
            .eq('student_id', currentUser.id);

        if (status !== 'All') {
            query = query.eq('status', status);
        }

        const { data: complaints, error } = await query;

        if (error) throw error;

        // Sort in memory
        if (complaints) {
            complaints.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        // Render List
        listContainer.innerHTML = '';

        if (!complaints || complaints.length === 0) {
            if (status === 'All' && !searchTerm) {
                listContainer.innerHTML = `
                    <div class="text-center py-5">
                        <div class="mb-3 text-light" style="font-size: 3rem;"><i class="fas fa-folder-open"></i></div> 
                        <h5 class="text-muted">No complaints found</h5>
                        <p class="text-secondary small">Get started by creating a new complaint.</p>
                        <div class="d-flex gap-2 justify-content-center mt-3">
                            <a href="new-complaint.html" class="btn btn-primary btn-sm px-4">Create New Complaint</a>
                        </div>
                    </div>`;
            } else {
                listContainer.innerHTML = `
                <div class="text-center py-5">
                    <div class="mb-3 text-light" style="font-size: 3rem;"><i class="fas fa-search"></i></div> 
                    <div class="text-muted">No ${status !== 'All' ? status.toLowerCase() : ''} complaints found.</div>
                </div>`;
            }
            return;
        }

        // Search Filter (Client-side for responsiveness on small datasets)
        const filtered = searchTerm ? complaints.filter(c =>
            (c.title && c.title.toLowerCase().includes(searchTerm)) ||
            (c.id && c.id.toLowerCase().includes(searchTerm))
        ) : complaints;

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div class="text-center py-5 text-muted">No matches found for your search.</div>';
            return;
        }

        // Update count showing
        const countEl = document.getElementById('showingCount');
        if (countEl) {
            countEl.innerText = `Showing ${filtered.length} of ${complaints.length} complaints`;
            countEl.classList.remove('d-none');
        }

        filtered.forEach(c => {
            const date = new Date(c.created_at).toLocaleDateString();

            // Status Badge Class
            let statusClass = 'pending';
            let statusIcon = '<i class="fas fa-clock"></i>';
            let statusText = c.status;

            if (c.status === 'In Progress') {
                statusClass = 'progress';
                statusIcon = '<i class="fas fa-spinner fa-spin-pulse"></i>';
            }
            else if (c.status === 'Resolved') {
                statusClass = 'resolved';
                statusIcon = '<i class="fas fa-check-circle"></i>';
            }
            else if (c.status === 'Rejected') {
                statusClass = 'pending';
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
                <div class="complaint-card-new" onclick="window.location.href='progress.html?id=${c.id}'">
                    <div class="card-left-section">
                        <div class="card-icon-box" style="background-color: ${iconBg}; color: ${iconColor};">
                            <i class="fas ${iconClass}"></i>
                        </div>
                        <div class="card-info">
                            <h3 class="text-truncate" style="max-width: 400px;">${c.title}</h3>
                            <div class="card-meta">
                                <span class="meta-tag">${c.category ? c.category.toUpperCase() : 'GENERAL'}</span>
                                <span><i class="far fa-calendar me-1"></i> ${date}</span>
                                <span><i class="fas fa-hashtag me-1"></i> ${c.id.substring(0, 8)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="status-badge ${statusClass}">
                            ${statusIcon} ${statusText}
                        </div>
                        <div class="card-arrow text-secondary opacity-50 ms-3">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </div>
                </div>
            `;
            listContainer.insertAdjacentHTML('beforeend', html);
        });

    } catch (error) {
        console.error('Error fetching complaints:', error);
        listContainer.innerHTML = '<div class="text-center py-4 text-danger">Failed to load complaints. Please try again.</div>';
    }
}


