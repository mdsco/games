# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A collection of 6 browser-based arcade games built with vanilla HTML5, CSS3, and JavaScript — no frameworks, no build tools, no dependencies.

**Games:** Tetris, Snake, Solitaire, 2048, Flappy Bird, Sudoku

## Running the Project

No build step required. Open any file directly in a browser:
- `index.html` — redirects to the dashboard
- `dashboard.html` — game selection hub
- `games/{game-name}/{game-name}.html` — individual games

For development, use a local static file server (e.g., `python3 -m http.server`) if you need relative paths to behave consistently, though files open directly from disk as well.

## Architecture

**Hub-spoke model:** `dashboard.html` links to 6 self-contained game directories under `games/`. Each game is fully independent — its own HTML, CSS, and JS file with no cross-game dependencies.

**Shared resource:** `shared/common.css` provides reusable UI components (buttons, score panels, game-over overlay, control info boxes) used by all games.

**Rendering approach per game:**
- Canvas API: Tetris, Snake, Flappy Bird
- DOM-based tiles/elements: 2048, Solitaire, Sudoku

**Game loop patterns:**
- `requestAnimationFrame`: Tetris, Flappy Bird
- `setInterval`: Snake

**Persistence:** Snake and Flappy Bird store high/best scores in `localStorage`. All other games are session-only.

## Visual Design Conventions

All games share a consistent visual theme:
- Background gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- White card containers with box shadows and rounded corners
- Score/stats displayed in side info panels
- Game-over overlay rendered on top of the game area
- "Back to Menu" nav link in every game

When adding a new game, follow the existing `games/{name}/{name}.html|js|css` structure and import `../../shared/common.css` for the shared UI components.
