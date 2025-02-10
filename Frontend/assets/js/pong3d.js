

class PongGame {
    constructor(data, socket, gameMap) {
        this.gameMap = 3;
       this.socket = socket;
        this.data = data;
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            physicallyCorrectLights: false,
            outputEncoding: THREE.sRGBEncoding,
            toneMapping: THREE.ReinhardToneMapping,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.0
        });
        this.scene = new THREE.Scene();

        //garantir alinhamento dos elementos e aspeto
        //try NOT CHANGE THIS ONE  RECOMENDED this.overallHight = 0.2;
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
        this.playerPos =this.fieldLength / 2 +this.overallHight / 2;
        this.camPos = 6.5;
        this.topCamera;

        //player stuff
        this.player1;
        this.player2;
        this.player1Camera;
        this.player2Camera;
        this.player1Score = 0;
        this.player2Score = 0;
        this.gridMaterial;
        this.ballMaterial;

        this.ballVelocity = { x: 0.05, y: 0.02 };
        this.keys = {};
        this.isRunning = true;
        console.log("PongGame Initialized!");
        this.init();
    }

    init() {
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        this.setupGameElements();
        this.setupGlowingGrid();

        // controls should stay the same no matter the gameMAp
        this.setupControls();
        //document.body.appendChild(this.renderer.domElement);
        //this.setupBackground();

        this.setupScoreboard();

        this.animate();
    }

    //cameras setup each player 
    setupCamera() {
        const fov = 80;
        const aspect = window.innerWidth / window.innerHeight;
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
    
//when called acesses gameMap variable to set the render color
    // setupRenderer() {
    //     this.renderer.setSize(window.innerWidth, window.innerHeight);
    //     this.renderer.shadowMap.enabled = true;

    //     if(this.gameMap == 1){  
    //         this.renderer.setClearColor("#0A001E");
    //     }
    //     if(this.gameMap == 2){
    //         this.renderer.setClearColor("#001700");
    //     }
    //     if(this.gameMap == 3){  
    //         this.renderer.setClearColor("#2299FF");
    //     }
    //     if(this.gameMap == 4){
    //         this.renderer.setClearColor("#00000F");
    //     }
    // }

    setupRenderer() {
        // Get the existing canvas
        const canvas = document.getElementById("board");
    
        // Set canvas size to full window
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    
        // Create Three.js renderer and attach it to the existing canvas
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,  // ✅ Correctly assign the existing canvas
            antialias: true,
            alpha: true
        });
    
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
    
        // Set background color based on gameMap
        if (this.gameMap == 1) this.renderer.setClearColor("#0A001E");
        if (this.gameMap == 2) this.renderer.setClearColor("#001700");
        if (this.gameMap == 3) this.renderer.setClearColor("#2299FF");
        if (this.gameMap == 4) this.renderer.setClearColor("#00000F");
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
            //this.spotLight.rotation.set(0, 0, 0);
            this.scene.add(this.spotLight);
        } 
        if (this.gameMap == 4 ){
            this.ambientLight = new THREE.AmbientLight(0x5500AA, 1);
            this.scene.add(this.ambientLight);
            this.spotLight = new THREE.SpotLight(0xFFFFFF, 100, 100, 0.6, 1);
            this.spotLight.position.set(0, 0, 10);
            this.spotLight.castShadow = true;
            this.scene.add(this.spotLight);
        }
    }

    setupGameElements() {

        //sets player blocks up generates them 3D
        this.setupPaddles();

        
        if (this.gameMap == 3) {
            this.setupWallsTextured();
        } else {
            this.setupWalls();
        }
        
        //sets up the ball 3d Mesh but makes it a square for gameMaop 1 
        this.setupSquareBall();

        this.resetBall();

        //ADD field ad Skybox to the respective gameMap.
        const starField = this.generateRotatingStarfield();

        //each of the GameMaps hasits own field and stuff
        if(this.gameMap == 1){
            const GameField = this.setupGlowingGrid();
            this.scene.add(GameField);
            this.scene.add(starField);
        }
        if (this.gameMap == 2){
            const GameField = this.setupGlowingGrid();
            this.scene.add(GameField);
            this.scene.add(starField);
        }
        if(this.gameMap == 3) {
            const footBallField = this.createFootballField();
            const grass = this.createFootballGrass();
            this.scene.add(grass);
            this.scene.add(footBallField);
            this.scene.add(starField);
        }
        if(this.gameMap == 4){
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

        if (this.gameMap == 1){
            const paddleMaterial = new THREE.MeshStandardMaterial({ color: "#FF00FF" });
            const paddleGeometry = new THREE.BoxGeometry(this.overallHight, this.paddleLenght, this.overallHight);
            this.leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.leftPaddle.position.set(-this.playerPos, 0, 0);
            this.rightPaddle.position.set(this.playerPos, 0, 0);
            this.scene.add(this.leftPaddle, this.rightPaddle);
        }
        if (this.gameMap == 2){
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
        if (this.gameMap == 3){
            const paddleMaterial = new THREE.MeshStandardMaterial({ color: "#FF99FF" });
            const paddleGeometry = new THREE.BoxGeometry(this.overallHight, this.paddleLenght, this.overallHight);
            this.leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
            this.leftPaddle.position.set(-this.playerPos, 0, 0);
            this.rightPaddle.position.set(this.playerPos, 0, 0);
            this.scene.add(this.leftPaddle, this.rightPaddle);
        }
        if (this.gameMap == 4) {
            const paddleMaterial = new THREE.MeshStandardMaterial({color: "#FFFFFFF" });
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

    //variaveis usadas diretamente para manter perpetivas
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
        // Set texture properties
        wallTexture.wrapS = THREE.RepeatWrapping;
        wallTexture.wrapT = THREE.RepeatWrapping;
        wallTexture.repeat.set(15, 1); // Adjust tiling for better look
            const wallMaterial = new THREE.MeshStandardMaterial({
                map: wallTexture, // Apply the same texture
                color: "#559988", // Base color mix
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
            this.gridMaterial = new THREE.LineBasicMaterial({ color: "#FFFFFF", linewidth: this.lineGirth});
        } else {
            this.gridMaterial = new THREE.LineBasicMaterial({ color: "#00DF00", linewidth: this.lineGirth});
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

        // guarantee the grid is the base and aligned as floor
        fieldGroup.position.z = -this.fieldOffset;
        //this.scene.add(fieldGroup);
        return fieldGroup;
    }

    setupControls() {
        window.addEventListener("keydown", (e) => (this.keys[e.key] = true));
        window.addEventListener("keyup", (e) => (this.keys[e.key] = false));
    }

    resetBall() {
        this.ball.position.set(0, 0, 0);
        this.ballVelocity = { x: (Math.random() > 0.5 ? 1 : -1) * 0.05, y: (Math.random() - 0.5) * 0.1 };
    }

    updateBall() {
        this.ball.position.x += this.ballVelocity.x;
        this.ball.position.y += this.ballVelocity.y;

        // Goal positions lets the ball go slightly past the player
        this.goalPosition = (this.fieldLength + 0.4) / 2;
        // Define field bounds
        const fieldTop = this.fieldWidth / 2 - this.ballSize / 2;
        const fieldBottom = -this.fieldWidth / 2 + this.ballSize / 2;
        const fieldLeft = -(this.fieldLength + 0.5) / 2;
        const fieldRight = (this.fieldLength + 0.5) / 2;
    
        // Wall collisions (Ball bounces off the top/bottom walls)
        if (this.ball.position.y >= fieldTop || this.ball.position.y <= fieldBottom) {
            this.ballVelocity.y *= -1;
        }
    
        // Scoring (Ball passes player bounds)
        if (this.ball.position.x >= fieldRight) {
            this.player1Score++;
            console.log("Player 1 Scored! Score:", this.player1Score);
            this.updateScore();
            this.resetBall();
        } else if (this.ball.position.x <= fieldLeft) {
            this.player2Score++;
            this.updateScore();
            console.log("Player 2 Scored! Score:", this.player2Score);
            this.resetBall();
        }
    
        // Paddle collisions
        this.checkPaddleCollision(this.leftPaddle);
        this.checkPaddleCollision(this.rightPaddle);
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
    
        // Check for collision
        if (
            ballRight >= paddleLeft &&
            ballLeft <= paddleRight &&
            ballTop >= paddleBottom &&
            ballBottom <= paddleTop
        ) {
            // Ball bounced, adjust velocity
            this.ballVelocity.x *= -1.1; // Increase speed slightly
    
            //deflection Calculation
            const impactPoint = (this.ball.position.y - paddle.position.y) / (paddleHeight / 2);
            this.ballVelocity.y += impactPoint * 0.1;
        }
    }
    


//players controls ...
    updatePaddles() {
        const paddleLimit = this.fieldWidth / 2 - 1.1 / 2; // Limit paddles within field bounds
    
        // Player 1 Controls
        if (this.keys["w"] && this.leftPaddle.position.y < paddleLimit) {
            this.leftPaddle.position.y += 0.1;
        }
        if (this.keys["s"] && this.leftPaddle.position.y > -paddleLimit) {
            this.leftPaddle.position.y -= 0.1;
        }
    
        // Player 2 Controls
        if (this.keys["ArrowUp"] && this.rightPaddle.position.y < paddleLimit) {
            this.rightPaddle.position.y += 0.1;
        }
        if (this.keys["ArrowDown"] && this.rightPaddle.position.y > -paddleLimit) {
            this.rightPaddle.position.y -= 0.1;
        }
    }

    createHexagon(size, opacity) {
        const hexGeometry = new THREE.CircleGeometry(size, 6); // Hexagon shape
        const edges = new THREE.EdgesGeometry(hexGeometry);
        // const material = new THREE.LineBasicMaterial({ color: "#00DF00", opacity: opacity, transparent: true });
        const material = new THREE.LineBasicMaterial({ color: "#4440FF", opacity: 0.8, transparent: true });
        const hexagon = new THREE.LineSegments(edges, material);
        return hexagon;
    }
    
    createHexagonGrid(hexSize = 0.3, hexSpacing = 0.01) {
        const fieldGroup = new THREE.Group();
    
        // Calculate number of columns & rows based on field size
        let cols = Math.ceil(this.fieldLength / (hexSize * Math.sqrt(3) + hexSpacing));
        let rows = Math.floor(this.fieldWidth / (hexSize * 2 + hexSpacing));
    
        // Calculate total width and height of the grid
        let totalWidth = cols * (hexSize * Math.sqrt(3) + hexSpacing);
        let totalHeight = rows * (hexSize * 2 + hexSpacing);
    
        // Offset to center the grid
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
        //White Boundary Lines
        const lineMaterial = new THREE.LineBasicMaterial({ color: "#FFFFFF" });
        
        // Boundary Box
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
    
        //Midfield Line
        const midLinePoints = [
            new THREE.Vector3(0, -this.fieldWidth / 2, 0.01),
            new THREE.Vector3(0, this.fieldWidth / 2, 0.01)
        ];
        const midLineGeometry = new THREE.BufferGeometry().setFromPoints(midLinePoints);
        const midLine = new THREE.Line(midLineGeometry, lineMaterial);
        fieldGroup.add(midLine);
    
        //Center Circle
        const centerCircleGeometry = new THREE.CircleGeometry(0.8, 32);
        const centerCircleEdges = new THREE.EdgesGeometry(centerCircleGeometry);
        const centerCircle = new THREE.LineSegments(centerCircleEdges, lineMaterial);
        centerCircle.position.set(0, 0, 0.01);
        fieldGroup.add(centerCircle);
    
        //Goal Areas
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
    
        // Loop through every pixel to generate noise-based grass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Procedural noise effect: small color variations in green
                let noise = (Math.random() - 0.5) * scale; // Range from -scale to +scale
                let green = 90 + noise; // Base green color with noise variation
                let r = 10 + noise * 0.3; // Slight red tint variation
                let b = 10 + noise * 0.3; // Slight blue tint variation
    
                ctx.fillStyle = `rgb(${r}, ${green}, ${b})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping; // Ensures seamless tiling
        texture.repeat.set(1, 1); // Adjust tiling to match the field grid
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
        // Create scoreboard container
        this.scoreboard = document.createElement("div");
        this.scoreboard.style.position = "absolute";
        this.scoreboard.style.top = "20px";
        this.scoreboard.style.left = "50%";
        this.scoreboard.style.transform = "translateX(-50%)";
        this.scoreboard.style.fontSize = "36px";
        this.scoreboard.style.fontFamily = "Arial, sans-serif";
        this.scoreboard.style.fontWeight = "bold";
        this.scoreboard.style.color = "white";
        this.scoreboard.style.background = "rgba(0, 0, 0, 0.6)";
        this.scoreboard.style.padding = "10px 20px";
        this.scoreboard.style.borderRadius = "10px";
        this.scoreboard.style.textAlign = "center";
    
        // Create player 1 score
        this.player1ScoreText = document.createElement("span");
        this.player1ScoreText.textContent = this.player1Score;
    
        // Create separator "-"
        this.scoreSeparator = document.createElement("span");
        this.scoreSeparator.textContent = " - ";
        this.scoreSeparator.style.margin = "0 10px";
    
        // Create player 2 score
        this.player2ScoreText = document.createElement("span");
        this.player2ScoreText.textContent = this.player2Score;
    
        // Append elements
        this.scoreboard.appendChild(this.player1ScoreText);
        this.scoreboard.appendChild(this.scoreSeparator);
        this.scoreboard.appendChild(this.player2ScoreText);
        document.body.appendChild(this.scoreboard);
    }

    updateScore() {
        this.player1ScoreText.textContent = this.player1Score;
        this.player2ScoreText.textContent = this.player2Score;
    }
    
    
    animate() {
        //this should take into account the2 players and the gmameMap
        requestAnimationFrame(() => this.animate());
        this.updateBall();
        //as long the gamemap dimensions are the same this shouldnt need to change
        this.updatePaddles();

        //for player 1
        //this.renderer.render(this.scene, this.player2Camera);
        //for player 2
        this.renderer.render(this.scene, this.player2Camera);
        //for top view
        //this.renderer.render(this.scene, this.topCamera);

        if (this.starfield && this.gameMap == 4) {
            this.starfield.rotation.y += 0.005; // Slow horizontal movement
            this.starfield.rotation.x += 0.0035; // Slight vertical movement
        } else {
            this.starfield.rotation.y += 0.0003;
            this.starfield.rotation.x += 0.0003;
        }
    }
}

function startGame(data, socket, gameMap) {
    console.log("Game starting...");
    new PongGame(data, socket, gameMap);
}

//window.addEventListener("load", () => startGame(null, null, null));
