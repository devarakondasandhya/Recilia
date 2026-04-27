// Paste your Firebase Config Object Here
const firebaseConfig = {
    apiKey: "AIzaSyBxcTu2i8ONphEugoA9p2DYuRrCD8fJEWs",
    authDomain: "smart-recipe-generator-7f025.firebaseapp.com",
    databaseURL: "https://smart-recipe-generator-7f025-default-rtdb.firebaseio.com",
    projectId: "smart-recipe-generator-7f025",
    storageBucket: "smart-recipe-generator-7f025.firebasestorage.app",
    messagingSenderId: "226947089135",
    appId: "1:226947089135:web:1c557c30a686762668d11a",
    measurementId: "G-TQYQP3EVG9"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
} catch (e) {
    if (e.code !== 'app/duplicate-app') {
        console.error("Firebase Initialization Error:", e);
    }
}

const auth = firebase.auth();
const rtdb = firebase.database();

// Make them available globally
window.fbAuth = auth;
window.rtdb = rtdb;
