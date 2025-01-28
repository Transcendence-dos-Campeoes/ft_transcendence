const elements = {
  currentElement: null,
  elements: {
    overview: "/components/overview.html",
    profile: "/components/profile.html",
    settings: "/components/settings.html",
    matches: "/components/matches.html",
    tournaments: "/components/tournaments.html",
  },
};

async function renderElement(element) {
  console.log("Rendering element:", element);

  try {
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
    } else if (element === "settings") {
    }
    console.log("✅ Component render complete:", element);
  } catch (error) {
    console.error("Error loading element:", error);
  }
}
