/**
 * Optimal Move Solver for Match-Drop Game
 * Uses BFS to find minimum moves to clear the board
 */

class MatchSolver {
    constructor(board) {
        this.board = JSON.parse(JSON.stringify(board)); // Deep copy
        this.boardSize = board.length;
        this.steps = [];
        this.visited = new Set();
    }

    /**
     * Find all valid matches on the current board
     * Adjacent tiles with the same element count as 1+ match
     */
    findMatches(board) {
        const matches = [];
        const visited = new Set();

        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[r].length; c++) {
                const key = `${r},${c}`;
                if (visited.has(key) || board[r][c] === null) continue;

                const match = this.floodFill(board, r, c);
                if (match.length > 0) {
                    matches.push(match);
                    match.forEach(pos => visited.add(`${pos[0]},${pos[1]}`));
                }
            }
        }

        return matches;
    }

    /**
     * Flood fill to find all connected adjacent tiles with same element
     */
    floodFill(board, r, c, visited = new Set()) {
        const key = `${r},${c}`;
        if (visited.has(key)) return [];
        if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return [];
        if (board[r][c] === null) return [];

        const element = board[r][c];
        const result = [];
        const stack = [[r, c]];

        while (stack.length > 0) {
            const [cr, cc] = stack.pop();
            const ckey = `${cr},${cc}`;

            if (visited.has(ckey)) continue;
            if (cr < 0 || cr >= board.length || cc < 0 || cc >= board[0].length) continue;
            if (board[cr][cc] !== element) continue;

            visited.add(ckey);
            result.push([cr, cc]);

            // Check 4 adjacent tiles (up, down, left, right)
            stack.push([cr - 1, cc]);
            stack.push([cr + 1, cc]);
            stack.push([cr, cc - 1]);
            stack.push([cr, cc + 1]);
        }

        return result;
    }

    /**
     * Apply gravity: drop elements down when tiles below are empty
     */
    applyGravity(board) {
        const newBoard = JSON.parse(JSON.stringify(board));

        for (let c = 0; c < newBoard[0].length; c++) {
            // Collect all non-null elements in this column
            const elements = [];
            for (let r = 0; r < newBoard.length; r++) {
                if (newBoard[r][c] !== null) {
                    elements.push(newBoard[r][c]);
                }
            }

            // Clear column
            for (let r = 0; r < newBoard.length; r++) {
                newBoard[r][c] = null;
            }

            // Place elements from bottom up
            let r = newBoard.length - 1;
            for (let i = elements.length - 1; i >= 0; i--) {
                newBoard[r][c] = elements[i];
                r--;
            }
        }

        return newBoard;
    }

    /**
     * Check if board is empty (all null)
     */
    isBoardEmpty(board) {
        return board.every(row => row.every(cell => cell === null));
    }

    /**
     * Convert board to string for comparison
     */
    boardToString(board) {
        return JSON.stringify(board);
    }

    /**
     * BFS to find minimum moves to clear board
     */
    findOptimalSolution() {
        const queue = [{ board: this.board, steps: [], moves: 0 }];
        const visited = new Set();
        visited.add(this.boardToString(this.board));

        while (queue.length > 0) {
            const { board, steps, moves } = queue.shift();

            // Check if board is empty
            if (this.isBoardEmpty(board)) {
                this.steps = steps;
                return { steps, moves, success: true };
            }

            // Limit search depth to prevent infinite loops
            if (moves > 200) continue;

            // Find all possible matches
            const matches = this.findMatches(board);

            if (matches.length === 0) {
                // No moves available, board cannot be cleared
                continue;
            }

            // Try each match
            for (let matchIdx = 0; matchIdx < matches.length; matchIdx++) {
                const match = matches[matchIdx];
                const newBoard = JSON.parse(JSON.stringify(board));

                // Remove matched tiles
                match.forEach(([r, c]) => {
                    newBoard[r][c] = null;
                });

                // Apply gravity
                const afterGravity = this.applyGravity(newBoard);
                const boardStr = this.boardToString(afterGravity);

                if (!visited.has(boardStr)) {
                    visited.add(boardStr);

                    const newSteps = [
                        ...steps,
                        {
                            board: afterGravity,
                            matchedTiles: match,
                            moveNumber: moves + 1
                        }
                    ];

                    queue.push({
                        board: afterGravity,
                        steps: newSteps,
                        moves: moves + 1
                    });
                }
            }
        }

        // No solution found
        return { steps: [], moves: -1, success: false };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MatchSolver;
}