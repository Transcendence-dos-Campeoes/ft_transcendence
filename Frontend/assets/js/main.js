// Router state
const router = {
    currentPage: null,
    pages: {
        home: '/home.html',
        login: '/login.html',
        register: '/register.html'
    }
};

// Page loader
async function navigateToPage(page) {
    if (router.currentPage === page) return;
    
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
		}
        else if (page === 'login') {
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
    const initialPage = window.location.hash.slice(1) || 'home';
    navigateToPage(initialPage);
});