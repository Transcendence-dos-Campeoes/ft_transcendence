
class PongDuoGame {
    constructor(data, socket, gameMap, aiMode) {
        this.gameMap = 2;
        this.socket = socket;
        this.data = data;
        this.ballMaxAnglle = 60;

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

        this.isAIMode = aiMode;
        this.aiWorker = null;
        this.lastAIUpdateTime = 0;
        this.AI_UPDATE_INTERVAL = 1000;

        if (this.isAIMode) {
            this.setupAIWorker();
        }

        //scoreboard stuff and names needed to fill in the tables with correct names and scores
        this.player1Name = "";
        this.player2Name = "";

        //player stuff
        this.player1;
        this.player2;
        this.player1Camera;
        this.player2Camera;
        this.player1Score = 0;
        this.player2Score = 0;
        this.gridMaterial;
        this.ballMaterial;
        this.cameraEventListener;

        this.ballVelocity = { x: 0.05, y: 0.02 };
        this.isBallMovingRight = true;
        this.keys = {};
        this.isRunning = true;
        console.log("'Game' instancce Started!");
        this.init();
    }

    setupAIWorker() {
        this.aiWorker = new Worker('./assets/js/aiWorker.js');
        console.log('AI Worker initialized');
        this.keys = this.keys || {};
        this.aiWorker.onmessage = (e) => {
            if (e.data.type === 'key_press') {

                console.log('Received AI keys:', e.data.keys); // Debug log

                // Use the correct key names that match updatePaddles
                this.keys['ArrowUp'] = e.data.keys.ArrowUp;
                this.keys['ArrowDown'] = e.data.keys.ArrowDown;
            }
        };
    }

    setupRenderer() {
        this.board = document.getElementById("board");
        if (!this.board) {
            console.log("'board' canvas not found!");
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
        //sets render image quality
        this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
        this.renderer.setSize(this.board.clientWidth, this.board.clientHeight, false);
        this.renderer.shadowMap.enabled = true;
        const colors = {
            1: "#0A001E",
            2: "#001700",
            3: "#2299FF",
            4: "#00000F"
        };
        this.renderer.setClearColor(colors[this.gameMap] || "#000000");
    }

    setupCamera() {
        const fov = 82;
        const aspect = this.board.clientWidth / this.board.clientHeight;
        const near = 0.1;
        const far = 1000;
        // Player 1 Camera
        this.player1Camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.player1Camera.position.set(this.camPos, 0, 3);
        this.player1Camera.rotation.set(0.0, 1, 1.57);
        // Player 2 Camera
        this.player2Camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.player2Camera.position.set(-this.camPos, 0, 3);
        this.player2Camera.rotation.set(0, -1, -1.57);
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

    // Reset the ball to the center and changes state for next call
    resetBall() {
        this.ball.position.set(0, 0, 0);
        //x horizontal y vertical
        this.lastAIUpdateTime = 0;
        if (this.isBallMovingRight) {
            this.ballVelocity = { x: 0.05, y: 0 };
        } else {
            this.ballVelocity = { x: -0.05, y: 0 };
        }
        this.isBallMovingRight = !this.isBallMovingRight;
        if (this.isAIMode && this.aiWorker) {
            this.aiWorker.postMessage({
                type: 'ball_reset',
                ballPosition: {
                    x: this.ball.position.x,
                    y: this.ball.position.y
                },
                ballVelocity: this.ballVelocity,
                fieldHeight: this.fieldWidth,
                paddleY: this.rightPaddle.position.y
            });
        }
    }


    updateBall() {
        this.ball.position.x += this.ballVelocity.x;
        this.ball.position.y += this.ballVelocity.y;
        this.goalPosition = (this.fieldLength + 0.4) / 2;
        const fieldTop = this.fieldWidth / 2 - this.ballSize / 2;
        const fieldBottom = -this.fieldWidth / 2 + this.ballSize / 2;
        const fieldLeft = -(this.fieldLength + 0.5) / 2;
        const fieldRight = (this.fieldLength + 0.5) / 2;
        if (this.ball.position.y >= fieldTop || this.ball.position.y <= fieldBottom) {
            this.ballVelocity.y *= -1;
        }
        if (this.ball.position.x >= fieldRight) {
            this.player1Score++;
            console.log("Player 1 Scored! Score:", this.player1Score);
            this.updateScoreboard();
            this.resetBall();
        } else if (this.ball.position.x <= fieldLeft) {
            this.player2Score++;
            console.log("Player 2 Scored! Score:", this.player2Score);
            this.resetBall();
            this.updateScoreboard();
        }
        this.checkPaddleCollision(this.leftPaddle);
        this.checkPaddleCollision(this.rightPaddle);

        //this sends the ball position to the AI worker and directional velocity.
        //x horizontal y vertical

        if (this.isAIMode && this.aiWorker) {
            const currentTime = Date.now();
            //updates to 1 second intervals unless ball reset (new game)
            if (!this.lastAIUpdate || currentTime - this.lastAIUpdate >= 1000) {
                this.aiWorker.postMessage({
                    type: 'ball_update',
                    ballPosition: {
                        x: this.ball.position.x,
                        y: this.ball.position.y
                    },
                    ballVelocity: this.ballVelocity,
                    fieldHeight: this.fieldWidth,
                    paddleY: this.rightPaddle.position.y
                });
                this.lastAIUpdate = currentTime;
            }
        }
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

    ////////////// game elements creation functions

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
        if (!this.board) {
            console.log("loard element not found for scoreboard!");
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
        this.scoreboard.appendChild(this.player1ScoreText);
        this.scoreboard.appendChild(this.scoreSeparator);
        this.scoreboard.appendChild(this.player2ScoreText);
        this.board.parentElement.appendChild(this.scoreboard);
    }

    updateScoreboard() {
        this.player1ScoreText.textContent = this.player1Name + " " + this.player1Score;
        this.player2ScoreText.textContent = this.player2Score + " " + this.player2Name;
    }


    updatePaddles() {
        const paddleLimit = this.fieldWidth / 2 - 1.1 / 2;

        // Handle human player (left paddle)
        if (this.keys["w"] && this.leftPaddle.position.y < paddleLimit) {
            this.leftPaddle.position.y += 0.1;
        }
        if (this.keys["s"] && this.leftPaddle.position.y > -paddleLimit) {
            this.leftPaddle.position.y -= 0.1;
        }

        // Handle AI or human player (right paddle)
        if (this.keys["ArrowUp"] && this.rightPaddle.position.y < paddleLimit) {
            this.rightPaddle.position.y += 0.1;
        }
        if (this.keys["ArrowDown"] && this.rightPaddle.position.y > -paddleLimit) {
            this.rightPaddle.position.y -= 0.1;
        }
    }

    //Controls padles and keeps them inside the field. 
    // rotating camera views triggers movement switch of keys to adjust to view
    // updatePaddles() {
    //     let sideN = 1;
    //     const paddleLimit = this.fieldWidth / 2 - 1.1 / 2;

    //     if (this.isAIMode) {
    //         // Human player controls (left paddle)
    //         if (this.keys["w"] && this.leftPaddle.position.y < paddleLimit) {
    //             this.leftPaddle.position.y += 0.1;
    //         }
    //         if (this.keys["s"] && this.leftPaddle.position.y > -paddleLimit) {
    //             this.leftPaddle.position.y -= 0.1;
    //         }

    //         // AI controls (right paddle)
    //         if (this.keys["ArrowLeft"] && this.rightPaddle.position.y < paddleLimit) {
    //             this.rightPaddle.position.y += 0.1;
    //         }
    //         if (this.keys["ArrowRight"] && this.rightPaddle.position.y > -paddleLimit) {
    //             this.rightPaddle.position.y -= 0.1;
    //         }
    //         return;
    //     }
    //     ////
    //     if (this.currentCamera === this.topCamera) {
    //         if (this.keys["w"] && this.leftPaddle.position.y < paddleLimit) {
    //             this.leftPaddle.position.y += 0.1;
    //         }
    //         if (this.keys["s"] && this.leftPaddle.position.y > -paddleLimit) {
    //             this.leftPaddle.position.y -= 0.1;
    //         }
    //         if (this.keys["ArrowUp"] && this.rightPaddle.position.y < paddleLimit) {
    //             this.rightPaddle.position.y += 0.1;
    //         }
    //         if (this.keys["ArrowDown"] && this.rightPaddle.position.y > -paddleLimit) {
    //             this.rightPaddle.position.y -= 0.1;
    //         }
    //     } else {
    //         if (this.currentCamera === this.player1Camera) {
    //             if (this.keys["d"] && this.leftPaddle.position.y < paddleLimit) {
    //                 this.leftPaddle.position.y += 0.1 * sideN;
    //             }
    //             if (this.keys["a"] && this.leftPaddle.position.y > -paddleLimit) {
    //                 this.leftPaddle.position.y -= 0.1 * sideN;
    //             }
    //             if (this.keys["ArrowRight"] && this.rightPaddle.position.y < paddleLimit) {
    //                 this.rightPaddle.position.y += 0.1 * sideN;
    //             }
    //             if (this.keys["ArrowLeft"] && this.rightPaddle.position.y > -paddleLimit) {
    //                 this.rightPaddle.position.y -= 0.1 * sideN;
    //             }
    //             return;
    //         }
    //         if (this.keys["a"] && this.leftPaddle.position.y < paddleLimit) {
    //             this.leftPaddle.position.y += 0.1 * sideN;
    //         }
    //         if (this.keys["d"] && this.leftPaddle.position.y > -paddleLimit) {
    //             this.leftPaddle.position.y -= 0.1 * sideN;
    //         }
    //         if (this.keys["ArrowLeft"] && this.rightPaddle.position.y < paddleLimit) {
    //             this.rightPaddle.position.y += 0.1 * sideN;
    //         }
    //         if (this.keys["ArrowRight"] && this.rightPaddle.position.y > -paddleLimit) {
    //             this.rightPaddle.position.y -= 0.1 * sideN;
    //         }
    //     }
    // }

    setupControls() {
        window.addEventListener("keydown", (e) => (this.keys[e.key] = true));
        window.addEventListener("keyup", (e) => (this.keys[e.key] = false));
    }

    //press c to rotate between camera views
    cameraKeyControls() {
        if (!this.currentCamera) {
            this.currentCamera = this.topCamera;
        }
        if (!this.cameraEventListener) {
            this.cameraEventListener = (e) => {
                if (e.key === "c") {
                    if (this.currentCamera === this.topCamera) {
                        this.currentCamera = this.player1Camera;
                    } else if (this.currentCamera === this.player1Camera) {
                        this.currentCamera = this.player2Camera;
                    } else {
                        this.currentCamera = this.topCamera;
                    }
                }
            };
            window.addEventListener("keydown", this.cameraEventListener);
        }
    }

    //rotation of the starfield background
    starfieldBackgroudRotation() {
        if (this.starfield && this.gameMap == 4) {
            this.starfield.rotation.y += 0.005;
            this.starfield.rotation.x += 0.0035;
        } else {
            this.starfield.rotation.y += 0.0003;
            this.starfield.rotation.x += 0.0003;
        }
    }

    //class initialization

    init() {
        this.setupCamera();
        this.setupLighting();
        this.setupGameElements();
        this.setupGlowingGrid();
        this.setupControls();
        this.setupScoreboard();
        this.animate();
    }
    ////////  here is the main loop of the game    ///////////

    animate() {
        requestAnimationFrame(() => this.animate());
        //colisions and ball  position update
        this.updateBall();
        //players control each paddle here
        this.updatePaddles();
        //camera switch control and listeners
        this.cameraKeyControls();
        //renders scene and starfield rotation with selected camera from precious functions
        this.renderer.render(this.scene, this.currentCamera);
        this.starfieldBackgroudRotation();
    }
}

/////    function called on main js 
async function startGameDuo(data, socket, gameMap, aiMode) {
    console.log("Game starting...");
    new PongDuoGame(data, socket, gameMap, aiMode);
}


//need to create cleanup function for all ellements.
/*

These ones are window event listeners....
    this.cameraEventListener 
    this.keys


*/