const CloudSync = (function () {
    const API = {
        me: '/api/auth/me',
        login: '/api/auth/google',
        logout: '/api/auth/logout',
        push: '/api/sync/push',
        pull: '/api/sync/pull'
    };

    function parseJson(value, fallback) {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function getLocalState() {
        return {
            products: parseJson(localStorage.getItem('productDB') || '[]', []),
            history: parseJson(localStorage.getItem('calcHistory') || '[]', []),
            scenarios: parseJson(localStorage.getItem('savedScenarios') || '[]', []),
            settings: {
                theme: localStorage.getItem('theme') || '',
                language: localStorage.getItem('language') || localStorage.getItem('lang') || ''
            }
        };
    }

    function applyPulledState(data) {
        if (!data || typeof data !== 'object') return;

        if (Array.isArray(data.products)) {
            localStorage.setItem('productDB', JSON.stringify(data.products));
            window.productDB = data.products;
        }

        if (Array.isArray(data.history)) {
            localStorage.setItem('calcHistory', JSON.stringify(data.history));
            window.calcHistory = data.history;
        }

        if (Array.isArray(data.scenarios)) {
            localStorage.setItem('savedScenarios', JSON.stringify(data.scenarios));
        }

        if (data.settings && typeof data.settings === 'object') {
            if (data.settings.theme) localStorage.setItem('theme', data.settings.theme);
            if (data.settings.language) localStorage.setItem('language', data.settings.language);
        }
    }

    async function requestJson(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'include',
            cache: 'no-store',
            ...options,
            headers: {
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(options.headers || {})
            }
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = payload.error || `Request failed: ${response.status}`;
            throw new Error(message);
        }
        return payload;
    }

    async function getCurrentUser() {
        return requestJson(API.me);
    }

    function login() {
        window.location.href = API.login;
    }

    async function logout() {
        await requestJson(API.logout, { method: 'POST' });
        return getCurrentUser().catch(() => ({ authenticated: false }));
    }

    async function pushLocalState() {
        return requestJson(API.push, {
            method: 'POST',
            body: JSON.stringify(getLocalState())
        });
    }

    async function pullRemoteState({ apply = false } = {}) {
        const result = await requestJson(API.pull);
        if (apply) applyPulledState(result.data);
        return result;
    }

    function showToast(message, type = 'info') {
        if (window.UIManager?.showToast) {
            window.UIManager.showToast(message, type);
            return;
        }
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        console[type === 'error' ? 'error' : 'log'](message);
    }

    function setStatus(text, tone = 'neutral') {
        const el = document.getElementById('cloudSyncStatus');
        if (!el) return;
        el.textContent = text;
        el.dataset.tone = tone;
        el.className = 'hidden sm:inline text-[10px] font-semibold ' + (
            tone === 'success' ? 'text-emerald-600 dark:text-emerald-400' :
            tone === 'error' ? 'text-red-600 dark:text-red-400' :
            tone === 'loading' ? 'text-blue-600 dark:text-blue-400' :
            'text-slate-500 dark:text-slate-400'
        );
    }

    function setElementHidden(id, hidden) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle('hidden', hidden);
            el.classList.toggle('auth-hidden', hidden);
        }
    }

    function setAppAccess(authenticated) {
        setElementHidden('landingPage', authenticated);
        setElementHidden('mainNav', !authenticated);
        setElementHidden('main-content', !authenticated);
        setElementHidden('desktopTabsNav', !authenticated);
        setElementHidden('mobileProfit', !authenticated);
        setElementHidden('desktopSaveBtn', !authenticated);
        setElementHidden('mobileModuleNav', !authenticated);

        document.body.dataset.authenticated = authenticated ? 'true' : 'false';
    }

    function setAuthUi(state) {
        const loginBtn = document.getElementById('btnCloudLogin');
        const logoutBtn = document.getElementById('btnCloudLogout');
        const pushBtn = document.getElementById('btnCloudPush');
        const pullBtn = document.getElementById('btnCloudPull');
        const nameEl = document.getElementById('cloudUserName');

        const authenticated = Boolean(state?.authenticated);

        // Simpan status ke localStorage untuk pre-load sinkron berikutnya
        if (authenticated) {
            localStorage.setItem('isAuthenticated', 'true');
        } else {
            localStorage.removeItem('isAuthenticated');
        }

        setAppAccess(authenticated);

        // Hapus kelas helper setelah kelas sebenarnya diterapkan
        document.documentElement.classList.remove('app-loading-auth');

        if (loginBtn) loginBtn.classList.toggle('hidden', authenticated);
        if (logoutBtn) logoutBtn.classList.toggle('hidden', !authenticated);
        if (pushBtn) pushBtn.disabled = !authenticated;
        if (pullBtn) pullBtn.disabled = !authenticated;
        if (nameEl) nameEl.textContent = authenticated ? (state.user?.name || state.user?.email || 'Google') : '';

        setStatus(authenticated ? 'Cloud aktif' : 'Belum login', authenticated ? 'success' : 'neutral');
    }

    async function refreshAuthUi() {
        try {
            const state = await getCurrentUser();
            setAuthUi(state);
            return state;
        } catch (error) {
            setStatus('Cloud offline', 'error');

            // Jika offline, periksa apakah sebelumnya sudah terautentikasi
            const isLocalAuth = localStorage.getItem('isAuthenticated') === 'true';
            if (isLocalAuth) {
                setAuthUi({ authenticated: true, user: { name: 'Offline' } });
            } else {
                setAuthUi({ authenticated: false });
            }

            return { authenticated: isLocalAuth, error: error.message };
        }
    }

    async function handlePush() {
        try {
            setStatus('Mengirim...', 'loading');
            const result = await pushLocalState();
            setStatus('Tersimpan cloud', 'success');
            showToast('Data berhasil disimpan ke cloud.', 'success');
            return result;
        } catch (error) {
            setStatus('Push gagal', 'error');
            showToast(`Push gagal: ${error.message}`, 'error');
            throw error;
        }
    }

    async function handlePull() {
        try {
            setStatus('Mengambil...', 'loading');
            const result = await pullRemoteState({ apply: true });
            setStatus('Data dipulihkan', 'success');
            showToast('Data berhasil diambil dari cloud. Muat ulang halaman jika daftar belum berubah.', 'success');
            return result;
        } catch (error) {
            setStatus('Pull gagal', 'error');
            showToast(`Pull gagal: ${error.message}`, 'error');
            throw error;
        }
    }

    function init() {
        const loginBtn = document.getElementById('btnCloudLogin');
        const landingLoginBtn = document.getElementById('btnLandingLogin');
        const logoutBtn = document.getElementById('btnCloudLogout');
        const pushBtn = document.getElementById('btnCloudPush');
        const pullBtn = document.getElementById('btnCloudPull');

        // Gunakan status pre-auth dari localStorage agar konsisten dengan CSS
        const isPreAuth = localStorage.getItem('isAuthenticated') === 'true';
        setAppAccess(isPreAuth);

        loginBtn?.addEventListener('click', login);
        landingLoginBtn?.addEventListener('click', login);
        logoutBtn?.addEventListener('click', async () => {
            await logout();
            setAuthUi({ authenticated: false });
            showToast('Logout Google berhasil.', 'info');
        });
        pushBtn?.addEventListener('click', handlePush);
        pullBtn?.addEventListener('click', handlePull);

        refreshAuthUi();
    }

    return {
        init,
        login,
        logout,
        getCurrentUser,
        getLocalState,
        applyPulledState,
        pushLocalState,
        pullRemoteState,
        refreshAuthUi,
        setAppAccess
    };
})();

window.CloudSync = CloudSync;

document.addEventListener('DOMContentLoaded', () => {
    CloudSync.init();
});
