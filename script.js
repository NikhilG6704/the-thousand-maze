document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    const timerDisplay = document.getElementById('timer');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const setSizeBtn = document.getElementById('setSizeBtn');
    const rowsInput = document.getElementById('rowsInput');
    const colsInput = document.getElementById('colsInput');

    let cellSize = 25;
    let rows = 20;
    let cols = 20;
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    let grid = [];
    const player = { row: 0, col: 0, size: cellSize / 2, color: '#0095DD', targetRow: 0, targetCol: 0, dx: 0, dy: 0 };
    let goal = { row: 0, col: 0, size: cellSize / 2, color: '#28A745' };
    const path = [];
    let stack = [];
    let timeRemaining = calculateTime();
    let timerInterval;
    let gameStarted = false;
    let gamePaused = false;
    let isMoving = false;

    // Initialize the maze grid
    function initializeGrid() {
        grid = Array.from({ length: rows }, (_, row) => 
            Array.from({ length: cols }, (_, col) => ({
                row, col, visited: false, walls: [true, true, true, true] // Top, Right, Bottom, Left
            }))
        );
    }

    // Generate maze
    function generateMaze() {
        initializeGrid();
        stack.length = 0;
        path.length = 0;
        const startCell = grid[0][0];
        stack.push(startCell);
        startCell.visited = true;

        while (stack.length > 0) {
            const nextCell = getUnvisitedNeighbor(stack[stack.length - 1]);
            if (nextCell) {
                nextCell.visited = true;
                removeWalls(stack[stack.length - 1], nextCell);
                stack.push(nextCell);
            } else {
                stack.pop();
            }
        }
        setRandomGoal(); // Set random goal after maze generation
        drawMaze();
    }

    // Set a random goal within the grid
    function setRandomGoal() {
        let randomRow, randomCol;
        do {
            randomRow = Math.floor(Math.random() * rows);
            randomCol = Math.floor(Math.random() * cols);
        } while (randomRow === player.row && randomCol === player.col); // Ensure goal is not at the player's starting position

        goal.row = randomRow;
        goal.col = randomCol;
    }

    // Maze grid creation and drawing
    function drawMaze() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        grid.forEach(row => row.forEach(cell => drawCell(cell)));
        drawPath();
        drawPlayerAndGoal();
    }

    // Draw individual cell walls
    function drawCell(cell) {
        const x = cell.col * cellSize;
        const y = cell.row * cellSize;

        ctx.strokeStyle = '#f0a500';
        ctx.lineWidth = 2;

        if (cell.walls[0]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + cellSize, y); ctx.stroke(); } // Top
        if (cell.walls[1]) { ctx.beginPath(); ctx.moveTo(x + cellSize, y); ctx.lineTo(x + cellSize, y + cellSize); ctx.stroke(); } // Right
        if (cell.walls[2]) { ctx.beginPath(); ctx.moveTo(x + cellSize, y + cellSize); ctx.lineTo(x, y + cellSize); ctx.stroke(); } // Bottom
        if (cell.walls[3]) { ctx.beginPath(); ctx.moveTo(x, y + cellSize); ctx.lineTo(x, y); ctx.stroke(); } // Left
    }

    // Draw path taken by player
    function drawPath() {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath();

        if (path.length > 0) {
            const startCell = path[0];
            ctx.moveTo(startCell.col * cellSize + cellSize / 2, startCell.row * cellSize + cellSize / 2);
        }

        path.forEach(cell => {
            ctx.lineTo(cell.col * cellSize + cellSize / 2, cell.row * cellSize + cellSize / 2);
        });

        ctx.stroke();
    }

    // Draw player and goal
    function drawPlayerAndGoal() {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.col * cellSize + cellSize / 4, player.row * cellSize + cellSize / 4, player.size, player.size);

        ctx.fillStyle = goal.color;
        ctx.fillRect(goal.col * cellSize + cellSize / 4, goal.row * cellSize + cellSize / 4, goal.size, goal.size);
    }

    // Function to get unvisited neighbors of a given cell
    function getUnvisitedNeighbor(cell) {
        const { row, col } = cell;
        const neighbors = [];

        if (row > 0 && !grid[row - 1][col].visited) neighbors.push(grid[row - 1][col]);
        if (col < cols - 1 && !grid[row][col + 1].visited) neighbors.push(grid[row][col + 1]);
        if (row < rows - 1 && !grid[row + 1][col].visited) neighbors.push(grid[row + 1][col]);
        if (col > 0 && !grid[row][col - 1].visited) neighbors.push(grid[row][col - 1]);

        return neighbors.length > 0 ? neighbors[Math.floor(Math.random() * neighbors.length)] : null;
    }

    // Function to remove walls between adjacent cells
    function removeWalls(cell1, cell2) {
        const dx = cell1.col - cell2.col;
        const dy = cell1.row - cell2.row;

        if (dx === 1) { cell1.walls[3] = false; cell2.walls[1] = false; }
        if (dx === -1) { cell1.walls[1] = false; cell2.walls[3] = false; }
        if (dy === 1) { cell1.walls[0] = false; cell2.walls[2] = false; }
        if (dy === -1) { cell1.walls[2] = false; cell2.walls[0] = false; }
    }

    // Function to calculate time based on maze size, capped at 100 seconds
    function calculateTime() {
        return Math.min(Math.max((rows * cols) / 2, 30), 100); // Cap at 100 seconds
    }

    // Start the game
    function startGame() {
        if (!gameStarted) {
            gameStarted = true;
            gamePaused = false;
            timerDisplay.innerText = `Time Remaining: ${timeRemaining}s`;
            canvas.style.display = 'block';
            startBtn.style.display = 'none';
            pauseBtn.style.display = 'inline';

            timerInterval = setInterval(updateTimer, 1000);
            generateMaze();
        }
    }

    // Pause the game
    function pauseGame() {
        gamePaused = true;
        clearInterval(timerInterval);
        pauseBtn.innerText = 'Resume';
    }

    // Resume the game
    function resumeGame() {
        gamePaused = false;
        timerInterval = setInterval(updateTimer, 1000);
        pauseBtn.innerText = 'Pause';
    }

    // Update the timer
    function updateTimer() {
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert("⏳ Time's up! Try again.");
            resetGame();
        } else {
            timeRemaining--;
            timerDisplay.innerText = `Time Remaining: ${timeRemaining}s`;
        }
    }

    // Reset the game
    function resetGame() {
        gameStarted = false;
        player.row = 0;
        player.col = 0;
        player.targetRow = 0;
        player.targetCol = 0;
        path.length = 0;
        timeRemaining = calculateTime();
        timerDisplay.innerText = `Time Remaining: ${timeRemaining}s`;
        canvas.style.display = 'none';
        startBtn.style.display = 'inline';
        pauseBtn.style.display = 'none';
        generateMaze();
    }

    // Function to move the player
    function movePlayer(dx, dy) {
        if (isMoving || gamePaused || !gameStarted) return;

        const targetRow = player.row + dy;
        const targetCol = player.col + dx;

        if (targetRow >= 0 && targetRow < rows && targetCol >= 0 && targetCol < cols) {
            const currentCell = grid[player.row][player.col];
            const targetCell = grid[targetRow][targetCol];

            // Check for walls
            if (dx === 0 && dy === -1 && !currentCell.walls[0]) {
                player.targetRow = targetRow;
                player.targetCol = targetCol;
            } else if (dx === 1 && dy === 0 && !currentCell.walls[1]) {
                player.targetRow = targetRow;
                player.targetCol = targetCol;
            } else if (dx === 0 && dy === 1 && !currentCell.walls[2]) {
                player.targetRow = targetRow;
                player.targetCol = targetCol;
            } else if (dx === -1 && dy === 0 && !currentCell.walls[3]) {
                player.targetRow = targetRow;
                player.targetCol = targetCol;
            } else {
                return; // Blocked by wall
            }

            // Add current position to path
            path.push({ row: player.row, col: player.col });

            isMoving = true;
            animateMovement();
        }
    }

    // Function to animate player movement
    function animateMovement() {
        const speed = 0.1; // Movement speed
        const rowDiff = player.targetRow - player.row;
        const colDiff = player.targetCol - player.col;

        player.row += rowDiff * speed;
        player.col += colDiff * speed;

        if (Math.abs(player.row - player.targetRow) <= 0.5 && Math.abs(player.col - player.targetCol) <= 0.5) {
            player.row = player.targetRow;
            player.col = player.targetCol;
            isMoving = false;
            path.push({ row: player.row, col: player.col });
            checkGoal();
        } else {
            requestAnimationFrame(animateMovement);
        }

        drawMaze();
    }

    // Check if player reached the goal
    function checkGoal() {
        if (player.row === goal.row && player.col === goal.col) {
            alert('🎉 You reached the goal! Congratulations!');
            resetGame();
        }
    }

    // Event listeners for player movement
    document.addEventListener('keydown', (event) => {
        if (!gameStarted || gamePaused) return;

        switch (event.key) {
            case 'ArrowUp': movePlayer(0, -1); break;
            case 'ArrowRight': movePlayer(1, 0); break;
            case 'ArrowDown': movePlayer(0, 1); break;
            case 'ArrowLeft': movePlayer(-1, 0); break;
        }
    });

    // Event listeners for buttons
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', () => {
        if (gamePaused) resumeGame();
        else pauseGame();
    });

    setSizeBtn.addEventListener('click', () => {
        const rowsValue = parseInt(rowsInput.value, 10);
        const colsValue = parseInt(colsInput.value, 10);
        if (rowsValue && colsValue) {
            rows = rowsValue;
            cols = colsValue;
            canvas.width = cols * cellSize;
            canvas.height = rows * cellSize;
            timeRemaining = calculateTime();
            resetGame();
        }
    });
});
