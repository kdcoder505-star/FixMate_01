// Firebase Adapter to mimic Supabase Client
// Requires: firebase-app-compat.js, firebase-auth-compat.js, firebase-firestore-compat.js, firebase-storage-compat.js
// AND firebase-config.js loaded before this file.

if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded. Please include Firebase Compat scripts.');
}

if (!window.firebaseConfig) {
    console.error('Firebase Config not found. Please include js/firebase-config.js.');
}

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(window.firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

class FirebaseSupabaseAdapter {
    constructor() {
        this.auth = {
            getSession: async () => {
                return new Promise((resolve) => {
                    const unsubscribe = auth.onAuthStateChanged(async (user) => {
                        unsubscribe();
                        if (user) {
                            const token = await user.getIdToken();
                            resolve({
                                data: {
                                    session: {
                                        access_token: token,
                                        user: {
                                            id: user.uid,
                                            email: user.email,
                                            user_metadata: {
                                                full_name: user.displayName || user.email.split('@')[0]
                                            }
                                        }
                                    }
                                },
                                error: null
                            });
                        } else {
                            resolve({ data: { session: null }, error: null });
                        }
                    });
                });
            },
            getUser: async () => {
                return new Promise((resolve) => {
                    const unsubscribe = auth.onAuthStateChanged(user => {
                        unsubscribe();
                        if (user) {
                            resolve({
                                data: {
                                    user: {
                                        id: user.uid,
                                        email: user.email,
                                        user_metadata: {
                                            full_name: user.displayName || user.email.split('@')[0]
                                        }
                                    }
                                },
                                error: null
                            });
                        } else {
                            resolve({ data: { user: null }, error: null }); // Supabase returns { user: null } on no session
                        }
                    });
                });
            },
            signInWithPassword: async ({ email, password }) => {
                try {
                    const userCredential = await auth.signInWithEmailAndPassword(email, password);
                    const user = userCredential.user;
                    const token = await user.getIdToken();

                    // Fetch role from Firestore 'users' collection
                    let role = 'student'; // Default
                    try {
                        const userDoc = await db.collection('users').doc(user.uid).get();
                        if (userDoc.exists) {
                            role = userDoc.data().role || role;
                        }
                    } catch (e) {
                        console.warn('Error fetching role:', e);
                    }

                    return {
                        data: {
                            user: {
                                id: user.uid,
                                email: user.email,
                                role: role,
                                user_metadata: { full_name: user.displayName }
                            },
                            session: { access_token: token }
                        },
                        error: null
                    };
                } catch (error) {
                    return { data: null, error };
                }
            },
            signOut: async () => {
                try {
                    await auth.signOut();
                    return { error: null };
                } catch (error) {
                    return { error };
                }
            },
            signUp: async ({ email, password, options }) => {
                try {
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    const user = userCredential.user;

                    if (options && options.data) {
                        await db.collection('users').doc(user.uid).set({
                            email: email,
                            role: 'student',
                            ...options.data,
                            created_at: new Date().toISOString()
                        });

                        if (options.data.full_name) {
                            await user.updateProfile({ displayName: options.data.full_name });
                        }
                    }

                    return { data: { user: { id: user.uid, email } }, error: null };
                } catch (error) {
                    return { data: null, error };
                }
            },
            updateUser: async (updates) => {
                try {
                    const user = auth.currentUser;
                    if (!user) return { data: null, error: { message: 'Not logged in' } };

                    if (updates.password) {
                        await user.updatePassword(updates.password);
                    }

                    if (updates.data) {
                        // metadata updates if needed (e.g. full_name update in profile?)
                        // Supabase puts this in data.
                        // We might want to update Firestore 'users' too if full_name changes.
                    }

                    return { data: { user }, error: null };
                } catch (error) {
                    return { data: null, error };
                }
            }
        };

        this.storage = {
            from: (bucketName) => ({
                upload: async (path, file) => {
                    try {
                        const ref = storage.ref().child(`${bucketName}/${path}`);
                        const snapshot = await ref.put(file);
                        // Get download URL immediately to mimic Supabase logic if needed? 
                        // But Supabase separates upload and getPublicUrl.
                        return { data: { path: snapshot.ref.fullPath }, error: null };
                    } catch (error) {
                        return { data: null, error };
                    }
                },
                getPublicUrl: (path) => {
                    const bucket = window.firebaseConfig.storageBucket;
                    // Properly encode path segments
                    const parts = path.split('/');
                    const encodedPath = parts.map(p => encodeURIComponent(p)).join('%2F');
                    const fullPath = encodeURIComponent(`${bucketName}/${path}`); // Wait, bucketName is not in path usually for Firebase URL?

                    // Firebase Storage URL format:
                    // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media
                    // Path must be fully encoded.
                    // If path is "folder/file.jpg", encoded is "folder%2Ffile.jpg"

                    // "bucketName" in Supabase is the top level.
                    // In Firebase, we usually use one bucket and folders.
                    // So "complaint-images" bucket -> "complaint-images" folder in Firebase Storage default bucket.

                    const storagePath = `${bucketName}/${path}`;
                    // Recursive encoding for path segments to match Firebase Storage REST API
                    const encodedStoragePath = storagePath.split('/').map(segment => encodeURIComponent(segment)).join('%2F');

                    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedStoragePath}?alt=media`;
                    return { data: { publicUrl } };
                }
            })
        };
    }

    from(table) {
        return new FirebaseQueryBuilder(table);
    }
}

class FirebaseQueryBuilder {
    constructor(table) {
        this.table = table;
        this.query = db.collection(table);
        this.operation = 'select';
        this.opData = null;
        this.isSingle = false;
    }

    select(columns = '*') {
        if (this.operation !== 'insert' && this.operation !== 'update' && this.operation !== 'delete') {
            this.operation = 'select';
        }
        return this;
    }

    insert(data) {
        this.operation = 'insert';
        this.opData = data;
        return this;
    }

    update(data) {
        this.operation = 'update';
        this.opData = data;
        return this;
    }

    delete() {
        this.operation = 'delete';
        return this;
    }

    eq(column, value) {
        if (column === 'id') {
            this.query = this.query.where(firebase.firestore.FieldPath.documentId(), '==', value);
        } else {
            this.query = this.query.where(column, '==', value);
        }
        return this;
    }

    in(column, values) {
        if (values && values.length > 0) {
            if (column === 'id') {
                this.query = this.query.where(firebase.firestore.FieldPath.documentId(), 'in', values);
            } else {
                this.query = this.query.where(column, 'in', values);
            }
        }
        return this;
    }

    order(column, { ascending = true } = {}) {
        this.query = this.query.orderBy(column, ascending ? 'asc' : 'desc');
        return this;
    }

    limit(n) {
        this.query = this.query.limit(n);
        return this;
    }

    single() {
        this.isSingle = true;
        this.query = this.query.limit(1);
        return this;
    }

    // Execute the query when awaited
    then(resolve, reject) {
        this._execute()
            .then(res => resolve(res))
            .catch(err => reject(err));
    }

    async _execute() {
        try {
            if (this.operation === 'select') {
                const snapshot = await this.query.get();
                if (this.isSingle) {
                    if (snapshot.empty) {
                        return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
                    }
                    const doc = snapshot.docs[0];
                    return { data: { ...doc.data(), id: doc.id }, error: null };
                } else {
                    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                    return { data, error: null };
                }
            }

            if (this.operation === 'insert') {
                const data = this.opData;
                const rows = Array.isArray(data) ? data : [data];
                const results = [];

                for (const row of rows) {
                    const rowData = { ...row };
                    if (!rowData.created_at) rowData.created_at = new Date().toISOString();

                    let docRef;
                    if (rowData.id) {
                        docRef = db.collection(this.table).doc(rowData.id);
                        await docRef.set(rowData);
                    } else {
                        docRef = await db.collection(this.table).add(rowData);
                    }

                    // Fetch back the data to ensure we have the ID and everything
                    results.push({ ...rowData, id: docRef.id || rowData.id });
                }
                return { data: results.length === 1 ? results[0] : results, error: null };
            }

            if (this.operation === 'update') {
                const updates = this.opData;
                const snapshot = await this.query.get(); // Get docs matching filters
                const batch = db.batch();
                const updatedData = [];

                if (snapshot.empty) return { data: [], error: null };

                snapshot.forEach(doc => {
                    const docRef = db.collection(this.table).doc(doc.id);
                    batch.update(docRef, updates);
                    updatedData.push({ ...doc.data(), ...updates, id: doc.id });
                });

                await batch.commit();
                return { data: this.isSingle && updatedData.length ? updatedData[0] : updatedData, error: null };
            }

            if (this.operation === 'delete') {
                const snapshot = await this.query.get(); // Get docs matching filters
                const batch = db.batch();

                if (snapshot.empty) return { data: null, error: null };

                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                return { data: null, error: null };
            }

        } catch (error) {
            console.error("Firebase Adapter Error:", error);
            return { data: null, error };
        }
    }
}

window.supabaseClient = new FirebaseSupabaseAdapter();
console.log('Firebase Adapter for Supabase Initialized');

// Toast & Dialog Notification System
function injectNotificationContainer() {
    if (!document.getElementById('notification-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'notification-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
            align-items: center; justify-content: center;
            z-index: 10001; transition: all 0.3s ease;
            display: none;
        `;
        document.body.appendChild(overlay);
    }

    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed; top: 10%; left: 50%; transform: translateX(-50%);
            display: flex; flex-direction: column; align-items: center; gap: 10px;
            z-index: 10000; pointer-events: none; width: 100%; max-width: 400px;
        `;
        document.body.appendChild(container);
    }

    // Inject CSS for custom dialog
    if (!document.getElementById('custom-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'custom-notification-styles';
        style.textContent = `
            .dialog-centered {
                background: white; border-radius: 16px; padding: 24px;
                max-width: 400px; width: 90%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                transform: scale(0.9); opacity: 0; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                text-align: center;
            }
            #notification-overlay { display: none; }
            #notification-overlay.active { display: flex; }
            #notification-overlay.active .dialog-centered { transform: scale(1); opacity: 1; }
            .dialog-icon { 
                width: 56px; height: 56px; border-radius: 50%; display: flex; 
                align-items: center; justify-content: center; margin: 0 auto 16px;
                font-size: 24px;
            }
            .dialog-icon.success { background: #ecfdf5; color: #10b981; }
            .dialog-icon.error { background: #fef2f2; color: #ef4444; }
            .dialog-icon.info { background: #eff6ff; color: #3b82f6; }
            .dialog-icon.confirm { background: #fffbeb; color: #f59e0b; }
            .dialog-btn {
                padding: 10px 20px; border-radius: 8px; border: none; font-weight: 600;
                transition: all 0.2s; cursor: pointer;
            }
            .dialog-btn-primary { background: #1e40af; color: white; }
            .dialog-btn-secondary { background: #f3f4f6; color: #374151; margin-right: 8px; }
            .dialog-btn:hover { filter: brightness(1.1); }
            
            .toast-custom {
                background: white; border-radius: 12px; padding: 12px 16px;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 90%; max-width: 350px;
                border-left: 4px solid #ccc; opacity: 0; transform: translateY(-20px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: auto;
            }
            .toast-custom.show { opacity: 1; transform: translateY(0); }
            .toast-custom.success { border-left-color: #10b981; }
            .toast-custom.error { border-left-color: #ef4444; }
            .toast-custom.info { border-left-color: #3b82f6; }
        `;
        document.head.appendChild(style);
    }
}

window.showToast = function (message, type = 'info') {
    injectNotificationContainer();
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toastIdx = Date.now();
    const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');

    const toastHtml = `
        <div id="toast-${toastIdx}" class="toast-custom ${type}">
            <div class="d-flex align-items-center gap-3">
                <div class="text-${type === 'success' ? 'success' : (type === 'error' ? 'danger' : 'primary')}">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="flex-grow-1 text-sm fw-medium" style="color: #374151;">${message}</div>
                <button type="button" class="btn-close" style="font-size: 0.6rem;" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = toastHtml;
    const toastEl = wrapper.firstElementChild;
    container.appendChild(toastEl);

    // Trigger animation
    setTimeout(() => toastEl.classList.add('show'), 100);

    setTimeout(() => {
        if (toastEl && toastEl.parentElement) {
            toastEl.classList.remove('show');
            setTimeout(() => {
                if (toastEl.parentElement) toastEl.remove();
            }, 300);
        }
    }, 5000);
};

window.showDialog = function (options) {
    injectNotificationContainer();
    const overlay = document.getElementById('notification-overlay');

    const {
        title = 'Notification',
        message = '',
        type = 'info',
        onConfirm = null,
        confirmText = 'OK',
        cancelText = 'Cancel'
    } = options;

    const icon = type === 'success' ? 'fa-check' : (type === 'error' ? 'fa-times' : (type === 'confirm' ? 'fa-question' : 'fa-info'));

    overlay.innerHTML = `
        <div class="dialog-centered">
            <div class="dialog-icon ${type}">
                <i class="fas ${icon}"></i>
            </div>
            <h5 class="fw-bold mb-2" style="color: #111827;">${title}</h5>
            <p class="text-secondary mb-4" style="font-size: 0.95rem;">${message}</p>
            <div class="d-flex justify-content-center">
                ${type === 'confirm' ? `<button class="dialog-btn dialog-btn-secondary" id="dialog-cancel">${cancelText}</button>` : ''}
                <button class="dialog-btn dialog-btn-primary" id="dialog-ok">${confirmText}</button>
            </div>
        </div>
    `;

    overlay.classList.add('active');
    overlay.style.display = 'flex'; // Direct style to override any legacy css

    return new Promise((resolve) => {
        const cleanup = (value) => {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
            setTimeout(() => { overlay.innerHTML = ''; }, 200);
            resolve(value);
        };

        const okBtn = document.getElementById('dialog-ok');
        const cancelBtn = document.getElementById('dialog-cancel');

        okBtn.onclick = () => {
            if (onConfirm) onConfirm();
            cleanup(true);
        };

        if (cancelBtn) {
            cancelBtn.onclick = () => cleanup(false);
        }
    });
};

// Global overrides for alert and confirm
window.alert = (msg) => window.showDialog({ message: msg, type: 'info', title: 'FixMate Alert' });
window.confirm = (msg) => {
    // Note: window.confirm is synchronous, but showDialog is async.
    // This override might break legacy code that expects blocking behavior.
    // We should use showDialog directly in our JS files for better control.
    console.warn("Native confirm() called. Please use showDialog() for better flow control.");
    return window.showDialog({ message: msg, type: 'confirm', title: 'Please Confirm' });
};
