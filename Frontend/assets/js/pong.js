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



window.onload = function()
{
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    //initial players position
    context.fillStyle = "skyblue";
    context.fillRect(player1.x, player1.y, player1.width, player1.height);
    
    context.fillRect(player2.x, player2.y, player2.width, player2.height);

    
    //initial ball position
    context.fillStyle = "white";
    context.fillRect(ball.x, ball.y, ball.width, ball.height);
    
    requestAnimationFrame(update);
    document.addEventListener("keydown", movePlayer);
    document.addEventListener("keyup", stopPlayer);
}

function update() {
    requestAnimationFrame(update);
    context.clearRect(0, 0, board.width, board.height);

    context.fillStyle = "skyblue";

    //redraw players
    let nextPlayer1Y = player1.y + player1.velocityY;
    if (!outOfBounds(nextPlayer1Y))
        player1.y = nextPlayer1Y;
    context.fillRect(player1.x, player1.y, player1.width, player1.height);

    let nextPlayer2Y = player2.y + player2.velocityY;
    if (!outOfBounds(nextPlayer2Y))
        player2.y = nextPlayer2Y;
    context.fillRect(player2.x, player2.y, player2.width, player2.height);

    //redraw ball
    context.fillStyle = "white";
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;
    context.fillRect(ball.x, ball.y, ball.width, ball.height);

    //ball touches wall
    if (ball.y <= 0 || ball.y + ballHeight >= boardHeight)
        ball.velocityY *= -1;

    //ball hits player
    if(detectCollision(ball, player1))
    {
        if (ball.x <= player1.x + player1.width)
            ball.velocityX *= -1;
    }
    else if(detectCollision(ball, player2))
    {
        if (ball.x + ball.width >= player2.x)
            ball.velocityX *= -1;
    }

    //gameover
    if (ball.x < 0 || ball.x + ball.width > board.width)
    {
        if (ball.x < 0 )
        {
            player2Score++;
            reset(1); 
        }
        else
        {
            player1Score++;
            reset(-1);
        }
    }

    //scores
    context.fillStyle = "blue";
    context.font = "45px sans-serif";
    context.fillText(player1Score, board.width / 4, board.height / 4)
    context.fillText(player2Score, board.width * 3 / 4 - 45, board.height / 4)
    
}

function movePlayer(e){

    //player1
    if(e.code == "KeyW")
        player1.velocityY = -3;
    else if (e.code == "KeyS")
        player1.velocityY = 3;
    
    //player2
    if(e.code == "ArrowUp")
        player2.velocityY = -3;
    else if (e.code == "ArrowDown")
        player2.velocityY = 3;
        
}

function stopPlayer(e){

    //player1
    if(e.code == "KeyW" || e.code == "KeyS")
        player1.velocityY = 0;
    
    //player2
    if(e.code == "ArrowUp" || e.code == "ArrowDown")
        player2.velocityY = 0;
}

function outOfBounds(yPos)
{
    return(yPos < 0 || yPos + playerHeight > board.height)
}

function detectCollision(a, b)
{
    return a.x < b.x + b.width &&
            a.x + a.width > b.x && 
            a.y < b.y + b.height && 
            a.y + a.height > b.y;  
}

function reset(direction)
{
    ball = 
    {  
        x : boardWidth / 2,
        y : boardHeight / 2,
        width : ballWidth,
        height : ballHeight,
        velocityX : direction,
        velocityY : ballVelocityY
    }
}