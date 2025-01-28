class ArcadeAudio {
  constructor() {
    this.audio = new Audio("/assets/audio/arcade-music.mp3");
    this.audio.loop = true;
    this.audio.volume = 0;
    this.isPlaying = false;
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
        }
      });
    });

    observer.observe(screen, {
      attributes: true,
    });
  }

  fadeIn() {
    this.audio.play().catch((err) => console.log("Audio play failed:", err));
    let volume = 0;
    const fadeIn = setInterval(() => {
      if (volume < 0.3) {
        volume += 0.01;
        this.audio.volume = volume;
      } else {
        clearInterval(fadeIn);
      }
    }, 50);
  }

  fadeOut() {
    let volume = this.audio.volume;
    const fadeOut = setInterval(() => {
      if (volume > 0) {
        volume -= 0.01;
        this.audio.volume = volume;
      } else {
        this.audio.pause();
        clearInterval(fadeOut);
      }
    }, 50);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const arcadeAudio = new ArcadeAudio();
});
