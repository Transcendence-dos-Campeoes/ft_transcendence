class ArcadeButton {
  constructor(button) {
    this.button = button;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.button.addEventListener("mousedown", () => {
      // Optional: Add sound effect
      // new Audio('button-press.mp3').play();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".button").forEach((button) => {
    new ArcadeButton(button);
  });
});
