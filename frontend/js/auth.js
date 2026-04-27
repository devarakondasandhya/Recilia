let currentUser = null;

const viewAuth = document.getElementById('view-auth');
const viewHome = document.getElementById('view-home');
const viewFavs = document.getElementById('view-favorites');

const authContainer = document.getElementById('auth-status-container');
const userInfoContainer = document.getElementById('user-info-container');
const navUsername = document.getElementById('nav-username');
const btnLogout = document.getElementById('btn-logout');

const navBtnFavs = document.getElementById('nav-btn-favorites');

// Auth View Elements
const authTitle = document.getElementById('auth-title');
const authUsernameContainer = document.getElementById('auth-username-container');
const authUsername = document.getElementById('auth-username');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authSubmit = document.getElementById('auth-submit');
const authToggleText = document.getElementById('auth-toggle-text');
const authToggleBtn = document.getElementById('auth-toggle-btn');

let currentAuthMode = 'login';

function navigateTo(view) {
    viewAuth.classList.add('hidden');
    viewHome.classList.add('hidden');
    viewFavs.classList.add('hidden');

    if (view === 'auth') viewAuth.classList.remove('hidden');
    else if (view === 'home') viewHome.classList.remove('hidden');
    else if (view === 'favorites') {
        if (!currentUser) alert("Please login first!");
        else viewFavs.classList.remove('hidden');
    }
}

function updateAuthStateUI(user) {
    if (user) {
        authContainer.classList.add('hidden');
        userInfoContainer.classList.remove('hidden');
        navBtnFavs.classList.remove('hidden');
        navUsername.textContent = `Hi, ${user.displayName || 'Chef'}`;
        
        // Let app know we logged in so it loads favorites
        if (window.onUserLogin) window.onUserLogin(user.uid);
    } else {
        authContainer.classList.remove('hidden');
        userInfoContainer.classList.add('hidden');
        navBtnFavs.classList.add('hidden');
        
        if (window.onUserLogout) window.onUserLogout();
    }
}

// Watch firebase auth
if (window.fbAuth) {
    window.fbAuth.onAuthStateChanged(user => {
        currentUser = user;
        updateAuthStateUI(user);
    });
}

function toggleAuthMode() {
    currentAuthMode = (currentAuthMode === 'login') ? 'signup' : 'login';
    authTitle.textContent = (currentAuthMode === 'login') ? 'Welcome Back' : 'Create Account';
    
    if (currentAuthMode === 'signup') {
        authUsernameContainer.classList.remove('hidden');
        authToggleText.textContent = "Already have an account?";
        authToggleBtn.textContent = "Login";
        authSubmit.textContent = "Sign Up";
    } else {
        authUsernameContainer.classList.add('hidden');
        authToggleText.textContent = "Don't have an account?";
        authToggleBtn.textContent = "Sign Up";
        authSubmit.textContent = "Login";
    }
}

authToggleBtn.addEventListener('click', toggleAuthMode);

authSubmit.addEventListener('click', async () => {
    const email = authEmail.value;
    const pwd = authPassword.value;
    const name = authUsername.value;

    if (!email || !pwd) {
        alert("Enter email and password.");
        return;
    }

    try {
        authSubmit.textContent = "Please wait...";
        authSubmit.disabled = true;

        if (currentAuthMode === 'login') {
            await window.fbAuth.signInWithEmailAndPassword(email, pwd);
            navigateTo('home');
        } else {
            if (!name) throw new Error("Please enter a username.");
            const cred = await window.fbAuth.createUserWithEmailAndPassword(email, pwd);
            await cred.user.updateProfile({ displayName: name });
            alert("Account created and logged in!");
            navigateTo('home');
        }
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        authSubmit.textContent = currentAuthMode === 'login' ? "Login" : "Sign Up";
        authSubmit.disabled = false;
    }
});

// Navbar Bindings
document.getElementById('btn-login-modal').addEventListener('click', () => {
    currentAuthMode = 'login';
    toggleAuthMode();
    toggleAuthMode(); // Ensure state syncs visually
    navigateTo('auth');
});

document.getElementById('btn-signup-modal').addEventListener('click', () => {
    currentAuthMode = 'signup';
    toggleAuthMode();
    toggleAuthMode();
    navigateTo('auth');
});

btnLogout.addEventListener('click', () => {
    window.fbAuth.signOut();
    navigateTo('home');
});
