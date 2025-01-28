// Router state
const router = {
  currentPage: null,
  pages: {
    home: "/home.html",
    login: "/login.html",
    register: "/register.html",
  },
};

function displayErrorMessage(message, errorModal) {
  errorModal.show(message);
}

// Check if user is authenticated
function isAuthenticated() {
  return !!localStorage.getItem("access");
}

// Logout function
async function logout() {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return;

  try {
    const response = await fetch("http://localhost:8000/api/users/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
      body: JSON.stringify({ refresh }),
      credentials: "include", // Include cookies in the request
    });

    if (response.ok) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("access_token_expiry");
      renderPage("login");
    } else {
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        console.error("Error parsing JSON:", e);
        responseData = { detail: "An error occurred" };
      }
      if (responseData.detail === "Token is already blacklisted") {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("access_token_expiry");
        navigateToPage("login");
      } else {
        console.error("Failed to log out:", responseData);
      }
    }
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

// Page loader
async function renderPage(page) {
  if (router.currentPage === page) return;

  // Check authentication before navigating to home page
  if (page === "home") {
    console.log("Navigating to home, checking and refreshing token...");
    const isAuthenticated = await checkAndRefreshToken();
    if (!isAuthenticated) {
      page = "login";
    }
  }

  try {
    const screen = document.querySelector(".screen-container");

    // Remove previous classes
    screen.classList.remove("zoom-in", "zoom-out");

    // Add zoom effect based on navigation
    if (page === "home") {
      screen.classList.add("zoom-in");
    //   updateUserProfile();
    } else if (router.currentPage === "home") {
      // Coming from home page
      screen.classList.add("zoom-out");
      // Wait for zoom out
      await new Promise((resolve) => setTimeout(resolve, 500));
      screen.classList.remove("zoom-out");
    }

    // Load the new page
    const response = await fetch(router.pages[page]);
    const html = await response.text();
    document.querySelector(".screen").innerHTML = html;
    router.currentPage = page;

    // Attach event listeners for the new page
    if (page === "login") {
      attachLoginFormListener();
    } else if (page === "register") {
      attachRegisterFormListener();
    }
  } catch (error) {
    console.error("Error loading page:", error);
  }
}

async function checkAndRefreshToken() {
  console.log("checkAndRefreshToken called");
  const accessTokenExpiry = parseInt(
    localStorage.getItem("access_token_expiry"),
    10
  );
  const currentTime = new Date().getTime();

  if (isNaN(accessTokenExpiry)) {
    console.error("Invalid access token expiry time");
    logout();
    return false;
  }

  const expiry_minus_five = accessTokenExpiry - 5 * 60 * 1000;
  console.log("Current Time:", new Date(currentTime).toLocaleString());
  console.log("Expiry Time:", new Date(accessTokenExpiry).toLocaleString());
  console.log(
    "Expiry minus five minutes:",
    new Date(expiry_minus_five).toLocaleString()
  );

  if (currentTime > expiry_minus_five) {
    // 5 minutes before expiry
    console.log("Token Expired, refreshing token.");
    const refreshSuccess = await refreshToken();
    if (!refreshSuccess) {
      console.log("Refresh unsuccessful.");
      logout();
      return false;
    }
    console.log("Refresh successful.");
  }
  return true;
}

async function refreshToken() {
  try {
    const refresh = localStorage.getItem("refresh");
    const response = await fetch("http://localhost:8000/api/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh }),
    });

    const responseData = await response.json();
    if (response.ok) {
      localStorage.setItem("access", responseData.access);
      const accessTokenExpiry = new Date().getTime() + 10 * 60 * 1000; // 10 minutes for testing
      console.log(
        "New Access Token Expiry:",
        new Date(accessTokenExpiry).toLocaleString()
      );
      localStorage.setItem("access_token_expiry", accessTokenExpiry);
      console.log("Token refreshed successfully");
      return true;
    } else {
      console.error("Failed to refresh Access token:", responseData);
      return false;
    }
  } catch (error) {
    console.error("Error refreshing Access token:", error);
    return false;
  }
}

// Handle browser back/forward
window.addEventListener("popstate", (e) => {
  if (e.state?.page) {
    renderPage(e.state.page);
  }
});

// Load initial page
window.addEventListener("load", () => {
  const initialPage = window.location.hash.slice(1) || "home";
  renderPage(initialPage);
});
