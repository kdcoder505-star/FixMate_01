
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI References
        const emailInput = document.getElementById('email');
        const passInput = document.getElementById('password');
        const errorMsg = document.getElementById('errorMsg');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        const originalBtnText = submitBtn.innerText;

        // Reset UI
        errorMsg.innerHTML = '';
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing in...';

        try {
            const email = emailInput.value.trim();
            const password = passInput.value.trim();

            if (!email || !password) {
                throw new Error("Please fill in all fields.");
            }

            // 1. Authenticate with Supabase
            // Destructure carefully in case 'data' is null
            const response = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            // Check if error exists first
            if (response.error) throw response.error;

            // If data is null, fallback
            const user = response.data?.session?.user || response.data?.user;

            if (!user) {
                throw new Error("Login failed. Please check your credentials.");
            }

            // 2. Fetch Profile to Determine Role
            // For mock data, user metadata is enough
            let role = user.role || user.user_metadata?.role;

            // If role not in metadata, fetch from users table (Firestore)
            if (!role) {
                const { data: profile, error: profileError } = await window.supabaseClient
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile && !profileError) {
                    role = profile.role;
                }
            }

            // 3. Routing
            showToast('Login successful!', 'success');

            setTimeout(() => {
                if (role === 'admin') {
                    window.location.href = 'pages/admin/dashboard.html';
                } else if (role === 'staff') {
                    window.location.href = 'pages/staff/dashboard.html';
                } else if (role === 'student') {
                    window.location.href = 'pages/student/dashboard.html';
                } else {
                    // Fallback for demo if role is missing but login worked
                    console.warn("Role not found, defaulting to student for demo.");
                    window.location.href = 'pages/student/dashboard.html';
                }
            }, 500);

        } catch (error) {
            console.error(error);
            errorMsg.innerHTML = `
                <div class="alert alert-danger bg-danger-subtle text-danger border-0 small py-2 rounded-3">
                    <i class="fas fa-exclamation-circle me-2"></i> ${error.message || 'Authentication failed'}
                </div>
            `;
            showToast(error.message || 'Authentication failed', 'error');
            // Attempt to sign out to clean state if partial login occurred
            if (window.supabaseClient && window.supabaseClient.auth) {
                await window.supabaseClient.auth.signOut();
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalBtnText;
        }
    });
});
