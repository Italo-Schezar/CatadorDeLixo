/**
 * Renderer module
 * Handles the visual representation of the maze
 */
class Renderer {
    constructor(mazeElement, maze) {
        this.mazeElement = mazeElement;
        this.maze = maze;
        this.cellSize = 30; // Default cell size
        this.animationSpeed = 100; // ms between steps
    }

    // Render the maze
    render() {
        const { width, height, grid } = this.maze;

        // Adjust cell size based on screen width
        this.adjustCellSize();

        // Set the grid template
        this.mazeElement.style.gridTemplateColumns = `repeat(${width}, ${this.cellSize}px)`;
        this.mazeElement.style.gridTemplateRows = `repeat(${height}, ${this.cellSize}px)`;

        // Clear existing content
        this.mazeElement.innerHTML = '';

        // Create cells
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cell = grid[y][x];
                const cellElement = document.createElement('div');

                cellElement.className = 'cell';
                cellElement.dataset.x = x;
                cellElement.dataset.y = y;

                if (cell.isWall) {
                    cellElement.classList.add('wall');
                } else if (cell.isRobot) {
                    cellElement.classList.add('robot');
                    // Mostrar robô diferente quando estiver carregando lixo
                    cellElement.innerHTML = this.maze.hasGarbage ? '🤖🚮' : '🤖';
                } else if (cell.isTrash) {
                    cellElement.classList.add('trash');
                    cellElement.innerHTML = '🗑️';
                } else if (cell.isGarbage) {
                    cellElement.classList.add('garbage');
                    cellElement.innerHTML = '🚮';
                } else if (cell.isPath) {
                    cellElement.classList.add('path');
                }

                this.mazeElement.appendChild(cellElement);
            }
        }
    }

    // Adjust cell size based on screen width
    adjustCellSize() {
        const containerWidth = this.mazeElement.parentElement.clientWidth;
        const maxCellSize = 40;
        const minCellSize = 20;

        // Calculate ideal cell size
        let idealCellSize = Math.floor(containerWidth / this.maze.width);

        // Constrain to min/max
        this.cellSize = Math.min(maxCellSize, Math.max(minCellSize, idealCellSize));
    }

    // Animate the robot following the path
    animatePath(path, targetType, targetPosition) {
        return new Promise(resolve => {
            if (!path || path.length < 2) {
                console.error('Invalid path for animation');
                resolve();
                return;
            }

            // Clone the path to avoid modifying the original
            const pathCopy = [...path];

            // Skip the first node (robot's starting position)
            const robotStart = pathCopy.shift();

            // Get the target position (last node)
            const targetPos = pathCopy[pathCopy.length - 1];

            // Clear any existing robot and path markers
            for (let y = 0; y < this.maze.height; y++) {
                for (let x = 0; x < this.maze.width; x++) {
                    // Keep walls, trash and garbage, clear robot and path
                    if (this.maze.grid[y][x].isRobot) {
                        this.maze.grid[y][x].isRobot = false;
                    }
                    this.maze.grid[y][x].isPath = false;
                }
            }

            // Make sure the robot is at the start position
            this.maze.grid[robotStart.y][robotStart.x].isRobot = true;
            this.maze.robotPosition = { x: robotStart.x, y: robotStart.y };

            // Initial render
            this.render();

            let step = 0;

            const animate = () => {
                if (step < pathCopy.length) {
                    const { x, y } = pathCopy[step];

                    // Move the robot
                    // Clear previous position
                    this.maze.grid[this.maze.robotPosition.y][this.maze.robotPosition.x].isRobot = false;

                    // Mark the path where the robot was
                    if (!(this.maze.robotPosition.x === robotStart.x && this.maze.robotPosition.y === robotStart.y) &&
                        !(this.maze.robotPosition.x === targetPos.x && this.maze.robotPosition.y === targetPos.y)) {
                        this.maze.grid[this.maze.robotPosition.y][this.maze.robotPosition.x].isPath = true;
                    }

                    // Update robot position
                    this.maze.robotPosition = { x, y };

                    // Place robot at new position (unless it's the final destination)
                    if (step < pathCopy.length - 1) {
                        this.maze.grid[y][x].isRobot = true;
                    }

                    // Re-render
                    this.render();

                    step++;
                    setTimeout(animate, this.animationSpeed);
                } else {
                    // Animation complete
                    console.log('Animation complete');

                    // Executar a ação apropriada ao chegar no destino
                    if (targetType === 'garbage') {
                        // Pegar o lixo
                        this.maze.removeGarbage(targetPosition);
                        // Colocar o robô na posição do lixo
                        this.maze.grid[targetPosition.y][targetPosition.x].isRobot = true;
                        this.maze.robotPosition = { x: targetPosition.x, y: targetPosition.y };
                    } else if (targetType === 'trash') {
                        // Depositar o lixo na lixeira
                        this.maze.depositGarbage();
                        // Colocar o robô na posição da lixeira
                        this.maze.grid[targetPosition.y][targetPosition.x].isRobot = true;
                        this.maze.robotPosition = { x: targetPosition.x, y: targetPosition.y };
                    }

                    // Renderizar novamente para mostrar as mudanças
                    this.render();

                    resolve();
                }
            };

            // Start animation
            setTimeout(animate, this.animationSpeed);
        });
    }
}
