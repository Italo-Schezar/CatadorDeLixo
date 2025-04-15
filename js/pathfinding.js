/**
 * Pathfinding module
 * Implements A* algorithm to find the optimal path
 */
class Pathfinder {
    constructor(maze) {
        this.maze = maze;
    }

    // A* algorithm to find the shortest path
    findPath(start, goal) {
        // Safety check for valid start and goal
        if (!start || !goal) {
            console.error('Invalid start or goal position');
            return null;
        }

        // Clear any existing path
        this.maze.clearPath();

        // Priority queue for open nodes
        const openSet = [start];

        // Set to keep track of visited nodes
        const closedSet = new Set();

        // Keep track of where we came from
        const cameFrom = {};

        // Cost from start to current node
        const gScore = {};
        gScore[`${start.x},${start.y}`] = 0;

        // Estimated total cost from start to goal through current node
        const fScore = {};
        fScore[`${start.x},${start.y}`] = this.heuristic(start, goal);

        // Set a maximum number of iterations to prevent infinite loops
        const maxIterations = this.maze.width * this.maze.height * 2;
        let iterations = 0;

        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;

            // Find the node with the lowest fScore
            let current = this.getLowestFScore(openSet, fScore);

            // If we've reached the goal, reconstruct and return the path
            if (current.x === goal.x && current.y === goal.y) {
                console.log(`Path found in ${iterations} iterations`);
                return this.reconstructPath(cameFrom, current);
            }

            // Remove current from openSet
            openSet.splice(openSet.indexOf(current), 1);

            // Add to closed set
            closedSet.add(`${current.x},${current.y}`);

            // Check all neighbors
            const neighbors = this.maze.getNeighbors(current.x, current.y);
            for (const neighbor of neighbors) {
                // Skip if already evaluated
                if (closedSet.has(`${neighbor.x},${neighbor.y}`)) {
                    continue;
                }

                // Calculate tentative gScore
                const tentativeGScore = gScore[`${current.x},${current.y}`] + 1;

                // Check if this is a new node to evaluate
                const isNewNode = !openSet.some(node => node.x === neighbor.x && node.y === neighbor.y);

                // If this path is better than any previous one, record it
                if (isNewNode || tentativeGScore < gScore[`${neighbor.x},${neighbor.y}`]) {
                    cameFrom[`${neighbor.x},${neighbor.y}`] = current;
                    gScore[`${neighbor.x},${neighbor.y}`] = tentativeGScore;
                    fScore[`${neighbor.x},${neighbor.y}`] = tentativeGScore + this.heuristic(neighbor, goal);

                    // Add neighbor to openSet if it's not there
                    if (isNewNode) {
                        openSet.push(neighbor);
                    }
                }
            }
        }

        // No path found or max iterations reached
        console.warn(`No path found after ${iterations} iterations`);
        return null;
    }

    // Manhattan distance heuristic
    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    // Get the node with the lowest fScore
    getLowestFScore(nodes, fScore) {
        let lowest = nodes[0];
        let lowestScore = fScore[`${lowest.x},${lowest.y}`];

        for (let i = 1; i < nodes.length; i++) {
            const node = nodes[i];
            const score = fScore[`${node.x},${node.y}`];

            if (score < lowestScore) {
                lowest = node;
                lowestScore = score;
            }
        }

        return lowest;
    }

    // Reconstruct the path from start to goal
    reconstructPath(cameFrom, current) {
        const path = [current];

        while (cameFrom[`${current.x},${current.y}`]) {
            current = cameFrom[`${current.x},${current.y}`];
            path.unshift(current);
        }

        return path;
    }

    // Mark the path on the maze grid
    markPath(path) {
        // Skip the first node (robot) and last node (trash)
        for (let i = 1; i < path.length - 1; i++) {
            const { x, y } = path[i];
            this.maze.grid[y][x].isPath = true;
        }
    }
}
