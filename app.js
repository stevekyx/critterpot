/**
 * Main Application Controller
 * Manages UI interactions and coordinates between modules
 */

class CritterpotApp {
    constructor() {
        this.solver = null;
        this.detector = null;
        this.editor = null;
        this.currentSolution = null;
        this.currentStepIndex = 0;
        this.boardCanvas = null;
        this.stepCanvas = null;
        this.tileColors = {};
    }

    /**
     * Initialize application
     */
    init() {
        this.initializeCanvases();
        this.initializeEventListeners();
        this.editor = new BoardEditor();
        this.editor.init('editorCanvas', 'elementSelect');
    }

    /**
     * Initialize canvas elements
     */
    initializeCanvases() {
        this.boardCanvas = document.getElementById('boardCanvas');
        this.stepCanvas = document.getElementById('stepCanvas');
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Solver tab
        document.getElementById('analyzeBtn').addEventListener('click', () => this.analyzeBoardImage());
        document.getElementById('nextStep').addEventListener('click', () => this.nextStep());
        document.getElementById('prevStep').addEventListener('click', () => this.prevStep());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadSteps());

        // Editor tab
        document.getElementById('clearEditorBtn').addEventListener('click', () => this.editor.clear());
        document.getElementById('solveEditorBtn').addEventListener('click', () => this.solveEditorBoard());

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        event.target.classList.add('active');
    }

    /**
     * Analyze uploaded board image
     */
    async analyzeBoardImage() {
        const fileInput = document.getElementById('screenshot');
        const file = fileInput.files[0];

        if (!file) {
            alert('Please select an image file');
            return;
        }

        try {
            this.updateStatus('Analyzing image...');

            // Detect board from image
            this.detector = new BoardDetector();
            const board = await this.detector.analyzeScreenshot(file);

            // Store element colors for visualization
            const elements = this.detector.getElements();
            elements.forEach((el, idx) => {
                this.tileColors[idx] = el.color;
            });

            // Draw original board
            this.drawBoard(this.boardCanvas, board, false);

            // Solve the board
            this.updateStatus('Solving...');
            this.solver = new MatchSolver(board);
            const solution = this.solver.findOptimalSolution();

            if (solution.success) {
                this.currentSolution = solution;
                this.currentStepIndex = 0;
                this.displaySolution(solution);
            } else {
                this.updateStatus('Board cannot be cleared');
                document.getElementById('movesCount').textContent = 'N/A';
            }
        } catch (error) {
            console.error('Error analyzing image:', error);
            this.updateStatus('Error: ' + error.message);
        }
    }

    /**
     * Display solution
     */
    displaySolution(solution) {
        document.getElementById('movesCount').textContent = solution.moves;
        this.updateStatus('Solution found!');

        // Show step controls
        const stepControls = document.getElementById('stepControls');
        stepControls.classList.remove('hidden');

        // Show download button
        document.getElementById('downloadBtn').classList.remove('hidden');

        // Display first step
        this.displayStep(0);
    }

    /**
     * Display specific step
     */
    displayStep(stepIndex) {
        if (!this.currentSolution || stepIndex < 0 || stepIndex > this.currentSolution.steps.length) {
            return;
        }

        this.currentStepIndex = stepIndex;
        let board, matchedTiles;

        if (stepIndex === 0) {
            // First step shows original board
            board = this.solver.board;
            matchedTiles = [];
        } else {
            const step = this.currentSolution.steps[stepIndex - 1];
            board = step.board;
            matchedTiles = step.matchedTiles;
        }

        // Draw step
        this.drawBoard(this.stepCanvas, board, true, matchedTiles);

        // Update step indicator
        document.getElementById('currentStep').textContent = stepIndex + 1;
        document.getElementById('stepIndicator').textContent = `Step ${stepIndex + 1}/${this.currentSolution.steps.length + 1}`;

        // Update button states
        document.getElementById('prevStep').disabled = stepIndex === 0;
        document.getElementById('nextStep').disabled = stepIndex >= this.currentSolution.steps.length;
    }

    /**
     * Go to next step
     */
    nextStep() {
        if (this.currentSolution && this.currentStepIndex < this.currentSolution.steps.length) {
            this.displayStep(this.currentStepIndex + 1);
        }
    }

    /**
     * Go to previous step
     */
    prevStep() {
        if (this.currentStepIndex > 0) {
            this.displayStep(this.currentStepIndex - 1);
        }
    }

    /**
     * Draw board on canvas
     */
    drawBoard(canvas, board, highlightMatches = false, matchedTiles = []) {
        const ctx = canvas.getContext('2d');
        const tileSize = 50;
        const boardSize = board.length;

        // Set canvas size
        canvas.width = tileSize * boardSize;
        canvas.height = tileSize * boardSize;

        // Draw background
        ctx.fillStyle = '#252d38';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        ctx.strokeStyle = '#3a4452';
        ctx.lineWidth = 1;
        for (let i = 0; i <= boardSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * tileSize, 0);
            ctx.lineTo(i * tileSize, canvas.height);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * tileSize);
            ctx.lineTo(canvas.width, i * tileSize);
            ctx.stroke();
        }

        // Draw tiles
        const matchedSet = new Set(matchedTiles.map(pos => `${pos[0]},${pos[1]}>`));

        for (let r = 0; r < boardSize; r++) {
            for (let c = 0; c < boardSize; c++) {
                if (board[r][c] !== null) {
                    const isMatched = matchedSet.has(`${r},${c}`);
                    this.drawTile(ctx, c, r, board[r][c], tileSize, isMatched);
                }
            }
        }
    }

    /**
     * Draw single tile
     */
    drawTile(ctx, col, row, elementId, tileSize, highlight = false) {
        const x = col * tileSize + 2;
        const y = row * tileSize + 2;
        const size = tileSize - 4;

        // Get color for element
        const colorMap = [
            '#ff6b6b', '#4ecdc4', '#95e77d', '#ffe66d',
            '#a78bfa', '#ff8c42', '#ff6b9d', '#00d4ff'
        ];
        const color = colorMap[elementId % colorMap.length];

        // Draw tile
        ctx.fillStyle = highlight ? '#ffff00' : color;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw highlight border if matched
        if (highlight) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    /**
     * Solve the board from manual editor
     */
    solveEditorBoard() {
        const board = this.editor.getBoard();

        // Check if board is empty
        if (board.every(row => row.every(cell => cell === null))) {
            alert('Board is empty');
            return;
        }

        // Solve
        try {
            this.updateStatus('Solving board...');
            this.solver = new MatchSolver(board);
            const solution = this.solver.findOptimalSolution();

            if (solution.success) {
                this.currentSolution = solution;
                this.currentStepIndex = 0;

                // Switch to solver tab and display results
                document.getElementById('solver').classList.add('active');
                document.getElementById('editor').classList.remove('active');
                document.querySelectorAll('.tab-btn')[0].classList.add('active');
                document.querySelectorAll('.tab-btn')[1].classList.remove('active');

                // Draw board
                this.drawBoard(this.boardCanvas, board, false);
                this.displaySolution(solution);
            } else {
                alert('Board cannot be cleared');
            }
        } catch (error) {
            console.error('Error solving:', error);
            alert('Error solving board: ' + error.message);
        }
    }

    /**
     * Download all steps as images
     */
    downloadSteps() {
        if (!this.currentSolution) return;

        alert('Download feature coming soon!');
        // TODO: Implement zip download of step images
    }

    /**
     * Update status message
     */
    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new CritterpotApp();
        app.init();
    });
} else {
    const app = new CritterpotApp();
    app.init();
}