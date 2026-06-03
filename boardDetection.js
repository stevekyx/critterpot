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
                    try {
                        const board = this.detectBoardElements(img);
                        resolve(board);
                    } catch (error) {
                        reject(error);
                    }
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

        // Find the game board area first
        const boardArea = this.findBoardArea(ctx, img.width, img.height);
        
        // Estimate tile size from board area
        this.tileSize = Math.round(boardArea.width / 8);
        this.boardOffset = { x: boardArea.x, y: boardArea.y };

        // Extract the board grid
        const board = this.extractBoardGrid(ctx);

        return board;
    }

    /**
     * Find the main game board area by detecting color consistency
     */
    findBoardArea(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Scan for green background (typical game board color)
        let greenPixels = [];

        // Sample every 10th pixel for speed
        for (let i = 0; i < data.length; i += 40) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Check if pixel is greenish (game background)
            if (g > r && g > b && g > 100) {
                const pixelIndex = i / 4;
                const x = pixelIndex % width;
                const y = Math.floor(pixelIndex / width);
                greenPixels.push({ x, y });
            }
        }

        if (greenPixels.length === 0) {
            // Fallback: assume board is in center
            const margin = Math.min(width, height) * 0.1;
            return {
                x: margin,
                y: margin,
                width: width - margin * 2,
                height: height - margin * 2
            };
        }

        // Find bounding box of green pixels
        let minX = width, maxX = 0, minY = height, maxY = 0;
        greenPixels.forEach(p => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Extract 8x8 grid of elements from image
     */
    extractBoardGrid(ctx) {
        const board = [];
        const colorClusters = {}; // Group similar colors
        let elementId = 0;

        for (let r = 0; r < 8; r++) {
            const row = [];
            for (let c = 0; c < 8; c++) {
                const tileX = this.boardOffset.x + c * this.tileSize;
                const tileY = this.boardOffset.y + r * this.tileSize;

                const color = this.getTileDominantColor(ctx, tileX, tileY, this.tileSize);

                // Check if tile is empty (very light - background)
                if (this.isEmptyTile(color)) {
                    row.push(null);
                } else {
                    // Find or create color cluster
                    const clusterId = this.findColorCluster(color, colorClusters);
                    row.push(clusterId);
                    this.detectedElements[clusterId] = { color, name: `Element ${clusterId}` };
                }
            }
            board.push(row);
        }

        return board;
    }

    /**
     * Find or create color cluster for similar colors
     */
    findColorCluster(color, clusters, threshold = 40) {
        // Check existing clusters
        for (const [clusterId, clusterColor] of Object.entries(clusters)) {
            if (this.colorDistance(color, clusterColor) < threshold) {
                return parseInt(clusterId);
            }
        }

        // Create new cluster
        const newId = Object.keys(clusters).length;
        clusters[newId] = color;
        return newId;
    }

    /**
     * Calculate Euclidean distance between two RGB colors
     */
    colorDistance(color1, color2) {
        const dr = color1.r - color2.r;
        const dg = color1.g - color2.g;
        const db = color1.b - color2.b;
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * Get dominant color in a tile
     */
    getTileDominantColor(ctx, x, y, size) {
        try {
            const imageData = ctx.getImageData(x, y, size, size);
            const data = imageData.data;

            let r = 0, g = 0, b = 0, count = 0;

            // Sample every 4th pixel to speed up
            for (let i = 0; i < data.length; i += 16) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }

            if (count === 0) return { r: 200, g: 200, b: 200 };

            return {
                r: Math.round(r / count),
                g: Math.round(g / count),
                b: Math.round(b / count)
            };
        } catch (error) {
            // Out of bounds - return neutral color
            return { r: 200, g: 200, b: 200 };
        }
    }

    /**
     * Check if tile is empty (light colored background)
     */
    isEmptyTile(color) {
        const brightness = (color.r + color.g + color.b) / 3;
        // Check if it's very light (background) or very similar to green background
        const isLight = brightness > 200;
        const isGreen = color.g > color.r && color.g > color.b && color.g > 150;
        return isLight || isGreen;
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