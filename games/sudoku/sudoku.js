// Game constants
const GRID_SIZE = 9;
const BOX_SIZE = 3;
const DIFFICULTIES = {
    easy: 40,    // 40 empty cells
    medium: 50,  // 50 empty cells
    hard: 60     // 60 empty cells
};

// Game state
let board = [];
let solution = [];
let initialBoard = [];
let selectedCell = null;
let difficulty = 'easy';
let mistakes = 0;
let maxMistakes = 300;
let gameStartTime = null;
let timerInterval = null;

// UI elements
const boardElement = document.getElementById('sudoku-board');
const difficultyElement = document.getElementById('difficulty');
const timeElement = document.getElementById('time');
const mistakesElement = document.getElementById('mistakes');
const difficultySelect = document.getElementById('difficulty-select');
const newGameBtn = document.getElementById('new-game-btn');
const hintBtn = document.getElementById('hint-btn');
const checkBtn = document.getElementById('check-btn');
const gameWinElement = document.getElementById('game-win');
const finalTimeElement = document.getElementById('final-time');
const finalDifficultyElement = document.getElementById('final-difficulty');
const restartBtn = document.getElementById('restart-btn');
const numberBtns = document.querySelectorAll('.number-btn');

// Initialize game
function initGame() {
    difficulty = difficultySelect.value;
    difficultyElement.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

    mistakes = 0;
    mistakesElement.textContent = `${mistakes} / ${maxMistakes}`;
    gameWinElement.classList.add('hidden');

    // Generate puzzle
    generatePuzzle();

    // Render board
    renderBoard();

    // Start timer
    startTimer();
}

// Generate a valid Sudoku puzzle
function generatePuzzle() {
    // Start with empty board
    board = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));

    // Fill diagonal boxes first (they are independent)
    fillDiagonalBoxes();

    // Solve the rest
    solveSudoku(board);

    // Save solution
    solution = board.map(row => [...row]);

    // Remove numbers based on difficulty
    const cellsToRemove = DIFFICULTIES[difficulty];
    removeNumbers(cellsToRemove);

    // Save initial state
    initialBoard = board.map(row => [...row]);
}

// Fill the three diagonal 3x3 boxes
function fillDiagonalBoxes() {
    for (let box = 0; box < GRID_SIZE; box += BOX_SIZE) {
        fillBox(box, box);
    }
}

// Fill a 3x3 box with random valid numbers
function fillBox(row, col) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffleArray(numbers);

    let num = 0;
    for (let i = 0; i < BOX_SIZE; i++) {
        for (let j = 0; j < BOX_SIZE; j++) {
            board[row + i][col + j] = numbers[num++];
        }
    }
}

// Solve Sudoku using backtracking
function solveSudoku(grid) {
    const emptyCell = findEmptyCell(grid);

    if (!emptyCell) {
        return true; // Puzzle solved
    }

    const [row, col] = emptyCell;

    for (let num = 1; num <= 9; num++) {
        if (isValid(grid, row, col, num)) {
            grid[row][col] = num;

            if (solveSudoku(grid)) {
                return true;
            }

            grid[row][col] = 0; // Backtrack
        }
    }

    return false;
}

// Find empty cell
function findEmptyCell(grid) {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (grid[row][col] === 0) {
                return [row, col];
            }
        }
    }
    return null;
}

// Check if number is valid in position
function isValid(grid, row, col, num) {
    // Check row
    for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < GRID_SIZE; x++) {
        if (grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
    const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;

    for (let i = 0; i < BOX_SIZE; i++) {
        for (let j = 0; j < BOX_SIZE; j++) {
            if (grid[boxRow + i][boxCol + j] === num) return false;
        }
    }

    return true;
}

// Remove numbers to create puzzle
function removeNumbers(count) {
    let removed = 0;

    while (removed < count) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);

        if (board[row][col] !== 0) {
            board[row][col] = 0;
            removed++;
        }
    }
}

// Shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Render board
function renderBoard() {
    boardElement.innerHTML = '';

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            // Add thick borders for 3x3 boxes
            if (row % 3 === 0 && row !== 0) cell.classList.add('border-top');
            if (col % 3 === 0 && col !== 0) cell.classList.add('border-left');

            const value = board[row][col];

            if (value !== 0) {
                cell.textContent = value;

                if (initialBoard[row][col] !== 0) {
                    cell.classList.add('given');
                } else {
                    cell.classList.add('filled');
                }
            }

            cell.addEventListener('click', () => selectCell(row, col));

            boardElement.appendChild(cell);
        }
    }
}

// Select cell
function selectCell(row, col) {
    // Can't select given cells
    if (initialBoard[row][col] !== 0) return;

    selectedCell = { row, col };

    // Update UI
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => cell.classList.remove('selected'));

    const selectedElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (selectedElement) {
        selectedElement.classList.add('selected');
    }
}

// Place number in selected cell
function placeNumber(num) {
    if (!selectedCell) return;

    const { row, col } = selectedCell;

    // Can't change given cells
    if (initialBoard[row][col] !== 0) return;

    // Place number
    if (num === 0) {
        board[row][col] = 0;
    } else {
        board[row][col] = num;

        // Check if correct
        if (solution[row][col] !== num) {
            mistakes++;
            mistakesElement.textContent = `${mistakes} / ${maxMistakes}`;

            // Highlight error briefly
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('error');
            setTimeout(() => cell.classList.remove('error'), 500);

            if (mistakes >= maxMistakes) {
                alert('Too many mistakes! Starting over...');
                initGame();
                return;
            }
        }
    }

    renderBoard();
    checkWin();
}

// Give hint
function giveHint() {
    // Find an empty cell and fill it with correct answer
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (board[row][col] === 0) {
                board[row][col] = solution[row][col];

                // Highlight hint
                renderBoard();
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.classList.add('hint');

                return;
            }
        }
    }
}

// Check for errors
function checkBoard() {
    let hasErrors = false;

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (board[row][col] !== 0 && board[row][col] !== solution[row][col]) {
                hasErrors = true;
                const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                cell.classList.add('error');
                setTimeout(() => cell.classList.remove('error'), 1000);
            }
        }
    }

    if (!hasErrors) {
        alert('No errors found! Keep going!');
    }
}

// Check win
function checkWin() {
    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            if (board[row][col] !== solution[row][col]) {
                return;
            }
        }
    }

    // Won!
    clearInterval(timerInterval);
    finalTimeElement.textContent = timeElement.textContent;
    finalDifficultyElement.textContent = difficultyElement.textContent;

    setTimeout(() => {
        gameWinElement.classList.remove('hidden');
    }, 500);
}

// Start timer
function startTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    gameStartTime = Date.now();

    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Keyboard input
document.addEventListener('keydown', (e) => {
    if (!selectedCell) return;

    if (e.key >= '1' && e.key <= '9') {
        placeNumber(parseInt(e.key));
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        placeNumber(0);
    }
});

// Number pad buttons
numberBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const num = parseInt(btn.dataset.number);
        placeNumber(num);
    });
});

// Event listeners
newGameBtn.addEventListener('click', initGame);
hintBtn.addEventListener('click', giveHint);
checkBtn.addEventListener('click', checkBoard);
restartBtn.addEventListener('click', initGame);

// Initialize
initGame();