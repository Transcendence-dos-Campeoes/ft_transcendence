class LoadingOverlay {
  constructor() {
    this.overlay = null;
    this.createOverlay();
  }

  createOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.className = "loading-overlay";
    this.overlay.innerHTML = `
          <div class="arcade-screen">
            <div class="pixel-text">LOADING...</div>
              <div class="pacman">
                  <div class="pacman-top"></div>
                  <div class="pacman-bottom"></div>
              </div>
              <div class="dots">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
              </div>
            </div>
          </div>
        `;
    document.body.appendChild(this.overlay);
  }

  show() {
    this.overlay.classList.add("active");
  }

  hide() {
    this.overlay.classList.remove("active");
  }
}
