class PongGame {
  constructor(data, socket) {
      console.log("PongGame Initialized!");
      this.scene = new THREE.Scene();
      this.data = data; // Store the received data
      this.socket = socket; // Store the socket connection
      this.player1Score = 0;
      this.player2Score = 0;
      this.init();
  }

  init() {
      this.setupCamera();
      this.setupRenderer();
      this.setupLighting();
      this.setupGameElements();
      this.setupGlowingGrid();
      this.setupControls();
      document.body.appendChild(this.renderer.domElement);
      this.animate();
  }

  setupCamera() {
      this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.camera.position.set(6.5, 0, 3);
      this.camera.rotation.set(0.0, 1, 1.57);
  }

  setupRenderer() {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.shadowMap.enabled = true;
      this.renderer.setClearColor("#0A001E"); // Dark Purple (Neon Style)
  }

  setupLighting() {
      this.ambientLight = new THREE.AmbientLight(0x5500AA, 1);
      this.scene.add(this.ambientLight);

      this.spotLight = new THREE.SpotLight(0xffffff, 2, 10, Math.PI / 4, 1);
      this.spotLight.position.set(0, 5, 5);
      this.spotLight.castShadow = true;
      this.scene.add(this.spotLight);
  }

  setupGameElements() {
      this.setupPaddles();
      this.setupSquareBall();
      this.setupWalls();
      this.resetBall();
  }

  setupPaddles() {
      const paddleMaterial = new THREE.MeshStandardMaterial({
          color: "#FF00FF", // Neon Pink
          emissive: "#FF00FF",
          emissiveIntensity: 1.5,
          metalness: 0.8,
          roughness: 0.2
      });

      const paddleGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.3);
      this.leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
      this.rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);

      this.leftPaddle.position.set(-4, 0, 0.2);
      this.rightPaddle.position.set(4, 0, 0.2);

      this.scene.add(this.leftPaddle, this.rightPaddle);
  }

  setupSquareBall() {
      const squareMaterial = new THREE.MeshStandardMaterial({
          color: "#00FFFF", // Neon Cyan
          emissive: "#00FFFF",
          emissiveIntensity: 2.0,
          metalness: 1.0,
          roughness: 0.1
      });

      const squareGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      this.ball = new THREE.Mesh(squareGeometry, squareMaterial);
      this.scene.add(this.ball);
  }

  setupWalls() {
      const wallMaterial = new THREE.MeshStandardMaterial({
          color: "#FFCC00",
          emissive: "#FFCC00",
          emissiveIntensity: 1.5,
          transparent: true,
          opacity: 0.5 // 🔥 Corrected: 50% transparent walls
      });

      const wallThickness = 0.1; // 🔥 Thinner walls
      this.topWall = new THREE.Mesh(new THREE.BoxGeometry(9, wallThickness, 0.2), wallMaterial);
      this.bottomWall = new THREE.Mesh(new THREE.BoxGeometry(9, wallThickness, 0.2), wallMaterial);

      this.topWall.position.set(0, 2.5, 0.2);
      this.bottomWall.position.set(0, -2.5, 0.2);

      this.scene.add(this.topWall, this.bottomWall);
  }

  setupGlowingGrid() {
      const gridMaterial = new THREE.LineBasicMaterial({ color: "#00FF00" }); // Green Grid

      const gridWidth = 8.5;
      const gridHeight = 4.5;
      const gridSpacing = 0.5;
      const fieldGroup = new THREE.Group();

      for (let i = -gridWidth / 2; i <= gridWidth / 2; i += gridSpacing) {
          const vertPoints = [new THREE.Vector3(i, -gridHeight / 2, 0), new THREE.Vector3(i, gridHeight / 2, 0)];
          const vertGeometry = new THREE.BufferGeometry().setFromPoints(vertPoints);
          fieldGroup.add(new THREE.Line(vertGeometry, gridMaterial));
      }

      for (let i = -gridHeight / 2; i <= gridHeight / 2; i += gridSpacing) {
          const horizPoints = [new THREE.Vector3(-gridWidth / 2, i, 0), new THREE.Vector3(gridWidth / 2, i, 0)];
          const horizGeometry = new THREE.BufferGeometry().setFromPoints(horizPoints);
          fieldGroup.add(new THREE.Line(horizGeometry, gridMaterial));
      }

      fieldGroup.position.z = -0.2;
      this.scene.add(fieldGroup);
  }

  setupControls() {
      this.keys = {};
      window.addEventListener("keydown", (e) => (this.keys[e.key] = true));
      window.addEventListener("keyup", (e) => (this.keys[e.key] = false));
  }

  animate() {
      requestAnimationFrame(() => this.animate());
      this.renderer.render(this.scene, this.camera);
  }
}

// 🔥 Function to Start the Game (Now Passing `data` and `socket`)
function startGame(data, socket) {
  console.log("Game starting... f() StartGame", data.gameGroup, socket);
  new PongGame(data, socket); // Pass data & socket to PongGame
}

// ✅ Corrected Event Listener
window.addEventListener("load", () => startGame({ gameGroup: null }, null));
