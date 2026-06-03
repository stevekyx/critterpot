/**
 * Board Detection from Screenshot
 * Identifies 8x8 grid elements from uploaded image using icon/sprite recognition
 */

class BoardDetector {
    constructor() {
        this.tileSize = 0;
        this.boardOffset = { x: 0, y: 0 };
        this.detectedElements = [];
        this.elementTemplates = new Map();
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

        // Extract the board grid with icon recognition
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
     * Extract 8x8 grid of elements from image with icon recognition
     */
    extractBoardGrid(ctx) {
        const board = [];
        const iconSignatures = {}; // Map icon signatures to element IDs
        let elementId = 0;

        // First pass: collect all tile signatures
        for (let r = 0; r < 8; r++) {
            const row = [];
            for (let c = 0; c < 8; c++) {
                const tileX = this.boardOffset.x + c * this.tileSize;
                const tileY = this.boardOffset.y + r * this.tileSize;

                const signature = this.getTileSignature(ctx, tileX, tileY, this.tileSize);

                if (this.isEmptyTile(signature)) {
                    row.push(null);
                } else {
                    // Find or create element ID for this signature
                    const sigKey = JSON.stringify(signature);
                    
                    if (!iconSignatures[sigKey]) {
                        iconSignatures[sigKey] = elementId++;
                    }
                    
                    const id = iconSignatures[sigKey];
                    row.push(id);
                    
                    // Store element info
                    if (!this.detectedElements[id]) {
                        this.detectedElements[id] = {
                            signature,
                            color: signature.dominantColor,
                            name: `Element ${id}`
                        };
                    }
                }
            }
            board.push(row);
        }

        return board;
    }

    /**\n     * Get a multi-feature signature of a tile for icon recognition\n     */\n    getTileSignature(ctx, x, y, size) {\n        try {\n            const imageData = ctx.getImageData(x, y, size, size);\n            const data = imageData.data;\n\n            // Extract multiple features for better icon recognition\n            let r = 0, g = 0, b = 0;\n            let edgePixels = 0;\n            let centerPixels = 0;\n            let colorVariance = 0;\n            const colorBuckets = {}; // Histogram of colors\n            let count = 0;\n\n            // Analyze pixels with stride for efficiency\n            for (let i = 0; i < data.length; i += 16) {\n                const pr = data[i];\n                const pg = data[i + 1];\n                const pb = data[i + 2];\n\n                r += pr;\n                g += pg;\n                b += pb;\n\n                // Quantize color to bucket (for histogram)\n                const colorKey = `${Math.floor(pr / 50)},${Math.floor(pg / 50)},${Math.floor(pb / 50)}`;\n                colorBuckets[colorKey] = (colorBuckets[colorKey] || 0) + 1;\n\n                count++;\n            }\n\n            if (count === 0) {\n                return { brightness: 200, dominantColor: { r: 200, g: 200, b: 200 } };\n            }\n\n            const avgR = Math.round(r / count);\n            const avgG = Math.round(g / count);\n            const avgB = Math.round(b / count);\n\n            // Calculate color variance (how many different colors in tile)\n            const uniqueColors = Object.keys(colorBuckets).length;\n\n            return {\n                dominantColor: { r: avgR, g: avgG, b: avgB },\n                brightness: (avgR + avgG + avgB) / 3,\n                uniqueColors,\n                colorProfile: Object.entries(colorBuckets)\n                    .sort((a, b) => b[1] - a[1])\n                    .slice(0, 3) // Top 3 colors\n                    .map(([key, count]) => key)\n            };\n        } catch (error) {\n            return { brightness: 200, dominantColor: { r: 200, g: 200, b: 200 } };\n        }\n    }\n\n    /**\n     * Check if tile is empty (light colored background)\n     */\n    isEmptyTile(signature) {\n        const brightness = signature.brightness || 200;\n        const dominantColor = signature.dominantColor || {};\n\n        // Very light (background) or very green (board background)\n        const isLight = brightness > 200;\n        const isGreen = (dominantColor.g || 0) > (dominantColor.r || 0) &&\n                        (dominantColor.g || 0) > (dominantColor.b || 0) &&\n                        (dominantColor.g || 0) > 150;\n\n        return isLight || isGreen;\n    }\n\n    /**\n     * Get detected elements\n     */\n    getElements() {\n        return this.detectedElements.filter(el => el !== undefined);\n    }\n}\n\n// Export for use in other modules\nif (typeof module !== 'undefined' && module.exports) {\n    module.exports = BoardDetector;\n}