//board
let board;
let boardWidth = 500;
let boardHeight = 500;

let context;

//players
let playerWidth = 10;
let playerHeight = 50;
let playerVelocityY = 0;

let player1 = 
{  
    x : 10,
    y : boardHeight / 2,
    width : playerWidth,
    height : playerHeight,
    velocityY : playerVelocityY
}

let player2 = 
{  
    x : boardWidth - playerWidth - 10,
    y : boardHeight / 2,
    width : playerWidth,
    height : playerHeight,
    velocityY : playerVelocityY
}

//ball
let ballWidth = 10;
let ballHeight = 10;
let ballVelocityX = 1;
let ballVelocityY = 2;


let ball = 
{  
    x : boardWidth / 2,
    y : boardHeight / 2,
    width : ballWidth,
    height : ballHeight,
    velocityX : ballVelocityX,
    velocityY : ballVelocityY
}

let player1Score = 0;
let player2Score = 0;
let isHost = false;
let actualPlayer
let gameRunning = true;
let animationFrameId;

function resetValues() {
    player1 = {
        x: 10,
        y: boardHeight / 2,
        width: playerWidth,
        height: playerHeight,
        velocityY: playerVelocityY
    };

    player2 = {
        x: boardWidth - playerWidth - 10,
        y: boardHeight / 2,
        width: playerWidth,
        height: playerHeight,
        velocityY: playerVelocityY
    };

    ball = {
        x: boardWidth / 2,
        y: boardHeight / 2,
        width: ballWidth,
        height: ballHeight,
        velocityX: ballVelocityX,
        velocityY: ballVelocityY
    };

    player1Score = 0;
    player2Score = 0;
    gameRunning = true;
}

function startGame(gameGroup, socket) {
        resetValues();
        if (data['player'] === "player1")
        {
            isHost = true;
            actualPlayer = 'player1'; 
        }
        else
            actualPlayer = 'player2';
        socket.send(JSON.stringify({
            type: 'ready',
            player: data['player'],
            user: localStorage.getItem("username")
        }));
        initializeGame(socket, gameGroup, actualPlayer);
        socket.onmessage = async function(event) {
            const data = JSON.parse(event.data);
            console.log("Game message received:", data); // Debugging line
            
            if (data.type === 'game_update') {
                player1 = data.player1;
                player2 = data.player2;
                ball = data.ball;
                player1Score = data.player1Score;
                player2Score = data.player2Score;
            }
            if (data.type === 'player_move')
                {
                    if (data.player == 'player1')
                        player1.velocityY = data.velocityY;
                    else
                    player2.velocityY = data.velocityY;
            }
            if (data.type === 'end_game')
            {
                //cancelAnimationFrame(animationFrameId);
                await wait(1200);
                renderPage("home");
                return;
            }
        }
}

function initializeGame(socket, gameGroup, actualPlayer) {
    const board = document.getElementById("board");
    if (!board) {
        console.error("Board element not found");
        return;
    }
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    if (!gameRunning) return;

    animationFrameId = requestAnimationFrame(() => update(context, socket, gameGroup));
    draw(context);

    // Handle player movement
            
    if (!document.keyListenersAdded) {
        document.addEventListener("keydown", function(event) {
            movePlayer(event, actualPlayer, socket, gameGroup);
        });

        document.addEventListener("keyup", function(event) {
            stopPlayer(event, actualPlayer, socket, gameGroup);
        });

        document.keyListenersAdded = true; // Prevents multiple event bindings
    }
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function update(context, socket, gameGroup) {

    animationFrameId = requestAnimationFrame(() => update(context, socket, gameGroup));
    // Update player positions
    if (isHost && gameRunning) {
        player1.y += player1.velocityY;
        player2.y += player2.velocityY;

        // Update ball position
        ball.x += ball.velocityX;
        ball.y += ball.velocityY;

        // Check for collisions with paddles
        if (ball.y <= 0 || ball.y + ball.height >= boardHeight) {
            ball.velocityY *= -1; // Reverse the ball's Y velocity
        }

        if (ball.x <= player1.x + player1.width && ball.y >= player1.y && ball.y <= player1.y + player1.height) {
            ball.velocityX *= -1; // Reverse the ball's X velocity
        }

        if (ball.x + ball.width >= player2.x && ball.y >= player2.y && ball.y <= player2.y + player2.height) {
            ball.velocityX *= -1; // Reverse the ball's X velocity
        }

        // Check for scoring
        if (ball.x <= 0) {
            player2Score++;
            resetBall();
        }

        if (ball.x + ball.width >= boardWidth) {
            player1Score++;
            resetBall();
        }

    // Draw the updated state
    
    // Send game state updates if the current client is the host
        const currentUser = localStorage.getItem("username");
        socket.send(JSON.stringify({
            type: 'game_update',
            player1: player1,
            player2: player2,
            ball: ball,
            game_group: gameGroup,
            user: currentUser,
            player1Score: player1Score,
            player2Score: player2Score
        }));
    }
    
    draw(context);
    if (player1Score === 5 || player2Score === 5)
    {
        gameRunning = false;
        context.clearRect(0, 0, boardWidth, boardHeight);
        if (player1Score === 5)
        {
            context.fillStyle = "white  ";
            context.font = "60px Arial";
            context.fillText('Player 1 wins', 20, 20);
        }
        else
        {
            context.fillStyle = "white  ";
            context.font = "60px Arial";
            context.fillText('Player 2 wins', 20, 100);
        }
        const currentUser = localStorage.getItem("username");
        socket.send(JSON.stringify({
            type: 'end_game',
            user: currentUser,
            game_group: gameGroup,
            player1Score: player1Score,
            player2Score: player2Score
        }));
        cancelAnimationFrame(animationFrameId);
    }
}

function resetBall() {
    ball.x = boardWidth / 2;
    ball.y = boardHeight / 2;
    ball.velocityX = 2;
    ball.velocityY = 2;
}

function draw(context) {
    context.clearRect(0, 0, boardWidth, boardHeight);

    // Draw players
    context.fillStyle = "skyblue";
    context.fillRect(player1.x, player1.y, player1.width, player1.height);
    context.fillRect(player2.x, player2.y, player2.width, player2.height);

    // Draw ball
    context.fillStyle = "white";
    context.fillRect(ball.x, ball.y, ball.width, ball.height);

    // Draw scores
    context.fillStyle = "white  ";
    context.font = "20px Arial";
    context.fillText(`Player 1: ${player1Score}`, 20, 20);
    context.fillText(`Player 2: ${player2Score}`, boardWidth - 120, 20);
}

let lastVelocityY = { player1: 0, player2: 0 }; // Store previous velocities

function movePlayer(event, player, socket, gameGroup) {
    const currentUser = localStorage.getItem("username");
    let newVelocityY = 0;

    if (event.key === 'ArrowUp') {
        newVelocityY = -5;
    } else if (event.key === 'ArrowDown') {
        newVelocityY = 5;
    } else {
        return; // Ignore other keys
    }

    // Determine which player is moving
    if (player === 'player1' && player1.velocityY !== newVelocityY) {
        player1.velocityY = newVelocityY;

        // Only send if velocity actually changed
        if (lastVelocityY.player1 !== newVelocityY) {
            lastVelocityY.player1 = newVelocityY;
            socket.send(JSON.stringify({
                type: 'player_move',
                player: 'player1',
                velocityY: newVelocityY,
                game_group: gameGroup,
                user: currentUser
            }));
        }
    } else if (player === 'player2' && player2.velocityY !== newVelocityY) {
        player2.velocityY = newVelocityY;

        // Only send if velocity actually changed
        if (lastVelocityY.player2 !== newVelocityY) {
            lastVelocityY.player2 = newVelocityY;
            socket.send(JSON.stringify({
                type: 'player_move',
                player: 'player2',
                velocityY: newVelocityY,
                game_group: gameGroup,
                user: currentUser
            }));
        }
    }
}

function stopPlayer(event, player, socket, gameGroup) {
    const currentUser = localStorage.getItem("username");

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        if (player === 'player1' && player1.velocityY !== 0) {
            player1.velocityY = 0;

            // Only send if velocity actually changed
            if (lastVelocityY.player1 !== 0) {
                lastVelocityY.player1 = 0;
                socket.send(JSON.stringify({
                    type: 'player_move',
                    player: 'player1',
                    velocityY: 0,
                    game_group: gameGroup,
                    user: currentUser
                }));
            }
        } else if (player === 'player2' && player2.velocityY !== 0) {
            player2.velocityY = 0;

            // Only send if velocity actually changed
            if (lastVelocityY.player2 !== 0) {
                lastVelocityY.player2 = 0;
                socket.send(JSON.stringify({
                    type: 'player_move',
                    player: 'player2',
                    velocityY: 0,
                    game_group: gameGroup,
                    user: currentUser
                }));
            }
        }
    }
}

// function movePlayer(event, player, socket, gameGroup){
    
//     const currentUser = localStorage.getItem("username");
    
//     if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
//         if (player === 'player1') {
//             player1.velocityY = (event.key === 'ArrowUp') ? -5 : 5;
//             socket.send(JSON.stringify({
//                 type: 'player_move',
//                 player: 'player1',
//                 velocityY: player1.velocityY,
//                 game_group: gameGroup,
//                 user: currentUser
//             }));
//         } else if (player === 'player2'){
//             player2.velocityY = (event.key === 'ArrowUp') ? -5 : 5;
//             socket.send(JSON.stringify({
//                 type: 'player_move',
//                 player: 'player2',
//                 velocityY: player2.velocityY,
//                 game_group: gameGroup,
//                 user: currentUser
//             }));
//         }
//     }
// }

// function stopPlayer(event, player, socket, gameGroup){
//     const currentUser = localStorage.getItem("username");
//     if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
//         if (player === 'player1') {
//             player1.velocityY = 0;
//         } else if (player === 'player2') {
//             player2.velocityY = 0;
//         }
//         socket.send(JSON.stringify({
//             type: 'player_move',
//             player: player,
//             velocityY: 0,
//             game_group: gameGroup,
//             user: currentUser
//         }));
//     }
// }

// function initializeGame(socket, gameGroup, data, player)
// {
//     board = document.getElementById("board");
//     board.height = boardHeight;
//     board.width = boardWidth;
//     context = board.getContext("2d");
//     //initial players position
//     context.fillStyle = "skyblue";
//     context.fillRect(player1.x, player1.y, player1.width, player1.height);
    
//     context.fillRect(player2.x, player2.y, player2.width, player2.height);

    
//     //initial ball position
//     context.fillStyle = "white";
//     context.fillRect(ball.x, ball.y, ball.width, ball.height);
    
//     requestAnimationFrame(() => update(context, socket, gameGroup, player));
//     document.addEventListener("keydown", function(event) {
//         movePlayer(event, data['player'], socket, gameGroup);
//     });
//     document.addEventListener("keyup", function(event) {
//         stopPlayer(event, data['player'], socket, gameGroup);
//     });
// }

// function update(context, socket, gameGroup, player) {
//     requestAnimationFrame(() => update(context, socket, gameGroup, player));
//     context.clearRect(0, 0, board.width, board.height);

//     context.fillStyle = "skyblue";

//     //redraw players
//     let nextPlayer1Y = player1.y + player1.velocityY;
//     if (!outOfBounds(nextPlayer1Y))
//         player1.y = nextPlayer1Y;
//     context.fillRect(player1.x, player1.y, player1.width, player1.height);

//     let nextPlayer2Y = player2.y + player2.velocityY;
//     if (!outOfBounds(nextPlayer2Y))
//         player2.y = nextPlayer2Y;
//     context.fillRect(player2.x, player2.y, player2.width, player2.height);

//     //redraw ball
//     context.fillStyle = "white";
//     ball.x += ball.velocityX;
//     ball.y += ball.velocityY;
//     context.fillRect(ball.x, ball.y, ball.width, ball.height);

//     //ball touches wall
//     if (ball.y <= 0 || ball.y + ballHeight >= boardHeight)
//         ball.velocityY *= -1;

//     //ball hits player
//     if(detectCollision(ball, player1))
//     {
//         if (ball.x <= player1.x + player1.width)
//             ball.velocityX *= -1;
//     }
//     else if(detectCollision(ball, player2))
//     {
//         if (ball.x + ball.width >= player2.x)
//             ball.velocityX *= -1;
//     }

//     //gameover
//     if (ball.x < 0 || ball.x + ball.width > board.width)
//     {
//         if (ball.x < 0 )
//         {
//             player2Score++;
//             reset(1); 
//         }
//         else
//         {
//             player1Score++;
//             reset(-1);
//         }
//     }

//     //scores
//     context.fillStyle = "blue";
//     context.font = "45px sans-serif";
//     context.fillText(player1Score, board.width / 4, board.height / 4)
//     context.fillText(player2Score, board.width * 3 / 4 - 45, board.height / 4)

//     if (player == "player1") {
//         socket.send(JSON.stringify({
//             type: 'game_update',
//             player1: player1,
//             player2: player2,
//             ball: ball,
//             game_group: gameGroup
//         }));
//     }
    
// }
// function outOfBounds(yPos)
// {
//     return(yPos < 0 || yPos + playerHeight > board.height)
// }

// function detectCollision(a, b)
// {
//     return a.x < b.x + b.width &&
//             a.x + a.width > b.x && 
//             a.y < b.y + b.height && 
//             a.y + a.height > b.y;  
// }

// function reset(direction)
// {
//     ball = 
//     {  
//         x : boardWidth / 2,
//         y : boardHeight / 2,
//         width : ballWidth,
//         height : ballHeight,
//         velocityX : direction,
//         velocityY : ballVelocityY
//     }
// }