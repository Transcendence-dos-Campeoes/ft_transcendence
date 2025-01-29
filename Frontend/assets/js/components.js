const elements = {
  currentElement: null,
  elements: {
    overview: "/components/overview.html",
    profile: "/components/profile.html",
    settings: "/components/settings.html",
    matches: "/components/matches.html",
    tournaments: "/components/tournaments.html",
    newgame: "/components/newgame.html",
    joingame: "/components/joingame.html",
    newtournament: "/components/newtournament.html",
    jointournament: "/components/jointournament.html",
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
      await loadProfileData();
      attachProfileFormListener();
    } else if (element === "overview") {
      loadChart();
    }
    console.log("✅ Component render complete:", element);
  } catch (error) {
    console.error("Error loading element:", error);
  } finally {
    loadingOverlay.hide();
  }
}
