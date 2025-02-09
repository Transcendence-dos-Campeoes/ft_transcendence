class PongGame {
    constructor(data, socket, gameMap) {
        this.gameMap = gameMap;
        this.socket = socket;
        this.data = data;
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            physicallyCorrectLights: false,
            outputEncoding: THREE.sRGBEncoding
            //toneMapping: THREE.ReinhardToneMapping,
            //toneMapping: THREE.ACESFilmicToneMapping,
            //toneMappingExposure: 1.0,
        });
        this.scene = new THREE.Scene();



        //garantir alinhamento dos elementos e aspeto
        //try NOT CHANGE THIS ONE  RECOMENDED this.overallHight = 0.2;
        this.overallHight = 0.2;

        //field dimentions resizes all ellements acording to the passed values
        this.fieldLength = 8.5;
        this.fieldWidth = 5;
        this.fieldOffset = this.overallHight / 2;
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

        this.ballVelocity = { x: 0.05, y: 0.02 };
        this.keys = {};
        this.isRunning = true;
        console.log("PongGame Initialized!");
        this.init();
    }

    init() {
        //cameras ready for 2 playes
        this.setupCamera();

        //these elements should build the gameMap acording to the desired gameMap
        this.setupRenderer();
        this.setupLighting();
        this.setupGameElements();
        this.setupGlowingGrid();

        // controls should stay the same no matter the gameMAp
        this.setupControls();
        document.body.appendChild(this.renderer.domElement);
        //this.setupBackground();

        this.animate();
    }

    //cameras setup each player can have the exat same view of the field
    setupCamera() {
        const fov = 80;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 1000;
    
        // Player 1
        this.player1Camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.player1Camera.position.set(this.camPos, 0, 3);
        this.player1Camera.rotation.set(0.0, 1, 1.57);

        // Player 2
        this.player2Camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.player2Camera.position.set(-this.camPos, 0, 3);
        this.player2Camera.rotation.set(0, -1, -1.57);

        this.topCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.topCamera.position.set(0, 0, 4);
        this.topCamera.rotation.set(0, 0, 0);
        // this.topCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        // this.topCamera.position.set(1, 0, -0.2);
        // this.topCamera.rotation.set(0, 2.5, 0);
    }
    
    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        //this.renderer.setClearColor("#0A001E");
        this.renderer.setClearColor("#000F00"); 
    }

    // setupLighting() {
    //     this.ambientLight = new THREE.AmbientLight(0x5500AA, 1);
    //     this.scene.add(this.ambientLight);
    //     this.spotLight = new THREE.SpotLight(0xffffff, 2, 10, Math.PI / 4, 1);
    //     this.spotLight.position.set(0, 5, 5);
    //     this.spotLight.castShadow = true;
    //     this.scene.add(this.spotLight);
    // }



    //depending on the game mode we can send it here and create the desired ambient light
    setupLighting() {
        this.ambientLight = new THREE.AmbientLight(0x5500AA, 2); // Stronger purple ambient light
        //this.ambientLight = new THREE.AmbientLight(0xFFFFFF, 2); //white ambient light
        this.scene.add(this.ambientLight);
        
        // Add a soft glowing point light
        this.pointLight = new THREE.PointLight(0xFFFFFF, 8, 10);
        this.pointLight.position.set(0, 0, 5); // Light from above
        //this.pointLight.castShadow = true;
        this.scene.add(this.pointLight);
    }


    //all this functions should be accessing gameMap variable to generete the propper map
    setupGameElements() {
        this.setupPaddles();
        this.setupSquareBall();
        this.setupWalls();
        this.resetBall();
        //const GameField = this.generateTriangularGrid();
        const GameField1 = this.setupGlowingGrid(); 
        const GameField = this.generateRotatingStarfield();
        this.scene.add(GameField)
        this.scene.add(GameField1)

    }

    generateRotatingStarfield(starCount = 500, radius = 15, brightnessVariation = 0.5, sizeVariation = 0.07) {
        const fieldGroup = new THREE.Group();
        
        for (let i = 0; i < starCount; i++) {
            // Generate a random position on a sphere
            const phi = Math.acos(2 * Math.random() - 1); // Latitude
            const theta = Math.random() * Math.PI * 2; // Longitude
            const distance = radius + (Math.random() - 0.5) * 2; // Slight variation in distance
    
            const pos = new THREE.Vector3(
                distance * Math.sin(phi) * Math.cos(theta),
                distance * Math.sin(phi) * Math.sin(theta),
                distance * Math.cos(phi)
            );
    
            // Star brightness variation (randomized color intensity)
            const brightness = Math.random() * brightnessVariation + 0.1;
            const starMaterial = new THREE.MeshBasicMaterial({ color: `rgb(${brightness * 255},${brightness * 255},${brightness * 255})` });
    
            // Star size variation
            const starSize = Math.random() * sizeVariation + 0.03;
            const starGeometry = new THREE.SphereGeometry(starSize, 4, 4);
            
            const star = new THREE.Mesh(starGeometry, starMaterial);
            star.position.copy(pos);
            fieldGroup.add(star);
        }
    
        this.starfield = fieldGroup; // Store for animation
        return fieldGroup;
    }
    

    setupPaddles() {
        //const paddleMaterial = new THREE.MeshStandardMaterial({ color: "#FF00FF" });

        const paddleMaterial = new THREE.MeshStandardMaterial({
            color: "#FF55FF", // Base neon pink
            //emissive: "#FF00FF", // Glow effect
            //emissiveIntensity: 1.5, // Increase brightness
            metalness: 0.5,
            roughness: 0.2
        });
        
        const paddleGeometry = new THREE.BoxGeometry(0.15, 1.1, this.overallHight);

        this.leftPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
        this.rightPaddle = new THREE.Mesh(paddleGeometry, paddleMaterial);

        this.leftPaddle.position.set(-this.playerPos, 0, 0);
        this.rightPaddle.position.set(this.playerPos, 0, 0);

        this.scene.add(this.leftPaddle, this.rightPaddle);
    }

    setupSquareBall() {
        //const squareMaterial = new THREE.MeshStandardMaterial({ color: "#FFFFFF" });

        const squareMaterial = new THREE.MeshStandardMaterial({
            color: "#FFFFFF", // Base cyan
            emissive: "#00FFFF", // Add neon glow
            emissiveIntensity: 1.0, // Brighter than the paddles
            //metalness: 1.0,
            roughness: 0.1
        });
        
        const squareGeometry = new THREE.BoxGeometry(this.ballSize, this.ballSize, this.ballSize);
        this.ball = new THREE.Mesh(squareGeometry, squareMaterial);
        this.scene.add(this.ball);
    }

    //variaveis usadas diretamente para manter perpetivas
    setupWalls() {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: "#00FF00",
            transparent: true,
            opacity: 1,
            //metalness:1.0,
            roughness: 0.1
        });
        this.topWall = new THREE.Mesh(new THREE.BoxGeometry(this.fieldLength, this.wallHightness, this.wallThickness), wallMaterial);
        this.bottomWall = new THREE.Mesh(new THREE.BoxGeometry(this.fieldLength, this.wallHightness, this.wallThickness), wallMaterial);
        this.topWall.position.set(0, this.wallSidePos, 0);
        this.bottomWall.position.set(0, -this.wallSidePos, 0);
        this.scene.add(this.topWall, this.bottomWall);
    }

    setupGlowingGrid() {
        const gridMaterial = new THREE.LineBasicMaterial({ color: "#00DF00", linewidth: this.lineGirth});

        const gridWidth = this.fieldLength;
        const gridHeight = this.fieldWidth;
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
    
        // Define field bounds
        const fieldTop = this.fieldWidth / 2 - this.ballSize / 2;
        const fieldBottom = -this.fieldWidth / 2 + this.ballSize / 2;
        const fieldLeft = -this.fieldLength / 2;
        const fieldRight = this.fieldLength / 2;
    
        // Wall collisions (Ball bounces off the top/bottom walls)
        if (this.ball.position.y >= fieldTop || this.ball.position.y <= fieldBottom) {
            this.ballVelocity.y *= -1;
        }
    
        // Scoring (Ball passes player bounds)
        if (this.ball.position.x >= fieldRight) {
            this.player1Score++;
            console.log("Player 1 Scored! Score:", this.player1Score);
            this.resetBall();
        } else if (this.ball.position.x <= fieldLeft) {
            this.player2Score++;
            console.log("Player 2 Scored! Score:", this.player2Score);
            this.resetBall();
        }
    
        // Paddle collisions
        this.checkPaddleCollision(this.leftPaddle);
        this.checkPaddleCollision(this.rightPaddle);
    }
    

    checkPaddleCollision(paddle) {
        const paddleWidth = 0.15; // Keep consistent with paddle geometry
        const paddleHeight = 1.1; // Keep consistent with paddle geometry
        const ballSize = this.ballSize; // Ensure ball size consistency
    
        // Define paddle hitbox
        const paddleLeft = paddle.position.x - paddleWidth / 2;
        const paddleRight = paddle.position.x + paddleWidth / 2;
        const paddleTop = paddle.position.y + paddleHeight / 2;
        const paddleBottom = paddle.position.y - paddleHeight / 2;
    
        // Define ball hitbox
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
    
            // 🔥 Directional Deflection Calculation
            const impactPoint = (this.ball.position.y - paddle.position.y) / (paddleHeight / 2);
            this.ballVelocity.y += impactPoint * 0.1; // Increase based on where it hits
        }
    }
    



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


    generateTriangularGrid(gridWidth = this.fieldLength, gridHeight = this.fieldWidth, gridSpacing = 0.5) {
        const gridMaterial = new THREE.LineBasicMaterial({ color: "#00DF00" });
        const fieldGroup = new THREE.Group();
        
        const triHeight = Math.sqrt(3) * gridSpacing / 2; // Height of equilateral triangle
        const rowCount = Math.floor(gridHeight / triHeight);
        const colCount = Math.floor(gridWidth / gridSpacing);
    
        for (let row = 0; row < rowCount; row++) {
            for (let col = 0; col < colCount; col++) {
                const x = col * gridSpacing - gridWidth / 2;
                const y = row * triHeight - gridHeight / 2;
    
                const vertices = [
                    new THREE.Vector3(x, y, 0),
                    new THREE.Vector3(x + gridSpacing / 2, y + triHeight, 0),
                    new THREE.Vector3(x - gridSpacing / 2, y + triHeight, 0),
                    new THREE.Vector3(x, y, 0)
                ];
    
                const triGeometry = new THREE.BufferGeometry().setFromPoints(vertices);
                fieldGroup.add(new THREE.Line(triGeometry, gridMaterial));
            }
        }
    
        fieldGroup.position.z = -this.fieldOffset;
        return fieldGroup;
    }
    
    animate() {
        //this should take into account the2 players and the gmameMap
        requestAnimationFrame(() => this.animate());
        this.updateBall();
        //as long the gamemap dimensions are the same this shouldnt need to change
        this.updatePaddles();

        //for player 1
        this.renderer.render(this.scene, this.player2Camera);
        //for player 2
        //this.renderer.render(this.scene, this.player2Camera);
        //for top view
        //this.renderer.render(this.scene, this.topCamera);

        if (this.starfield) {
            this.starfield.rotation.y += 0.0003; // Slow horizontal movement
            this.starfield.rotation.x += 0.0001; // Slight vertical movement
        }
    }
}

function startGame(data, socket, gameMap) {
    console.log("Game starting...");
    new PongGame(data, socket, gameMap);
}

window.addEventListener("load", () => startGame(null, null, null));
