// Router state
const router = {
    currentPage: null,
    pages: {
        home: '/home.html',
        login: '/login.html',
        register: '/register.html',
        lobby: '/lobby.html'
    }
};

// Check if user is authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Logout function
async function logout() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch('http://localhost:8000/api/users/logout/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ refresh: localStorage.getItem('refresh_token') })
        });

        if (response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
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

    if (page === 'lobby' && !isAuthenticated()) {
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