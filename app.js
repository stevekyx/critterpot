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
    }

    /**
     * Initialize application
     */
    init() {
        this.boardCanvas = document.getElementById('boardCanvas');
        this.stepCanvas = document.getElementById('stepCanvas');
        
        // Initialize board editor
        this.editor = new BoardEditor();
        this.editor.init('boardCanvas', 'elementSelect');

        // Initialize event listeners
        this.initializeEventListeners();
        
        // Initial status
        this.updateStatus('Ready', false);
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const solveBtn = document.getElementById('solveBtn');
        const clearBoardBtn = document.getElementById('clearBoardBtn');
        
        if (analyzeBtn) analyzeBtn.addEventListener('click', () => this.analyzeBoardImage());
        if (solveBtn) solveBtn.addEventListener('click', () => this.solveBoard());
        if (clearBoardBtn) clearBoardBtn.addEventListener('click', () => this.editor.clear());
        
        const nextBtn = document.getElementById('nextStep');
        const prevBtn = document.getElementById('prevStep');
        const downloadBtn = document.getElementById('downloadBtn');
        
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadSteps());
    }

    /**
     * Update status message
     */
    updateStatus(message, isLoading = false) {
        const statusText = document.getElementById('statusText');
        const statusIcon = document.getElementById('statusIcon');
        
        if (statusText) statusText.textContent = message;
        if (statusIcon) {\n            if (isLoading) {\n                statusIcon.classList.add('loading');\n            } else {\n                statusIcon.classList.remove('loading');\n            }\n        }\n    }\n\n    /**\n     * Analyze uploaded board image\n     */\n    async analyzeBoardImage() {\n        const fileInput = document.getElementById('screenshot');\n        const file = fileInput.files[0];\n\n        if (!file) {\n            alert('Please select an image file');\n            return;\n        }\n\n        try {\n            this.updateStatus('Loading image...', true);\n            const analyzeBtn = document.getElementById('analyzeBtn');\n            if (analyzeBtn) analyzeBtn.disabled = true;\n\n            // Allow UI to update\n            await new Promise(resolve => setTimeout(resolve, 100));\n\n            this.updateStatus('Analyzing image...', true);\n\n            // Detect board from image\n            this.detector = new BoardDetector();\n            const board = await this.detector.analyzeScreenshot(file);\n\n            // Set the detected board in the editor\n            this.editor.setBoard(board);\n\n            this.updateStatus('Ready to solve', false);\n            \n            // Clear any previous solution\n            const solutionSection = document.querySelector('.solution-section');\n            if (solutionSection) solutionSection.classList.add('hidden');\n        } catch (error) {\n            console.error('Error analyzing image:', error);\n            this.updateStatus('Error: ' + error.message, false);\n            alert('Error analyzing image: ' + error.message);\n        } finally {\n            const analyzeBtn = document.getElementById('analyzeBtn');\n            if (analyzeBtn) analyzeBtn.disabled = false;\n        }\n    }\n\n    /**\n     * Solve the current board\n     */\n    async solveBoard() {\n        const board = this.editor.getBoard();\n\n        // Check if board is empty\n        if (board.every(row => row.every(cell => cell === null))) {\n            alert('Board is empty');\n            return;\n        }\n\n        try {\n            this.updateStatus('Solving board...', true);\n            const solveBtn = document.getElementById('solveBtn');\n            if (solveBtn) solveBtn.disabled = true;\n\n            // Allow UI to update\n            await new Promise(resolve => setTimeout(resolve, 100));\n\n            this.solver = new MatchSolver(board);\n            const solution = await this.solveBoardAsync();\n\n            if (solution.success) {\n                this.currentSolution = solution;\n                this.currentStepIndex = 0;\n                this.displaySolution(solution);\n                this.updateStatus('Solution found!', false);\n            } else {\n                this.updateStatus('Board cannot be cleared', false);\n                alert('Board cannot be cleared');\n            }\n        } catch (error) {\n            console.error('Error solving:', error);\n            this.updateStatus('Error solving board', false);\n            alert('Error solving board: ' + error.message);\n        } finally {\n            const solveBtn = document.getElementById('solveBtn');\n            if (solveBtn) solveBtn.disabled = false;\n        }\n    }\n\n    /**\n     * Solve board asynchronously\n     */\n    async solveBoardAsync() {\n        return new Promise((resolve) => {\n            setTimeout(() => {\n                try {\n                    const solution = this.solver.findOptimalSolution();\n                    resolve(solution);\n                } catch (error) {\n                    console.error('Solver error:', error);\n                    resolve({ steps: [], moves: -1, success: false });\n                }\n            }, 50);\n        });\n    }\n\n    /**\n     * Display solution\n     */\n    displaySolution(solution) {\n        const movesCount = document.getElementById('movesCount');\n        if (movesCount) movesCount.textContent = solution.moves;\n        \n        // Show solution section\n        const solutionSection = document.querySelector('.solution-section');\n        if (solutionSection) solutionSection.classList.remove('hidden');\n\n        // Show step controls\n        const stepControls = document.getElementById('stepControls');\n        if (stepControls) stepControls.classList.remove('hidden');\n\n        // Show download button\n        const downloadBtn = document.getElementById('downloadBtn');\n        if (downloadBtn) downloadBtn.classList.remove('hidden');\n\n        // Display first step\n        this.displayStep(0);\n    }\n\n    /**\n     * Display specific step\n     */\n    displayStep(stepIndex) {\n        if (!this.currentSolution || stepIndex < 0 || stepIndex > this.currentSolution.steps.length) {\n            return;\n        }\n\n        this.currentStepIndex = stepIndex;\n        let board, matchedTiles;\n\n        if (stepIndex === 0) {\n            // First step shows original board\n            board = this.solver.board;\n            matchedTiles = [];\n        } else {\n            const step = this.currentSolution.steps[stepIndex - 1];\n            board = step.board;\n            matchedTiles = step.matchedTiles;\n        }\n\n        // Draw step\n        this.drawBoard(this.stepCanvas, board, true, matchedTiles);\n\n        // Update step indicator\n        const currentStep = document.getElementById('currentStep');\n        const stepIndicator = document.getElementById('stepIndicator');\n        \n        if (currentStep) currentStep.textContent = stepIndex + 1;\n        if (stepIndicator) stepIndicator.textContent = `Step ${stepIndex + 1}/${this.currentSolution.steps.length + 1}`;\n\n        // Update button states\n        const prevBtn = document.getElementById('prevStep');\n        const nextBtn = document.getElementById('nextStep');\n        \n        if (prevBtn) prevBtn.disabled = stepIndex === 0;\n        if (nextBtn) nextBtn.disabled = stepIndex >= this.currentSolution.steps.length;\n    }\n\n    /**\n     * Go to next step\n     */\n    nextStep() {\n        if (this.currentSolution && this.currentStepIndex < this.currentSolution.steps.length) {\n            this.displayStep(this.currentStepIndex + 1);\n        }\n    }\n\n    /**\n     * Go to previous step\n     */\n    prevStep() {\n        if (this.currentStepIndex > 0) {\n            this.displayStep(this.currentStepIndex - 1);\n        }\n    }\n\n    /**\n     * Draw board on canvas\n     */\n    drawBoard(canvas, board, highlightMatches = false, matchedTiles = []) {\n        const ctx = canvas.getContext('2d');\n        const tileSize = 50;\n        const boardSize = board.length;\n\n        // Set canvas size\n        canvas.width = tileSize * boardSize;\n        canvas.height = tileSize * boardSize;\n\n        // Draw background\n        ctx.fillStyle = '#252d38';\n        ctx.fillRect(0, 0, canvas.width, canvas.height);\n\n        // Draw grid\n        ctx.strokeStyle = '#3a4452';\n        ctx.lineWidth = 1;\n        for (let i = 0; i <= boardSize; i++) {\n            ctx.beginPath();\n            ctx.moveTo(i * tileSize, 0);\n            ctx.lineTo(i * tileSize, canvas.height);\n            ctx.stroke();\n\n            ctx.beginPath();\n            ctx.moveTo(0, i * tileSize);\n            ctx.lineTo(canvas.width, i * tileSize);\n            ctx.stroke();\n        }\n\n        // Draw tiles\n        const matchedSet = new Set(matchedTiles.map(pos => `${pos[0]},${pos[1]}`));\n\n        for (let r = 0; r < boardSize; r++) {\n            for (let c = 0; c < boardSize; c++) {\n                if (board[r][c] !== null) {\n                    const isMatched = matchedSet.has(`${r},${c}`);\n                    this.drawTile(ctx, c, r, board[r][c], tileSize, isMatched);\n                }\n            }\n        }\n    }\n\n    /**\n     * Draw single tile\n     */\n    drawTile(ctx, col, row, elementId, tileSize, highlight = false) {\n        const x = col * tileSize + 2;\n        const y = row * tileSize + 2;\n        const size = tileSize - 4;\n\n        // Get color for element\n        const colorMap = [\n            '#ff6b6b', '#4ecdc4', '#95e77d', '#ffe66d',\n            '#a78bfa', '#ff8c42', '#ff6b9d', '#00d4ff'\n        ];\n        const color = colorMap[elementId % colorMap.length];\n\n        // Draw tile\n        ctx.fillStyle = highlight ? '#ffff00' : color;\n        ctx.beginPath();\n        ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);\n        ctx.fill();\n\n        // Draw highlight border if matched\n        if (highlight) {\n            ctx.strokeStyle = '#ff0000';\n            ctx.lineWidth = 3;\n            ctx.stroke();\n        } else {\n            ctx.strokeStyle = '#fff';\n            ctx.lineWidth = 1;\n            ctx.stroke();\n        }\n    }\n\n    /**\n     * Download all steps as images\n     */\n    downloadSteps() {\n        if (!this.currentSolution) return;\n        alert('Download feature coming soon!');\n    }\n}\n\n// Initialize app when DOM is ready\nif (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', () => {\n        const app = new CritterpotApp();\n        app.init();\n    });\n} else {\n    const app = new CritterpotApp();\n    app.init();\n}