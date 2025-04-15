/**
 * Maze generation module
 * Uses Depth-First Search algorithm to generate random mazes
 */
class Maze {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
        this.robotPosition = null;
        this.trashPositions = []; // Lixeiras (destino)
        this.garbagePositions = []; // Itens de lixo (para coletar)
        this.hasGarbage = false; // Indica se o robô está carregando lixo
        this.initialize();
    }

    initialize() {
        // Create a grid filled with walls
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push({
                    x,
                    y,
                    isWall: true,
                    isRobot: false,
                    isTrash: false, // Lixeira (destino)
                    isGarbage: false, // Item de lixo (para coletar)
                    isPath: false
                });
            }
            this.grid.push(row);
        }
    }

    generate() {
        // Reset the grid to all walls
        this.initialize();

        // Start with a grid full of walls
        const startX = 1;
        const startY = 1;

        // Use DFS to carve passages
        this.dfsCarve(startX, startY);

        // Ensure the maze has enough open cells
        this.ensureConnectivity();

        // Place robot and trash
        this.placeRobotAndTrash();

        return this.grid;
    }

    // Ensure the maze has enough connectivity
    ensureConnectivity() {
        // Count open cells
        let openCells = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.grid[y][x].isWall) {
                    openCells++;
                }
            }
        }

        // If less than 30% of cells are open, create more paths
        const totalCells = this.width * this.height;
        const minOpenPercentage = 0.3;

        if (openCells / totalCells < minOpenPercentage) {
            // Add some random passages
            for (let i = 0; i < 10; i++) {
                const x = Math.floor(Math.random() * (this.width - 2)) + 1;
                const y = Math.floor(Math.random() * (this.height - 2)) + 1;

                if (this.grid[y][x].isWall) {
                    this.grid[y][x].isWall = false;

                    // Also open adjacent cells to create passages
                    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
                    const randomDir = directions[Math.floor(Math.random() * directions.length)];
                    const nx = x + randomDir[0];
                    const ny = y + randomDir[1];

                    if (nx > 0 && nx < this.width - 1 && ny > 0 && ny < this.height - 1) {
                        this.grid[ny][nx].isWall = false;
                    }
                }
            }
        }
    }

    dfsCarve(x, y) {
        // Mark the current cell as a passage
        this.grid[y][x].isWall = false;

        // Define possible directions: [dx, dy]
        const directions = [
            [0, -2], // Up
            [2, 0],  // Right
            [0, 2],  // Down
            [-2, 0]  // Left
        ];

        // Shuffle directions for randomness
        this.shuffleArray(directions);

        // Try each direction
        for (const [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;

            // Check if the new position is valid
            if (this.isValidPosition(newX, newY) && this.grid[newY][newX].isWall) {
                // Carve a passage by making the wall between current and new cell a passage
                this.grid[y + dy/2][x + dx/2].isWall = false;

                // Continue DFS from the new cell
                this.dfsCarve(newX, newY);
            }
        }
    }

    isValidPosition(x, y) {
        return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    placeRobotAndTrash() {
        // Limpar posições anteriores
        this.trashPositions = [];
        this.garbagePositions = [];
        this.hasGarbage = false;

        // Get all non-wall cells
        const openCells = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (!this.grid[y][x].isWall) {
                    openCells.push({ x, y });
                }
            }
        }

        // Shuffle the open cells
        this.shuffleArray(openCells);

        // Place robot at the first open cell
        if (openCells.length > 0) {
            const robotCell = openCells.shift();
            this.grid[robotCell.y][robotCell.x].isRobot = true;
            this.robotPosition = { x: robotCell.x, y: robotCell.y };
        }

        // Número de lixeiras e itens de lixo (ajuste conforme necessário)
        const numTrash = 2; // Lixeiras (destino)
        const numGarbage = 3; // Itens de lixo (para coletar)

        // Place trash bins (destino)
        for (let i = 0; i < numTrash && i < openCells.length; i++) {
            const trashCell = openCells.shift();
            this.grid[trashCell.y][trashCell.x].isTrash = true;
            this.trashPositions.push({ x: trashCell.x, y: trashCell.y });
        }

        // Place garbage items (para coletar)
        for (let i = 0; i < numGarbage && i < openCells.length; i++) {
            const garbageCell = openCells.shift();
            this.grid[garbageCell.y][garbageCell.x].isGarbage = true;
            this.garbagePositions.push({ x: garbageCell.x, y: garbageCell.y });
        }
    }

    clearPath() {
        // Clear any existing path
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.grid[y][x].isPath = false;
            }
        }
    }

    // Encontra a lixeira mais próxima do robô
    findNearestTrash() {
        if (this.trashPositions.length === 0) return null;

        let nearest = this.trashPositions[0];
        let minDistance = this.calculateDistance(this.robotPosition, nearest);

        for (let i = 1; i < this.trashPositions.length; i++) {
            const distance = this.calculateDistance(this.robotPosition, this.trashPositions[i]);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = this.trashPositions[i];
            }
        }

        return nearest;
    }

    // Encontra o item de lixo mais próximo do robô
    findNearestGarbage() {
        if (this.garbagePositions.length === 0) return null;

        let nearest = this.garbagePositions[0];
        let minDistance = this.calculateDistance(this.robotPosition, nearest);

        for (let i = 1; i < this.garbagePositions.length; i++) {
            const distance = this.calculateDistance(this.robotPosition, this.garbagePositions[i]);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = this.garbagePositions[i];
            }
        }

        return nearest;
    }

    // Calcula a distância Manhattan entre dois pontos
    calculateDistance(pointA, pointB) {
        return Math.abs(pointA.x - pointB.x) + Math.abs(pointA.y - pointB.y);
    }

    // Remove um item de lixo da posição especificada
    removeGarbage(position) {
        // Remove do grid
        this.grid[position.y][position.x].isGarbage = false;

        // Remove da lista de posições
        this.garbagePositions = this.garbagePositions.filter(pos =>
            !(pos.x === position.x && pos.y === position.y)
        );

        // Indica que o robô está carregando lixo
        this.hasGarbage = true;
    }

    // Deposita o lixo na lixeira
    depositGarbage() {
        // Indica que o robô não está mais carregando lixo
        this.hasGarbage = false;
    }

    getNeighbors(x, y) {
        const neighbors = [];
        const directions = [
            [0, -1], // Up
            [1, 0],  // Right
            [0, 1],  // Down
            [-1, 0]  // Left
        ];

        for (const [dx, dy] of directions) {
            const newX = x + dx;
            const newY = y + dy;

            if (newX >= 0 && newX < this.width && newY >= 0 && newY < this.height && !this.grid[newY][newX].isWall) {
                neighbors.push({ x: newX, y: newY });
            }
        }

        return neighbors;
    }
}
