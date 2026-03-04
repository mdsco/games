// Card constants
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUIT_SYMBOLS = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
};

// Game state
let deck = [];
let stock = [];
let waste = [];
let foundations = [[], [], [], []];
let tableau = [[], [], [], [], [], [], []];
let score = 0;
let moves = 0;
let gameStartTime = null;
let timerInterval = null;
let moveHistory = [];
let draggedCards = [];
let dragSource = null;

// UI elements
const scoreElement = document.getElementById('score');
const movesElement = document.getElementById('moves');
const timeElement = document.getElementById('time');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const finalMovesElement = document.getElementById('final-moves');
const finalTimeElement = document.getElementById('final-time');
const newGameBtn = document.getElementById('new-game-btn');
const undoBtn = document.getElementById('undo-btn');
const hintBtn = document.getElementById('hint-btn');
const restartBtn = document.getElementById('restart-btn');

// Card class
class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.faceUp = false;
        this.element = null;
    }

    get color() {
        return (this.suit === 'hearts' || this.suit === 'diamonds') ? 'red' : 'black';
    }

    get value() {
        return RANKS.indexOf(this.rank) + 1;
    }

    createElement() {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.suit = this.suit;
        card.dataset.rank = this.rank;

        if (this.faceUp) {
            card.classList.add('face-up');
            card.innerHTML = `
                <div class="card-corner top-left">
                    <div class="rank">${this.rank}</div>
                    <div class="suit ${this.color}">${SUIT_SYMBOLS[this.suit]}</div>
                </div>
                <div class="card-center ${this.color}">${SUIT_SYMBOLS[this.suit]}</div>
                <div class="card-corner bottom-right">
                    <div class="rank">${this.rank}</div>
                    <div class="suit ${this.color}">${SUIT_SYMBOLS[this.suit]}</div>
                </div>
            `;
        } else {
            card.classList.add('face-down');
            card.innerHTML = '<div class="card-back"></div>';
        }

        this.element = card;
        this.attachEventListeners();
        return card;
    }

    flip() {
        this.faceUp = true;
        this.updateElement();
    }

    updateElement() {
        if (this.element) {
            this.element.remove();
        }
        this.createElement();
    }

    attachEventListeners() {
        if (!this.element) return;

        this.element.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.element.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
    }

    handleMouseDown(e) {
        if (!this.faceUp) return;
        e.preventDefault();

        const pile = this.element.closest('.card-pile');
        if (!pile) return;

        const pileId = pile.id;
        const cards = Array.from(pile.querySelectorAll('.card'));
        const cardIndex = cards.indexOf(this.element);

        // Can only drag from tableau or waste
        if (pileId.startsWith('tableau')) {
            const tableauIndex = parseInt(pileId.split('-')[1]);
            const cardsInPile = tableau[tableauIndex];
            const cardPileIndex = cardsInPile.findIndex(c => c.element === this.element);

            if (cardPileIndex === -1) return;

            // Can only drag face-up cards and everything below them
            draggedCards = cardsInPile.slice(cardPileIndex);
            dragSource = { type: 'tableau', index: tableauIndex, cardIndex: cardPileIndex };
            startDrag(e, draggedCards);
        } else if (pileId === 'waste' && waste.length > 0 && waste[waste.length - 1] === this) {
            draggedCards = [this];
            dragSource = { type: 'waste' };
            startDrag(e, draggedCards);
        }
    }

    handleDoubleClick(e) {
        e.preventDefault();
        // Try to auto-move to foundation
        autoMoveToFoundation(this);
    }
}

// Create and shuffle deck
function createDeck() {
    const newDeck = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            newDeck.push(new Card(suit, rank));
        }
    }
    return shuffle(newDeck);
}

function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Initialize game
function initGame() {
    // Reset state
    deck = createDeck();
    stock = [];
    waste = [];
    foundations = [[], [], [], []];
    tableau = [[], [], [], [], [], [], []];
    score = 0;
    moves = 0;
    moveHistory = [];

    scoreElement.textContent = score;
    movesElement.textContent = moves;
    gameOverElement.classList.add('hidden');

    // Deal to tableau
    for (let col = 0; col < 7; col++) {
        for (let row = 0; row <= col; row++) {
            const card = deck.pop();
            if (row === col) {
                card.faceUp = true;
            }
            tableau[col].push(card);
        }
    }

    // Remaining cards go to stock
    stock = deck;

    // Start timer
    startTimer();

    // Render
    render();
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

// Render game
function render() {
    // Render stock
    renderPile('stock', stock, false);

    // Render waste
    renderPile('waste', waste, true);

    // Render foundations
    for (let i = 0; i < 4; i++) {
        renderPile(`foundation-${i}`, foundations[i], true);
    }

    // Render tableau
    for (let i = 0; i < 7; i++) {
        renderTableauPile(i);
    }
}

function renderPile(pileId, cards, showTop) {
    const pileElement = document.getElementById(pileId);
    pileElement.innerHTML = '';

    if (cards.length === 0) {
        pileElement.classList.add('empty');

        // Show placeholder for stock
        if (pileId === 'stock') {
            const placeholder = document.createElement('div');
            placeholder.className = 'card-placeholder reload';
            placeholder.textContent = '↻';
            pileElement.appendChild(placeholder);
        }
    } else {
        pileElement.classList.remove('empty');

        if (showTop && cards.length > 0) {
            const topCard = cards[cards.length - 1];
            pileElement.appendChild(topCard.createElement());
        } else if (pileId === 'stock') {
            // Show card back for stock
            const backCard = document.createElement('div');
            backCard.className = 'card face-down';
            backCard.innerHTML = '<div class="card-back"></div>';
            pileElement.appendChild(backCard);
        }
    }

    // Add click handler for stock
    if (pileId === 'stock') {
        pileElement.onclick = handleStockClick;
    }

    // Make foundations and tableau drop targets
    if (pileId.startsWith('foundation') || pileId.startsWith('tableau')) {
        setupDropZone(pileElement);
    }
}

function renderTableauPile(index) {
    const pileElement = document.getElementById(`tableau-${index}`);
    pileElement.innerHTML = '';

    const cards = tableau[index];

    if (cards.length === 0) {
        pileElement.classList.add('empty');
    } else {
        pileElement.classList.remove('empty');

        cards.forEach((card, i) => {
            const cardElement = card.createElement();
            cardElement.style.top = `${i * 30}px`;
            pileElement.appendChild(cardElement);
        });
    }

    setupDropZone(pileElement);
}

// Handle stock click
function handleStockClick() {
    if (stock.length > 0) {
        // Draw card from stock to waste
        const card = stock.pop();
        card.faceUp = true;
        waste.push(card);
        moves++;
        movesElement.textContent = moves;
    } else if (waste.length > 0) {
        // Reset: move all waste back to stock
        stock = waste.reverse();
        waste = [];
        stock.forEach(card => card.faceUp = false);
    }

    render();
}

// Drag and drop
let dragGhost = null;

function startDrag(e, cards) {
    dragGhost = document.createElement('div');
    dragGhost.className = 'drag-ghost';

    cards.forEach((card, i) => {
        const cardClone = card.element.cloneNode(true);
        cardClone.style.top = `${i * 30}px`;
        dragGhost.appendChild(cardClone);
    });

    dragGhost.style.left = `${e.pageX}px`;
    dragGhost.style.top = `${e.pageY}px`;
    document.body.appendChild(dragGhost);

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
}

function handleDragMove(e) {
    if (dragGhost) {
        dragGhost.style.left = `${e.pageX}px`;
        dragGhost.style.top = `${e.pageY}px`;
    }
}

function handleDragEnd(e) {
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);

    if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }

    // Find drop target
    const element = document.elementFromPoint(e.clientX, e.clientY);
    const dropPile = element ? element.closest('.card-pile') : null;

    if (dropPile && dragSource && draggedCards.length > 0) {
        handleDrop(dropPile.id);
    }

    draggedCards = [];
    dragSource = null;
}

function setupDropZone(element) {
    element.addEventListener('dragover', (e) => e.preventDefault());
}

function handleDrop(targetPileId) {
    if (targetPileId.startsWith('foundation')) {
        const foundationIndex = parseInt(targetPileId.split('-')[1]);
        if (canMoveToFoundation(draggedCards[0], foundationIndex) && draggedCards.length === 1) {
            performMove(dragSource, { type: 'foundation', index: foundationIndex });
        }
    } else if (targetPileId.startsWith('tableau')) {
        const tableauIndex = parseInt(targetPileId.split('-')[1]);
        if (canMoveToTableau(draggedCards, tableauIndex)) {
            performMove(dragSource, { type: 'tableau', index: tableauIndex });
        }
    }
}

// Move validation
function canMoveToFoundation(card, foundationIndex) {
    const foundation = foundations[foundationIndex];

    if (foundation.length === 0) {
        return card.value === 1; // Ace
    }

    const topCard = foundation[foundation.length - 1];
    return card.suit === topCard.suit && card.value === topCard.value + 1;
}

function canMoveToTableau(cards, tableauIndex) {
    const targetPile = tableau[tableauIndex];
    const movingCard = cards[0];

    if (targetPile.length === 0) {
        return movingCard.value === 13; // King
    }

    const topCard = targetPile[targetPile.length - 1];
    return movingCard.color !== topCard.color && movingCard.value === topCard.value - 1;
}

// Perform move
function performMove(source, target) {
    const movedCards = [];

    // Remove cards from source
    if (source.type === 'waste') {
        movedCards.push(waste.pop());
    } else if (source.type === 'tableau') {
        movedCards.push(...tableau[source.index].splice(source.cardIndex));

        // Flip top card if needed
        if (tableau[source.index].length > 0) {
            const topCard = tableau[source.index][tableau[source.index].length - 1];
            if (!topCard.faceUp) {
                topCard.flip();
            }
        }
    }

    // Add cards to target
    if (target.type === 'foundation') {
        foundations[target.index].push(...movedCards);
        score += 10;
    } else if (target.type === 'tableau') {
        tableau[target.index].push(...movedCards);
    }

    moves++;
    movesElement.textContent = moves;
    scoreElement.textContent = score;

    render();
    checkWin();
}

// Auto-move to foundation
function autoMoveToFoundation(card) {
    for (let i = 0; i < 4; i++) {
        if (canMoveToFoundation(card, i)) {
            // Find source
            let source = null;

            if (waste.length > 0 && waste[waste.length - 1] === card) {
                source = { type: 'waste' };
                draggedCards = [card];
            } else {
                for (let j = 0; j < 7; j++) {
                    const pile = tableau[j];
                    if (pile.length > 0 && pile[pile.length - 1] === card) {
                        source = { type: 'tableau', index: j, cardIndex: pile.length - 1 };
                        draggedCards = [card];
                        break;
                    }
                }
            }

            if (source) {
                performMove(source, { type: 'foundation', index: i });
                return;
            }
        }
    }
}

// Check win
function checkWin() {
    const allInFoundation = foundations.every(f => f.length === 13);

    if (allInFoundation) {
        clearInterval(timerInterval);
        finalScoreElement.textContent = score;
        finalMovesElement.textContent = moves;
        finalTimeElement.textContent = timeElement.textContent;
        gameOverElement.classList.remove('hidden');
    }
}

// Hint system
function showHint() {
    // Find any valid move
    // Check waste to foundation
    if (waste.length > 0) {
        const card = waste[waste.length - 1];
        for (let i = 0; i < 4; i++) {
            if (canMoveToFoundation(card, i)) {
                highlightMove(card.element, document.getElementById(`foundation-${i}`));
                return;
            }
        }
    }

    // Check tableau to foundation
    for (let i = 0; i < 7; i++) {
        if (tableau[i].length > 0) {
            const card = tableau[i][tableau[i].length - 1];
            if (card.faceUp) {
                for (let j = 0; j < 4; j++) {
                    if (canMoveToFoundation(card, j)) {
                        highlightMove(card.element, document.getElementById(`foundation-${j}`));
                        return;
                    }
                }
            }
        }
    }

    // Check tableau to tableau moves
    for (let i = 0; i < 7; i++) {
        const pile = tableau[i];
        for (let cardIndex = 0; cardIndex < pile.length; cardIndex++) {
            const card = pile[cardIndex];
            if (card.faceUp) {
                for (let j = 0; j < 7; j++) {
                    if (i !== j && canMoveToTableau([card], j)) {
                        highlightMove(card.element, document.getElementById(`tableau-${j}`));
                        return;
                    }
                }
            }
        }
    }

    alert('No hints available. Try drawing from the stock!');
}

function highlightMove(fromElement, toElement) {
    fromElement.classList.add('hint-highlight');
    toElement.classList.add('hint-target');

    setTimeout(() => {
        fromElement.classList.remove('hint-highlight');
        toElement.classList.remove('hint-target');
    }, 2000);
}

// Event listeners
newGameBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
hintBtn.addEventListener('click', showHint);

// Initialize game on load
initGame();