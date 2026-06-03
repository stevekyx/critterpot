/**
 * Manual Board Editor
 * Allows users to manually create/edit board state
 */

class BoardEditor {
    constructor() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        this.tileSize = 50;
        this.selectedElement = null;
        this.elements = [
            { id: 0, name: 'Red', color: '#ff6b6b' },
            { id: 1, name: 'Blue', color: '#4ecdc4' },
            { id: 2, name: 'Green', color: '#95e77d' },
            { id: 3, name: 'Yellow', color: '#ffe66d' },
            { id: 4, name: 'Purple', color: '#a78bfa' },
            { id: 5, name: 'Orange', color: '#ff8c42' },
            { id: 6, name: 'Pink', color: '#ff6b9d' },
            { id: 7, name: 'Cyan', color: '#00d4ff' }
        ];
    }

    /**
     * Initialize editor canvas and controls
     */
    init(canvasId, selectId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.selectElement = document.getElementById(selectId);

        // Set canvas size
        this.canvas.width = this.tileSize * 8;
        this.canvas.height = this.tileSize * 8;

        // Populate element select
        this.populateElementSelect();

        // Add event listeners
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.selectElement.addEventListener('change', (e) => {
            this.selectedElement = e.target.value === '' ? null : parseInt(e.target.value);
        });

        // Initial draw
        this.draw();
    }

    /**
     * Populate element select dropdown
     */
    populateElementSelect() {
        this.elements.forEach(element => {
            const option = document.createElement('option');
            option.value = element.id;
            option.textContent = element.name;
            this.selectElement.appendChild(option);
        });
    }

    /**
     * Handle canvas click to place/remove elements
     */
    handleCanvasClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);

        if (row >= 0 && row < 8 && col >= 0 && col < 8) {
            if (this.selectedElement === null) {
                this.board[row][col] = null;
            } else {
                this.board[row][col] = this.selectedElement;
            }
            this.draw();
        }
    }

    /**
     * Draw the board
     */
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#252d38';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#3a4452';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= 8; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.tileSize, 0);
            this.ctx.lineTo(i * this.tileSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.tileSize);
            this.ctx.lineTo(this.canvas.width, i * this.tileSize);
            this.ctx.stroke();
        }

        // Draw elements
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.board[r][c] !== null) {
                    this.drawTile(c, r, this.board[r][c]);
                }
            }
        }
    }

    /**
     * Draw a single tile with element
     */
    drawTile(col, row, elementId) {
        const x = col * this.tileSize + 2;
        const y = row * this.tileSize + 2;
        const size = this.tileSize - 4;
        const element = this.elements[elementId];

        // Draw background circle
        this.ctx.fillStyle = element.color;
        this.ctx.beginPath();
        this.ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Draw element ID/text
        this.ctx.fillStyle = '#000';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(elementId, x + size / 2, y + size / 2);
    }

    /**
     * Get current board state
     */
    getBoard() {
        return JSON.parse(JSON.stringify(this.board));
    }

    /**
     * Set board state
     */
    setBoard(board) {
        this.board = JSON.parse(JSON.stringify(board));
        this.draw();
    }

    /**
     * Clear board
     */
    clear() {
        this.board = Array(8).fill(null).map(() => Array(8).fill(null));
        this.draw();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoardEditor;
}