
document.addEventListener('DOMContentLoaded', async () => {
    // Check Auth
    if (!window.supabaseClient) return;
    const sb = window.supabaseClient;

    let users = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    // Elements
    const tableBody = document.getElementById('usersTableBody');
    const searchInput = document.getElementById('userSearch');
    const roleFilter = document.getElementById('roleFilter');
    const showingText = document.getElementById('showingText');
    const paginationControls = document.getElementById('paginationControls');

    // Modal
    const userModalEl = document.getElementById('userModal');
    const userModal = new bootstrap.Modal(userModalEl);

    // Initial Load
    await fetchUsers();

    // Event Listeners
    searchInput.addEventListener('input', renderTable);
    roleFilter.addEventListener('change', renderTable);

    // Global function binding
    window.openUserModal = openUserModal;
    window.saveUser = saveUser;
    window.openEditModal = openEditModal;
    window.deleteUser = deleteUser;
    window.goToPage = goToPage;
    window.togglePasswordVisibility = (id, btn) => {
        const input = document.getElementById(id);
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    };

    async function fetchUsers() {
        // Fetch users using the adapter
        const { data, error } = await sb.from('users').select('*');
        if (data) {
            users = data;
        } else {
            console.error('Fetch error:', error);
            users = [];
        }
        renderTable();
    }

    function renderTable() {
        if (!tableBody) return;
        const query = searchInput.value.toLowerCase();
        const role = roleFilter.value;

        const filtered = users.filter(user => {
            const matchesSearch = (user.full_name || '').toLowerCase().includes(query) ||
                (user.email || '').toLowerCase().includes(query) ||
                (user.id || '').toLowerCase().includes(query);
            const matchesRole = role === 'All' || (user.role && user.role.toLowerCase() === role.toLowerCase());
            return matchesSearch && matchesRole;
        });

        // Pagination
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = 1;
        if (currentPage < 1) currentPage = 1;

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageData = filtered.slice(start, end);

        tableBody.innerHTML = '';

        if (pageData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">No users found.</td></tr>';
            showingText.innerText = 'Showing 0 users';
            paginationControls.innerHTML = '';
            return;
        }

        pageData.forEach(user => {
            const tr = document.createElement('tr');

            // Avatar Initials
            const initials = (user.full_name || 'U').substring(0, 2).toUpperCase();

            // Role Badge logic
            let roleBadge = `<span class="badge bg-light text-secondary border fw-bold text-xs uppercase">${user.role || 'Guest'}</span>`;
            if (user.role === 'admin') roleBadge = `<span class="badge bg-dark text-white border border-dark fw-bold text-xs uppercase">ADMIN</span>`;
            if (user.role === 'student') roleBadge = `<span class="badge bg-primary-subtle text-primary border border-primary-subtle fw-bold text-xs uppercase">STUDENT</span>`;
            if (user.role === 'staff') roleBadge = `<span class="badge bg-info-subtle text-info border border-info-subtle fw-bold text-xs uppercase">STAFF</span>`;

            tr.innerHTML = `
                <td>
                    <div class="d-flex align-items-center gap-3">
                        <div class="avatar-circle bg-light text-primary border-0 text-xs shadow-sm" style="width: 32px; height: 32px; display:flex; align-items:center; justify-content:center; border-radius:50%; font-weight:700;">${initials}</div>
                        <div>
                            <div class="fw-bold text-dark text-sm">${user.full_name || 'Unknown'}</div>
                            <div class="text-muted text-xs">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td class="fw-bold text-dark text-xs font-monospace text-uppercase">#${(user.id || '').substring(0, 8)}</td>
                <td>${roleBadge}</td>
                <td class="text-dark text-sm">${user.department || '-'}</td>
                <td class="text-xs font-monospace text-secondary">${user.password || '******'}</td>
                <td><span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill text-xs"><i class="fas fa-circle me-1" style="font-size: 6px;"></i> Active</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-white border shadow-sm text-secondary me-1" onclick="openEditModal('${user.id}')" title="Edit"><i class="fas fa-pen"></i></button>
                    <!-- Delete disabled for safety in demo usually, but enabled here -->
                    <button class="btn btn-sm btn-white border shadow-sm text-danger" onclick="deleteUser('${user.id}')" title="Delete"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Update Footer
        showingText.innerText = `Showing ${filtered.length > 0 ? start + 1 : 0} to ${Math.min(end, filtered.length)} of ${filtered.length} users`;
        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        if (totalPages <= 1) {
            paginationControls.innerHTML = '';
            return;
        }

        let html = `
            <button class="btn btn-sm btn-white border me-1" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-white border'} me-1" onclick="goToPage(${i})">${i}</button>`;
        }

        html += `
            <button class="btn btn-sm btn-white border" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
        `;

        paginationControls.innerHTML = html;
    }

    function goToPage(page) {
        currentPage = page;
        renderTable();
    }

    function openUserModal() {
        document.getElementById('userForm').reset();
        document.getElementById('userId').value = ''; // Clear ID for new user
        document.getElementById('userModalTitle').innerText = 'Add New User';
        document.getElementById('passwordGroup').style.display = 'block';
        document.getElementById('passwordLabel').innerText = 'Set Password';
        document.getElementById('userEmail').disabled = false; // Allow email edit for new
        userModal.show();
    }

    function openEditModal(userId) {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('userId').value = user.id;
        document.getElementById('userName').value = user.full_name;
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userDept').value = user.department || '';

        // Hide password field for existing users (requested by user)
        document.getElementById('userPassword').value = user.password || '';
        document.getElementById('passwordGroup').style.display = 'none';

        document.getElementById('userModalTitle').innerText = 'Edit User';
        document.getElementById('userEmail').disabled = true; // Prevent email change to keep auth sync simple

        userModal.show();
    }

    async function saveUser() {
        const id = document.getElementById('userId').value;
        const name = document.getElementById('userName').value;
        const email = document.getElementById('userEmail').value;
        const role = document.getElementById('userRole').value;
        const dept = document.getElementById('userDept').value;
        const pass = document.getElementById('userPassword').value;
        const saveBtn = document.querySelector('#userModal .btn-primary-action');

        if (!name || (!id && !email) || (!id && !pass)) {
            showToast('Please fill in default fields', 'error');
            return;
        }

        // Loading state
        const originalText = saveBtn.innerText;
        saveBtn.innerText = 'Saving...';
        saveBtn.disabled = true;

        try {
            if (id) {
                // UPDATE Existing User
                const oldUser = users.find(u => u.id === id);
                const isNewPasswordProvided = pass && pass.trim().length > 0 && pass !== oldUser.password;
                const newPassword = isNewPasswordProvided ? pass : (oldUser.password || '');

                // 1. Sync Password with Auth if we have the current one stored in DB
                if (isNewPasswordProvided && oldUser.password) {
                    let secondaryApp;
                    try {
                        secondaryApp = firebase.apps.find(a => a.name === "SecondaryUpdate") || firebase.initializeApp(window.firebaseConfig, "SecondaryUpdate");
                        const secondaryAuth = secondaryApp.auth();

                        // Use stored old password to sign in
                        await secondaryAuth.signInWithEmailAndPassword(email, oldUser.password);
                        await secondaryAuth.currentUser.updatePassword(newPassword);
                        await secondaryAuth.signOut();
                        await secondaryApp.delete();
                    } catch (syncErr) {
                        console.warn("Auth Sync Error - Likely background update only", syncErr);
                        if (secondaryApp) await secondaryApp.delete();
                    }
                }

                // 2. Update Firestore
                const { error } = await sb.from('users').eq('id', id).update({
                    full_name: name,
                    role: role,
                    department: dept,
                    password: newPassword
                });

                if (error) throw error;

            } else {
                // CREATE New User
                let secondaryApp;
                try {
                    secondaryApp = firebase.apps.find(a => a.name === "SecondaryCreate") || firebase.initializeApp(window.firebaseConfig, "SecondaryCreate");
                    const secondaryAuth = secondaryApp.auth();

                    const userCredential = await secondaryAuth.createUserWithEmailAndPassword(email, pass);
                    const newUser = userCredential.user;

                    // Update Profile in Auth
                    await newUser.updateProfile({ displayName: name });

                    // 2. Create in Firestore (Using secondaryApp instance to bypass permission issues)
                    const dbSecondary = secondaryApp.firestore();
                    await dbSecondary.collection('users').doc(newUser.uid).set({
                        id: newUser.uid,
                        email: email,
                        full_name: name,
                        role: role,
                        department: dept,
                        password: pass,
                        created_at: new Date().toISOString()
                    });

                    // Sign out and cleanup
                    await secondaryAuth.signOut();
                    await secondaryApp.delete();

                } catch (createErr) {
                    console.error("User Creation Error", createErr);
                    if (secondaryApp) await secondaryApp.delete();

                    if (createErr.code === 'permission-denied') {
                        showToast("Database Permission Error: Make sure your Firestore rules allow the operation.", 'error');
                    } else {
                        showToast("Error creating user: " + createErr.message, 'error');
                    }
                    throw createErr;
                }
            }

            userModal.hide();
            await fetchUsers(); // Refresh

        } catch (e) {
            console.error(e);
            if (!id && !e.message.includes('creating user')) { // If not already alerted
                showToast('Failed to save user: ' + (e.message || e), 'error');
            } else if (id) {
                showToast('Failed to update user', 'error');
            }
        } finally {
            saveBtn.innerText = originalText;
            saveBtn.disabled = false;
        }
    }

    async function deleteUser(userId) {
        const confirmed = await window.showDialog({
            title: 'Delete User',
            message: 'Are you sure you want to delete this user? This will remove their dashboard access.',
            type: 'confirm'
        });

        if (!confirmed) return;

        // NOTE: Deleting from Auth requires Cloud Functions or Admin SDK. 
        // Client SDK cannot delete ANOTHER user.
        // We can only delete their Firestore record, which effectively "bans" them from the app logic (if checked).
        // Or we can flag them as invalid.
        // For this demo, we will delete the Firestore record.

        try {
            const { error } = await sb.from('users').delete().eq('id', userId);
            if (error) throw error;

            // UI Update
            fetchUsers();

        } catch (e) {
            console.error(e);
            showToast('Failed to delete user record.', 'error');
        }
    }
});
