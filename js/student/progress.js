document.addEventListener('DOMContentLoaded', async () => {
    // Auth check handled by nav.js
    const params = new URLSearchParams(window.location.search);
    let complaintId = params.get('id');

    // If no ID, try to find the latest active complaint
    if (!complaintId) {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (user) {
            const { data, error } = await window.supabaseClient
                .from('complaints')
                .select('id')
                .eq('student_id', user.id)
                .neq('status', 'Resolved')
                .neq('status', 'Rejected')
                .limit(1)
                .single();

            if (data && data.id) {
                // Found active complaint, update URL and load
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('id', data.id);
                window.history.pushState({}, '', newUrl);
                complaintId = data.id;
            }
        }
    }

    if (!complaintId) {
        // If still no ID (no active complaints), show empty state or redirect
        document.getElementById('loadingState').classList.add('d-none');
        document.querySelector('.main-content').innerHTML += `
            <div class="text-center mt-5 pt-5">
                <h3 class="fw-bold text-muted">No Active Tracks</h3>
                <p class="text-secondary">You don't have any complaints in progress to track.</p>
                <a href="complaints.html" class="btn btn-primary-custom mt-3">View History</a>
            </div>
        `;
        return;
    }

    await loadComplaintDetails(complaintId);
});

async function loadComplaintDetails(id) {
    const loading = document.getElementById('loadingState');
    const content = document.getElementById('contentState');

    try {
        // 1. Fetch Complaint
        const { data: complaint, error } = await window.supabaseClient
            .from('complaints')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !complaint) throw new Error("Ticket not found");

        loading.classList.add('d-none');
        content.classList.remove('d-none');

        renderHeader(complaint);
        renderTracker(complaint);

        // 2. Fetch History for Comments
        const { data: history } = await window.supabaseClient
            .from('complaint_history')
            .select('*, profiles(email)')
            .eq('complaint_id', id);

        if (history) {
            history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        renderComments(history || [], complaint);

    } catch (error) {
        console.error(error);
        loading.innerHTML = `<div class="text-danger">Failed to load ticket details: ${error.message}</div>`;
    }
}

function renderHeader(c) {
    document.getElementById('cTitle').innerText = c.title;
    document.getElementById('headerId').innerText = `#${c.id.substring(0, 6)}`;

    // Status Badge
    const badge = document.getElementById('headerStatus');
    badge.innerText = c.status;
    badge.className = `badge badge-status ${getBadgeClass(c.status)}`;

    document.getElementById('cDate').innerText = new Date(c.created_at).toLocaleDateString();
    document.getElementById('cCategory').innerText = c.category;

    // Right Column Meta
    document.getElementById('cDesc').innerText = c.description;
    document.getElementById('metaCategory').innerText = c.category;
    document.getElementById('metaPriority').innerText = c.priority;

    // Attachment Logic (Moved inside tracker step 3 usually, but let's see)
    // For Reference UI, attachment is shown in "In Progress" or generally.
    if (c.image_url) {
        const area = document.getElementById('proofArea');
        const link = document.getElementById('proofLink');
        link.href = c.image_url;
        area.classList.remove('d-none');

        // Move proof area to be visible generally if needed, currently inside In Progress step
    }
}

function renderTracker(c) {
    // Reference UI has: Submitted -> Reviewed -> In Progress -> Resolved
    // We map our status to these levels.
    const steps = [
        { id: 'Submitted', label: 'Submitted' },
        { id: 'Reviewed', label: 'Reviewed' },
        { id: 'InProgress', label: 'In Progress' },
        { id: 'Resolved', label: 'Resolved' }
    ];

    // Determine current level index
    let currentIdx = 0;
    if (c.status === 'Pending') currentIdx = 0;
    else if (c.status === 'In Progress') currentIdx = 2;
    else if (c.status === 'Resolved') currentIdx = 3;
    else if (c.status === 'Rejected') currentIdx = -1;

    // Reject handling
    if (currentIdx === -1) {
        // Mark all as inactive/rejected visual
        document.getElementById('trackerContainer').innerHTML = `
            <div class="alert alert-danger">
                <h5 class="fw-bold">⛔ Ticket Rejected</h5>
                <p class="mb-0">This request was rejected by the admin. Please check comments for details.</p>
            </div>
        `;
        return;
    }

    // Loop through steps to set Active/Completed states and Dates
    steps.forEach((step, idx) => {
        const el = document.getElementById(`step_${step.id}`);
        const icon = el.querySelector('.tracker-icon');
        const dateEl = el.querySelector('small');

        // Reset
        el.classList.remove('active', 'completed');
        icon.innerText = idx + 1;
        dateEl.innerText = '';

        if (idx < currentIdx) {
            el.classList.add('completed');
            icon.innerHTML = '✓';
            // Mock date for passed steps
            dateEl.innerText = 'Completed';
        } else if (idx === currentIdx) {
            el.classList.add('active');
            dateEl.innerText = 'Current Stage';

            // If In Progress is active, ensure attachment is visible
            if (step.id === 'InProgress' && c.image_url) {
                document.getElementById('proofArea').classList.remove('d-none');
            }
        } else {
            // Future steps
            dateEl.innerText = 'Pending';
        }
    });

    // Specific Detail Injection
    document.getElementById('date_Submitted').innerText = new Date(c.created_at).toLocaleString();
    document.getElementById('desc_Submitted').innerText = `Complaint logged by Student.`;
}

function renderComments(history, complaint) {
    const container = document.getElementById('commentsList');
    container.innerHTML = '';

    // Filter useful history items (comments or status changes)
    const items = history.filter(h => h.comment || h.status);

    if (items.length === 0) {
        container.innerHTML = '<div class="text-center py-3 text-muted small">No updates yet.</div>';
        return;
    }

    items.forEach(h => {
        // Determine "Role" style
        const isAdmin = !!h.updated_by; // In our mock, updated_by usually exists for admins
        const userLabel = isAdmin ? 'Admin' : 'You';
        const avatarColor = isAdmin ? '#1e40af' : '#10b981';

        // Use a generic placeholder avatar
        const avatarUrl = `https://ui-avatars.com/api/?name=${userLabel}&background=random&color=fff&size=40`;

        const html = `
            <div class="comment-item">
                <div class="d-flex gap-3">
                    <img src="${avatarUrl}" class="comment-avatar" alt="Avatar">
                    <div>
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="fw-bold mb-0 text-dark" style="font-size: 0.9rem;">${userLabel}</h6>
                            <small class="text-muted" style="font-size: 0.75rem;">${new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                        </div>
                        <p class="text-secondary small mb-0">${h.comment || `Updated status to <span class="fw-bold">${h.status}</span>`}</p>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

function getBadgeClass(status) {
    switch (status) {
        case 'Pending': return 'bg-yellow-soft';
        case 'Reviewed': return 'bg-purple-soft';
        case 'In Progress': return 'bg-blue-soft';
        case 'Resolved': return 'bg-green-soft';
        case 'Rejected': return 'bg-red-soft';
        default: return 'bg-secondary text-white';
    }
}
