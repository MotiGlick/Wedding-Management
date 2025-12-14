// js/utils.js

// פונקציות קריטיות (Auth, Logout)
function getToken() { return sessionStorage.getItem('authToken'); }
function getAuthHeaders() {
    const token = getToken();
    if (!token) { throw new Error("Missing Auth Token"); }
    return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}
function logout() { sessionStorage.removeItem('authToken'); window.location.href = 'index.html'; }

