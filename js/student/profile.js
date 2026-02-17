
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get Setup
    const sb = window.supabaseClient;
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
        window.location.href = '../../index.html';
        return;
    }

    // 2. Fetch Full Profile from Firestore 'users' collection
    // The adapter treats .from('users') as db.collection('users')
    const { data: profile, error } = await sb
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error("Error fetching profile:", error);
    }

    // 3. Populate UI
    if (profile) {
        // Name & Email
        document.getElementById('profileEmail').innerText = profile.full_name || user.email;

        // Department
        const deptDiv = document.querySelector('.text-secondary.small.mb-3');
        if (deptDiv) deptDiv.innerText = (profile.department || 'General Student') + ' Dept';

        // ID
        // Note: HTML might have hardcoded structure, we need to target correctly.
        // The HTML has labels "ID Number" and value "ST-2024-88". 
        // We can target by structure or add IDs to HTML. 
        // For now, let's use the provided HTML structure searching.

        const labels = document.querySelectorAll('label');
        labels.forEach(label => {
            if (label.innerText.includes('ID NUMBER')) {
                const valueDiv = label.nextElementSibling;
                if (valueDiv) valueDiv.innerText = (profile.id || user.id).substring(0, 8).toUpperCase();
            }
            if (label.innerText.includes('JOINED')) {
                const valueDiv = label.nextElementSibling;
                if (valueDiv) valueDiv.innerText = new Date(profile.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }
        });

        // Set Avatar Initials
        const initials = (profile.full_name || user.email).substring(0, 2).toUpperCase();
        const avatarEl = document.querySelector('.bg-primary.text-white.rounded-circle');
        if (avatarEl) avatarEl.innerText = initials;
    } else {
        // Fallback if profile fetch fails (e.g. auth user exists but no firestore doc)
        document.getElementById('profileEmail').innerText = user.email;
    }

    // 4. Password Update Logic
    const form = document.getElementById('passwordForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const p1 = document.getElementById('newPassword').value;
            const p2 = document.getElementById('confirmPassword').value;
            const msg = document.getElementById('msgContainer');

            if (p1 !== p2) {
                msg.innerHTML = '<div class="alert alert-danger py-2 small">Passwords do not match</div>';
                return;
            }

            if (p1.length < 6) {
                msg.innerHTML = '<div class="alert alert-danger py-2 small">Password must be at least 6 characters</div>';
                return;
            }

            msg.innerHTML = '<div class="text-primary small"><span class="spinner-border spinner-border-sm"></span> Updating...</div>';

            // Supabase/Adapter updateUser
            const { error: updateError } = await sb.auth.updateUser({
                password: p1
            });

            if (updateError) {
                msg.innerHTML = `<div class="alert alert-danger py-2 small">${updateError.message}</div>`;
            } else {
                msg.innerHTML = '<div class="alert alert-success py-2 small">Password updated successfully!</div>';
                form.reset();
            }
        });
    }
});
