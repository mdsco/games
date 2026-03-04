// Game constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRAVITY = 0.5;
const FLAP_STRENGTH = -9;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 2;
const BIRD_SIZE = 30;
const BIRD_X = 80;

// Game state
let bird = {
    y: CANVAS_HEIGHT / 2,
    velocity: 0,
    rotation: 0
};

let pipes = [];
let score = 0;
let bestScore = 0;
let gameStarted = false;
let gameOver = false;
let frameCount = 0;

// Canvas and context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// UI elements
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const startScreen = document.getElementById('start-screen');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const finalBestElement = document.getElementById('final-best');
const newRecordElement = document.getElementById('new-record');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Load best score
function loadBestScore() {
    const saved = localStorage.getItem('flappyBirdBestScore');
    bestScore = saved ? parseInt(saved) : 0;
    bestScoreElement.textContent = bestScore;
}

// Save best score
function saveBestScore() {
    localStorage.setItem('flappyBirdBestScore', bestScore.toString());
}

// Initialize game
function initGame() {
    bird = {
        y: CANVAS_HEIGHT / 2,
        velocity: 0,
        rotation: 0
    };

    pipes = [];
    score = 0;
    gameStarted = false;
    gameOver = false;
    frameCount = 0;

    scoreElement.textContent = score;
    gameOverElement.classList.add('hidden');
    startScreen.classList.remove('hidden');

    // Draw initial state
    draw();
}

// Start game
function startGame() {
    if (gameStarted || gameOver) return;

    gameStarted = true;
    startScreen.classList.add('hidden');

    // Initial flap
    flap();

    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Flap
function flap() {
    if (!gameStarted || gameOver) {
        startGame();
        return;
    }

    bird.velocity = FLAP_STRENGTH;
}

// Create pipe
function createPipe() {
    const minHeight = 50;
    const maxHeight = CANVAS_HEIGHT - PIPE_GAP - minHeight - 100;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;

    pipes.push({
        x: CANVAS_WIDTH,
        topHeight: topHeight,
        bottomY: topHeight + PIPE_GAP,
        scored: false
    });
}

// Update game state
function update() {
    if (!gameStarted || gameOver) return;

    // Update bird
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Update bird rotation based on velocity
    bird.rotation = Math.min(Math.max(bird.velocity * 3, -30), 90);

    // Check ceiling collision
    if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }

    // Check ground collision
    if (bird.y + BIRD_SIZE > CANVAS_HEIGHT - 50) {
        endGame();
        return;
    }

    // Create pipes
    frameCount++;
    if (frameCount % 90 === 0) {
        createPipe();
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= PIPE_SPEED;

        // Score when passing pipe
        if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X) {
            pipe.scored = true;
            score++;
            scoreElement.textContent = score;

            if (score > bestScore) {
                bestScore = score;
                bestScoreElement.textContent = bestScore;
                saveBestScore();
            }
        }

        // Check collision
        if (checkCollision(pipe)) {
            endGame();
            return;
        }

        // Remove off-screen pipes
        if (pipe.x + PIPE_WIDTH < 0) {
            pipes.splice(i, 1);
        }
    }
}

// Check collision with pipe
function checkCollision(pipe) {
    const birdLeft = BIRD_X;
    const birdRight = BIRD_X + BIRD_SIZE;
    const birdTop = bird.y;
    const birdBottom = bird.y + BIRD_SIZE;

    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + PIPE_WIDTH;

    // Check if bird is within pipe's x range
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
        // Check if bird hits top or bottom pipe
        if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
            return true;
        }
    }

    return false;
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw clouds
    drawClouds();

    // Draw pipes
    pipes.forEach(pipe => {
        drawPipe(pipe);
    });

    // Draw ground
    drawGround();

    // Draw bird
    drawBird();

    // Draw score on canvas
    if (gameStarted && !gameOver) {
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText(score, CANVAS_WIDTH / 2, 60);
        ctx.fillText(score, CANVAS_WIDTH / 2, 60);
    }
}

// Draw bird
function drawBird() {
    ctx.save();
    ctx.translate(BIRD_X + BIRD_SIZE / 2, bird.y + BIRD_SIZE / 2);
    ctx.rotate((bird.rotation * Math.PI) / 180);

    // Bird body
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Bird wing
    ctx.fillStyle = '#ffec8b';
    ctx.beginPath();
    ctx.ellipse(-5, 5, 8, 12, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Bird beak
    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(BIRD_SIZE / 2 - 5, -2);
    ctx.lineTo(BIRD_SIZE / 2 + 5, 0);
    ctx.lineTo(BIRD_SIZE / 2 - 5, 2);
    ctx.closePath();
    ctx.fill();

    // Bird eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(5, -5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(7, -5, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// Draw pipe
function drawPipe(pipe) {
    // Pipe color gradient
    const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
    gradient.addColorStop(0, '#5cb85c');
    gradient.addColorStop(0.5, '#4cae4c');
    gradient.addColorStop(1, '#5cb85c');

    // Top pipe
    ctx.fillStyle = gradient;
    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);

    // Top pipe cap
    ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);

    // Bottom pipe
    ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY - 50);

    // Bottom pipe cap
    ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 20);

    // Pipe border
    ctx.strokeStyle = '#2d5f2d';
    ctx.lineWidth = 2;
    ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
    ctx.strokeRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);
    ctx.strokeRect(pipe.x, pipe.bottomY, PIPE_WIDTH, CANVAS_HEIGHT - pipe.bottomY - 50);
    ctx.strokeRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 20);
}

// Draw ground
function drawGround() {
    const groundY = CANVAS_HEIGHT - 50;

    // Ground
    ctx.fillStyle = '#deb887';
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 50);

    // Ground grass
    ctx.fillStyle = '#8fbc8f';
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 10);

    // Ground pattern
    ctx.strokeStyle = '#cd853f';
    ctx.lineWidth = 2;
    for (let i = 0; i < CANVAS_WIDTH; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, groundY + 10);
        ctx.lineTo(i, CANVAS_HEIGHT);
        ctx.stroke();
    }
}

// Draw clouds
function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';

    // Cloud 1
    drawCloud(80, 100, 1);

    // Cloud 2
    drawCloud(250, 150, 0.8);

    // Cloud 3
    drawCloud(150, 250, 1.2);

    // Cloud 4
    drawCloud(320, 80, 0.9);
}

function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.arc(20, 0, 18, 0, Math.PI * 2);
    ctx.arc(35, 0, 15, 0, Math.PI * 2);
    ctx.arc(18, -8, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

// End game
function endGame() {
    gameOver = true;

    finalScoreElement.textContent = score;
    finalBestElement.textContent = bestScore;

    if (score === bestScore && score > 0) {
        newRecordElement.classList.remove('hidden');
    } else {
        newRecordElement.classList.add('hidden');
    }

    setTimeout(() => {
        gameOverElement.classList.remove('hidden');
    }, 500);
}

// Game loop
function gameLoop() {
    update();
    draw();

    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }
}

// Event listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
    initGame();
    startGame();
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        flap();
    } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        initGame();
        if (gameOver) {
            startGame();
        }
    }
});

// Mouse/touch controls
canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    flap();
});

// Initialize
loadBestScore();
initGame();