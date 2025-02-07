
let scene, camera, renderer;
let player1Mesh, player2Mesh, ballMesh;
let player1Score = 0, player2Score = 0;
let isHost = false;
let actualPlayer;
let gameRunning = true;
let animationFrameId;
let keyState = {};

// Board dimensions
const boardWidth = 500;
const boardHeight = 500;


// textureeee try for ball

const textureBall = new THREE.TextureLoader().load('./assets/textures/ballfade.png');


// Player and Ball sizes
const playerWidth = 10, playerHeight = 50, ballSize = 10;
let playerVelocityY = 0;

// Player and Ball Objects
let player1 = { x: -230, y: 0, velocityY: 0 };
let player2 = { x: 230, y: 0, velocityY: 0 };
let ball = { x: 0, y: 0, velocityX: 3, velocityY: 3 };

/**
 * Called by `main.js` when `page === "pong"`
 */
function startGame(gameGroup, socket) {
    console.log("🏓 Pong game starting...");
    waitForCanvasAndInit(socket, gameGroup, actualPlayer);
}

/**
 * Ensures `#board` exists before initializing the game.
 */
function waitForCanvasAndInit(socket, gameGroup, actualPlayer) {
    const canvas = document.getElementById("board");
    if (canvas) {
        console.log("✅ Canvas found, initializing game...");
        initializeGame(socket, gameGroup, actualPlayer);
    } else {
        console.warn("⏳ Canvas not found yet. Retrying...");
        setTimeout(() => waitForCanvasAndInit(socket, gameGroup, actualPlayer), 100);
    }
}

/**
 * Initializes the 3D scene inside `#board`.
 */
function initializeGame(socket, gameGroup, actualPlayer) {
    scene = new THREE.Scene();

    // Camera Setup
    camera = new THREE.PerspectiveCamera(75, boardWidth / boardHeight, 0.1, 1000);
    camera.position.set(0, 0, 300);

    // Get the existing canvas inside `pong.html`
    const canvas = document.getElementById("board");

    if (!canvas) {
        console.error("❌ Error: Canvas element #board not found!");
        return;
    }

    // Use the existing canvas for rendering
    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(boardWidth, boardHeight);

    // Lighting
    const light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    // Create Players (3D Rectangles)
    const playerGeometry = new THREE.BoxGeometry(playerWidth, playerHeight, 5);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

    player1Mesh = new THREE.Mesh(playerGeometry, playerMaterial);
    player1Mesh.position.set(player1.x, player1.y, 0);
    
    player2Mesh = new THREE.Mesh(playerGeometry, playerMaterial);
    player2Mesh.position.set(player2.x, player2.y, 0);

    scene.add(player1Mesh);
    scene.add(player2Mesh);

    // Create Ball
    const ballGeometry = new THREE.SphereGeometry(ballSize / 2, 32, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    ballMesh = new THREE.Mesh(ballGeometry, ballMaterial);
    ballMesh.position.set(ball.x, ball.y, 0);
    scene.add(ballMesh);

    // Attach event listeners
    if (!document.keyListenersAdded) {
        document.addEventListener("keydown", (event) => movePlayer(event, actualPlayer, socket, gameGroup));
        document.addEventListener("keyup", (event) => stopPlayer(event, actualPlayer, socket, gameGroup));
        document.keyListenersAdded = true;
    }

    console.log("🎮 Game Initialized. Starting animation loop...");
    animate();
}

/**
 * Game loop for rendering.
 */
function animate() {
    if (!gameRunning)
        return;

    requestAnimationFrame(animate);

    // Move players
    player1.y += player1.velocityY;
    player2.y += player2.velocityY;

    // Keep players inside bounds
    player1.y = Math.max(-225, Math.min(225, player1.y));
    player2.y = Math.max(-225, Math.min(225, player2.y));

    // Move ball
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // Ball collision with top/bottom walls
    if (ball.y > 240 || ball.y < -240) {
        ball.velocityY *= -1;
    }

    // Ball collision with paddles
    if ((ball.x < -220 && ball.y >= player1.y - 25 && ball.y <= player1.y + 25) ||
        (ball.x > 220 && ball.y >= player2.y - 25 && ball.y <= player2.y + 25)) {
        ball.velocityX *= -1;
    }

    // Scoring system
    if (ball.x < -250) { 
        player2Score++;
        resetBall();
    } else if (ball.x > 250) { 
        player1Score++;
        resetBall();
    }

    // Update positions of meshes
    player1Mesh.position.y = player1.y;
    player2Mesh.position.y = player2.y;
    ballMesh.position.set(ball.x, ball.y, 0);

    renderer.render(scene, camera);
}

/**
 * Resets ball position after a point is scored.
 */
function resetBall() {
    ball.x = 0;
    ball.y = 0;
    ball.velocityX = 3 * (Math.random() > 0.5 ? 1 : -1);
    ball.velocityY = 3 * (Math.random() > 0.5 ? 1 : -1);
}

/**
 * Handles player movement (keydown).
 */
function movePlayer(event, player, socket, gameGroup) {
    keyState[event.key] = true;
    updatePlayerMovement(player, socket, gameGroup);
}

/**
 * Handles player stopping (keyup).
 */
function stopPlayer(event, player, socket, gameGroup) {
    delete keyState[event.key];
    updatePlayerMovement(player, socket, gameGroup);
}

/**
 * Updates player movement based on key states.
 */
function updatePlayerMovement(player, socket, gameGroup) {
    let newVelocityY = 0;

    if (keyState['ArrowUp'] && !keyState['ArrowDown']) {
        newVelocityY = -5;
    } else if (keyState['ArrowDown'] && !keyState['ArrowUp']) {
        newVelocityY = 5;
    }

    // Update only if changed
    if (player === 'player1' && player1.velocityY !== newVelocityY) {
        player1.velocityY = newVelocityY;
        socket.send(JSON.stringify({
            type: 'player_move',
            player: 'player1',
            velocityY: newVelocityY,
            game_group: gameGroup,
            user: localStorage.getItem("username")
        }));
    } else if (player === 'player2' && player2.velocityY !== newVelocityY) {
        player2.velocityY = newVelocityY;
        socket.send(JSON.stringify({
            type: 'player_move',
            player: 'player2',
            velocityY: newVelocityY,
            game_group: gameGroup,
            user: localStorage.getItem("username")
        }));
    }
}
