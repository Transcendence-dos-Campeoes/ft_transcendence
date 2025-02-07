// ------------------------------------------------
// BASIC SETUP
// ------------------------------------------------
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(6.5, 0, 3);
camera.rotation.set(0.0, 1, 1.57);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor("#000000");
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ------------------------------------------------
// LIGHTING SETUP
// ------------------------------------------------
const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0x606060, 3);
spotLight.position.set(0, 3, 5);
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// ------------------------------------------------
// GAME ELEMENTS
// ------------------------------------------------
const textureBackGround = new THREE.TextureLoader().load('./assets/textures/background.jpeg');
scene.background = textureBackGround;

const textureBall = new THREE.TextureLoader().load('./assets/textures/ballfade.png');
const materialBall = new THREE.MeshStandardMaterial({ map: textureBall });

var paddleWidth = 0.2, paddleHeight = 1, paddleDepth = 0.3;
var paddleMaterial = new THREE.MeshStandardMaterial({ color: "#FF7F50" });

var leftPaddleGeometry = new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth);
var rightPaddleGeometry = new THREE.BoxGeometry(paddleWidth, paddleHeight, paddleDepth);

var leftPaddle = new THREE.Mesh(leftPaddleGeometry, paddleMaterial);
var rightPaddle = new THREE.Mesh(rightPaddleGeometry, paddleMaterial);
leftPaddle.castShadow = rightPaddle.castShadow = true;
leftPaddle.receiveShadow = rightPaddle.receiveShadow = true;

leftPaddle.position.set(-4, 0, 0);
rightPaddle.position.set(4, 0, 0);
scene.add(leftPaddle, rightPaddle);

var ballSize = 0.2;
var ballGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
var ball = new THREE.Mesh(ballGeometry, materialBall);
ball.castShadow = true;
ball.receiveShadow = true;
ball.position.set(0, 0, 0);
scene.add(ball);

var wallMaterial = new THREE.MeshStandardMaterial({ color: "#FFFFFF" });
var wallHeight = 5, wallDepth = 0.2;

var leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallDepth, wallHeight, wallDepth), wallMaterial);
var rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallDepth, wallHeight, wallDepth), wallMaterial);
leftWall.position.set(-5, 0, 0);
rightWall.position.set(5, 0, 0);
scene.add(leftWall, rightWall);

var topWall = new THREE.Mesh(new THREE.BoxGeometry(10, wallDepth, wallDepth), wallMaterial);
var bottomWall = new THREE.Mesh(new THREE.BoxGeometry(10, wallDepth, wallDepth), wallMaterial);
topWall.position.set(0, 2.5, 0);
bottomWall.position.set(0, -2.5, 0);
scene.add(topWall, bottomWall);

// ------------------------------------------------
// BALL MOVEMENT
// ------------------------------------------------
var ballVelocity = new THREE.Vector3(0.1, 0.1, 0);
var ballSpeed = 0.1;

// ------------------------------------------------
// CONTROLS
// ------------------------------------------------
var upKeyPressed = false, downKeyPressed = false;
document.addEventListener("keydown", (event) => {
    if (event.code === "ArrowUp") upKeyPressed = true;
    if (event.code === "ArrowDown") downKeyPressed = true;
});
document.addEventListener("keyup", (event) => {
    if (event.code === "ArrowUp") upKeyPressed = false;
    if (event.code === "ArrowDown") downKeyPressed = false;
});

// ------------------------------------------------
// SCORE SYSTEM
// ------------------------------------------------
var leftScore = 0, rightScore = 0;
var scoreText = document.createElement('div');
scoreText.style.position = 'absolute';
scoreText.style.top = '10px';
scoreText.style.left = '50%';
scoreText.style.color = 'white';
scoreText.style.fontSize = '30px';
scoreText.style.transform = 'translateX(-50%)';
document.body.appendChild(scoreText);

function updateScore() {
    scoreText.innerText = `Left: ${leftScore} | Right: ${rightScore}`;
}

// ------------------------------------------------
// GAME LOGIC
// ------------------------------------------------
function update() {
    ball.position.add(ballVelocity);
    if (ball.position.y >= 2.5 || ball.position.y <= -2.5) ballVelocity.y = -ballVelocity.y;
    
    if (ball.position.x - ballSize / 2 <= leftPaddle.position.x + paddleWidth / 2 &&
        ball.position.y < leftPaddle.position.y + paddleHeight / 2 &&
        ball.position.y > leftPaddle.position.y - paddleHeight / 2) {
        ballVelocity.x = -ballVelocity.x * 1.05;
    }

    if (ball.position.x + ballSize / 2 >= rightPaddle.position.x - paddleWidth / 2 &&
        ball.position.y < rightPaddle.position.y + paddleHeight / 2 &&
        ball.position.y > rightPaddle.position.y - paddleHeight / 2) {
        ballVelocity.x = -ballVelocity.x * 1.05;
    }

    if (ball.position.x > 5) {
        leftScore++;
        resetBall();
    } else if (ball.position.x < -5) {
        rightScore++;
        resetBall();
    }
    updateScore();

    if (upKeyPressed && rightPaddle.position.y < 2.5) rightPaddle.position.y += 0.15;
    if (downKeyPressed && rightPaddle.position.y > -2.5) rightPaddle.position.y -= 0.15;
    
    if (ball.position.y > leftPaddle.position.y && leftPaddle.position.y < 2.5) leftPaddle.position.y += 0.1;
    if (ball.position.y < leftPaddle.position.y && leftPaddle.position.y > -2.5) leftPaddle.position.y -= 0.1;

    renderer.render(scene, camera);
}

function resetBall() {
    ball.position.set(0, 0, 0);
    ballVelocity.x = (Math.random() > 0.5 ? 1 : -1) * ballSpeed;
    ballVelocity.y = (Math.random() - 0.5) * ballSpeed;
}

// ------------------------------------------------
// ANIMATION LOOP
// ------------------------------------------------
function animate() {
    requestAnimationFrame(animate);
    update();
}
animate();




// class PongGame {
//     constructor() {
//         this.scene = new THREE.Scene();
//         this.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000);
//         this.renderer = new THREE.WebGLRenderer({ antialias: true });
//         this.ballVelocity = new THREE.Vector3(0.1, 0.1, 0);
//         this.ballSpeed = 0.1;
//         this.leftScore = 0;
//         this.rightScore = 0;
//         this.upKeyPressed = false;
//         this.downKeyPressed = false;
//         this.setupRenderer();
//         this.setupScene();
//         this.setupLighting();
//         this.setupGameElements();
//         this.setupControls();
//         this.setupScoreDisplay();
//         this.animate();
//     }

//     setupRenderer() {
//         this.renderer.setClearColor("#000000");
//         this.renderer.setSize(window.innerWidth, window.innerHeight);
//         this.renderer.shadowMap.enabled = true;
//         this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
//         document.body.appendChild(this.renderer.domElement);
//     }

//     setupScene() {
//         this.camera.position.set(6.5, 0, 3);
//         this.camera.rotation.set(0.0, 1, 1.57);
//     }

//     setupLighting() {
//         const ambientLight = new THREE.AmbientLight(0x888888, 2);
//         this.scene.add(ambientLight);

//         const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
//         directionalLight.position.set(10, 10, 10);
//         directionalLight.castShadow = true;
//         this.scene.add(directionalLight);
//     }

//     setupGameElements() {
//         const textureBackGround = new THREE.TextureLoader().load('./assets/textures/background.jpeg');
//         this.scene.background = textureBackGround;

//         const textureBall = new THREE.TextureLoader().load('./assets/textures/ballfade.png');
//         this.materialBall = new THREE.MeshStandardMaterial({ map: textureBall });

//         this.createPaddles();
//         this.createBall();
//         this.createWalls();
//     }

//     createPaddles() {
//         const paddleMaterial = new THREE.MeshStandardMaterial({ color: "#FF7F50" });
//         const paddleGeometry = new THREE.BoxGeometry(0.2, 1, 0.3);
        
//         this.leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
//         this.rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
        
//         this.leftPaddle.castShadow = this.rightPaddle.castShadow = true;
//         this.leftPaddle.receiveShadow = this.rightPaddle.receiveShadow = true;

//         this.leftPaddle.position.set(-4, 0, 0);
//         this.rightPaddle.position.set(4, 0, 0);
//         this.scene.add(this.leftPaddle, this.rightPaddle);
//     }

//     createBall() {
//         const ballGeometry = new THREE.SphereGeometry(0.2, 32, 32);
//         this.ball = new THREE.Mesh(ballGeometry, this.materialBall);
//         this.ball.castShadow = this.ball.receiveShadow = true;
//         this.ball.position.set(0, 0, 0);
//         this.scene.add(this.ball);
//     }

//     createWalls() {
//         const wallMaterial = new THREE.MeshStandardMaterial({ color: "#FFFFFF" });
//         const wallHeight = 5, wallDepth = 0.2;

//         const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallDepth, wallHeight, wallDepth), wallMaterial);
//         const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallDepth, wallHeight, wallDepth), wallMaterial);
//         leftWall.position.set(-5, 0, 0);
//         rightWall.position.set(5, 0, 0);
//         this.scene.add(leftWall, rightWall);
        
//         const topWall = new THREE.Mesh(new THREE.BoxGeometry(10, wallDepth, wallDepth), wallMaterial);
//         const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(10, wallDepth, wallDepth), wallMaterial);
//         topWall.position.set(0, 2.5, 0);
//         bottomWall.position.set(0, -2.5, 0);
//         this.scene.add(topWall, bottomWall);
//     }

//     setupControls() {
//         document.addEventListener("keydown", (event) => {
//             if (event.code === "ArrowUp") this.upKeyPressed = true;
//             if (event.code === "ArrowDown") this.downKeyPressed = true;
//         });
//         document.addEventListener("keyup", (event) => {
//             if (event.code === "ArrowUp") this.upKeyPressed = false;
//             if (event.code === "ArrowDown") this.downKeyPressed = false;
//         });
//     }

//     update() {
//         this.ball.position.add(this.ballVelocity);
        
//         if (this.upKeyPressed && this.rightPaddle.position.y < 2.5) {
//             this.rightPaddle.position.y += 0.1;
//         }
//         if (this.downKeyPressed && this.rightPaddle.position.y > -2.5) {
//             this.rightPaddle.position.y -= 0.1;
//         }
        
//         if (
//             this.ball.position.x - 0.2 <= this.leftPaddle.position.x + 0.1 &&
//             this.ball.position.y < this.leftPaddle.position.y + 0.5 &&
//             this.ball.position.y > this.leftPaddle.position.y - 0.5
//         ) {
//             this.ballVelocity.x = -this.ballVelocity.x;
//         }
        
//         if (
//             this.ball.position.x + 0.2 >= this.rightPaddle.position.x - 0.1 &&
//             this.ball.position.y < this.rightPaddle.position.y + 0.5 &&
//             this.ball.position.y > this.rightPaddle.position.y - 0.5
//         ) {
//             this.ballVelocity.x = -this.ballVelocity.x;
//         }
        
//         if (this.ball.position.y >= 2.5 || this.ball.position.y <= -2.5) {
//             this.ballVelocity.y = -this.ballVelocity.y;
//         }
//     }

//     animate() {
//         requestAnimationFrame(() => this.animate());
//         this.update();
//         this.renderer.render(this.scene, this.camera);
//     }
// }

// const game = new PongGame();



