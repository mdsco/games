// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    '#000000', // Empty
    '#00f0f0', // I - Cyan
    '#f0f000', // O - Yellow
    '#a000f0', // T - Purple
    '#00f000', // S - Green
    '#f00000', // Z - Red
    '#0000f0', // J - Blue
    '#f0a000'  // L - Orange
];

// Tetromino shapes
const SHAPES = [
    [], // Empty
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[0,1,1],[1,1,0]], // S
    [[1,1,0],[0,1,1]], // Z
    [[1,0,0],[1,1,1]], // J
    [[0,0,1],[1,1,1]]  // L
];

// Game state
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let gamePaused = false;
let dropInterval = 1000;
let lastDropTime = 0;

// Canvas elements
const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');

// UI elements
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const startButton = document.getElementById('start-btn');
const restartButton = document.getElementById('restart-btn');

// Initialize game board
function initBoard() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
}

// Create a new piece
function createPiece() {
    const type = Math.floor(Math.random() * 7) + 1;
    const shape = SHAPES[type];
    return {
        type: type,
        shape: shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0
    };
}

// Draw a block
function drawBlock(ctx, x, y, type) {
    ctx.fillStyle = COLORS[type];
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

// Draw the board
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                drawBlock(ctx, col, row, board[row][col]);
            }
        }
    }
}

// Draw current piece
function drawPiece() {
    if (!currentPiece) return;

    const { shape, x, y, type } = currentPiece;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                drawBlock(ctx, x + col, y + row, type);
            }
        }
    }
}

// Draw next piece
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!nextPiece) return;

    const { shape, type } = nextPiece;
    const offsetX = (4 - shape[0].length) / 2;
    const offsetY = (4 - shape.length) / 2;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                drawBlock(nextCtx, offsetX + col, offsetY + row, type);
            }
        }
    }
}

// Check collision
function collision(piece, offsetX = 0, offsetY = 0) {
    const { shape, x, y } = piece;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const newX = x + col + offsetX;
                const newY = y + row + offsetY;

                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }

                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }

    return false;
}

// Merge piece to board
function merge() {
    const { shape, x, y, type } = currentPiece;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardY = y + row;
                const boardX = x + col;
                if (boardY >= 0) {
                    board[boardY][boardX] = type;
                }
            }
        }
    }
}

// Clear completed lines
function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // Check same row again
        }
    }

    if (linesCleared > 0) {
        lines += linesCleared;
        linesElement.textContent = lines;

        // Scoring: 1 line = 100, 2 = 300, 3 = 500, 4 = 800
        const points = [0, 100, 300, 500, 800][linesCleared] * level;
        score += points;
        scoreElement.textContent = score;

        // Level up every 10 lines
        const newLevel = Math.floor(lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            levelElement.textContent = level;
            dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        }
    }
}

// Move piece
function move(dir) {
    if (!gameRunning || gamePaused) return;

    if (!collision(currentPiece, dir, 0)) {
        currentPiece.x += dir;
        draw();
    }
}

// Rotate piece
function rotate() {
    if (!gameRunning || gamePaused) return;

    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );

    const previousShape = currentPiece.shape;
    currentPiece.shape = rotated;

    // Wall kick
    let offset = 0;
    if (collision(currentPiece, offset, 0)) {
        offset = currentPiece.x > COLS / 2 ? -1 : 1;
        if (collision(currentPiece, offset, 0)) {
            offset = currentPiece.x > COLS / 2 ? -2 : 2;
            if (collision(currentPiece, offset, 0)) {
                currentPiece.shape = previousShape;
                return;
            }
        }
    }

    currentPiece.x += offset;
    draw();
}

// Drop piece
function drop() {
    if (!gameRunning || gamePaused) return;

    if (!collision(currentPiece, 0, 1)) {
        currentPiece.y++;
        draw();
    } else {
        merge();
        clearLines();
        currentPiece = nextPiece;
        nextPiece = createPiece();
        drawNextPiece();

        if (collision(currentPiece, 0, 0)) {
            gameOver();
        }
    }
}

// Hard drop
function hardDrop() {
    if (!gameRunning || gamePaused) return;

    while (!collision(currentPiece, 0, 1)) {
        currentPiece.y++;
        score += 2; // Bonus points for hard drop
    }

    scoreElement.textContent = score;
    drop();
}

// Draw everything
function draw() {
    drawBoard();
    drawPiece();
}

// Game loop
function gameLoop(timestamp) {
    if (!gameRunning) return;

    if (!gamePaused && timestamp - lastDropTime > dropInterval) {
        drop();
        lastDropTime = timestamp;
    }

    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    gameRunning = true;
    gamePaused = false;

    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
    gameOverElement.classList.add('hidden');

    currentPiece = createPiece();
    nextPiece = createPiece();

    draw();
    drawNextPiece();

    lastDropTime = performance.now();
    requestAnimationFrame(gameLoop);

    startButton.textContent = 'Restart';
}

// Game over
function gameOver() {
    gameRunning = false;
    finalScoreElement.textContent = score;
    gameOverElement.classList.remove('hidden');
}

// Toggle pause
function togglePause() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    startButton.textContent = gamePaused ? 'Resume' : 'Pause';
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            move(-1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            move(1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            drop();
            lastDropTime = performance.now();
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotate();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
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
initBoard();
drawBoard();