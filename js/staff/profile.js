
document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabaseClient) return;
    const sb = window.supabaseClient;

    const profileForm = document.getElementById('profileForm');
    const saveBtn = document.getElementById('saveBtn');

    let currentUser = null;

    // Load initial data
    await loadProfile();

    async function loadProfile() {
        try {
            // Get user from Auth
            const user = firebase.auth().currentUser;
            if (!user) {
                // If not loaded yet, wait or redirect
                firebase.auth().onAuthStateChanged(u => {
                    if (u) loadProfile();
                    else window.location.href = '../../index.html';
                });
                return;
            }

            // Get doc from Firestore
            const { data, error } = await sb.from('users').eq('id', user.uid).single();
            if (error) throw error;

            currentUser = data;

            // Bind values
            const nameParts = (data.full_name || '').split(' ');
            document.getElementById('firstName').value = nameParts[0] || '';
            document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';
            document.getElementById('userEmail').value = data.email || '';
            document.getElementById('phone').value = data.phone || '';
            document.getElementById('department').value = data.department || 'MCA';

            // Sidebar/Left Card update
            document.getElementById('p_full_name').innerText = data.full_name || 'Staff Member';
            document.getElementById('p_email_text').innerText = data.email || '';
            document.getElementById('p_role_badge').innerText = data.role || 'Staff';

            const initials = (data.full_name || 'U').substring(0, 2).toUpperCase();
            document.getElementById('p_initials').innerText = initials;

        } catch (e) {
            console.error('Profile load error:', e);
        }
    }

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const phone = document.getElementById('phone').value;
        const department = document.getElementById('department').value;

        const fullName = `${firstName} ${lastName}`.trim();

        saveBtn.disabled = true;
        saveBtn.innerText = 'Saving...';

        try {
            const user = firebase.auth().currentUser;
            if (!user) throw new Error('Not authenticated');

            const { error } = await sb.from('users').eq('id', user.uid).update({
                full_name: fullName,
                phone: phone,
                department: department
            });

            if (error) throw error;

            showToast('Profile updated successfully!', 'success');
            window.location.reload();

        } catch (err) {
            console.error('Update error:', err);
            showToast('Failed to update profile: ' + err.message, 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerText = 'Save Changes';
        }
    });
});
