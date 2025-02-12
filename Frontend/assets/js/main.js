// Router state
const router = {
	currentPage: null,
	pages: {
		home: "/home.html",
		login: "/login.html",
		register: "/register.html",
		pong: "/pong.html",
		42: "/42.html"
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
async function renderPage(page) {
	console.log(`Attempting to render page: ${page}`);
	const loadingOverlay = new LoadingOverlay();
	if (router.currentPage === page) return;

	if (page === "home" || page === "pong") {
		const authenticated = await isAuthenticated();
		if (!authenticated) {
			console.log("User not authenticated, redirecting to login page.");
			page = "login";
		}
	} 
	// else {
	// 	if (authenticated) {
	// 		console.log("User authenticated, redirecting to home page.");
	// 		page = "home";
	// 	}
	// }

	try {
		loadingOverlay.show();
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
		} else if (page === "pong") {
			startGame(data.game_group, socket);
		} else if (page === "42") {
			handle42Callback();
		}
		history.pushState({ page: page }, "", `/${page}`);
		router.currentPage = page;
	} catch (error) {
		console.error("Error loading page:", error);
	} finally {
		loadingOverlay.hide();
	}
}

async function renderAuthPage(page, responseStruct) {
	console.log(`Attempting to render page: ${page}`);
	const loadingOverlay = new LoadingOverlay();
	if (routerAuth.currentPage === page) return;

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
			if (typeof socket !== "undefined" && socket.readyState !== WebSocket.CLOSED) {
				socket.close();
			}
			socket = new WebSocket(
				`wss://${window.location.host}/ws/users/online-players/?token=${refreshed.access}`
			);
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