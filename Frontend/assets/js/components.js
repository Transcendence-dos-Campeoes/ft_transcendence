const elements = {
  currentElement: null,
  elements: {
    overview: '/components/overview.html',
    profile: '/components/profile.html',
    settings: '/components/settings.html',
    matches: '/components/matches.html',
    tournaments: '/components/tournaments.html',
  },
};
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkElement = () => {
      const element = document.getElementById(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        reject(new Error(`Element ${selector} not found after ${timeout}ms`));
      } else {
        setTimeout(checkElement, 100);
      }
    };

    checkElement();
  });
}

async function renderElement(element, event = null) {
  console.log('Rendering element:', element);
  if (elements.currentElement === element) return;

  try {
    const centerContent = await waitForElement('center-content');
    const response = await fetch(elements.elements[element]);
    const content = await response.text();

    centerContent.innerHTML = content;
    elements.currentElement = element;
  } catch (error) {
    console.error('Error loading element:', error);
  }
}
