class ArcadeAudio {
  constructor() {
    this.audio = new Audio("/assets/audio/arcade-music.mp3");
    this.audio.loop = true;
    this.audio.volume = 0;
    this.isPlaying = true;
    this.setupButtons();
    this.observeZoom();
  }

  setupButtons() {
    const rightButton = document.querySelectorAll(".button")[1]; // Second button
    rightButton.classList.add("audio-button");

    rightButton.addEventListener("click", () => {
      if (this.isPlaying) {
        this.fadeOut();
        rightButton.classList.remove("active");
      } else {
        this.fadeIn();
        rightButton.classList.add("active");
      }
      this.isPlaying = !this.isPlaying;
    });
  }

  observeZoom() {
    const screen = document.querySelector(".screen-container");
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const rightButton = document.querySelectorAll(".button")[1];
          if (screen.classList.contains("zoom-in")) {
            this.fadeOut();
            rightButton.classList.remove("active");
            this.isPlaying = false;
          }
          else if (screen.classList.contains("zoom-out")) {
            this.fadeIn();
            rightButton.classList.add("active");
            this.isPlaying = true;
          }
        }
      });
    });

    observer.observe(screen, {
      attributes: true,
    });
  }

  fadeIn() {
    if (!this.audio) return;

    const fadeInterval = setInterval(() => {
      if (this.audio.volume < 1) {
        const newVolume = Math.min(this.audio.volume + 0.1, 1);
        this.audio.volume = newVolume;
        if (this.audio.paused) this.audio.play();
      } else {
        clearInterval(fadeInterval);
      }
    }, 100);
  }

  fadeOut() {
    if (!this.audio) return;

    const fadeInterval = setInterval(() => {
      if (this.audio.volume > 0) {
        const newVolume = Math.max(this.audio.volume - 0.1, 0);
        this.audio.volume = newVolume;
      } else {
        this.audio.pause();
        clearInterval(fadeInterval);
      }
    }, 100);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const arcadeAudio = new ArcadeAudio();
});
