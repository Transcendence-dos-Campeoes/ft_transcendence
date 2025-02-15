const elements = {
	currentElement: null,
	elements: {
		overview: "/components/overview.html",
		profile: "/components/profile.html",
		friendProfile: "/components/profile.html",
		settings: "/components/settings.html",
		matches: "/components/matches.html",
		tournaments: "/components/tournaments.html",
		newgame: "/components/newgame.html",
		newtournament: "/components/newtournament.html",
		invites: "/components/invites.html",
		tournamentBracket: "/components/tournamentBracket.html",
		changeMap: "/components/changeMap.html",
		404: "/components/404.html",
	},
};

function clearNavLinkButtons() {
	document.querySelectorAll(".nav-link").forEach((link) => {
		link.classList.remove("active");
	});

	document.querySelectorAll(".dropdown-item").forEach((link) => {
		link.classList.remove("active");
	});
}
async function renderElement(element) {
	if (!elements.elements[element]) {
		console.error(`Element not found: ${element}, rendering 404 element.`);
		element = "404";
	}
	console.log("Rendering element:", element);
	const loadingOverlay = new LoadingOverlay();

	try {
		loadingOverlay.show();
		clearNavLinkButtons();

		const navLink = document.querySelector(
			`a[onclick*="renderElement('${element}')"]`
		);
		if (navLink) {
			navLink.classList.add("active");
		}

		const content = document.querySelector(".center-content");

		if (!content) {
			throw new Error("Content container not found");
		}

		console.log("📡 Fetching component HTML:", elements.elements[element]);
		const response = await fetch(elements.elements[element]);
		const html = await response.text();
		console.log("📥 HTML received, length:", html.length);

		console.log("🎨 Updating DOM");
		content.innerHTML = html;
		elements.currentElement = element;

		console.log("🎯 Initializing component:", element);
		if (element === "profile") {
			await viewProfile();
		} else if (element === "overview") {
			loadChart();
		} else if (element === "invites") {
			new FriendSystem();
		} else if (element === "settings") {
			await loadSettingsData();
			attachSettingsFormListener();
		} else if (element === "newtournament") {
			attachTournamentFormListener();
		} else if (element === "tournaments") {
			loadAvailableTournaments();
		} else if (element === "matches") {
			loadMatches();
		} else if (element === "newgame") {
			waitgame();
		} else if (element === "changeMap") {
			loadMaps();
		}
		// history.pushState({ element: element }, "", `/home/${element}`);
		elements.currentElement = element;
		console.log("✅ Component render complete:", element);
		history.pushState({ element: element }, "", `/home/${element}`);
	} catch (error) {
		console.error("Error loading element:", error);
	} finally {
		loadingOverlay.hide();
	}
}
