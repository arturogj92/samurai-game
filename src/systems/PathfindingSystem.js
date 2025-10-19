import Phaser from 'phaser';

/**
 * PathfindingSystem - A* pathfinding for enemies
 *
 * Features:
 * - Grid-based pathfinding using A* algorithm
 * - Marks obstacle cells from static physics bodies
 * - Efficient path caching and updates
 * - Supports dynamic obstacle updates
 */
export default class PathfindingSystem {
    constructor(scene) {
        this.scene = scene;

        // Grid configuration
        this.cellSize = 32; // Size of each grid cell (pixels)
        this.gridWidth = Math.ceil(scene.physics.world.bounds.width / this.cellSize);
        this.gridHeight = Math.ceil(scene.physics.world.bounds.height / this.cellSize);

        // Create grid (0 = walkable, 1 = blocked)
        this.grid = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = 0; // Start with all cells walkable
            }
        }

        console.log(`🗺️ PathfindingSystem: Created grid ${this.gridWidth}x${this.gridHeight} (cell size: ${this.cellSize}px)`);
    }

    /**
     * Mark obstacles on the grid from physics bodies
     */
    markObstacles() {
        // Reset grid first
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                this.grid[y][x] = 0;
            }
        }

        let obstacleCount = 0;

        // Mark trees
        if (this.scene.trees) {
            this.scene.trees.getChildren().forEach(tree => {
                if (tree.body) {
                    this.markBodyAsObstacle(tree.body);
                    obstacleCount++;
                }
            });
        }

        // Mark rocks
        if (this.scene.rocks) {
            this.scene.rocks.getChildren().forEach(rock => {
                if (rock.body) {
                    this.markBodyAsObstacle(rock.body);
                    obstacleCount++;
                }
            });
        }

        // Mark bushes
        if (this.scene.bushes) {
            this.scene.bushes.getChildren().forEach(bush => {
                if (bush.body) {
                    this.markBodyAsObstacle(bush.body);
                    obstacleCount++;
                }
            });
        }

        // Mark goblin huts
        if (this.scene.goblinHuts) {
            this.scene.goblinHuts.getChildren().forEach(hut => {
                if (hut.body) {
                    this.markBodyAsObstacle(hut.body);
                    obstacleCount++;
                }
            });
        }

        console.log(`🚧 PathfindingSystem: Marked ${obstacleCount} obstacles on grid`);
    }

    /**
     * Mark a physics body as an obstacle on the grid
     */
    markBodyAsObstacle(body) {
        // Get body bounds in world coordinates
        const left = body.x;
        const top = body.y;
        const right = body.x + body.width;
        const bottom = body.y + body.height;

        // Convert to grid coordinates
        const gridLeft = Math.floor(left / this.cellSize);
        const gridTop = Math.floor(top / this.cellSize);
        const gridRight = Math.ceil(right / this.cellSize);
        const gridBottom = Math.ceil(bottom / this.cellSize);

        // Mark cells as blocked (with bounds checking)
        for (let y = Math.max(0, gridTop); y < Math.min(this.gridHeight, gridBottom); y++) {
            for (let x = Math.max(0, gridLeft); x < Math.min(this.gridWidth, gridRight); x++) {
                this.grid[y][x] = 1; // Blocked
            }
        }
    }

    /**
     * Convert world coordinates to grid coordinates
     */
    worldToGrid(x, y) {
        return {
            x: Math.floor(x / this.cellSize),
            y: Math.floor(y / this.cellSize)
        };
    }

    /**
     * Convert grid coordinates to world coordinates (center of cell)
     */
    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.cellSize + this.cellSize / 2,
            y: gridY * this.cellSize + this.cellSize / 2
        };
    }

    /**
     * Check if a grid cell is walkable
     */
    isWalkable(gridX, gridY) {
        // Out of bounds = not walkable
        if (gridX < 0 || gridX >= this.gridWidth || gridY < 0 || gridY >= this.gridHeight) {
            return false;
        }
        return this.grid[gridY][gridX] === 0;
    }

    /**
     * Get neighboring cells (8-directional movement)
     */
    getNeighbors(gridX, gridY) {
        const neighbors = [];

        // 8 directions: N, NE, E, SE, S, SW, W, NW
        const directions = [
            { x: 0, y: -1 },  // N
            { x: 1, y: -1 },  // NE
            { x: 1, y: 0 },   // E
            { x: 1, y: 1 },   // SE
            { x: 0, y: 1 },   // S
            { x: -1, y: 1 },  // SW
            { x: -1, y: 0 },  // W
            { x: -1, y: -1 }  // NW
        ];

        for (const dir of directions) {
            const newX = gridX + dir.x;
            const newY = gridY + dir.y;

            if (this.isWalkable(newX, newY)) {
                neighbors.push({ x: newX, y: newY });
            }
        }

        return neighbors;
    }

    /**
     * Calculate heuristic (Manhattan distance)
     */
    heuristic(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    /**
     * Find path from start to goal using A* algorithm
     * Returns array of world coordinates, or null if no path found
     */
    findPath(startX, startY, goalX, goalY) {
        // Convert to grid coordinates
        const start = this.worldToGrid(startX, startY);
        const goal = this.worldToGrid(goalX, goalY);

        // If start or goal is not walkable, return null
        if (!this.isWalkable(start.x, start.y) || !this.isWalkable(goal.x, goal.y)) {
            return null;
        }

        // If already at goal, return empty path
        if (start.x === goal.x && start.y === goal.y) {
            return [];
        }

        // A* algorithm
        const openSet = new Set();
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();

        const startKey = `${start.x},${start.y}`;
        const goalKey = `${goal.x},${goal.y}`;

        openSet.add(startKey);
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(start.x, start.y, goal.x, goal.y));

        while (openSet.size > 0) {
            // Find node in openSet with lowest fScore
            let current = null;
            let lowestF = Infinity;
            for (const key of openSet) {
                const f = fScore.get(key) || Infinity;
                if (f < lowestF) {
                    lowestF = f;
                    current = key;
                }
            }

            // If we reached the goal, reconstruct path
            if (current === goalKey) {
                return this.reconstructPath(cameFrom, current, start, goal);
            }

            openSet.delete(current);
            closedSet.add(current);

            // Get current position
            const [currentX, currentY] = current.split(',').map(Number);

            // Check all neighbors
            const neighbors = this.getNeighbors(currentX, currentY);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;

                if (closedSet.has(neighborKey)) continue;

                // Calculate tentative gScore
                const tentativeG = (gScore.get(current) || 0) + 1;

                if (!openSet.has(neighborKey)) {
                    openSet.add(neighborKey);
                } else if (tentativeG >= (gScore.get(neighborKey) || Infinity)) {
                    continue; // Not a better path
                }

                // This is the best path so far
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeG);
                fScore.set(neighborKey, tentativeG + this.heuristic(neighbor.x, neighbor.y, goal.x, goal.y));
            }
        }

        // No path found
        return null;
    }

    /**
     * Reconstruct path from A* result
     */
    reconstructPath(cameFrom, current, start, goal) {
        const path = [];

        while (current) {
            const [x, y] = current.split(',').map(Number);

            // Don't include the start position
            if (x !== start.x || y !== start.y) {
                const worldPos = this.gridToWorld(x, y);
                path.unshift(worldPos); // Add to beginning
            }

            current = cameFrom.get(current);
        }

        return path;
    }

    /**
     * Debug visualization of grid (optional, can be called manually)
     */
    debugDraw() {
        if (this.debugGraphics) {
            this.debugGraphics.destroy();
        }

        this.debugGraphics = this.scene.add.graphics();
        this.debugGraphics.setDepth(1000); // Above everything

        // Draw grid
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const worldPos = this.gridToWorld(x, y);
                const color = this.grid[y][x] === 1 ? 0xff0000 : 0x00ff00;
                const alpha = this.grid[y][x] === 1 ? 0.3 : 0.1;

                this.debugGraphics.fillStyle(color, alpha);
                this.debugGraphics.fillRect(
                    worldPos.x - this.cellSize / 2,
                    worldPos.y - this.cellSize / 2,
                    this.cellSize,
                    this.cellSize
                );
            }
        }
    }
}
