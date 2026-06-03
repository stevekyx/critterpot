/**
 * Board Detection from Screenshot
 * Identifies 8x8 grid elements from uploaded image
 */

class BoardDetector {
    constructor() {
        this.tileSize = 0;
        this.boardOffset = { x: 0, y: 0 };
        this.elementColors = {};
        this.detectedElements = [];
    }

    /**
     * Load image and analyze it
     */
    async analyzeScreenshot(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const board = this.detectBoardElements(img);
                    resolve(board);
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Detect board elements from canvas image data
     */
    detectBoardElements(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Estimate tile size (assuming 8x8 board, find largest square area)
        const estimatedTileSize = Math.min(img.width, img.height) / 8;
        this.tileSize = Math.round(estimatedTileSize);

        // Analyze board to find grid alignment
        this.findBoardOffset(ctx, img.width, img.height);

        // Detect colors/elements in each tile
        const board = this.extractBoardGrid(ctx);

        return board;
    }

    /**
     * Find where the board starts (offset from image edges)
     */
    findBoardOffset(ctx, width, height) {
        // Simple heuristic: find largest continuous dark region
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // For now, assume board starts near center or from analysis
        // This is a simplification - production would need more robust detection
        const margin = this.tileSize * 0.5;
        this.boardOffset.x = Math.max(0, (width - this.tileSize * 8) / 2);
        this.boardOffset.y = Math.max(0, (height - this.tileSize * 8) / 2);
    }

    /**
     * Extract 8x8 grid of elements from image
     */
    extractBoardGrid(ctx) {
        const board = [];
        const elementMap = {}; // Map colors to element IDs
        let elementCount = 0;

        for (let r = 0; r < 8; r++) {
            const row = [];
            for (let c = 0; c < 8; c++) {
                const color = this.getTileDominantColor(
                    ctx,
                    this.boardOffset.x + c * this.tileSize,
                    this.boardOffset.y + r * this.tileSize,
                    this.tileSize
                );

                // Check if tile is empty (very light/white)
                if (this.isEmptyTile(color)) {
                    row.push(null);
                } else {
                    // Map color to element ID
                    const colorKey = this.colorToKey(color);
                    if (!elementMap[colorKey]) {
                        elementMap[colorKey] = elementCount++;
                    }
                    row.push(elementMap[colorKey]);
                    this.detectedElements[elementMap[colorKey]] = { color, name: `Element ${elementMap[colorKey]}` };
                }
            }
            board.push(row);
        }

        return board;
    }

    /**
     * Get dominant color in a tile
     */
    getTileDominantColor(ctx, x, y, size) {
        const imageData = ctx.getImageData(x, y, size, size);
        const data = imageData.data;

        let r = 0, g = 0, b = 0, count = 0;

        // Sample pixels (skip every other to speed up)
        for (let i = 0; i < data.length; i += 8) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
        }

        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
        };
    }

    /**
     * Check if tile is empty (light colored)
     */
    isEmptyTile(color) {
        const brightness = (color.r + color.g + color.b) / 3;
        return brightness > 200; // Threshold for empty tiles
    }

    /**
     * Convert RGB to comparable key
     */
    colorToKey(color) {
        // Quantize to nearest 10 for color grouping
        const r = Math.round(color.r / 10) * 10;
        const g = Math.round(color.g / 10) * 10;
        const b = Math.round(color.b / 10) * 10;
        return `${r},${g},${b}`;
    }

    /**
     * Get detected elements
     */
    getElements() {
        return this.detectedElements;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoardDetector;
}