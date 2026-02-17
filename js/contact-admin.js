document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const loadingBtn = document.getElementById('loadingBtn');
    const msgContainer = document.getElementById('msgContainer');

    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('fullName').value.trim();
        const course = document.getElementById('course').value;
        const message = document.getElementById('message').value.trim();

        if (!fullName || !course || !message) {
            window.showToast('Please fill in all fields.', 'error');
            return;
        }

        // Toggle loading state
        submitBtn.classList.add('d-none');
        loadingBtn.classList.remove('d-none');
        msgContainer.innerHTML = '';

        try {
            const sb = window.supabaseClient;
            if (!sb) throw new Error("Database adapter not initialized.");

            const { error } = await sb.from('contact_requests').insert([{
                full_name: fullName,
                course: course,
                message: message,
                status: 'unread',
                created_at: new Date().toISOString()
            }]);

            if (error) throw error;

            // Success feedback
            await window.showDialog({
                title: 'Message Sent',
                message: 'Your message has been received. Our admin team will contact you soon.',
                type: 'success'
            });

            // Redirect back to login
            window.location.href = '../index.html';

        } catch (err) {
            console.error('Contact Submission Error:', err);

            submitBtn.classList.remove('d-none');
            loadingBtn.classList.add('d-none');

            msgContainer.innerHTML = `
                <div class="alert alert-danger border-0 small py-2 mb-0">
                    <i class="fas fa-exclamation-circle me-1"></i> Failed to send message. Please try again.
                </div>
            `;
        }
    });
});
