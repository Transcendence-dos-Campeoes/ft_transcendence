
class PongGame {
    constructor(data, socket, gameMap) {
        this.gameMap = gameMap;
        this.socket = socket;
        this.data = data;
        this.game_group = data.game_group;

        // Scene & Renderer
        this.scene = new THREE.Scene();
        this.setupRenderer();
        this.overallHight = 0.2;
        this.gridDensity = 0.5;
        this.lineGirth = 1;
        this.fieldLength = 8.5;
        this.fieldWidth = 5;
        this.fieldOffset = this.overallHight / 2;
        this.paddleLenght = 1.1;
        this.wallThickness = this.overallHight;
        this.wallHightness = this.overallHight / 2;
        this.wallSidePos = this.fieldWidth / 2 + this.wallThickness / 2;
        this.ballSize = this.overallHight;
        this.playerPos = this.fieldLength / 2 + this.overallHight / 2;
        this.camPos = 6.5;
        this.topCamera;
        this.player1Name = this.data.player1;
        this.player2Name = this.data.player2;


        // DEFINE PLAYER AND CAMERA
        this.user = localStorage.getItem("username")
        this.player = this.user === this.player1Name ? "player1" : "player2";
        this.currentCamera = this.player === "player1" ? "player1Camera" : "player2Camera";

        //player stuff
        this.player1 = { position: { y: 0 } };
        this.player2 = { position: { y: 0 } };
        this.player1Camera;
        this.player2Camera;
        this.player1Score = 0;
        this.player2Score = 0;
        this.gridMaterial;
        this.ballMaterial;

        this.ballVelocity = { x: 0.05, y: 0.02 };
        this.keys = {};
        this.isRunning = true;
        this.lastSentTime = 0;
        this.targetBallPosition = { x: 0, y: 0 };
        this.targetPlayer1Position = 0;
        this.targetPlayer2Position = 0;
        this.lastPlayerPosition = { player1: 0, player2: 0 };
        this.isRunning = true;

        this.ingame_modal = null;

        console.log("PongGame Initialized!");
        this.init();
    }

    setupRenderer() {
        this.board = document.getElementById("board");
        if (!this.board) {
            console.error("❌ 'board' canvas not found!");
            return;
        }

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.board,
            antialias: true,
            alpha: true,
            physicallyCorrectLights: false,
            outputEncoding: THREE.sRGBEncoding,
            toneMapping: THREE.ReinhardToneMapping,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0
        });


        // this.renderer.setPixelRatio(2);
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        this.renderer.setSize(this.board.clientWidth, this.board.clientHeight, false);

        ///////////////////////////// this here  influences the   game window ////////////////////
        //this.renderer.setPixelRatio(window.devicePixelRatio);
        //this.renderer.setSize(this.board.clientWidth, this.board.clientHeight);
        ///////////////////////////////////////////////////////////////////////////////////// 
        this.renderer.shadowMap.enabled = true;
        const colors = {
            1: "#0A001E",
            2: "#001700",
            3: "#2299FF",
            4: "#00000F"
        };
        this.renderer.setClearColor(colors[this.gameMap] || "#000000");
    }

    init() {
        this.setupCamera();
        this.setupLighting();
        this.setupGameElements();
        this.setupGlowingGrid();
        this.setupControls();
        this.setupScoreboard();
        this.setupSocketListeners();

        this.animate();
    }

    setupSocketListeners() {
        this.socket.addEventListener('message', (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'game_update') {
                this.targetBallPosition.x = data.ball.x;
                this.targetBallPosition.y = data.ball.y;
                this.ballVelocity = data.ballVelocity;
                this.player1Score = data.player1Score;
                this.player2Score = data.player2Score;
                this.updateScoreboard();
            }
    
            if (data.type === 'player_move') {
                if (data.player === 'player1') {
                    this.targetPlayer1Position = data.position;
                } else {
                    this.targetPlayer2Position = data.position;
                }
            }
    
            if (data.type === 'end_game') {
                this.handleEndGame();
            }
    
            if (data.type === 'player_warning') {
                this.handlePlayerWarning(data);
            }
    
            if (data.type === 'resume_game') {
                this.handleResumeGame(data);
            }
        });
    }

    async handleEndGame() {
        await this.wait(1200);
        this.cleanup();
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    setupCamera() {
        const fov = 80;
        // const aspect = window.innerWidth / window.innerHeight;
        const aspect = this.board.clientWidth / this.board.clientHeight;
        const near = 0.1;
        const far = 1000;
        // Player 2 Camera
        this.player2Camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.player2Camera.position.set(this.camPos, 0, 3);
        this.player2Camera.rotation.set(0.0, 1, 1.57);
        // Player 1 Camera
        this.player1Camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.player1Camera.position.set(-this.camPos, 0, 3);
        this.player1Camera.rotation.set(0, -1, -1.57);
        // Top view
        this.topCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.topCamera.position.set(0, 0, 4);
        this.topCamera.rotation.set(0, 0, 0);
    }

    setupLighting() {

        if (this.gameMap == 1) {
            this.ambientLight = new THREE.AmbientLight(0x5500AA, 1);
            this.scene.add(this.ambientLight);
            this.spotLight = new THREE.SpotLight(0xFFFFFF, 100, 100, 0.6, 1);
            this.spotLight.position.set(0, 0, 10);
            this.spotLight.castShadow = true;
            this.scene.add(this.spotLight);
        }
        if (this.gameMap == 2) {
            this.ambientLight = new THREE.AmbientLight(0x5500AA, 1);
            this.scene.add(this.ambientLight);
            this.spotLight = new THREE.SpotLight(0xFFFFFF, 100, 100, 0.6, 1);
            this.spotLight.position.set(0, 0, 10);
            this.spotLight.castShadow = true;
            this.scene.add(this.spotLight);
        }
        if (this.gameMap == 3) {
            this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
            this.scene.add(this.ambientLight);
            this.spotLight = new THREE.SpotLight(0xFF9999, 700, 1000, 0.9, 1);
            this.spotLight.position.set(0, 0, 10);
            this.spotLight.castShadow = true;
            this.scene.add(this.spotLight);
        }
        if (this.gameMap == 4) {
            this.ambientLight = new THREE.AmbientLight(0x5500AA, 1);
            this.scene.add(this.ambientLight);
            this.spotLight = new THREE.SpotLight(0xFFFFFF, 100, 100, 0.6, 1);
            this.spotLight.position.set(0, 0, 10);
            this.spotLight.castShadow = true;
            this.scene.add(this.spotLight);
        }
    }

    setupGameElements() {
        this.setupPaddles();
        if (this.gameMap == 3) {
            this.setupWallsTextured();
        } else {
            this.setupWalls();
        }
        this.setupSquareBall();
        this.resetBall();
        const starField = this.generateRotatingStarfield();
        if (this.gameMap == 1) {
            const GameField = this.setupGlowingGrid();
            this.scene.add(GameField);
            this.scene.add(starField);
        }
        if (this.gameMap == 2) {
            const GameField = this.setupGlowingGrid();
            this.scene.add(GameField);
            this.scene.add(starField);
        }
        if (this.gameMap == 3) {
            const footBallField = this.createFootballField();
            const grass = this.createFootballGrass();
            this.scene.add(grass);
            this.scene.add(footBallField);
            this.scene.add(starField);
        }
        if (this.gameMap == 4) {
            const hexaGrid = this.createHexagonGrid();
            this.scene.add(starField);
            this.scene.add(hexaGrid);
        }
    }

    generateRotatingStarfield(starCount = 500, radius = 15, brightnessVariation = 0.5, sizeVariation = 0.07) {
        const fieldGroup = new THREE.Group();

        for (let i = 0; i < starCount; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            const distance = radius + (Math.random() - 0.5) * 2;
            const pos = new THREE.Vector3(
                distance * Math.sin(phi) * Math.cos(theta),
                distance * Math.sin(phi) * Math.sin(theta),
                distance * Math.cos(phi)
            );
            // Star brightness variation
            const brightness = Math.random() * brightnessVariation + 0.1;
            const starMaterial = new THREE.MeshBasicMaterial({ color: `rgb(${brightness * 255},${brightness * 255},${brightness * 255})` });
            // Star size variation
            const starSize = Math.random() * sizeVariation + 0.03;
            const starGeometry = new THREE.SphereGeometry(starSize, 4, 4);
            const star = new THREE.Mesh(starGeometry, starMaterial);
            star.position.copy(pos);
            fieldGroup.add(star);
        }
        this.starfield = fieldGroup;
        return fieldGroup;
    }


    setupPaddles() {

        if (this.gameMap == 1) {
            const paddleMaterial = new THREE.MeshStandardMaterial({ color: "#FF00FF" });
            const paddleGeometry = new THREE.BoxGeometry(this.overallHight, this.paddleLenght, this.overallHight);
            this.leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.leftPaddle.position.set(-this.playerPos, 0, 0);
            this.rightPaddle.position.set(this.playerPos, 0, 0);
            this.scene.add(this.leftPaddle, this.rightPaddle);
        }
        if (this.gameMap == 2) {
            const paddleMaterial = new THREE.MeshStandardMaterial({
                color: "#FFFFFF",
                emissive: "#990099",
                emissiveIntensity: 1.5,
                metalness: 0.2,
                roughness: 0.3
            });
            const paddleGeometry = new THREE.BoxGeometry(this.overallHight, this.paddleLenght, this.overallHight);
            this.leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.leftPaddle.position.set(-this.playerPos, 0, 0);
            this.rightPaddle.position.set(this.playerPos, 0, 0);
            this.scene.add(this.leftPaddle, this.rightPaddle);
        }
        if (this.gameMap == 3) {
            const paddleMaterial = new THREE.MeshStandardMaterial({ color: "#FF99FF" });
            const paddleGeometry = new THREE.BoxGeometry(this.overallHight, this.paddleLenght, this.overallHight);
            this.leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.leftPaddle.position.set(-this.playerPos, 0, 0);
            this.rightPaddle.position.set(this.playerPos, 0, 0);
            this.scene.add(this.leftPaddle, this.rightPaddle);
        }
        if (this.gameMap == 4) {
            const paddleMaterial = new THREE.MeshStandardMaterial({ color: "#FFFFFFF" });
            const paddleGeometry = new THREE.BoxGeometry(this.overallHight, this.paddleLenght, this.overallHight);
            this.leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.leftPaddle.position.set(-this.playerPos, 0, 0);
            this.rightPaddle.position.set(this.playerPos, 0, 0);
            this.scene.add(this.leftPaddle, this.rightPaddle);
        }
    }

    setupSquareBall() {
        if (this.gameMap == 1) {
            const squareMaterial = new THREE.MeshStandardMaterial({
                color: "#FFFFFF",
                emissive: "#00FFFF",
                emissiveIntensity: 1.0,
                //metalness: 1.0,
                roughness: 0.1
            });
            const squareGeometry = new THREE.BoxGeometry(this.ballSize, this.ballSize, this.ballSize);
            this.ball = new THREE.Mesh(squareGeometry, squareMaterial);
            this.scene.add(this.ball);
        } else {
            this.createSoccerBall();
        }
    }

    //BAll Creation only used in the map 2 3 e 4  map 1 uses square
    createSoccerBall() {
        const radius = this.ballSize / 2;
        const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
        if (this.gameMap == 3) {
            this.ballMaterial = new THREE.MeshStandardMaterial({ color: "#FFFFFF" });
        }
        if (this.gameMap == 4) {
            this.ballMaterial = new THREE.MeshStandardMaterial({
                color: "#FFFFFF",
                emissive: "#0F4FFF",
                emissiveIntensity: 2.5
            });
        } else {
            this.ballMaterial = new THREE.MeshStandardMaterial({
                color: "#FFFFFF",
                emissive: "#00FFFF"
            });
        }
        this.ball = new THREE.Mesh(sphereGeometry, this.ballMaterial);
        this.ball.castShadow = true;
        this.ball.receiveShadow = true;
        this.scene.add(this.ball);
    }

    setupWalls() {
        if (this.gameMap == 1 || this.gameMap == 2) {
            const wallMaterial = new THREE.MeshStandardMaterial({
                color: "#00FF00",
                transparent: true,
                opacity: 1,
                roughness: 0.1
            });
            this.topWall = new THREE.Mesh(new THREE.BoxGeometry(this.fieldLength, this.wallHightness, this.wallThickness), wallMaterial);
            this.bottomWall = new THREE.Mesh(new THREE.BoxGeometry(this.fieldLength, this.wallHightness, this.wallThickness), wallMaterial);
            this.topWall.position.set(0, this.wallSidePos, 0);
            this.bottomWall.position.set(0, -this.wallSidePos, 0);
            this.scene.add(this.topWall, this.bottomWall);
        }
        if (this.gameMap == 4) {
            const wallMaterial = new THREE.MeshStandardMaterial({
                color: "#3F3FFF",
                opacity: 1,
                roughness: 0.1
            });
            this.topWall = new THREE.Mesh(new THREE.BoxGeometry(this.fieldLength, this.wallHightness, this.wallThickness), wallMaterial);
            this.bottomWall = new THREE.Mesh(new THREE.BoxGeometry(this.fieldLength, this.wallHightness, this.wallThickness), wallMaterial);
            this.topWall.position.set(0, this.wallSidePos, 0);
            this.bottomWall.position.set(0, -this.wallSidePos, 0);
            this.scene.add(this.topWall, this.bottomWall);
        }
    }

    setupWallsTextured() {
        const textureLoader = new THREE.TextureLoader();
        const wallTexture = textureLoader.load("./assets/textures/42porto.png");
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(15, 1);
        const wallMaterial = new THREE.MeshStandardMaterial({
            map: wallTexture,
            color: "#559988",
        });

        this.topWall = new THREE.Mesh(new THREE.BoxGeometry(this.fieldLength, this.wallHightness, this.wallThickness), wallMaterial);
        this.bottomWall = new THREE.Mesh(new THREE.BoxGeometry(this.fieldLength, this.wallHightness, this.wallThickness), wallMaterial);
        this.topWall.position.set(0, this.wallSidePos - 0.03, 0);
        this.bottomWall.position.set(0, -this.wallSidePos + 0.03, 0);
        this.scene.add(this.topWall, this.bottomWall);
        this.bottomWall.rotation.x = 0.8;
        this.topWall.rotation.x = -0.8;
        this.bottomWall.rotation.y = Math.PI;
    }

    setupGlowingGrid() {
        if (this.gameMap == 4) {
            this.gridMaterial = new THREE.LineBasicMaterial({ color: "#FFFFFF", linewidth: this.lineGirth });
        } else {
            this.gridMaterial = new THREE.LineBasicMaterial({ color: "#00DF00", linewidth: this.lineGirth });
        }

        const gridWidth = this.fieldLength;
        const gridHeight = this.fieldWidth;
        const gridSpacing = this.gridDensity;
        const fieldGroup = new THREE.Group();

        for (let i = -gridWidth / 2; i <= gridWidth / 2; i += gridSpacing) {
            const vertPoints = [new THREE.Vector3(i, -gridHeight / 2, 0), new THREE.Vector3(i, gridHeight / 2, 0)];
            const vertGeometry = new THREE.BufferGeometry().setFromPoints(vertPoints);
            fieldGroup.add(new THREE.Line(vertGeometry, this.gridMaterial));
        }

        for (let i = -gridHeight / 2; i <= gridHeight / 2; i += gridSpacing) {
            const horizPoints = [new THREE.Vector3(-gridWidth / 2, i, 0), new THREE.Vector3(gridWidth / 2, i, 0)];
            const horizGeometry = new THREE.BufferGeometry().setFromPoints(horizPoints);
            fieldGroup.add(new THREE.Line(horizGeometry, this.gridMaterial));
        }
        fieldGroup.position.z = -this.fieldOffset;
        return fieldGroup;
    }

    resetBall() {
        this.ball.position.set(0, 0, 0);
        this.ballVelocity = { x: (Math.random() > 0.5 ? 1 : -1) * 0.05, y: (Math.random() - 0.5) * 0.1 };
    }


    checkPaddleCollision(paddle) {
        const paddleWidth = this.overallHight;
        const paddleHeight = this.paddleLenght;
        const ballSize = this.ballSize;
        //paddle hitbox
        const paddleLeft = paddle.position.x - paddleWidth / 2;
        const paddleRight = paddle.position.x + paddleWidth / 2;
        const paddleTop = paddle.position.y + paddleHeight / 2;
        const paddleBottom = paddle.position.y - paddleHeight / 2;
        //ball hitbox
        const ballLeft = this.ball.position.x - ballSize / 2;
        const ballRight = this.ball.position.x + ballSize / 2;
        const ballTop = this.ball.position.y + ballSize / 2;
        const ballBottom = this.ball.position.y - ballSize / 2;
        if (
            ballRight >= paddleLeft &&
            ballLeft <= paddleRight &&
            ballTop >= paddleBottom &&
            ballBottom <= paddleTop
        ) {
            this.ballVelocity.x *= -1.1;
            const impactPoint = (this.ball.position.y - paddle.position.y) / (paddleHeight / 2);
            this.ballVelocity.y += impactPoint * 0.1;
        }
    }

    createHexagon(size, opacity) {
        const hexGeometry = new THREE.CircleGeometry(size, 6); // Hexagon shape
        const edges = new THREE.EdgesGeometry(hexGeometry);
        const material = new THREE.LineBasicMaterial({ color: "#4440FF", opacity: 0.8, transparent: true });
        const hexagon = new THREE.LineSegments(edges, material);
        return hexagon;
    }

    createHexagonGrid(hexSize = 0.3, hexSpacing = 0.01) {
        const fieldGroup = new THREE.Group();
        let cols = Math.ceil(this.fieldLength / (hexSize * Math.sqrt(3) + hexSpacing));
        let rows = Math.floor(this.fieldWidth / (hexSize * 2 + hexSpacing));
        let totalWidth = cols * (hexSize * Math.sqrt(3) + hexSpacing);
        let totalHeight = rows * (hexSize * 2 + hexSpacing);
        let xOffset = -totalWidth / 2;
        let yOffset = -totalHeight / 2;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                let hex = this.createHexagon(hexSize, 0.7);
                hex.position.x = j * (hexSize * Math.sqrt(3)) + xOffset;
                hex.position.y = i * (hexSize * 2) + yOffset + 0.18;
                if (j % 2 !== 0) {
                    hex.position.y += (hexSize);
                }
                hex.position.z = -this.fieldOffset;
                fieldGroup.add(hex);
            }
        }
        this.hexGrid = fieldGroup;
        fieldGroup.position.z = -this.fieldOffset;
        fieldGroup.position.x = 0.35;
        return fieldGroup;
    }

    createFootballField() {
        const fieldGroup = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({ color: "#FFFFFF" });
        const boundaryPoints = [
            new THREE.Vector3(-this.fieldLength / 2, -this.fieldWidth / 2, 0.01),
            new THREE.Vector3(this.fieldLength / 2, -this.fieldWidth / 2, 0.01),
            new THREE.Vector3(this.fieldLength / 2, this.fieldWidth / 2, 0.01),
            new THREE.Vector3(-this.fieldLength / 2, this.fieldWidth / 2, 0.01),
            new THREE.Vector3(-this.fieldLength / 2, -this.fieldWidth / 2, 0.01)
        ];
        const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
        const boundaryLines = new THREE.Line(boundaryGeometry, lineMaterial);
        fieldGroup.add(boundaryLines);
        const midLinePoints = [
            new THREE.Vector3(0, -this.fieldWidth / 2, 0.01),
            new THREE.Vector3(0, this.fieldWidth / 2, 0.01)
        ];
        const midLineGeometry = new THREE.BufferGeometry().setFromPoints(midLinePoints);
        const midLine = new THREE.Line(midLineGeometry, lineMaterial);
        fieldGroup.add(midLine);
        const centerCircleGeometry = new THREE.CircleGeometry(0.8, 32);
        const centerCircleEdges = new THREE.EdgesGeometry(centerCircleGeometry);
        const centerCircle = new THREE.LineSegments(centerCircleEdges, lineMaterial);
        centerCircle.position.set(0, 0, 0.01);
        fieldGroup.add(centerCircle);
        const goalWidth = this.fieldWidth;
        const goalDepth = 0.4;
        const leftGoalPoints = [
            new THREE.Vector3(-this.fieldLength / 2, -goalWidth / 2, 0.01),
            new THREE.Vector3(-this.fieldLength / 2 - goalDepth, -goalWidth / 2, 0.01),
            new THREE.Vector3(-this.fieldLength / 2 - goalDepth, goalWidth / 2, 0.01),
            new THREE.Vector3(-this.fieldLength / 2, goalWidth / 2, 0.01)
        ];
        const rightGoalPoints = [
            new THREE.Vector3(this.fieldLength / 2, -goalWidth / 2, 0.01),
            new THREE.Vector3(this.fieldLength / 2 + goalDepth, -goalWidth / 2, 0.01),
            new THREE.Vector3(this.fieldLength / 2 + goalDepth, goalWidth / 2, 0.01),
            new THREE.Vector3(this.fieldLength / 2, goalWidth / 2, 0.01)
        ];

        const leftGoalGeometry = new THREE.BufferGeometry().setFromPoints(leftGoalPoints);
        const leftGoal = new THREE.Line(leftGoalGeometry, lineMaterial);
        fieldGroup.add(leftGoal);

        const rightGoalGeometry = new THREE.BufferGeometry().setFromPoints(rightGoalPoints);
        const rightGoal = new THREE.Line(rightGoalGeometry, lineMaterial);
        fieldGroup.add(rightGoal);
        fieldGroup.position.z = -this.fieldOffset;
        return fieldGroup;
    }

    generateGrassTexture(width = 1024, height = 1024, scale = 100) {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let noise = (Math.random() - 0.5) * scale;
                let green = 90 + noise;
                let r = 10 + noise * 0.3;
                let b = 10 + noise * 0.3;

                ctx.fillStyle = `rgb(${r}, ${green}, ${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        return texture;
    }

    createFootballGrass() {
        const grassGroup = new THREE.Group();
        const grassTexture = this.generateGrassTexture();
        const grassMaterial = new THREE.MeshStandardMaterial({
            map: grassTexture,
            transparent: true,
            opacity: 0.98,
            side: THREE.DoubleSide
        });
        const grassGeometry = new THREE.PlaneGeometry(this.fieldLength, this.fieldWidth);
        const grassMesh = new THREE.Mesh(grassGeometry, grassMaterial);
        grassMesh.position.z = -this.fieldOffset;
        grassGroup.add(grassMesh);
        return grassGroup;
    }

    setupScoreboard() {
        // Ensure board exists
        if (!this.board) {
            console.error("❌ Board element not found for scoreboard!");
            return;
        }

        // Create the scoreboard container
        this.scoreboard = document.createElement("div");
        this.scoreboard.style.position = "absolute";
        this.scoreboard.style.top = "5px"; // Keep inside board
        this.scoreboard.style.left = "50%";
        this.scoreboard.style.transform = "translateX(-50%)"; // Center it
        this.scoreboard.style.fontSize = "24px";
        this.scoreboard.style.fontWeight = "bold";
        this.scoreboard.style.color = "green";
        // this.scoreboard.style.background = "rgba(0, 0, 0, 0.5)";
        this.scoreboard.style.padding = "4px 30px";
        this.scoreboard.style.borderRadius = "4px";
        this.scoreboard.style.textAlign = "center";
        this.scoreboard.style.zIndex = "10";

        // Create Player 1 and Player 2 score spans
        this.player1ScoreText = document.createElement("span");
        this.player1ScoreText.textContent = this.player1Name + " " + this.player1Score;

        this.scoreSeparator = document.createElement("span");
        this.scoreSeparator.textContent = " - ";
        this.scoreSeparator.style.margin = "0px";

        this.player2ScoreText = document.createElement("span");
        this.player2ScoreText.textContent = this.player2Score + " " + this.player2Name;

        // Append elements
        this.scoreboard.appendChild(this.player1ScoreText);
        this.scoreboard.appendChild(this.scoreSeparator);
        this.scoreboard.appendChild(this.player2ScoreText);

        // Attach scoreboard inside the board container
        this.board.parentElement.appendChild(this.scoreboard);
    }

    // Function to update the scoreboard when a player scores
    updateScoreboard() {
        this.player1ScoreText.textContent = this.player1Name + " " + this.player1Score;
        this.player2ScoreText.textContent = this.player2Score + " " + this.player2Name;
    }


    ////////////////CONTROLS AND CAMERA! //////////////////////////////////
    ////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////

    setupControls() {
        window.addEventListener("keydown", (e) => {
            this.keys[e.key] = true;
            if (e.key === "c") {
                // Toggle between the player's camera and the top view
                this.currentCamera = this.currentCamera === "topCamera" ? (this.player === "player1" ? "player1Camera" : "player2Camera") : "topCamera";
            }
        });
        window.addEventListener("keyup", (e) => (this.keys[e.key] = false));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.addEventListener('popstate', this.handlePopState.bind(this));

    }

    async handleBeforeUnload(event) {
        this.sendWarningToOpponent();
        this.forfeitGame();
    }

    async handlePopState(event) {
        this.sendWarningToOpponent();
        this.forfeitGame();
    }

    sendWarningToOpponent() {
        this.socket.send(JSON.stringify({
            type: 'player_warning',
            user: this.user,
            game_group: this.game_group,
        }));
        this.isRunning = false; // Pause the game
    }

    sendResumeToOpponent() {
        this.socket.send(JSON.stringify({
            type: 'resume_game',
            user: this.user,
            game_group: this.game_group,
        }));
        this.isRunning = true; // Resume the game
    }

    handlePlayerWarning(data) {
        this.ingame_modal = new MessageModal(MessageType.ERROR);
        this.ingame_modal.show(`${data.user} gave up`, "Warning");
        this.isRunning = false; // Pause the game
    }

    handleResumeGame(data) {
        this.isRunning = true; // Resume the game
    }

    updatePaddles() {
        const paddleLimit = this.fieldWidth / 2 - this.paddleLenght / 2; // Limit paddles within field bounds

        if (this.currentCamera === "topCamera") {
            // Controls for top view
            if (this.player === "player1") {
                if (this.keys["ArrowUp"] && this.leftPaddle.position.y < paddleLimit) {
                    this.targetPlayer1Position += 0.1;
                }
                if (this.keys["ArrowDown"] && this.leftPaddle.position.y > -paddleLimit) {
                    this.targetPlayer1Position -= 0.1;
                }
            } else {
                if (this.keys["ArrowUp"] && this.rightPaddle.position.y < paddleLimit) {
                    this.targetPlayer2Position += 0.1;
                }
                if (this.keys["ArrowDown"] && this.rightPaddle.position.y > -paddleLimit) {
                    this.targetPlayer2Position -= 0.1;
                }
            }
        } else {
            // Controls for player view
            if (this.player === "player1") {
                if (this.keys["ArrowLeft"] && this.leftPaddle.position.y < paddleLimit) {
                    this.targetPlayer1Position += 0.1;
                }
                if (this.keys["ArrowRight"] && this.leftPaddle.position.y > -paddleLimit) {
                    this.targetPlayer1Position -= 0.1;
                }
            } else {
                if (this.keys["ArrowLeft"] && this.rightPaddle.position.y < paddleLimit) {
                    this.targetPlayer2Position -= 0.1;
                }
                if (this.keys["ArrowRight"] && this.rightPaddle.position.y > -paddleLimit) {
                    this.targetPlayer2Position += 0.1;
                }
            }
        }

        // Interpolate paddle positions
        this.leftPaddle.position.y += (this.targetPlayer1Position - this.leftPaddle.position.y) * 0.3;
        this.rightPaddle.position.y += (this.targetPlayer2Position - this.rightPaddle.position.y) * 0.3;

        // Send paddle position only if it has changed
        const paddlePosition = this.player === "player1" ? this.leftPaddle.position.y : this.rightPaddle.position.y;
        if (this.lastPlayerPosition[this.player] !== paddlePosition) {
            this.sendPaddlePosition(paddlePosition);
            this.lastPlayerPosition[this.player] = paddlePosition;
        }
    }

    updateBall() {
        // Interpolate ball position for smooth movement
        
        this.ball.position.x += (this.targetBallPosition.x - this.ball.position.x) * 0.7;
        this.ball.position.y += (this.targetBallPosition.y - this.ball.position.y) * 0.7;
        
        // Throttle sending ball position
        const now = Date.now();
        if (now - this.lastSentTime > 100) {
            this.sendBallPosition();
            this.lastSentTime = now;
            console.log(now);
        }
    
        
        // Check for game over
        if (this.player1Score >= 5 || this.player2Score >= 5) {
            console.log("Game Over!");
            if (this.player1Score >= 5)
                this.stopGame(this.player1Name);
            else
                this.stopGame(this.player2Name);
        }

        // Check for paddle collisions
        this.checkPaddleCollision(this.leftPaddle);
        this.checkPaddleCollision(this.rightPaddle);
    }

    sendBallPosition() {
        this.socket.send(JSON.stringify({
            type: 'game_update',
            user: this.user,
            ball: { x: this.ball.position.x, y: this.ball.position.y },
            ballVelocity: this.ballVelocity,
            game_group: this.game_group,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
        }));
    }

    sendPaddlePosition() {
        const paddlePosition = this.player === "player1" ? this.leftPaddle.position.y : this.rightPaddle.position.y;
        this.socket.send(JSON.stringify({
            type: 'player_move',
            user: this.user,
            player: this.player,
            game_group: this.game_group,
            position: paddlePosition
        }));
    }

    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());
        this.updateBall();
        this.updatePaddles();

        const camera = this[this.currentCamera];
        this.renderer.render(this.scene, camera);

        if (this.starfield && this.gameMap == 4) {
            this.starfield.rotation.y += 0.005;
            this.starfield.rotation.x += 0.0035;
        } else {
            this.starfield.rotation.y += 0.0003;
            this.starfield.rotation.x += 0.0003;
        }
    }

    cleanup() {
        // Perform any necessary cleanup here
        this.isRunning = false;
        window.removeEventListener("keydown", this.handleKeyDown);
        window.removeEventListener("keyup", this.handleKeyUp);
        window.removeEventListener("keyup", (e) => (this.keys[e.key] = false));
        window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.removeEventListener('popstate', this.handlePopState.bind(this));
        // Remove other event listeners, stop animations, etc.
        renderPage("home");
    }

    stopGame(winner) {
        this.displayEndGameMessage();
        console.log(`${winner} wins the game!`);
        this.socket.send(JSON.stringify({
            type: 'end_game',
            user: localStorage.getItem("username"),
            game_group: this.game_group,
            player1: this.player1,
            player2: this.player2,
            player1Score: this.player1Score,
            player2Score: this.player2Score,
            winner: winner
        }));
        this.cleanup();
    }


    forfeitGame() {
        const forfeitingPlayer = this.user === this.player1Name ? "player1" : "player2";

        this.socket.send(JSON.stringify({
            type: 'end_game',
            user: localStorage.getItem("username"),
            game_group: this.game_group,
            player1: this.player1,
            player2: this.player2,
            player1Score: forfeitingPlayer === "player1" ? 0 : 3,
            player2Score: forfeitingPlayer === "player2" ? 0 : 3,
        }));
        this.cleanup();
    }

    displayEndGameMessage() {
        if ((this.player1Score > this.player2Score) && (this.player === "player1")) {
            this.displayMessage("Winner!");
            return;
        } else if ((this.player2Score > this.player1Score) && this.player === "player2") {
            this.displayMessage("Winner!");
            return;
        } else {
            this.displayMessage("You Lost!");
        }
    }

    displayMessage(message) {
        const div = document.createElement("div");
        div.id = "endGameMessage";
        div.style.position = "absolute";
        div.style.top = "50%";
        div.style.left = "50%";
        div.style.transform = "translate(-50%, -50%)";
        div.style.color = "white";
        div.style.fontSize = "48px";
        div.style.fontFamily = "'Arial', sans-serif";
        div.style.padding = "20px";
        div.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        div.style.borderRadius = "10px";
        div.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
        div.style.textAlign = "center";
        div.style.animation = "fadeIn 1s ease-in-out";
        div.innerText = message;
        document.body.appendChild(div);

        const style = document.createElement("style");
        style.innerHTML = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        // Remove the message after 4 seconds
        setTimeout(() => {
            div.remove();
        }, 2000);
    }
}

/////    function called on main js ///////////////
async function startGame3d(data, socket) {
    const loadingOverlay = new LoadingOverlay();

    let selectedMap;
    try {
        loadingOverlay.show();
        const response = await fetchWithAuth("/api/users/selectedmap/");

        if (!response.ok) {
            throw new Error("Failed to fetch selected map");
        }

        const mapData = await response.json();
        console.log(mapData);

        selectedMap = mapData.map_number || 1;
        console.log("Selected map:", selectedMap);
    } catch {
        displayMessage("Failed to load profile data", MessageType.ERROR);
    } finally {
        loadingOverlay.hide();
    }
    console.log("Game starting...");
    const pongGame = new PongGame(data, socket, selectedMap);
}

//window.addEventListener("load", () => startGame(null, null, null));
