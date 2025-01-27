// Router state
const router = {
  currentPage: null,
  pages: {
    home: "/home.html",
    login: "/login.html",
    register: "/register.html",
  },
};

function updateUserProfile() {
  const username = sessionStorage.getItem("username");
  console.log("Username from session:", username); // Debug

  setTimeout(() => {
    const userDisplay = document.querySelector(".user-display");
    console.log("User display element:", userDisplay);

    if (userDisplay && username) {
      userDisplay.textContent = username;
    } else {
      if (!userDisplay && username) {
        setTimeout(updateUserProfile, 100);
      }
    }
  }, 0);
}

// Check if user is authenticated
function isAuthenticated() {
  return !!localStorage.getItem("token");
}

// Logout function
async function logout() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch("http://localhost:8000/api/users/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ refresh: localStorage.getItem("refresh_token") }),
    });

    if (response.ok) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      sessionStorage.removeItem("username");
      renderContent("login");
    } else {
      console.error("Failed to log out");
    }
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

// Page loader
async function renderContent(page) {
  if (router.currentPage === page) return;

  if (page === "home" && !isAuthenticated()) {
    page = "login";
  }

  try {
    const screen = document.querySelector(".screen-container");

    // Remove previous classes
    screen.classList.remove("zoom-in", "zoom-out");

    if (page === "home") {
      screen.classList.add("zoom-in");
    } else if (router.currentPage === "home") {
      screen.classList.add("zoom-out");
      await new Promise((resolve) => setTimeout(resolve, 500));
      screen.classList.remove("zoom-out");
    }

    const response = await fetch(router.pages[page]);
    const content = await response.text();
    document.getElementById("content").innerHTML = content;

    router.currentPage = page;
    history.pushState({ page }, "", `#${page}`);

    if (page === "register") {
      attachRegisterFormListener();
    } else if (page === "login") {
      attachLoginFormListener();
    }
  } catch (error) {
    console.error("Error loading page:", error);
  }
}

// Handle browser back/forward
window.addEventListener("popstate", (e) => {
  if (e.state?.page) {
    renderContent(e.state.page);
  }
});

// Load initial page
window.addEventListener("load", () => {
  const initialPage = window.location.hash.slice(1) || "home";
  renderContent(initialPage);
});

document.addEventListener("DOMContentLoaded", () => {
  if (isAuthenticated()) {
    updateUserProfile();
  }
});
