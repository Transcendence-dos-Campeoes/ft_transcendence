class LoadingOverlay {
  constructor() {
    this.overlay = null;
    this.createOverlay();
  }

  createOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.className = "loading-overlay";
    this.overlay.innerHTML = `
            <div class="spinner-container">
                <div class="spinner-border text-light" role="status">
                    <span class="visually-hidden">Loading...</span>
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
