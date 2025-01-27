// Router state
const router = {
  currentPage: null,
  pages: {
    home: '/home.html',
    login: '/login.html',
    register: '/register.html',
  },
};

function updateUserProfile() {
  const username = sessionStorage.getItem('username');
  if (!username) return;

  // Create observer to watch for element
  const observer = new MutationObserver((mutations, obs) => {
    const userDisplay = document.querySelector('.user-display');
    if (userDisplay) {
      userDisplay.textContent = username;
      obs.disconnect();
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Check if user is authenticated
function isAuthenticated() {
  return !!localStorage.getItem('token');
}

// Logout function
async function logout() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No token found, redirecting to login');
    renderPage('login');
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('http://localhost:8000/api/users/logout/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({refresh: localStorage.getItem('refresh_token')}),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      sessionStorage.removeItem('username');
      renderPage('login');
    } else {
      throw new Error(`Logout failed: ${response.status}`);
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Force logout on client side if server fails
    localStorage.clear();
    sessionStorage.clear();
    renderPage('login');
  }
}

async function renderPage(page) {
  if (router.currentPage === page) return;

  if (page === 'home' && !isAuthenticated()) {
    page = 'login';
  }

  try {
    const screen = document.querySelector('.screen-container');
    screen.classList.remove('zoom-in', 'zoom-out');

    if (page === 'home') {
      updateUserProfile();
      screen.classList.add('zoom-in');
    } else if (router.currentPage === 'home') {
      screen.classList.add('zoom-out');
      await new Promise((resolve) => setTimeout(resolve, 500));
      screen.classList.remove('zoom-out');
    }

    const response = await fetch(router.pages[page]);
    const content = await response.text();
    document.getElementById('content').innerHTML = content;

    router.currentPage = page;
    history.pushState({page}, '', `#${page}`);

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
    renderPage(e.state.page);
  }
});

// Load initial page
window.addEventListener('load', () => {
  const initialPage = window.location.hash.slice(1) || 'home';
  renderPage(initialPage);
});