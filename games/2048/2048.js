// Game constants
const GRID_SIZE = 4;
const CELL_SIZE = 110;
const CELL_GAP = 15;
const WIN_VALUE = 2048;

// Game state
let grid = [];
let score = 0;
let bestScore = 0;
let moves = 0;
let hasWon = false;
let gameOver = false;
let tileIdCounter = 0;

// UI elements
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best-score');
const movesElement = document.getElementById('moves');
const gameOverElement = document.getElementById('game-over');
const gameWinElement = document.getElementById('game-win');
const finalScoreElement = document.getElementById('final-score');
const winScoreElement = document.getElementById('win-score');
const newBestElement = document.getElementById('new-best');
const newGameBtn = document.getElementById('new-game-btn');
const restartBtn = document.getElementById('restart-btn');
const continueBtn = document.getElementById('continue-btn');
const winRestartBtn = document.getElementById('win-restart-btn');
const tileContainer = document.getElementById('tile-container');

// Tile class
class Tile {
    constructor(value, row, col) {
        this.id = tileIdCounter++;
        this.value = value;
        this.row = row;
        this.col = col;
        this.element = this.createElement();
    }

    createElement() {
        const tile = document.createElement('div');
        tile.className = `tile tile-${this.value} tile-new`;
        tile.textContent = this.value;
        tile.dataset.tileId = this.id;
        this.setPosition(tile);
        return tile;
    }

    setPosition(element) {
        const x = this.col * (CELL_SIZE + CELL_GAP);
        const y = this.row * (CELL_SIZE + CELL_GAP);
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    }

    updatePosition() {
        this.setPosition(this.element);
        // Remove new class after initial animation
        setTimeout(() => {
            this.element.classList.remove('tile-new');
        }, 200);
    }

    updateValue(newValue) {
        this.value = newValue;
        this.element.className = `tile tile-${this.value}`;
        this.element.textContent = this.value;

        // Add merge animation
        this.element.classList.add('tile-merged');
        setTimeout(() => {
            this.element.classList.remove('tile-merged');
        }, 200);
    }

    moveTo(row, col) {
        this.row = row;
        this.col = col;
        this.updatePosition();
    }

    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// Initialize game
function initGame() {
    // Clear existing tiles
    const oldTiles = tileContainer.querySelectorAll('.tile');
    oldTiles.forEach(tile => tile.remove());

    grid = [];
    for (let i = 0; i < GRID_SIZE; i++) {
        grid[i] = [];
        for (let j = 0; j < GRID_SIZE; j++) {
            grid[i][j] = null;
        }
    }

    score = 0;
    moves = 0;
    hasWon = false;
    gameOver = false;
    tileIdCounter = 0;

    scoreElement.textContent = score;
    movesElement.textContent = moves;
    gameOverElement.classList.add('hidden');
    gameWinElement.classList.add('hidden');

    // Add two starting tiles
    addRandomTile();
    addRandomTile();
}

// Load best score
function loadBestScore() {
    const saved = localStorage.getItem('2048BestScore');
    bestScore = saved ? parseInt(saved) : 0;
    bestScoreElement.textContent = bestScore;
}

// Save best score
function saveBestScore() {
    localStorage.setItem('2048BestScore', bestScore.toString());
}

// Add random tile (2 or 4)
function addRandomTile() {
    const emptyCells = [];

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (!grid[row][col]) {
                emptyCells.push({ row, col });
            }
        }
    }

    if (emptyCells.length === 0) return false;

    const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;

    const tile = new Tile(value, row, col);
    grid[row][col] = tile;
    tileContainer.appendChild(tile.element);

    return true;
}

// Get tiles for a row
function getRow(rowIndex) {
    return grid[rowIndex].filter(tile => tile !== null);
}

// Get tiles for a column
function getColumn(colIndex) {
    const column = [];
    for (let row = 0; row < GRID_SIZE; row++) {
        if (grid[row][colIndex]) {
            column.push(grid[row][colIndex]);
        }
    }
    return column;
}

// Move and merge tiles in one direction
function moveAndMergeTiles(tiles) {
    const merged = [];
    let i = 0;

    while (i < tiles.length) {
        if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
            // Merge tiles
            const newValue = tiles[i].value * 2;
            tiles[i].updateValue(newValue);
            merged.push(tiles[i]);

            // Remove the merged tile
            tiles[i + 1].remove();

            score += newValue;
            scoreElement.textContent = score;

            if (score > bestScore) {
                bestScore = score;
                bestScoreElement.textContent = bestScore;
                saveBestScore();
            }

            i += 2;
        } else {
            merged.push(tiles[i]);
            i++;
        }
    }

    return merged;
}

// Move left
function moveLeft() {
    let moved = false;

    for (let row = 0; row < GRID_SIZE; row++) {
        const tiles = getRow(row);
        const mergedTiles = moveAndMergeTiles(tiles);

        // Clear the row
        for (let col = 0; col < GRID_SIZE; col++) {
            grid[row][col] = null;
        }

        // Place merged tiles
        for (let i = 0; i < mergedTiles.length; i++) {
            const tile = mergedTiles[i];
            if (tile.row !== row || tile.col !== i) {
                moved = true;
            }
            tile.moveTo(row, i);
            grid[row][i] = tile;
        }
    }

    return moved;
}

// Move right
function moveRight() {
    let moved = false;

    for (let row = 0; row < GRID_SIZE; row++) {
        const tiles = getRow(row).reverse();
        const mergedTiles = moveAndMergeTiles(tiles);

        // Clear the row
        for (let col = 0; col < GRID_SIZE; col++) {
            grid[row][col] = null;
        }

        // Place merged tiles from right
        for (let i = 0; i < mergedTiles.length; i++) {
            const col = GRID_SIZE - 1 - i;
            const tile = mergedTiles[i];
            if (tile.row !== row || tile.col !== col) {
                moved = true;
            }
            tile.moveTo(row, col);
            grid[row][col] = tile;
        }
    }

    return moved;
}

// Move up
function moveUp() {
    let moved = false;

    for (let col = 0; col < GRID_SIZE; col++) {
        const tiles = getColumn(col);
        const mergedTiles = moveAndMergeTiles(tiles);

        // Clear the column
        for (let row = 0; row < GRID_SIZE; row++) {
            grid[row][col] = null;
        }

        // Place merged tiles
        for (let i = 0; i < mergedTiles.length; i++) {
            const tile = mergedTiles[i];
            if (tile.row !== i || tile.col !== col) {
                moved = true;
            }
            tile.moveTo(i, col);
            grid[i][col] = tile;
        }
    }

    return moved;
}

// Move down
function moveDown() {
    let moved = false;

    for (let col = 0; col < GRID_SIZE; col++) {
        const tiles = getColumn(col).reverse();
        const mergedTiles = moveAndMergeTiles(tiles);

        // Clear the column
        for (let row = 0; row < GRID_SIZE; row++) {
            grid[row][col] = null;
        }

        // Place merged tiles from bottom
        for (let i = 0; i < mergedTiles.length; i++) {
            const row = GRID_SIZE - 1 - i;
            const tile = mergedTiles[i];
            if (tile.row !== row || tile.col !== col) {
                moved = true;
            }
            tile.moveTo(row, col);
            grid[row][col] = tile;
        }
    }

    return moved;
}

// Move tiles
function move(direction) {
    if (gameOver) return;

    let moved = false;

    if (direction === 'left') {
        moved = moveLeft();
    } else if (direction === 'right') {
        moved = moveRight();
    } else if (direction === 'up') {
        moved = moveUp();
    } else if (direction === 'down') {
        moved = moveDown();
    }

    if (moved) {
        moves++;
        movesElement.textContent = moves;

        setTimeout(() => {
            addRandomTile();
            checkWin();
            checkGameOver();
        }, 150);
    }
}

// Check for win
function checkWin() {
    if (hasWon) return;

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const tile = grid[row][col];
            if (tile && tile.value === WIN_VALUE) {
                hasWon = true;
                winScoreElement.textContent = score;
                setTimeout(() => {
                    gameWinElement.classList.remove('hidden');
                }, 300);
                return;
            }
        }
    }
}

// Check for game over
function checkGameOver() {
    // Check if any empty cells
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (!grid[row][col]) return;
        }
    }

    // Check if any possible merges
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const tile = grid[row][col];
            if (!tile) continue;

            // Check right
            if (col < GRID_SIZE - 1 && grid[row][col + 1] && grid[row][col + 1].value === tile.value) {
                return;
            }

            // Check down
            if (row < GRID_SIZE - 1 && grid[row + 1][col] && grid[row + 1][col].value === tile.value) {
                return;
            }
        }
    }

    // No moves left
    gameOver = true;
    finalScoreElement.textContent = score;

    if (score === bestScore && score > 0) {
        newBestElement.classList.remove('hidden');
    } else {
        newBestElement.classList.add('hidden');
    }

    setTimeout(() => {
        gameOverElement.classList.remove('hidden');
    }, 300);
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        move('up');
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        move('down');
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        move('left');
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        move('right');
    } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        initGame();
    }
});

// Touch support for mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    if (!e.changedTouches || !e.changedTouches[0]) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    const minSwipeDistance = 30;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > minSwipeDistance) {
            e.preventDefault();
            move(deltaX > 0 ? 'right' : 'left');
        }
    } else {
        if (Math.abs(deltaY) > minSwipeDistance) {
            e.preventDefault();
            move(deltaY > 0 ? 'down' : 'up');
        }
    }
});

// Event listeners
newGameBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
winRestartBtn.addEventListener('click', initGame);
continueBtn.addEventListener('click', () => {
    gameWinElement.classList.add('hidden');
});

// Initialize
loadBestScore();
initGame();