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
      <div class="gif-container">
        <img src="../assets/img/loading.gif" alt="Loading animation" />
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
