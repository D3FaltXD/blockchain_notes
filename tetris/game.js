class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-canvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.holdCanvas = document.getElementById('hold-canvas');
        this.holdCtx = this.holdCanvas.getContext('2d');
        
        this.ROWS = 20;
        this.COLS = 10;
        this.BLOCK_SIZE = 30;
        
        this.board = this.createBoard();
        this.currentPiece = null;
        this.nextPiece = null;
        this.holdPiece = null;
        this.canHold = true;
        
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;
        
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameOver = false;
        
        this.pieces = this.initializePieces();
        this.bag = [];
        this.colors = {
            I: '#00f5ff',
            O: '#ffd700',
            T: '#da70d6',
            S: '#00ff00',
            Z: '#ff6347',
            J: '#1e90ff',
            L: '#ff8c00'
        };
        
        this.highScores = this.loadHighScores();
        this.soundEnabled = true;
        
        this.setupEventListeners();
        this.updateDisplay();
        this.updateHighScores();
        
        // Create particle system
        this.particles = [];
    }
    
    createBoard() {
        return Array(this.ROWS).fill().map(() => Array(this.COLS).fill(0));
    }
    
    initializePieces() {
        return {
            I: {
                shape: [
                    [0,0,0,0],
                    [1,1,1,1],
                    [0,0,0,0],
                    [0,0,0,0]
                ],
                color: 'I'
            },
            O: {
                shape: [
                    [1,1],
                    [1,1]
                ],
                color: 'O'
            },
            T: {
                shape: [
                    [0,1,0],
                    [1,1,1],
                    [0,0,0]
                ],
                color: 'T'
            },
            S: {
                shape: [
                    [0,1,1],
                    [1,1,0],
                    [0,0,0]
                ],
                color: 'S'
            },
            Z: {
                shape: [
                    [1,1,0],
                    [0,1,1],
                    [0,0,0]
                ],
                color: 'Z'
            },
            J: {
                shape: [
                    [1,0,0],
                    [1,1,1],
                    [0,0,0]
                ],
                color: 'J'
            },
            L: {
                shape: [
                    [0,0,1],
                    [1,1,1],
                    [0,0,0]
                ],
                color: 'L'
            }
        };
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('sound-btn').addEventListener('click', () => this.toggleSound());
    }
    
    getRandomPiece() {
        if (this.bag.length === 0) {
            this.bag = Object.keys(this.pieces).slice();
            this.shuffleArray(this.bag);
        }
        return this.bag.pop();
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    createPiece(type) {
        const piece = this.pieces[type];
        return {
            shape: piece.shape.map(row => [...row]),
            color: piece.color,
            x: Math.floor(this.COLS / 2) - Math.floor(piece.shape[0].length / 2),
            y: 0
        };
    }
    
    startGame() {
        this.gameRunning = true;
        this.gameOver = false;
        this.gamePaused = false;
        this.board = this.createBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = 1000;
        this.canHold = true;
        this.holdPiece = null;
        
        this.currentPiece = this.createPiece(this.getRandomPiece());
        this.nextPiece = this.createPiece(this.getRandomPiece());
        
        this.hideOverlay();
        this.updateDisplay();
        this.gameLoop();
    }
    
    restartGame() {
        this.startGame();
    }
    
    togglePause() {
        if (!this.gameRunning || this.gameOver) return;
        
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pause-btn');
        const icon = pauseBtn.querySelector('.btn-icon');
        const text = pauseBtn.querySelector('.btn-text');
        
        if (this.gamePaused) {
            icon.textContent = '▶';
            text.textContent = 'Resume';
            this.showOverlay('Game Paused', 'Press P to resume or click Resume');
        } else {
            icon.textContent = '⏸';
            text.textContent = 'Pause';
            this.hideOverlay();
            this.gameLoop();
        }
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const soundBtn = document.getElementById('sound-btn');
        const icon = soundBtn.querySelector('.btn-icon');
        const text = soundBtn.querySelector('.btn-text');
        
        if (this.soundEnabled) {
            icon.textContent = '🔊';
            text.textContent = 'Sound';
        } else {
            icon.textContent = '🔇';
            text.textContent = 'Muted';
        }
    }
    
    handleKeyPress(e) {
        if (!this.gameRunning || this.gameOver) return;
        
        if (e.key === 'p' || e.key === 'P') {
            this.togglePause();
            return;
        }
        
        if (this.gamePaused) return;
        
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1, 0);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1, 0);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.movePiece(0, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
            case 'c':
            case 'C':
                e.preventDefault();
                this.holdCurrentPiece();
                break;
        }
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (this.isValidPosition(this.currentPiece.shape, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            return true;
        }
        return false;
    }
    
    rotatePiece() {
        if (!this.currentPiece) return;
        
        const rotated = this.rotateMatrix(this.currentPiece.shape);
        
        if (this.isValidPosition(rotated, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = rotated;
        } else {
            // Try wall kicks
            const kicks = [[0, 0], [-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]];
            for (let [dx, dy] of kicks) {
                if (this.isValidPosition(rotated, this.currentPiece.x + dx, this.currentPiece.y + dy)) {
                    this.currentPiece.shape = rotated;
                    this.currentPiece.x += dx;
                    this.currentPiece.y += dy;
                    break;
                }
            }
        }
    }
    
    rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                rotated[j][rows - 1 - i] = matrix[i][j];
            }
        }
        
        return rotated;
    }
    
    hardDrop() {
        if (!this.currentPiece) return;
        
        let dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        
        this.score += dropDistance * 2;
        this.lockPiece();
    }
    
    holdCurrentPiece() {
        if (!this.canHold || !this.currentPiece) return;
        
        if (this.holdPiece) {
            const temp = this.holdPiece;
            this.holdPiece = {
                type: this.currentPiece.color,
                shape: this.pieces[this.currentPiece.color].shape
            };
            this.currentPiece = this.createPiece(temp.type);
        } else {
            this.holdPiece = {
                type: this.currentPiece.color,
                shape: this.pieces[this.currentPiece.color].shape
            };
            this.spawnNextPiece();
        }
        
        this.canHold = false;
    }
    
    isValidPosition(shape, x, y) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
                        return false;
                    }
                    
                    if (newY >= 0 && this.board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    lockPiece() {
        if (!this.currentPiece) return;
        
        // Place piece on board
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const x = this.currentPiece.x + col;
                    const y = this.currentPiece.y + row;
                    
                    if (y >= 0) {
                        this.board[y][x] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnNextPiece();
        this.canHold = true;
        
        // Check game over
        if (!this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y)) {
            this.endGame();
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                // Create particles for line clear
                this.createLineClearParticles(row);
                
                this.board.splice(row, 1);
                this.board.unshift(Array(this.COLS).fill(0));
                row++; // Check same row again
                linesCleared++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.calculateScore(linesCleared);
            this.updateLevel();
            this.updateDisplay();
            
            // Add screen shake effect for line clears
            if (linesCleared >= 4) {
                this.canvas.classList.add('shake');
                setTimeout(() => this.canvas.classList.remove('shake'), 500);
            }
        }
    }
    
    createLineClearParticles(row) {
        for (let col = 0; col < this.COLS; col++) {
            const x = col * this.BLOCK_SIZE + this.BLOCK_SIZE / 2;
            const y = row * this.BLOCK_SIZE + this.BLOCK_SIZE / 2;
            
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: x + (Math.random() - 0.5) * this.BLOCK_SIZE,
                    y: y + (Math.random() - 0.5) * this.BLOCK_SIZE,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    life: 1,
                    decay: 0.02,
                    color: this.colors[this.board[row][col]] || '#ffffff'
                });
            }
        }
    }
    
    calculateScore(linesCleared) {
        const baseScore = [0, 40, 100, 300, 1200];
        this.score += baseScore[linesCleared] * this.level;
    }
    
    updateLevel() {
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 50);
        }
    }
    
    spawnNextPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece(this.getRandomPiece());
    }
    
    endGame() {
        this.gameOver = true;
        this.gameRunning = false;
        this.saveHighScore();
        this.updateHighScores();
        this.showOverlay('Game Over!', `Final Score: ${this.score.toLocaleString()}`, true);
    }
    
    gameLoop(time = 0) {
        if (!this.gameRunning || this.gamePaused || this.gameOver) return;
        
        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.dropCounter = 0;
        }
        
        this.updateParticles();
        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
            return particle.life > 0;
        });
    }
    
    draw() {
        this.drawBoard();
        this.drawCurrentPiece();
        this.drawNextPiece();
        this.drawHoldPiece();
        this.drawParticles();
    }
    
    drawBoard() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        for (let row = 0; row <= this.ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.BLOCK_SIZE);
            this.ctx.lineTo(this.canvas.width, row * this.BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        for (let col = 0; col <= this.COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.BLOCK_SIZE, 0);
            this.ctx.lineTo(col * this.BLOCK_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Draw placed pieces
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.colors[this.board[row][col]]);
                }
            }
        }
    }
    
    drawCurrentPiece() {
        if (!this.currentPiece) return;
        
        // Draw ghost piece
        let ghostY = this.currentPiece.y;
        while (this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, ghostY + 1)) {
            ghostY++;
        }
        
        this.ctx.globalAlpha = 0.3;
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    this.drawBlock(
                        this.currentPiece.x + col,
                        ghostY + row,
                        this.colors[this.currentPiece.color]
                    );
                }
            }
        }
        this.ctx.globalAlpha = 1;
        
        // Draw current piece
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    this.drawBlock(
                        this.currentPiece.x + col,
                        this.currentPiece.y + row,
                        this.colors[this.currentPiece.color]
                    );
                }
            }
        }
    }
    
    drawBlock(x, y, color) {
        const pixelX = x * this.BLOCK_SIZE;
        const pixelY = y * this.BLOCK_SIZE;
        
        // Create gradient
        const gradient = this.ctx.createLinearGradient(
            pixelX, pixelY,
            pixelX + this.BLOCK_SIZE, pixelY + this.BLOCK_SIZE
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, this.darkenColor(color, 0.3));
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(pixelX + 1, pixelY + 1, this.BLOCK_SIZE - 2, this.BLOCK_SIZE - 2);
        
        // Add border
        this.ctx.strokeStyle = this.lightenColor(color, 0.2);
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(pixelX + 0.5, pixelY + 0.5, this.BLOCK_SIZE - 1, this.BLOCK_SIZE - 1);
    }
    
    drawNextPiece() {
        this.nextCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        if (!this.nextPiece) return;
        
        const shape = this.pieces[this.nextPiece.color].shape;
        const blockSize = 20;
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    this.nextCtx.fillStyle = this.colors[this.nextPiece.color];
                    this.nextCtx.fillRect(x, y, blockSize - 1, blockSize - 1);
                }
            }
        }
    }
    
    drawHoldPiece() {
        this.holdCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.holdCtx.fillRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
        
        if (!this.holdPiece) return;
        
        const shape = this.holdPiece.shape;
        const blockSize = 20;
        const offsetX = (this.holdCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.holdCanvas.height - shape.length * blockSize) / 2;
        
        this.holdCtx.globalAlpha = this.canHold ? 1 : 0.5;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const x = offsetX + col * blockSize;
                    const y = offsetY + row * blockSize;
                    
                    this.holdCtx.fillStyle = this.colors[this.holdPiece.type];
                    this.holdCtx.fillRect(x, y, blockSize - 1, blockSize - 1);
                }
            }
        }
        
        this.holdCtx.globalAlpha = 1;
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
        this.ctx.globalAlpha = 1;
    }
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
    
    lightenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.min(255, parseInt(hex.substr(0, 2), 16) * (1 + amount));
        const g = Math.min(255, parseInt(hex.substr(2, 2), 16) * (1 + amount));
        const b = Math.min(255, parseInt(hex.substr(4, 2), 16) * (1 + amount));
        return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
    }
    
    updateDisplay() {
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    showOverlay(title, message, showRestart = false) {
        const overlay = document.getElementById('game-overlay');
        const overlayTitle = document.getElementById('overlay-title');
        const overlayMessage = document.getElementById('overlay-message');
        const startBtn = document.getElementById('start-btn');
        const restartBtn = document.getElementById('restart-btn');
        
        overlayTitle.textContent = title;
        overlayMessage.textContent = message;
        
        if (showRestart) {
            startBtn.style.display = 'none';
            restartBtn.style.display = 'inline-block';
        } else {
            startBtn.style.display = this.gameRunning ? 'none' : 'inline-block';
            restartBtn.style.display = 'none';
        }
        
        overlay.style.display = 'flex';
    }
    
    hideOverlay() {
        const overlay = document.getElementById('game-overlay');
        overlay.style.display = 'none';
    }
    
    saveHighScore() {
        this.highScores.push(this.score);
        this.highScores.sort((a, b) => b - a);
        this.highScores = this.highScores.slice(0, 3);
        localStorage.setItem('tetris-high-scores', JSON.stringify(this.highScores));
    }
    
    loadHighScores() {
        const saved = localStorage.getItem('tetris-high-scores');
        return saved ? JSON.parse(saved) : [0, 0, 0];
    }
    
    updateHighScores() {
        const scoresList = document.getElementById('high-scores-list');
        const entries = scoresList.querySelectorAll('.score-entry .score');
        
        entries.forEach((entry, index) => {
            entry.textContent = this.highScores[index].toLocaleString();
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});