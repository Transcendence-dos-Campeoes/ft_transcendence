// Router state
const router = {
	currentPage: null,
	pages: {
		home: "/home.html",
		login: "/login.html",
		register: "/register.html",
		pong: "/pong.html",
		pongai: "/pong.html",
		42: "/42.html",
		404: "/404.html",
		403: "/403.html"
	},
};

const routerAuth = {
	currentPage: null,
	pages: {
		two_fa_enable: "/two_fa_enable.html",
		two_fa_verify: "/two_fa_verify.html",
		two_fa_recover: "/two_fa_recover.html",
	},
};

let socket;

function displayMessage(message, type) {
	const modal = new MessageModal(type);
	modal.show(message);
}

function formatErrorMessages(errors) {
	let formattedErrors = "";
	for (const [field, messages] of Object.entries(errors)) {
		formattedErrors += `<strong>${field.charAt(0).toUpperCase() + field.slice(1)
			}:</strong><br>`;
		messages.forEach((message) => {
			formattedErrors += `- ${message}<br>`;
		});
	}
	return formattedErrors;
}

async function isAuthenticated() {
	try {
		const response = await fetchWithAuth("/api/users/verify/");
		return response.ok;
	} catch {
		return false;
	}
}

// Page loader
async function renderPage(page, element) {
	const loadingOverlay = new LoadingOverlay();

	try {
		window.addEventListener("popstate", handlePopState);
		loadingOverlay.show();
		const screen = document.querySelector(".screen-container");

		// Load the new page
		if (router.currentPage !== page) {
			screen.classList.remove("zoom-in", "zoom-out");
			if (page === "home") {
				screen.classList.add("zoom-in");
			} else if (router.currentPage === "home") {
				screen.classList.add("zoom-out");
				await new Promise((resolve) => setTimeout(resolve, 500));
				screen.classList.remove("zoom-out");
			}
			const mainContent = document.getElementById("main-content");
			const response = await fetch(router.pages[page]);
			const html = await response.text();
			mainContent.innerHTML = html;
		}

		if (page === "login") {
			attachLoginFormListener();
		} else if (page === "register") {
			attachRegisterFormListener();
		} else if (page === "home") {
			if (router.currentPage !== page) {
				updateUserProfile();
				load_profile_pic();
				console.log("Before Load");
				if (!socket || socket == undefined)
					socket = new Socket(localStorage.getItem('access'));
				socket.lobbyLoad(localStorage.getItem('access'));
			}
			if (!element) {
				renderElement("overview");
			} else {
				renderElement(element);
			}

		} else if (page === "pong") {
			window.removeEventListener("popstate", handlePopState);
			startGame3d(data, socket);
		} else if (page === "42") {
			handle42Callback();
		} else if (page === "pongai") {
			startGameDuo();
		} else if (page === "403") {
			console.error(`Page not found: ${page}`);
		}
		router.currentPage = page;
	} catch (error) {
		console.error("Error loading page:", error);
	} finally {
		loadingOverlay.hide();
	}
}

async function renderAuthPage(page, responseStruct) {
	// console.log(`Attempting to render page: ${page}`);
	const loadingOverlay = new LoadingOverlay();

	try {
		loadingOverlay.show();
		const screen = document.querySelector(".screen-container");
		screen.classList.remove("zoom-in", "zoom-out");

		// Load the new page
		const mainContent = document.getElementById("main-content");
		const response = await fetch(routerAuth.pages[page]);
		const html = await response.text();
		mainContent.innerHTML = html;

		if (page === "two_fa_enable") {
			get_two_fa_qr(responseStruct);
			attach2FAEnableFormListener(responseStruct);
		} else if (page === "two_fa_verify") {
			attach2FAVerifyFormListener(responseStruct);
		} else if (page === "two_fa_recover") {
			attach2FaRecoverFormListener(responseStruct);
		}
		routerAuth.currentPage = page;
	} catch (error) {
		console.error("Error loading page:", error);
	} finally {
		loadingOverlay.hide();
	}
}

async function fetchWithAuth(url, options = {}) {
	const loadingOverlay = new LoadingOverlay();

	try {
		loadingOverlay.show();

		let response = await fetch(`${window.location.origin}${url}`, {
			...options,
			headers: {
				...options.headers,
				'Authorization': `Bearer ${localStorage.getItem('access')}`
			}
		});

		if (response.status === 401) {
			const refreshed = await refreshToken();
			console.log(refreshed);
			if (!refreshed) {
				clearLocalStorage();
				return;
			}

			if (socket != null || socket != undefined) {
				socket.destroy();
				socket = null;
			}
			socket = new Socket(refreshed.access);
			console.log("creating new socket");

			response = await fetch(`${window.location.origin}${url}`, {
				...options,
				headers: {
					...options.headers,
					'Authorization': `Bearer ${refreshed.access}`
				}
			});
		}
		return response;
	} catch (error) {
		console.error("Error in fetchWithAuth:", error);
		logout();
		throw error;
	} finally {
		loadingOverlay.hide();
	}
}

async function fetchWithDiffAuth(url, options = {}, tokens) {
	const loadingOverlay = new LoadingOverlay();

	try {
		loadingOverlay.show();

		let response = await fetch(`${window.location.origin}${url}`, {
			...options,
			headers: {
				...options.headers,
				'Authorization': `Bearer ${tokens.access}`
			}
		});

		if (response.status === 401) {
			const refreshed = await refreshTokenDiff(tokens);
			if (!refreshed) {
				clearLocalStorage();
				return;
			}
			response = await fetch(`${window.location.origin}${url}`, {
				...options,
				headers: {
					...options.headers,
					'Authorization': `Bearer ${tokens.access}`
				}
			});
		}
		return response;
	} catch (error) {
		logout();
		throw error;
	} finally {
		loadingOverlay.hide();
	}
}

async function refreshToken() {
	try {
		const response = await fetch(`${window.location.origin}/api/token/refresh/`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refresh: localStorage.getItem('refresh')
			})
		});

		if (!response.ok) {
			return false;
		}

		const data = await response.json();
		localStorage.setItem('access', data.access);
		localStorage.setItem('refresh', data.refresh);
		return data;
	} catch {
		return false;
	}
}

async function refreshTokenDiff(tokens) {
	try {
		const response = await fetch(`${window.location.origin}/api/token/refresh/`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refresh: tokens.refresh
			})
		});

		if (!response.ok) {
			return false;
		}

		const data = await response.json();
		localStorage.setItem('access', data.access);
		localStorage.setItem('refresh', data.refresh);
		return data;
	} catch {
		return false;
	}
}


const handlePopState = async (e) => {
	if (e.state?.page) {
		let path = window.location.pathname.slice(1) || "home";
		console.log(path);

		if (path === "home" || path === "pong" || path === "pongai" || elements.elements[path]) {
			const authenticated = await isAuthenticated();
			if (!authenticated) {
				console.log("User not authenticated, redirecting to login page.");
				history.pushState({ page: "login" }, "", "/login");
				path = "login";
			}
		}
		else if (path === "login" || path === "register" || path === "42") {
			const authenticated = await isAuthenticated();
			if (authenticated) {
				console.log("User authenticated, redirecting to home page.");
				history.pushState({ page: "home" }, "", "/home");
				path = "home";
			}
		}

		if (!router.pages[path] && !elements.elements[path] && !routerAuth.pages[path]) {
			renderPage("404");
		}
		else if (router.pages[path]) {
			renderPage(path);
		}
		else if (elements.elements[path]) {
			renderPage("home", path);
		}
	}
};

// Load initial page
window.addEventListener("load", async () => {

	let path = window.location.pathname.slice(1) || "home";
	console.log(path);

	if (path === "home" || path === "pong" || path === "pongai" || elements.elements[path]) {
		const authenticated = await isAuthenticated();
		if (!authenticated) {
			console.log("User not authenticated, redirecting to login page.");
			history.pushState({ page: "login" }, "", "/login");
			path = "login";
		}
	}
	else if (path === "login" || path === "register" || path === "42") {
		const authenticated = await isAuthenticated();
		if (authenticated) {
			console.log("User authenticated, redirecting to home page.");
			history.pushState({ page: "home" }, "", "/home");
			path = "home";
		}
	}

	if (!router.pages[path] && !elements.elements[path] && !routerAuth.pages[path]) {
		renderPage("404");
	}
	else if (router.pages[path]) {
		renderPage(path);
	}
	else if (elements.elements[path]) {
		renderPage("home", path);
	}
});
