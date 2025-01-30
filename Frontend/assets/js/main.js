// Router state
const router = {
  currentPage: null,
  pages: {
    home: "/home.html",
    login: "/login.html",
    register: "/register.html",
    pong: "/pong.html",
    42: "/42.html",
  },
};

function displayMessage(message, type) {
  const modal = new MessageModal(type);
  modal.show(message);
}

function formatErrorMessages(errors) {
  let formattedErrors = "";
  for (const [field, messages] of Object.entries(errors)) {
    formattedErrors += `<strong>${
      field.charAt(0).toUpperCase() + field.slice(1)
    }:</strong><br>`;
    messages.forEach((message) => {
      formattedErrors += `- ${message}<br>`;
    });
  }
  return formattedErrors;
}

// Check if user is authenticated
function isAuthenticated() {
  return !!localStorage.getItem("access");
}

// Page loader
async function renderPage(page) {
  console.log(`Attempting to render page: ${page}`);
  if (router.currentPage === page) return;

  // Check authentication before navigating to home page
  if (page === "home") {
    console.log("Navigating to home, checking and refreshing token...");
    const isAuthenticated = await checkAndRefreshToken();
    if (!isAuthenticated) {
      console.log("User not authenticated, redirecting to login page.");
      page = "login";
    }

  }

  try {
    const screen = document.querySelector(".screen-container");
    screen.classList.remove("zoom-in", "zoom-out");

    if (page === "home") {
      screen.classList.add("zoom-in");
    } else if (router.currentPage === "home") {
      screen.classList.add("zoom-out");
      await new Promise((resolve) => setTimeout(resolve, 500));
      screen.classList.remove("zoom-out");
    }

    // Load the new page
    const mainContent = document.getElementById("main-content");
    const response = await fetch(router.pages[page]);
    const html = await response.text();
    mainContent.innerHTML = html;

    if (page === "login") {
      attachLoginFormListener();
    } else if (page === "register") {
      attachRegisterFormListener();
    } else if (page === "home") {
      updateUserProfile();
	  load_profile_pic();
      renderElement("overview");
      lobbyLoad();
    }
    history.pushState({ page: page }, "", `/${page}`);
    router.currentPage = page;
  } catch (error) {
    console.error("Error loading page:", error);
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
  const initialPage = window.location.pathname.slice(1) || "home";
  renderPage(initialPage);
});

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

async function load_profile_pic()
{
	try {
		const response = await fetch("http://localhost:8000/api/users/profile/", {
		  headers: {
			Authorization: `Bearer ${localStorage.getItem("access")}`,
		  },
		});
	
		if (!response.ok) {
		  throw new Error("Failed to fetch profile data");
		}
	
		const data = await response.json();
		localStorage.setItem('photo_URL', data.photo_URL);
		// document.getElementById('photo_URL'.url = localStorage.photo_URL);

		const photoElement = document.getElementById('photo_URL');
		if (photoElement) {
		  photoElement.src = data.photo_URL;
		}
	}
	catch
	{
		displayMessage("Failed to load profile data", MessageType.ERROR);
	}
}