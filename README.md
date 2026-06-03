# 🐛 Critterpot - Match Drop Game Solver

An optimal move solver for Tap Titans 2's **Critter Haven** mini-game (match-drop game).

## Features

- **Screenshot Analysis**: Upload a board screenshot and automatically detect the 8x8 grid of elements
- **Optimal Solver**: Find the minimum number of moves needed to clear the board
- **Step-by-Step Visualization**: View each move with highlighted matched tiles
- **Manual Editor**: Create custom board states to test strategies
- **Mobile Friendly**: Dark theme, responsive design
- **100% Client-Side**: Hosted on GitHub Pages, no external servers needed

## How It Works

### Solver Algorithm

The solver uses **BFS (Breadth-First Search)** to find the optimal solution:

1. **Match Detection**: Finds all valid matches (1+ adjacent same-type elements)
2. **Gravity Simulation**: Applies physics - elements fall vertically when tiles below are removed
3. **State Exploration**: Explores all possible board states to find the path with fewest moves
4. **Result**: Returns step-by-step solution with highlighted matches

### Game Rules

- **Board Size**: 8x8 grid
- **Match**: 1 or more adjacent tiles (vertical/horizontal only, no diagonals)
- **Gravity**: Only vertical - elements drop when tiles below are removed
- **Goal**: Remove all elements in minimum moves

## Usage

### Solver Mode

1. Open the app: [https://stevekyx.github.io/critterpot](https://stevekyx.github.io/critterpot)
2. Click "Solver" tab
3. Upload a screenshot of your Critter Haven board
4. Click "Analyze Board"
5. View step-by-step solution with move count
6. Use Previous/Next buttons to navigate through moves

### Manual Editor Mode

1. Click "Manual Editor" tab
2. Select an element type from the dropdown
3. Click tiles to place elements (click again to remove)
4. Click "Solve This Board" to find the optimal solution

## Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Image Processing**: Canvas API for screenshot analysis
- **Algorithm**: BFS for optimal pathfinding
- **Hosting**: GitHub Pages (static site)

## Project Structure

```
critterpot/
├── index.html           # Main HTML
├── styles.css           # Dark theme styling
├── solver.js            # BFS algorithm for optimal solution
├── boardDetection.js    # Screenshot analysis & element detection
├── editor.js            # Manual board editor
├── app.js               # Main application controller
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## How Board Detection Works

1. **Image Analysis**: Loads uploaded screenshot
2. **Grid Detection**: Identifies 8x8 tile grid
3. **Color Recognition**: Analyzes dominant color in each tile
4. **Element Mapping**: Groups similar colors and assigns element IDs
5. **Board Output**: Returns 2D array representing board state

## Algorithm Complexity

- **Time**: O(n^m) where n = number of possible matches, m = max solution length
- **Space**: O(states) for visited state tracking
- **Optimization**: BFS guarantees optimal solution (fewest moves)

## Limitations

- Board detection accuracy depends on screenshot clarity and lighting
- Complex boards may take longer to solve (depth-limited BFS)
- Manual element identification may vary from actual game colors

## Future Enhancements

- [ ] Download step-by-step screenshots as zip
- [ ] Multiple solving strategies (greedy, heuristic)
- [ ] Board difficulty estimation
- [ ] Historical solve tracking
- [ ] Mobile app version

## Contributing

Feel free to open issues for bugs or feature requests!

## License

MIT License - See LICENSE file for details

---

**Built by @stevekyx**  
Hosted on GitHub Pages: [https://stevekyx.github.io/critterpot](https://stevekyx.github.io/critterpot)
