document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const robot = document.querySelector('.robot');
    const startBtn = document.getElementById('start-btn');
    const resetBtn = document.getElementById('reset-btn');
    const sensors = document.querySelectorAll('.sensor');
    const linePath = document.querySelector('.follow-line');

    // Configurações iniciais
    let isRunning = false;
    let animationId = null;

    // Pontos da linha de caminho
    const pathPoints = [];
    const pathLength = linePath.getTotalLength();
    const numPoints = 100;

    // Calcular pontos ao longo do caminho
    for (let i = 0; i < numPoints; i++) {
        const point = linePath.getPointAtLength(i / (numPoints - 1) * pathLength);
        pathPoints.push({ x: point.x, y: point.y });
    }

    // Posição inicial e atual do robô
    const initialPosition = {
        x: pathPoints[0].x,
        y: pathPoints[0].y,
        rotation: 0,
        pathIndex: 0
    };

    let robotPosition = { ...initialPosition };

    // Velocidade e direção
    const speed = 1;
    let direction = 0; // 0 = reto, -1 = esquerda, 1 = direita

    // Função para iniciar o movimento
    function startRobot() {
        if (isRunning) return;

        isRunning = true;
        animateRobot();
    }

    // Função para reiniciar o robô
    function resetRobot() {
        isRunning = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        // Resetar posição
        robotPosition = { ...initialPosition };
        updateRobotPosition();

        // Resetar sensores
        sensors.forEach(sensor => {
            sensor.classList.remove('active');
        });
    }

    // Função para animar o robô
    function animateRobot() {
        if (!isRunning) return;

        // Avançar para o próximo ponto no caminho
        robotPosition.pathIndex += speed;

        // Verificar se chegou ao final do caminho
        if (robotPosition.pathIndex >= pathPoints.length - 1) {
            robotPosition.pathIndex = 0;
        }

        // Calcular o índice atual e o próximo
        const currentIndex = Math.floor(robotPosition.pathIndex);
        const nextIndex = Math.min(currentIndex + 1, pathPoints.length - 1);

        // Interpolar entre os pontos para movimento suave
        const t = robotPosition.pathIndex - currentIndex;
        robotPosition.x = pathPoints[currentIndex].x * (1 - t) + pathPoints[nextIndex].x * t;
        robotPosition.y = pathPoints[currentIndex].y * (1 - t) + pathPoints[nextIndex].y * t;

        // Calcular a rotação com base na direção do caminho
        if (nextIndex > currentIndex) {
            const dx = pathPoints[nextIndex].x - pathPoints[currentIndex].x;
            const dy = pathPoints[nextIndex].y - pathPoints[currentIndex].y;
            robotPosition.rotation = Math.atan2(dy, dx) * 180 / Math.PI - 90;
        }

        // Verificar sensores
        checkSensors();

        // Atualizar posição visual
        updateRobotPosition();

        // Continuar animação
        animationId = requestAnimationFrame(animateRobot);
    }

    // Função para verificar sensores
    function checkSensors() {
        // Calcular o ponto atual e o próximo no caminho
        const currentIndex = Math.floor(robotPosition.pathIndex);
        const nextIndex = Math.min(currentIndex + 1, pathPoints.length - 1);

        // Calcular a posição da linha no ponto atual
        const lineX = pathPoints[currentIndex].x;
        const lineY = pathPoints[currentIndex].y;

        // Verificar cada sensor
        sensors.forEach((sensor, index) => {
            // Calcular a posição do sensor com base na posição e rotação do robô
            const sensorRect = sensor.getBoundingClientRect();
            const robotRect = robot.getBoundingClientRect();

            // Distância do sensor à linha
            const distance = Math.sqrt(
                Math.pow(sensorRect.left + sensorRect.width/2 - (robotRect.left + robotRect.width/2), 2) +
                Math.pow(sensorRect.top + sensorRect.height/2 - (robotRect.top + robotRect.height/2), 2)
            );

            // Ativar sensor se estiver próximo da linha
            if (distance < 30) {
                sensor.classList.add('active');
            } else {
                sensor.classList.remove('active');
            }
        });
    }

    // Função para atualizar a posição visual do robô
    function updateRobotPosition() {
        // Ajustar a posição para o tamanho da arena
        const arena = document.querySelector('.arena');
        const scaleX = arena.offsetWidth / 800;
        const scaleY = arena.offsetHeight / 400;

        const x = robotPosition.x * scaleX;
        const y = robotPosition.y * scaleY;

        robot.style.left = `${x}px`;
        robot.style.top = `${y}px`;
        robot.style.transform = `rotate(${robotPosition.rotation}deg)`;
    }

    // Eventos dos botões
    startBtn.addEventListener('click', startRobot);
    resetBtn.addEventListener('click', resetRobot);

    // Inicializar posição
    updateRobotPosition();
});
