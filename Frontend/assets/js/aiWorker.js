let lastUpdateTime = 0;
const UPDATE_INTERVAL = 1000; // Ball position update interval
const DECISION_INTERVAL = 30; // AI decision making interval
let lastDecisionTime = 0;
let lastKnownBallPosition = { x: 0, y: 0 };
let lastKnownBallVelocity = { x: 0, y: 0 };
let currentPaddlePosition = 0;
let targetPosition = 0;
let paddleVelocity = 0; // Tracks AI paddle movement speed

const rightPaddleX = 4.25; // AI paddle's x-position
let fieldHeight = 5; // Default value

self.onmessage = function (e) {
    if (e.data.type === 'ball_reset') {
        updateBallInfo(e.data);
        updateAIMovement();
    }

    if (e.data.type === 'ball_update') {
        updateBallInfo(e.data);
    }
};

function updateBallInfo(data) {
    lastKnownBallPosition = data.ballPosition;
    lastKnownBallVelocity = data.ballVelocity;
    currentPaddlePosition = data.paddleY;
    fieldHeight = data.fieldHeight; // Update field height

    lastUpdateTime = Date.now();
}

// Predict where the ball will reach the paddle, accounting for bounces
function calculateAIPaddlePosition() {
    const paddleLimit = fieldHeight / 2 - 1.1 / 2;
    let simulatedX = lastKnownBallPosition.x;
    let simulatedY = lastKnownBallPosition.y;
    let simulatedVelocityX = lastKnownBallVelocity.x;
    let simulatedVelocityY = lastKnownBallVelocity.y;

    if (simulatedVelocityX <= 0) {
        return (Math.random() - 0.5) * 0.2; // If ball moving away, stay near center
    }

    while (simulatedX < rightPaddleX) {
        simulatedX += simulatedVelocityX;
        simulatedY += simulatedVelocityY;

        // Handle wall bounces
        if (simulatedY >= fieldHeight / 2 || simulatedY <= -fieldHeight / 2) {
            simulatedVelocityY *= -1; // Reflect on wall collision
        }
    }

    // Apply reaction time randomness to make it more human-like
    const reactionError = (Math.random() - 0.5) * 0.3;
    const predictionError = (Math.random() - 0.5) * 0.1;
    let predictedY = simulatedY + reactionError + predictionError;

    return Math.max(-paddleLimit, Math.min(paddleLimit, predictedY)); // Clamp value
}

// Adjust movement toward the target position smoothly
function updateAIMovement() {
    const currentTime = Date.now();
    if (currentTime - lastDecisionTime < DECISION_INTERVAL) return;
    lastDecisionTime = currentTime;

    targetPosition = calculateAIPaddlePosition();

    let speedFactor = 0.08; // Base AI speed
    let maxSpeed = 0.15; // Maximum AI speed

    let difference = targetPosition - currentPaddlePosition;
    let acceleration = Math.min(Math.abs(difference) * 0.2, maxSpeed);

    if (difference > 0) {
        paddleVelocity = Math.min(paddleVelocity + acceleration, maxSpeed);
    } else if (difference < 0) {
        paddleVelocity = Math.max(paddleVelocity - acceleration, -maxSpeed);
    } else {
        paddleVelocity *= 0.8; // Slow down if no movement needed
    }

    // Simulate key presses for smooth movement
    const keys = {
        ArrowUp: paddleVelocity > speedFactor,
        ArrowDown: paddleVelocity < -speedFactor
    };

    self.postMessage({
        type: 'key_press',
        keys: keys
    });

    currentPaddlePosition += paddleVelocity; // Move paddle in simulation

    setTimeout(updateAIMovement, DECISION_INTERVAL); // Continue AI loop
}

// Start the AI movement loop
updateAIMovement();
