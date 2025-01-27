// Router state
const router = {
    currentPage: null,
    pages: {
        home: '/home.html',
        login: '/login.html',
        register: '/register.html'
    }
};

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Logout function
async function logout() {
    const refresh = localStorage.getItem('refresh');
    if (!refresh) return;

    try {
        const response = await fetch('http://localhost:8000/api/users/logout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access')}`
            },
            body: JSON.stringify({ refresh })
        });

        if (response.ok) {
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
            localStorage.removeItem('access_token_expiry');
            navigateToPage('login');
        } else {
            console.error('Failed to log out');
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

// Page loader
async function navigateToPage(page) {
    if (router.currentPage === page) return;

    // Check authentication before navigating to home page
    if (page === 'home' && !isAuthenticated()) {
        page = 'login';
    }

    try {
        const screen = document.querySelector('.screen');
        
        // Remove previous classes
        screen.classList.remove('zoom-in', 'zoom-out');
        
        // Add zoom effect based on navigation
        if (page === 'home') {
            screen.classList.add('zoom-in');
        } else if (router.currentPage === 'home') {
            // Coming from home page
            screen.classList.add('zoom-out');
            // Wait for zoom out
            await new Promise(resolve => setTimeout(resolve, 500));
            screen.classList.remove('zoom-out');
        }

        const response = await fetch(router.pages[page]);
        const content = await response.text();
        document.getElementById('content').innerHTML = content;
        
        router.currentPage = page;
        history.pushState({ page }, '', `#${page}`);

        if (page === 'register') {
            attachRegisterFormListener();
        } else if (page === 'login') {
            attachLoginFormListener();
        }
    } catch (error) {
        console.error('Error loading page:', error);
    }
}

// Handle browser back/forward
window.addEventListener('popstate', (e) => {
    if (e.state?.page) {
        navigateToPage(e.state.page);
    }
});

// Load initial page
window.addEventListener('load', () => {
    const initialPage = window.location.hash.slice(1) || 'register';
    navigateToPage(initialPage);
});

// filepath: /home/jorteixe/ft_transcendence/Frontend/assets/js/main.js
async function checkAndRefreshToken() {
    const accessTokenExpiry = localStorage.getItem('access_token_expiry');
    const currentTime = new Date().getTime();

    if (accessTokenExpiry && currentTime > accessTokenExpiry - 5 * 60 * 1000) { // 5 minutes before expiry
        await refreshToken();
    }
}

async function refreshToken() {
    try {
        const refresh = localStorage.getItem('refresh');
        const response = await fetch('http://localhost:8000/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ refresh })
        });

        const responseData = await response.json();
        if (response.ok) {
            localStorage.setItem('access', responseData.access);
            const accessTokenExpiry = new Date().getTime() + 30 * 60 * 1000; // 30 minutes
            localStorage.setItem('access_token_expiry', accessTokenExpiry);
            console.log('Token refreshed successfully');
        } else {
            console.error('Failed to refresh token:', responseData);
            logout(); // Log out if refresh token is expired or invalid
        }
    } catch (error) {
        console.error('Error refreshing token:', error);
        logout(); // Log out if there is an error during the refresh process
    }
}