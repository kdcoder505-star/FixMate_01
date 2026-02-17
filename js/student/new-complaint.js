
document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return; // nav.js handles redirect usually

    const form = document.getElementById('newComplaintForm');
    const msgContainer = document.getElementById('msgContainer');
    const submitBtn = form.querySelector('button[type="submit"]');
    const loadingBtn = document.getElementById('loadingBtn');

    // File Upload Logic
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('image');
    const filePreview = document.getElementById('filePreview');

    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover'); // This class might need defining in student.css if not already? (It is defined: .upload-zone-clean:hover styling handles it or add .dragover)
            dropZone.style.borderColor = '#3b82f6';
            dropZone.style.backgroundColor = '#eff6ff';
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '#d1d5db';
            dropZone.style.backgroundColor = '#f9fafb';
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#d1d5db';
            dropZone.style.backgroundColor = '#f9fafb';

            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
                if (fileInput.files[0]) updateFilePreview(fileInput.files[0]);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length > 0) {
                updateFilePreview(fileInput.files[0]);
            }
        });
    }

    function updateFilePreview(file) {
        if (file) {
            filePreview.innerHTML = `<i class="fas fa-check-circle me-1"></i> Selected: <strong>${file.name}</strong> (${(file.size / 1024).toFixed(1)} KB)`;
            filePreview.className = 'mt-2 text-success small fw-medium text-center';
        } else {
            filePreview.innerHTML = '';
        }
    }

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
            // Get Priority from Hidden Input
            const priority = document.getElementById('priority').value;
            const title = document.getElementById('title').value;
            const category = document.getElementById('category').value;
            const department = document.getElementById('department').value;
            const floor = document.getElementById('floor').value;
            const room_no = document.getElementById('room_no').value;
            const description = document.getElementById('description').value;
            const imageFile = fileInput.files[0];

            if (!title || !category || !description || !department || !floor || !room_no) {
                throw new Error("Please fill in all required fields.");
            }

            // Toggle Loading State
            submitBtn.classList.add('d-none');
            loadingBtn.classList.remove('d-none');
            msgContainer.innerHTML = '';

            let imageUrl = null;

            // 1. Upload Image (Robust with Base64 Fallback)
            if (imageFile) {
                try {
                    const fileExt = imageFile.name.split('.').pop();
                    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

                    // Attempt Storage Upload
                    const { data: uploadData, error: uploadError } = await window.supabaseClient
                        .storage
                        .from('complaint-images')
                        .upload(fileName, imageFile);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = window.supabaseClient
                        .storage
                        .from('complaint-images')
                        .getPublicUrl(fileName);

                    imageUrl = publicUrl;

                } catch (storageErr) {
                    console.warn("Storage upload failed, falling back to Base64:", storageErr);

                    // Base64 Fallback
                    try {
                        const toBase64 = file => new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = error => reject(error);
                        });
                        imageUrl = await toBase64(imageFile);
                        // Make sure content isn't too huge for DB column if text, but for demo fine.
                    } catch (b64Err) {
                        console.error("Base64 conversion failed:", b64Err);
                    }
                }
            }

            // 2. Insert Complaint
            const { data: complaintData, error: insertError } = await window.supabaseClient
                .from('complaints')
                .insert([{
                    student_id: user.id,
                    student_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
                    title,
                    description,
                    category,
                    department,
                    floor,
                    room_no,
                    priority,
                    status: 'Pending',
                    image_url: imageUrl,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            // 3. Add History
            try {
                const complaintId = complaintData?.id;
                if (complaintId) {
                    await window.supabaseClient
                        .from('complaint_history')
                        .insert([{
                            complaint_id: complaintId,
                            status: 'Pending',
                            comment: 'Complaint submitted by student.',
                            updated_by: user.id
                        }]);
                }
            } catch (histErr) {
                console.warn("History insert failed:", histErr);
            }

            // Success UI
            msgContainer.innerHTML = `
                <div class="alert alert-success border-0 shadow-sm d-flex align-items-center gap-3 p-3" role="alert" style="background-color: #f0fdf4; border-left: 4px solid #16a34a;">
                    <i class="fas fa-check-circle text-success fs-4"></i>
                    <div>
                        <h6 class="fw-bold text-success mb-1">Success!</h6>
                        <p class="mb-0 text-success small">Your complaint has been submitted. Redirecting...</p>
                    </div>
                </div>
            `;

            // Redirect
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('Submission Error:', error);

            // Revert Loading State
            submitBtn.classList.remove('d-none');
            loadingBtn.classList.add('d-none');

            msgContainer.innerHTML = `
                <div class="alert alert-danger border-0 shadow-sm d-flex align-items-center gap-3 p-3" role="alert" style="background-color: #fef2f2; border-left: 4px solid #dc2626;">
                    <i class="fas fa-exclamation-circle text-danger fs-4"></i>
                    <div>
                        <h6 class="fw-bold text-danger mb-1">Submission Failed</h6>
                        <p class="mb-0 text-danger small">${error.message || 'Something went wrong. Please try again.'}</p>
                    </div>
                </div>
            `;
        }
    });

});
