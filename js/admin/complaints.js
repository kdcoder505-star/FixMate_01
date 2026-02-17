
/* --- COMPLAINT DETAILS CONTROLLER --- */

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabaseClient) return;
    const sb = window.supabaseClient;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        document.querySelector('.page-content').innerHTML = '<div class="alert alert-danger">No Ticket ID provided. <a href="complaints.html">Back to List</a></div>';
        return;
    }

    // Load Data
    await loadTicketDetails(id);

    async function loadTicketDetails(ticketId) {
        try {
            // Mock '.single()' works now
            const { data: ticket, error } = await window.supabaseClient
                .from('complaints')
                .select('*')
                .eq('id', ticketId)
                .single();

            if (error) {
                console.error("Error fetching ticket:", error);
                document.querySelector('.page-content').innerHTML = '<div class="alert alert-warning">Issue not found or error occurred.</div>';
                return;
            }

            if (!ticket) {
                document.querySelector('.page-content').innerHTML = '<div class="alert alert-warning">Issue not found.</div>';
                return;
            }

            // Fetch student name if missing
            if (!ticket.student_name && ticket.student_id) {
                try {
                    const { data: userDoc, error: userError } = await window.supabaseClient
                        .from('users')
                        .select('*') // Adapter returns all fields anyway for single()
                        .eq('id', ticket.student_id)
                        .single();

                    if (userDoc) {
                        ticket.student_name = userDoc.full_name || userDoc.email?.split('@')[0] || 'Student';
                    }
                } catch (userErr) {
                    console.warn("Could not fetch student details:", userErr);
                }
            }

            console.log("Ticket loaded:", ticket); // Debug
            renderTicket(ticket);

        } catch (e) {
            console.error('Error loading ticket:', e);
        }
    }

    function renderTicket(ticket) {
        // Header
        setText('headerTicketId', `#${ticket.id.substring(0, 6)}`);
        setText('ticketTitle', ticket.title);

        const dateStr = ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Unknown Date';
        setText('ticketSubtitle', `Issue #${ticket.id.substring(0, 8)} • Submitted on ${dateStr}`);

        // Priority
        const priEl = document.getElementById('ticketPriority');
        if (priEl) {
            priEl.innerText = ticket.priority;
            priEl.className = `badge rounded-pill text-xs px-3 py-2 fw-bold`;
            if (ticket.priority === 'High') priEl.className += ' bg-danger-subtle text-danger border border-danger-subtle';
            else if (ticket.priority === 'Medium') priEl.className += ' bg-warning-subtle text-warning border border-warning-subtle';
            else priEl.className += ' bg-success-subtle text-success border border-success-subtle';
        }

        // Meta
        setText('studentIdDisplay', ticket.student_id ? 'STU-' + ticket.student_id.substring(0, 4) : '????');
        setText('dCategory', ticket.category);
        setText('dFloor', ticket.floor || '--');
        setText('dRoomNo', ticket.room_no || '--');
        setText('dDept', ticket.department || '--');

        // Status
        const stEl = document.getElementById('dStatus');
        if (stEl) {
            stEl.innerHTML = `<span class="badge ${getStatusBadgeClass(ticket.status)}">${ticket.status}</span>`;
        }

        // Student Info
        setText('dStudent', ticket.student_name || 'Unknown Student');
        const avatarEl = document.getElementById('studentAvatar');
        if (avatarEl) {
            avatarEl.innerText = (ticket.student_name || 'U').substring(0, 2).toUpperCase();
        }

        // Description
        if (ticket.description) {
            document.getElementById('dDesc').innerText = ticket.description;
        } else {
            document.getElementById('dDesc').innerHTML = '<span class="text-muted fst-italic">No description provided.</span>';
        }

        // Attachments
        const attachContainer = document.getElementById('attachmentContainer');
        if (attachContainer) {
            attachContainer.innerHTML = ''; // Clear previous

            if (ticket.image_url) {
                // Determine if it looks like an image or a link
                const isDataUrl = ticket.image_url.startsWith('data:');
                const isImageExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].some(ext => ticket.image_url.toLowerCase().includes(ext));

                // If it's a data URL or likely an image, show preview
                if (isDataUrl || isImageExt || true) { // Assume image for now as that's user intent
                    const imgHtml = `
                        <div class="position-relative">
                            <h6 class="fw-bold text-uppercase text-secondary text-xs ls-1 mb-2">Attachments</h6>
                            <a href="${ticket.image_url}" target="_blank" class="d-block border rounded overflow-hidden shadow-sm" style="max-width: 300px;">
                                <img src="${ticket.image_url}" alt="Attachment" class="img-fluid" style="max-height: 200px; object-fit: cover; width: 100%;">
                                <div class="px-3 py-2 bg-light text-xs text-secondary border-top text-truncate">
                                    <i class="fas fa-paperclip me-1"></i> View Full Image
                                </div>
                            </a>
                        </div>
                    `;
                    attachContainer.innerHTML = imgHtml;
                }
            } else {
                attachContainer.innerHTML = `<span class="text-muted text-xs ms-1">No attachments found.</span>`;
            }
        }

        // Timeline visualization logic...
        const allSteps = document.querySelectorAll('.workflow-step');
        allSteps.forEach(s => s.className = 'workflow-step'); // Reset

        // Simple Mapping based on status string
        if (ticket.status === 'Pending') {
            allSteps[0].classList.add('completed'); // Submitted
            allSteps[1].classList.add('active');    // Pending
        } else if (ticket.status === 'In Progress') {
            allSteps[0].classList.add('completed');
            allSteps[1].classList.add('completed');
            allSteps[2].classList.add('active'); // In Progress
        } else if (ticket.status === 'Resolved') {
            allSteps[0].classList.add('completed');
            allSteps[1].classList.add('completed');
            allSteps[2].classList.add('completed');
            allSteps[3].classList.add('completed'); // Resolved
        } else {
            // Default/Fallback
            allSteps[0].classList.add('completed');
        }
    }

    function getStatusBadgeClass(status) {
        if (status === 'Resolved') return 'bg-success-subtle text-success border border-success-subtle';
        if (status === 'In Progress') return 'bg-primary-subtle text-primary border border-primary-subtle';
        if (status === 'Pending') return 'bg-warning-subtle text-warning border border-warning-subtle';
        return 'bg-secondary text-white';
    }

    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    }

    // --- Actions ---

    // Expose functions globally for HTML onclick attributes if needed, 
    // or keep attaching listeners in DOMContentLoaded if elements exist.

    // Attach event listener specifically for the submit button which exists in DOM
    const btnSubmitUpdate = document.querySelector('button[onclick="submitUpdate()"]');
    if (btnSubmitUpdate) {
        // Remove onclick attribute to avoid double firing if we add listener, 
        // OR just define the function on window as it likely is expected by legacy onclick
        btnSubmitUpdate.removeAttribute('onclick');
        btnSubmitUpdate.addEventListener('click', postUpdate);
    }

    // Quick Resolve Button
    const btnQuickResolve = document.querySelector('button[onclick="quickResolve()"]');
    if (btnQuickResolve) {
        btnQuickResolve.removeAttribute('onclick');
        btnQuickResolve.addEventListener('click', async () => {
            const confirmed = await window.showDialog({
                title: 'Resolve Issue',
                message: 'Are you sure you want to mark this issue as "Resolved" immediately?',
                type: 'confirm'
            });
            if (!confirmed) return;
            try {
                const { error } = await sb.from('complaints').update({ status: 'Resolved' }).eq('id', id);
                if (error) throw error;
                showToast('Issue resolved.', 'success');
                location.reload();
            } catch (e) {
                console.error(e);
                showToast('Error: ' + e.message, 'error');
            }
        });
    }

    async function postUpdate() {
        const newStatus = document.getElementById('statusSelect').value;
        const responseDesc = document.getElementById('responseDesc').value;

        const confirmed = await window.showDialog({
            title: 'Confirm Status Change',
            message: `Are you sure you want to mark this issue as "${newStatus}"?`,
            type: 'confirm'
        });
        if (!confirmed) return;

        try {
            const { error } = await sb.from('complaints').update({
                status: newStatus
                // In a real app we'd save 'responseDesc' to a comments/timeline table
            }).eq('id', id);

            if (error) throw error;

            showToast('Status updated successfully', 'success');
            location.reload();
        } catch (e) {
            console.error(e);
            showToast('Failed to update: ' + e.message, 'error');
        }
    }

});
