// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = 25;
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 10;
const MIN_SPEED = 50;
const FOODS_PER_LEVEL = 5;

// Direction constants
const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
};

// Game state
let snake = [];
let direction = DIRECTIONS.RIGHT;
let nextDirection = DIRECTIONS.RIGHT;
let food = null;
let score = 0;
let highScore = 0;
let speed = INITIAL_SPEED;
let speedLevel = 1;
let foodsEaten = 0;
let gameRunning = false;
let gamePaused = false;
let gameLoopId = null;

// Canvas element
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');

// UI elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const speedElement = document.getElementById('speed');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const finalHighScoreElement = document.getElementById('final-high-score');
const startButton = document.getElementById('start-btn');
const restartButton = document.getElementById('restart-btn');

// Load high score from localStorage
function loadHighScore() {
    const saved = localStorage.getItem('snakeHighScore');
    highScore = saved ? parseInt(saved) : 0;
    highScoreElement.textContent = highScore;
}

// Save high score to localStorage
function saveHighScore() {
    localStorage.setItem('snakeHighScore', highScore.toString());
}

// Initialize snake
function initSnake() {
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    direction = DIRECTIONS.RIGHT;
    nextDirection = DIRECTIONS.RIGHT;
}

// Generate random food position
function generateFood() {
    let newFood;
    let isOnSnake;

    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };

        isOnSnake = snake.some(segment =>
            segment.x === newFood.x && segment.y === newFood.y
        );
    } while (isOnSnake);

    food = newFood;
}

// Draw grid
function drawGrid() {
    ctx.strokeStyle = '#2a2a2a';
    ctx.lineWidth = 1;

    for (let i = 0; i <= GRID_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
        ctx.stroke();
    }
}

// Draw snake
function drawSnake() {
    snake.forEach((segment, index) => {
        // Head is brighter green
        if (index === 0) {
            ctx.fillStyle = '#28a745';
        } else {
            ctx.fillStyle = '#20c997';
        }

        ctx.fillRect(
            segment.x * CELL_SIZE + 1,
            segment.y * CELL_SIZE + 1,
            CELL_SIZE - 2,
            CELL_SIZE - 2
        );

        // Add eye to head
        if (index === 0) {
            ctx.fillStyle = '#000';
            const eyeSize = 3;

            if (direction === DIRECTIONS.RIGHT) {
                ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - 8, segment.y * CELL_SIZE + 6, eyeSize, eyeSize);
                ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - 8, segment.y * CELL_SIZE + CELL_SIZE - 9, eyeSize, eyeSize);
            } else if (direction === DIRECTIONS.LEFT) {
                ctx.fillRect(segment.x * CELL_SIZE + 5, segment.y * CELL_SIZE + 6, eyeSize, eyeSize);
                ctx.fillRect(segment.x * CELL_SIZE + 5, segment.y * CELL_SIZE + CELL_SIZE - 9, eyeSize, eyeSize);
            } else if (direction === DIRECTIONS.UP) {
                ctx.fillRect(segment.x * CELL_SIZE + 6, segment.y * CELL_SIZE + 5, eyeSize, eyeSize);
                ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - 9, segment.y * CELL_SIZE + 5, eyeSize, eyeSize);
            } else if (direction === DIRECTIONS.DOWN) {
                ctx.fillRect(segment.x * CELL_SIZE + 6, segment.y * CELL_SIZE + CELL_SIZE - 8, eyeSize, eyeSize);
                ctx.fillRect(segment.x * CELL_SIZE + CELL_SIZE - 9, segment.y * CELL_SIZE + CELL_SIZE - 8, eyeSize, eyeSize);
            }
        }
    });
}

// Draw food
function drawFood() {
    if (!food) return;

    // Draw food as a red circle
    ctx.fillStyle = '#dc3545';
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2,
        food.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2 - 2,
        0,
        Math.PI * 2
    );
    ctx.fill();

    // Add shine effect
    ctx.fillStyle = '#ff6b7a';
    ctx.beginPath();
    ctx.arc(
        food.x * CELL_SIZE + CELL_SIZE / 2 - 3,
        food.y * CELL_SIZE + CELL_SIZE / 2 - 3,
        3,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawGrid();
    drawSnake();
    drawFood();
}

// Move snake
function moveSnake() {
    if (!gameRunning || gamePaused) return;

    // Update direction (prevent 180-degree turns)
    direction = nextDirection;

    // Calculate new head position
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;

    // Check wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        gameOver();
        return;
    }

    // Check self collision
    if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }

    // Add new head
    snake.unshift(head);

    // Check if food is eaten
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreElement.textContent = score;
        foodsEaten++;

        // Update high score
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            saveHighScore();
        }

        // Increase speed every FOODS_PER_LEVEL foods
        if (foodsEaten % FOODS_PER_LEVEL === 0) {
            speed = Math.max(MIN_SPEED, speed - SPEED_INCREMENT);
            speedLevel++;
            speedElement.textContent = speedLevel;

            // Restart game loop with new speed
            clearInterval(gameLoopId);
            gameLoopId = setInterval(gameLoop, speed);
        }

        generateFood();
    } else {
        // Remove tail if no food eaten
        snake.pop();
    }

    draw();
}

// Game loop
function gameLoop() {
    moveSnake();
}

// Start game
function startGame() {
    initSnake();
    score = 0;
    speed = INITIAL_SPEED;
    speedLevel = 1;
    foodsEaten = 0;
    gameRunning = true;
    gamePaused = false;

    scoreElement.textContent = score;
    speedElement.textContent = speedLevel;
    gameOverElement.classList.add('hidden');

    generateFood();
    draw();

    if (gameLoopId) {
        clearInterval(gameLoopId);
    }
    gameLoopId = setInterval(gameLoop, speed);

    startButton.textContent = 'Restart';
}

// Game over
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoopId);

    finalScoreElement.textContent = score;
    finalHighScoreElement.textContent = highScore;
    gameOverElement.classList.remove('hidden');
}

// Toggle pause
function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    startButton.textContent = gamePaused ? 'Resume' : 'Pause';
}

// Change direction
function changeDirection(newDirection) {
    // Prevent 180-degree turns
    if (newDirection === DIRECTIONS.UP && direction !== DIRECTIONS.DOWN) {
        nextDirection = newDirection;
    } else if (newDirection === DIRECTIONS.DOWN && direction !== DIRECTIONS.UP) {
        nextDirection = newDirection;
    } else if (newDirection === DIRECTIONS.LEFT && direction !== DIRECTIONS.RIGHT) {
        nextDirection = newDirection;
    } else if (newDirection === DIRECTIONS.RIGHT && direction !== DIRECTIONS.LEFT) {
        nextDirection = newDirection;
    }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            changeDirection(DIRECTIONS.UP);
            break;
        case 'ArrowDown':
            e.preventDefault();
            changeDirection(DIRECTIONS.DOWN);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            changeDirection(DIRECTIONS.LEFT);
            break;
        case 'ArrowRight':
            e.preventDefault();
            changeDirection(DIRECTIONS.RIGHT);
            break;
        case ' ':
            e.preventDefault();
            if (!gameRunning) {
                startGame();
            }
            break;
        case 'p':
        case 'P':
            e.preventDefault();
            togglePause();
            break;
    }
});

// Event listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Initialize
loadHighScore();
draw();