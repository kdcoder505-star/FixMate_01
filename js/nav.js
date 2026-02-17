
loadSidebar();
checkAuth();

async function checkAuth() {
    if (window.supabaseClient) {
        const { data } = await window.supabaseClient.auth.getSession();
        if (!data.session) {
            // Check relative path
            if (!window.location.pathname.endsWith('index.html') && window.location.pathname !== '/') {
                const prefix = getRelativePrefix();
                window.location.href = prefix + 'index.html';
            }
        }
    }
}

function getRelativePrefix() {
    const path = window.location.pathname;
    if (path.includes('/pages/admin/')) return '../../';
    if (path.includes('/pages/student/')) return '../../';
    if (path.includes('/pages/staff/')) return '../../';
    if (path.includes('/pages/')) return '../';
    return './';
}

function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return; // Should not happen

    const prefix = getRelativePrefix();
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Modern Sidebar Structure
    // CSS #sidebar-container handles position/width
    // Determine Role based on URL (Simple & Robust)
    const isAdmin = window.location.pathname.includes('/admin/');
    const isStudent = window.location.pathname.includes('/student/');
    const isStaff = window.location.pathname.includes('/staff/');

    let menuHTML = '';

    if (isAdmin) {
        menuHTML = `
            <div class="px-3 py-2">
                <ul class="nav flex-column gap-1">
                    <li class="nav-item">
                        <a href="${prefix}pages/admin/dashboard.html" class="nav-link-custom ${currentPage === 'dashboard.html' ? 'active' : ''}">
                            <i class="fas fa-th-large"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/admin/complaints.html" class="nav-link-custom ${currentPage === 'complaints.html' || currentPage === 'complaint-details.html' ? 'active' : ''}">
                            <i class="fas fa-images"></i>
                            <span>Complaints</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/admin/reports.html" class="nav-link-custom ${currentPage === 'reports.html' ? 'active' : ''}">
                            <i class="fas fa-chart-bar"></i>
                            <span>Reports & Analytics</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/admin/history.html" class="nav-link-custom ${currentPage === 'history.html' ? 'active' : ''}">
                            <i class="fas fa-history"></i>
                            <span>History</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/admin/contact-requests.html" class="nav-link-custom ${currentPage === 'contact-requests.html' ? 'active' : ''}">
                            <i class="fas fa-headset"></i>
                            <span>Contact Requests</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/admin/users.html" class="nav-link-custom ${currentPage === 'users.html' ? 'active' : ''}">
                            <i class="fas fa-user-friends"></i>
                            <span>User Management</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/admin/settings.html" class="nav-link-custom ${currentPage === 'settings.html' ? 'active' : ''}">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </a>
                    </li>
                </ul>
            </div>
        `;
    } else if (isStaff) {
        menuHTML = `
            <div class="px-3 py-2">
                <ul class="nav flex-column gap-1">
                    <li class="nav-item">
                        <a href="${prefix}pages/staff/dashboard.html" class="nav-link-custom ${currentPage === 'dashboard.html' ? 'active' : ''}">
                            <i class="fas fa-th-large"></i>
                            <span>Staff Dashboard</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/staff/complaints.html" class="nav-link-custom ${currentPage === 'complaints.html' || currentPage === 'complaint-details.html' ? 'active' : ''}">
                            <i class="fas fa-clipboard-list"></i>
                            <span>Manage Complaints</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/staff/history.html" class="nav-link-custom ${currentPage === 'history.html' ? 'active' : ''}">
                            <i class="fas fa-history"></i>
                            <span>Service History</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/staff/profile.html" class="nav-link-custom ${currentPage === 'profile.html' ? 'active' : ''}">
                            <i class="fas fa-user-circle"></i>
                            <span>Profile</span>
                        </a>
                    </li>
                </ul>
            </div>
        `;
    } else {
        // Student Menu (FixMate)
        menuHTML = `
            <div class="px-3 py-2">
                <ul class="nav flex-column gap-1">
                    <li class="nav-item">
                        <a href="${prefix}pages/student/dashboard.html" class="nav-link-custom ${currentPage === 'dashboard.html' && !window.location.search ? 'active' : ''}">
                            <i class="fas fa-th-large"></i>
                            <span>Dashboard</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/student/new-complaint.html" class="nav-link-custom ${currentPage === 'new-complaint.html' ? 'active' : ''}">
                            <i class="fas fa-plus-circle"></i>
                            <span>New Complaint</span>
                        </a>
                    </li>
                    
                    
                    <!-- Status Filters -->
                    <li class="nav-item">
                        <a href="${prefix}pages/student/dashboard.html?filter=Pending" class="nav-link-custom ${decodeURIComponent(window.location.search).includes('Pending') ? 'active' : ''}">
                            <i class="fas fa-clock text-warning"></i>
                            <span>Pending</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/student/dashboard.html?filter=In%20Progress" class="nav-link-custom ${decodeURIComponent(window.location.search).includes('In Progress') ? 'active' : ''}">
                            <i class="fas fa-spinner text-primary"></i>
                            <span>In Progress</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/student/dashboard.html?filter=Resolved" class="nav-link-custom ${decodeURIComponent(window.location.search).includes('Resolved') ? 'active' : ''}">
                            <i class="fas fa-check-circle text-success"></i>
                            <span>Resolved</span>
                        </a>
                    </li>

                    <li class="nav-item">
                        <a href="${prefix}pages/student/complaints.html" class="nav-link-custom ${currentPage === 'complaints.html' || currentPage === 'progress.html' ? 'active' : ''}">
                            <i class="fas fa-history"></i>
                            <span>History</span>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="${prefix}pages/student/profile.html" class="nav-link-custom ${currentPage === 'profile.html' ? 'active' : ''}">
                            <i class="fas fa-user-circle"></i>
                            <span>Profile</span>
                        </a>
                    </li>
                </ul>
            </div>
        `;
    }

    // Modern Sidebar Structure
    // CSS #sidebar-container handles position/width
    const sidebarHTML = `
        <div class="sidebar-inner bg-white d-flex flex-column h-100">
            
             <!-- Logo Header -->
            <div class="sidebar-logo p-4 pb-0 mb-3">
                <a href="${prefix}index.html" class="d-flex align-items-center text-dark text-decoration-none">
                    <div class="bg-primary text-white rounded-3 p-2 me-3 d-flex align-items-center justify-content-center shadow-sm" style="width: 48px; height: 48px; font-size: 1.25rem;">
                        <i class="fas fa-cube"></i>
                    </div>
                    <div>
                        <div class="fw-bold fs-6 tracking-tight text-dark" style="line-height:1.2">FixMate</div>
                        <div class="text-secondary text-xs" style="font-size: 0.75rem;">${isAdmin ? 'Campus Admin' : (isStaff ? 'Campus Staff' : 'Student Portal')}</div>
                    </div>
                </a>
            </div>

            <!-- Scrollable Nav -->
            <div class="flex-grow-1 overflow-auto py-2 custom-scrollbar">
                ${menuHTML}
            </div>

            <!-- User Footer -->
            <div class="mt-auto p-3 border-top bg-light-subtle">
                <div class="dropdown w-100 dropup">
                    <a href="#" class="d-flex align-items-center text-decoration-none dropdown-toggle p-2 rounded-3 hover-bg-white w-100" id="dropdownUser" data-bs-toggle="dropdown" aria-expanded="false">
                        <div class="avatar bg-white border shadow-sm rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 36px; height: 36px;">
                            <span class="fw-bold text-primary small">${isAdmin ? 'AD' : (isStaff ? 'SF' : 'ST')}</span>
                        </div>
                        <div class="overflow-hidden me-auto">
                            <div class="fw-bold text-dark text-truncate small" id="navUserName">${isAdmin ? 'System Admin' : (isStaff ? 'Staff Member' : 'Student')}</div>
                            <div class="text-muted text-xs text-truncate" id="navUserEmail">${isAdmin ? 'admin@college.edu' : (isStaff ? 'staff@college.edu' : 'student@college.edu')}</div>
                        </div>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-dark shadow-lg border-0 rounded-3 p-2 w-100 mb-2" aria-labelledby="dropdownUser">
                        <li><button class="dropdown-item rounded-2 py-2 small" onclick="cycleTheme()"><i class="fas fa-palette me-2 opacity-50"></i> Change Theme</button></li>
                        <li><hr class="dropdown-divider opacity-10"></li>
                        <li><button class="dropdown-item rounded-2 py-2 small text-danger" onclick="window.logout()"><i class="fas fa-sign-out-alt me-2 opacity-50"></i> Sign Out</button></li>
                    </ul>
                </div>
            </div>
            
        </div>
        
        <!-- Mobile Toggle -->
        <button class="d-lg-none btn glass shadow-sm position-fixed d-flex align-items-center justify-content-center" 
             id="mobile-nav-toggle"
             onclick="toggleSidebar()"
             style="top: 12px; left: 12px; z-index: 2001; width: 48px; height: 48px; border-radius: 14px; border: 1px solid var(--border) !important;">
            <i class="fas fa-bars text-primary" style="font-size: 1.2rem;"></i>
        </button>

        <!-- Overlay -->
        <div id="sidebar-overlay" onclick="toggleSidebar()" 
             style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: none; z-index: 1040;">
        </div>
    `;

    container.innerHTML = sidebarHTML;

    // Async User Info Update
    if (window.supabaseClient) {
        window.supabaseClient.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                const nameEl = document.getElementById('navUserName');
                const emailEl = document.getElementById('navUserEmail');
                if (nameEl && emailEl) {
                    const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
                    nameEl.innerText = fullName.charAt(0).toUpperCase() + fullName.slice(1);
                    emailEl.innerText = user.email;
                }
            }
        });
    }
}

function toggleSidebar() {
    const container = document.getElementById('sidebar-container');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('mobile-nav-toggle');

    if (container) {
        container.classList.toggle('active');
        const isActive = container.classList.contains('active');

        if (overlay) {
            overlay.style.display = isActive ? 'block' : 'none';
        }

        // Toggle icon between bars and times
        if (toggleBtn) {
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = isActive ? 'fas fa-times' : 'fas fa-bars';
            }
        }

        // Prevent body scroll when sidebar is open on mobile
        document.body.style.overflow = isActive ? 'hidden' : '';
    }
}

window.logout = async function () {
    if (window.supabaseClient) {
        showToast('Logged out safely', 'info');
        await window.supabaseClient.auth.signOut();
        const prefix = getRelativePrefix();
        setTimeout(() => {
            window.location.href = prefix + 'index.html';
        }, 500);
    }
}

window.cycleTheme = function () {
    if (!window.ThemeManager) return;
    const current = window.ThemeManager.getCurrentTheme();
    const themes = Object.keys(window.ThemeManager.themes);
    const currentIndex = themes.indexOf(current);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    window.ThemeManager.applyTheme(nextTheme);

    // If on settings page, refresh the gallery UI
    if (typeof renderThemeGallery === 'function') {
        renderThemeGallery();
    }
}
