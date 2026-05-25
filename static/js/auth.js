/**
 * Authentication Handler
 */

// Use global CONFIG from config.js
const API_BASE = CONFIG.BACKEND.API_URL;

// Show alert
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 1050; max-width: 400px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) alert.remove();
    }, 4000);
}

// Handle login form submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loadingSpinner = document.getElementById('loadingSpinner');
    const loginBtn = document.querySelector('.btn-login');
    
    // Show loading state
    loadingSpinner.classList.remove('d-none');
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password,
            }),
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }
        
        const data = await response.json();
        
        // Store token and user info in localStorage
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Initialize permissions (if permissions.js is available)
        if (typeof PermissionManager !== 'undefined' && data.user.role) {
            PermissionManager.init(data.user.role);
        }
        
        showAlert('Login successful! Redirecting...', 'success');
        
        // Redirect to role-appropriate workspace
        setTimeout(() => {
            let redirectUrl = 'admin/'; // default
            
            if (data.user && data.user.role) {
                const role = data.user.role.toLowerCase();
                if (role === 'admin') {
                    redirectUrl = 'admin/';
                } else if (role === 'manager') {
                    redirectUrl = 'manager/';
                } else if (role === 'nutritionist' || role === 'editor') {
                    redirectUrl = 'nutritionist/';
                }
            }
            
            window.location.href = redirectUrl;
        }, 1000);
        
    } catch (error) {
        showAlert(error.message || 'Login failed. Please try again.', 'danger');
    } finally {
        loadingSpinner.classList.add('d-none');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
});

// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token) {
        // User is already logged in
        try {
            const userObj = JSON.parse(user);
            
            // Initialize permissions
            if (typeof PermissionManager !== 'undefined' && userObj.role) {
                PermissionManager.init(userObj.role);
            }
            
            // Determine correct dashboard based on current page and user role
            const currentPage = window.location.pathname;
            const isLoginPage = /\/(login|forgot-password|reset-password)(\.html)?$/.test(currentPage);
            
            if (isLoginPage) {
                // Redirect logged-in user away from login pages
                let redirectUrl = 'admin/';
                if (userObj.role) {
                    const role = userObj.role.toLowerCase();
                    if (role === 'admin') {
                        redirectUrl = 'admin/';
                    } else if (role === 'manager') {
                        redirectUrl = 'manager/';
                    } else if (role === 'nutritionist' || role === 'editor') {
                        redirectUrl = 'nutritionist/';
                    }
                }
                window.location.href = redirectUrl;
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    } else {
        // User is not logged in, redirect to login if on protected page
        const currentPage = window.location.pathname;
        const protectedPages = ['admin-dashboard', 'dashboard', 'manager-dashboard', 'nutritionist-dashboard'];
        const protectedFolders = ['/admin/', '/manager/', '/nutritionist/'];
        
        if (protectedPages.some(page => currentPage.includes(page)) || protectedFolders.some(folder => currentPage.includes(folder))) {
            window.location.href = '/login';
        }
    }
}

// Run auth check on page load
document.addEventListener('DOMContentLoaded', checkAuth);
