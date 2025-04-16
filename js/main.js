/**
 * Main application script
 * Initializes and connects all components
 */
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const mazeElement = document.getElementById('maze');
    const findPathButton = document.getElementById('find-path');

    // Status variables
    let isAnimating = false;

    // Maze dimensions (must be odd for the algorithm to work properly)
    const mazeWidth = 21;
    const mazeHeight = 15; // Reduced height for better visibility on smaller screens

    // Initialize components
    const maze = new Maze(mazeWidth, mazeHeight);
    const pathfinder = new Pathfinder(maze);
    const renderer = new Renderer(mazeElement, maze);
    renderer.animationSpeed = 150; // Slightly slower animation for better visibility

    // Function to generate a new maze
    const generateNewMaze = () => {
        // Disable buttons during generation
        findPathButton.disabled = true;

        try {
            // Limpar completamente o labirinto antes de gerar um novo
            maze.clearRobotAndTrash();

            // Limpar o grid completamente
            maze.initialize();

            // Generate a new maze
            maze.generate();
            renderer.render();

            // Verify that robot position is valid
            if (!maze.robotPosition) {
                console.error('Failed to place robot');
                setTimeout(generateNewMaze, 100); // Try again
                return;
            }

            // Verify that we have exactly 3 garbage items and exactly one trash bin
            if (maze.garbagePositions.length !== 3 || maze.trashPositions.length !== 1) {
                console.error(`Failed to place garbage or trash bin correctly. Garbage: ${maze.garbagePositions.length}, Trash: ${maze.trashPositions.length}`);
                setTimeout(generateNewMaze, 100); // Try again
                return;
            }

            // Check if paths exist between robot, garbage and trash
            const nearestGarbage = maze.findNearestGarbage();
            const pathToGarbage = pathfinder.findPath(maze.robotPosition, nearestGarbage);

            if (!pathToGarbage) {
                console.warn('No valid path to garbage - regenerating');
                setTimeout(generateNewMaze, 100); // Try again
                return;
            }

            const nearestTrash = maze.findNearestTrash();
            const pathToTrash = pathfinder.findPath(nearestGarbage, nearestTrash);

            if (!pathToTrash) {
                console.warn('No valid path from garbage to trash - regenerating');
                setTimeout(generateNewMaze, 100); // Try again
                return;
            }

            // Clear the path but keep the maze
            maze.clearPath();
            renderer.render();

            // Enable buttons
            findPathButton.disabled = false;
        } catch (error) {
            console.error('Error generating maze:', error);
            // Try again
            setTimeout(generateNewMaze, 100);
        }
    };

    // Generate initial maze
    generateNewMaze();

    // Função para executar o ciclo completo de coleta e depósito de lixo
    const runRobotCycle = async () => {
        if (isAnimating) return; // Prevent multiple animations

        // Disable button during animation
        isAnimating = true;
        findPathButton.disabled = true;

        // Verificar se já existe um robô, uma lixeira e exatamente 3 itens de lixo
        if (!maze.robotPosition || maze.trashPositions.length !== 1 || maze.garbagePositions.length !== 3) {
            // Se não existir ou não estiver na quantidade correta, limpar tudo e criar novos
            maze.clearRobotAndTrash();
            maze.clearAllGarbage();
            maze.placeRobotAndTrash();
            renderer.render();
        }

        try {
            // Continuar enquanto houver lixo para coletar
            while (maze.garbagePositions.length > 0) {
                // 1. Encontrar o lixo mais próximo
                const nearestGarbage = maze.findNearestGarbage();
                if (!nearestGarbage) break;

                // 2. Encontrar caminho até o lixo
                const pathToGarbage = pathfinder.findPath(maze.robotPosition, nearestGarbage);
                if (!pathToGarbage || pathToGarbage.length <= 1) {
                    console.error('No path to garbage found');
                    break;
                }

                // 3. Mover até o lixo e coletá-lo
                await renderer.animatePath(pathToGarbage, 'garbage', nearestGarbage);

                // 4. Encontrar a lixeira mais próxima
                const nearestTrash = maze.findNearestTrash();
                if (!nearestTrash) break;

                // 5. Encontrar caminho até a lixeira
                const pathToTrash = pathfinder.findPath(maze.robotPosition, nearestTrash);
                if (!pathToTrash || pathToTrash.length <= 1) {
                    console.error('No path to trash bin found');
                    break;
                }

                // 6. Mover até a lixeira e depositar o lixo
                await renderer.animatePath(pathToTrash, 'trash', nearestTrash);
            }

            // Verificar se todos os lixos foram coletados
            if (maze.garbagePositions.length === 0) {
                console.log('All garbage collected!');
                // Aguardar um pouco antes de gerar um novo labirinto
                setTimeout(() => {
                    generateNewMaze();
                }, 1500);
            } else {
                alert('Não foi possível coletar todo o lixo. Gerando novo labirinto...');
                generateNewMaze();
            }
        } catch (error) {
            console.error('Error in robot cycle:', error);
            alert('Ocorreu um erro durante a execução. Tente novamente.');
            generateNewMaze();
        } finally {
            // Re-enable button
            isAnimating = false;
            findPathButton.disabled = false;
        }
    };

    // Button event listener
    findPathButton.addEventListener('click', runRobotCycle);

    // Handle window resize
    window.addEventListener('resize', () => {
        if (!isAnimating) {
            renderer.render();
        }
    });
});
