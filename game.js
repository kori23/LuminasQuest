// Game Configuration
const CONFIG = {
    canvas: {
        width: 800,
        height: 600
    },
    player: {
        width: 20,
        height: 20,
        speed: 3,
        gravity: 0.6,
        maxFallSpeed: 15,
        lightRadius: 80
    },
    shadow: {
        width: 30,
        height: 40,
        speed: 1.5,
        detectionRange: 150
    },
    tile: {
        size: 40
    }
};

// Game State
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.canvas.width;
        this.canvas.height = CONFIG.canvas.height;
        
        this.currentLevel = 0;
        this.gameState = 'menu'; // menu, playing, levelComplete, gameOver
        this.keys = {};
        this.player = null;
        this.shadows = [];
        this.obstacles = [];
        this.platforms = [];
        this.goal = null;
        this.camera = { x: 0, y: 0 };
        
        this.setupEventListeners();
        this.loadLevel(0);
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ') {
                e.preventDefault();
                if (this.player && this.gameState === 'playing') {
                    this.player.toggleLight();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Button controls
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('nextLevelButton').addEventListener('click', () => {
            this.nextLevel();
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartLevel();
        });
    }
    
    startGame() {
        this.hideAllScreens();
        this.currentLevel = 0;
        this.loadLevel(this.currentLevel);
        this.gameState = 'playing';
        this.gameLoop();
    }
    
    nextLevel() {
        this.hideAllScreens();
        this.currentLevel++;
        if (this.currentLevel >= LEVELS.length) {
            // Game completed
            this.currentLevel = 0;
        }
        this.loadLevel(this.currentLevel);
        this.gameState = 'playing';
        this.gameLoop();
    }
    
    restartLevel() {
        this.hideAllScreens();
        this.loadLevel(this.currentLevel);
        this.gameState = 'playing';
        this.gameLoop();
    }
    
    hideAllScreens() {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
    }
    
    showScreen(screenId) {
        document.getElementById(screenId).classList.add('active');
    }
    
    loadLevel(levelIndex) {
        const level = LEVELS[levelIndex];
        
        // Create player
        this.player = new Player(level.playerStart.x, level.playerStart.y);
        
        // Create platforms
        this.platforms = level.platforms.map(p => 
            new Platform(p.x, p.y, p.width, p.height)
        );
        
        // Create obstacles
        this.obstacles = level.obstacles.map(o => 
            new Obstacle(o.x, o.y, o.width, o.height)
        );
        
        // Create shadows
        this.shadows = level.shadows.map(s => 
            new Shadow(s.x, s.y, s.patrol)
        );
        
        // Create goal
        this.goal = new Goal(level.goal.x, level.goal.y);
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // Update player
        this.player.update(this.keys, this.platforms, this.obstacles);
        
        // Update shadows
        this.shadows.forEach(shadow => {
            shadow.update(this.platforms);
            
            // Check if shadow can see player
            if (shadow.canSeePlayer(this.player, this.obstacles)) {
                this.gameOver();
            }
        });
        
        // Check if player reached goal
        if (this.checkCollision(this.player, this.goal)) {
            this.levelComplete();
        }
        
        // Update camera to follow player
        this.updateCamera();
    }
    
    updateCamera() {
        this.camera.x = this.player.x - CONFIG.canvas.width / 2;
        this.camera.y = this.player.y - CONFIG.canvas.height / 2;
        
        // Clamp camera to level bounds
        this.camera.x = Math.max(0, Math.min(this.camera.x, 1600 - CONFIG.canvas.width));
        this.camera.y = Math.max(0, Math.min(this.camera.y, 800 - CONFIG.canvas.height));
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear canvas with dark background
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
        
        // Save context state
        ctx.save();
        
        // Apply camera transform
        ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render platforms
        this.platforms.forEach(platform => platform.render(ctx));
        
        // Render obstacles
        this.obstacles.forEach(obstacle => obstacle.render(ctx));
        
        // Render goal
        if (this.goal) this.goal.render(ctx);
        
        // Render player light (behind player)
        if (this.player) this.player.renderLight(ctx);
        
        // Render shadows
        this.shadows.forEach(shadow => shadow.render(ctx, this.player, this.obstacles));
        
        // Render player
        if (this.player) this.player.render(ctx);
        
        // Restore context
        ctx.restore();
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        this.showScreen('game-over-screen');
    }
    
    levelComplete() {
        this.gameState = 'levelComplete';
        this.showScreen('level-complete-screen');
    }
    
    gameLoop() {
        this.update();
        this.render();
        
        if (this.gameState === 'playing' || this.gameState === 'gameOver' || this.gameState === 'levelComplete') {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Player Class
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.player.width;
        this.height = CONFIG.player.height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isOnGround = false;
        this.lightOn = true;
        this.lightRadius = CONFIG.player.lightRadius;
        this.facingRight = true;
    }
    
    toggleLight() {
        this.lightOn = !this.lightOn;
    }
    
    update(keys, platforms, obstacles) {
        // Horizontal movement
        if (keys['ArrowLeft']) {
            this.velocityX = -CONFIG.player.speed;
            this.facingRight = false;
        } else if (keys['ArrowRight']) {
            this.velocityX = CONFIG.player.speed;
            this.facingRight = true;
        } else {
            this.velocityX = 0;
        }
        
        // Apply gravity
        this.velocityY += CONFIG.player.gravity;
        if (this.velocityY > CONFIG.player.maxFallSpeed) {
            this.velocityY = CONFIG.player.maxFallSpeed;
        }
        
        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;
        
        // Check platform collisions
        this.isOnGround = false;
        platforms.forEach(platform => {
            if (this.checkCollisionWithPlatform(platform)) {
                this.resolveCollision(platform);
            }
        });
        
        // Check obstacle collisions
        obstacles.forEach(obstacle => {
            if (this.checkCollisionWithPlatform(obstacle)) {
                this.resolveCollision(obstacle);
            }
        });
        
        // Keep player in bounds
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
    }
    
    checkCollisionWithPlatform(platform) {
        return this.x < platform.x + platform.width &&
               this.x + this.width > platform.x &&
               this.y < platform.y + platform.height &&
               this.y + this.height > platform.y;
    }
    
    resolveCollision(platform) {
        // Calculate overlap on each axis
        const overlapX = Math.min(
            this.x + this.width - platform.x,
            platform.x + platform.width - this.x
        );
        const overlapY = Math.min(
            this.y + this.height - platform.y,
            platform.y + platform.height - this.y
        );
        
        // Resolve smallest overlap
        if (overlapX < overlapY) {
            // Horizontal collision
            if (this.x < platform.x) {
                this.x = platform.x - this.width;
            } else {
                this.x = platform.x + platform.width;
            }
            this.velocityX = 0;
        } else {
            // Vertical collision
            if (this.y < platform.y) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
                this.isOnGround = true;
            } else {
                this.y = platform.y + platform.height;
                this.velocityY = 0;
            }
        }
    }
    
    renderLight(ctx) {
        if (!this.lightOn) return;
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const radius = this.lightRadius;
        
        // Create radial gradient for light
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(255, 235, 59, 0.6)');
        gradient.addColorStop(0.4, 'rgba(255, 193, 7, 0.3)');
        gradient.addColorStop(0.7, 'rgba(255, 152, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    render(ctx) {
        // Draw firefly body
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Body (glowing yellow)
        ctx.fillStyle = this.lightOn ? '#ffeb3b' : '#555';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow when light is on
        if (this.lightOn) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ffeb3b';
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, this.width / 3, this.height / 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Wings
        const wingOffset = this.facingRight ? 5 : -5;
        ctx.strokeStyle = this.lightOn ? 'rgba(255, 235, 59, 0.5)' : 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 5);
        ctx.lineTo(centerX + wingOffset, centerY - 10);
        ctx.moveTo(centerX, centerY + 5);
        ctx.lineTo(centerX + wingOffset, centerY + 10);
        ctx.stroke();
    }
}

// Shadow Enemy Class
class Shadow {
    constructor(x, y, patrol) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.shadow.width;
        this.height = CONFIG.shadow.height;
        this.patrol = patrol; // Array of waypoints
        this.currentWaypoint = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.facingRight = true;
        this.detectionRange = CONFIG.shadow.detectionRange;
    }
    
    update(platforms) {
        if (this.patrol && this.patrol.length > 0) {
            const target = this.patrol[this.currentWaypoint];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 5) {
                // Reached waypoint, move to next
                this.currentWaypoint = (this.currentWaypoint + 1) % this.patrol.length;
            } else {
                // Move towards waypoint
                this.velocityX = (dx / distance) * CONFIG.shadow.speed;
                this.facingRight = this.velocityX > 0;
                
                // Apply gravity
                this.velocityY += CONFIG.player.gravity;
                
                this.x += this.velocityX;
                this.y += this.velocityY;
                
                // Platform collision
                platforms.forEach(platform => {
                    if (this.checkCollisionWithPlatform(platform)) {
                        this.resolveCollision(platform);
                    }
                });
            }
        }
    }
    
    checkCollisionWithPlatform(platform) {
        return this.x < platform.x + platform.width &&
               this.x + this.width > platform.x &&
               this.y < platform.y + platform.height &&
               this.y + this.height > platform.y;
    }
    
    resolveCollision(platform) {
        const overlapX = Math.min(
            this.x + this.width - platform.x,
            platform.x + platform.width - this.x
        );
        const overlapY = Math.min(
            this.y + this.height - platform.y,
            platform.y + platform.height - this.y
        );
        
        if (overlapX < overlapY) {
            if (this.x < platform.x) {
                this.x = platform.x - this.width;
            } else {
                this.x = platform.x + platform.width;
            }
        } else {
            if (this.y < platform.y) {
                this.y = platform.y - this.height;
                this.velocityY = 0;
            } else {
                this.y = platform.y + platform.height;
                this.velocityY = 0;
            }
        }
    }
    
    canSeePlayer(player, obstacles) {
        if (!player.lightOn) return false;
        
        const shadowCenterX = this.x + this.width / 2;
        const shadowCenterY = this.y + this.height / 2;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        const dx = playerCenterX - shadowCenterX;
        const dy = playerCenterY - shadowCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if player is in detection range
        if (distance > this.detectionRange) return false;
        
        // Check line of sight - is there an obstacle blocking?
        for (let obstacle of obstacles) {
            if (this.lineIntersectsRect(
                shadowCenterX, shadowCenterY,
                playerCenterX, playerCenterY,
                obstacle
            )) {
                return false; // Obstacle blocking view
            }
        }
        
        return true; // Player is visible!
    }
    
    lineIntersectsRect(x1, y1, x2, y2, rect) {
        // Check if line segment intersects rectangle
        const left = this.lineIntersectsLine(x1, y1, x2, y2, rect.x, rect.y, rect.x, rect.y + rect.height);
        const right = this.lineIntersectsLine(x1, y1, x2, y2, rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height);
        const top = this.lineIntersectsLine(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.width, rect.y);
        const bottom = this.lineIntersectsLine(x1, y1, x2, y2, rect.x, rect.y + rect.height, rect.x + rect.width, rect.y + rect.height);
        
        return left || right || top || bottom;
    }
    
    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
        if (denominator === 0) return false;
        
        const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
        const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
        
        return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
    }
    
    render(ctx, player, obstacles) {
        // Draw shadow creature
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Shadow body (dark purple/black)
        ctx.fillStyle = '#2c1a3a';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes (red glow)
        const eyeY = centerY - 5;
        const eyeOffset = 6;
        ctx.fillStyle = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.arc(centerX - eyeOffset, eyeY, 3, 0, Math.PI * 2);
        ctx.arc(centerX + eyeOffset, eyeY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw vision cone if player is visible
        if (player && this.canSeePlayer(player, obstacles)) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(player.x + player.width / 2, player.y + player.height / 2);
            ctx.stroke();
        }
    }
}

// Platform Class
class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    render(ctx) {
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

// Obstacle Class (hiding spots)
class Obstacle {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    render(ctx) {
        // Draw as a rock/barrier
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Add some texture
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        // Diagonal lines for texture
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.width, this.y + this.height);
        ctx.moveTo(this.x + this.width, this.y);
        ctx.lineTo(this.x, this.y + this.height);
        ctx.stroke();
    }
}

// Goal Class
class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.pulse = 0;
    }
    
    render(ctx) {
        this.pulse += 0.05;
        const radius = 20 + Math.sin(this.pulse) * 5;
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Draw glowing goal
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(0, 255, 100, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 100, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 255, 100, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw core
        ctx.fillStyle = '#00ff64';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Level Definitions
const LEVELS = [
    {
        name: "Tutorial - Learning to Hide",
        playerStart: { x: 50, y: 400 },
        platforms: [
            { x: 0, y: 500, width: 800, height: 100 },
            { x: 200, y: 400, width: 150, height: 20 },
            { x: 500, y: 300, width: 150, height: 20 }
        ],
        obstacles: [
            { x: 300, y: 440, width: 60, height: 60 },
            { x: 600, y: 240, width: 80, height: 60 }
        ],
        shadows: [
            { x: 400, y: 450, patrol: [
                { x: 400, y: 450 },
                { x: 600, y: 450 }
            ]}
        ],
        goal: { x: 700, y: 250 }
    },
    {
        name: "The Narrow Path",
        playerStart: { x: 50, y: 400 },
        platforms: [
            { x: 0, y: 500, width: 300, height: 100 },
            { x: 350, y: 450, width: 100, height: 20 },
            { x: 500, y: 400, width: 100, height: 20 },
            { x: 650, y: 350, width: 150, height: 20 }
        ],
        obstacles: [
            { x: 375, y: 390, width: 50, height: 60 },
            { x: 525, y: 340, width: 50, height: 60 }
        ],
        shadows: [
            { x: 250, y: 450, patrol: [
                { x: 250, y: 450 },
                { x: 350, y: 450 },
                { x: 250, y: 450 }
            ]},
            { x: 600, y: 400, patrol: [
                { x: 600, y: 400 },
                { x: 700, y: 400 }
            ]}
        ],
        goal: { x: 750, y: 300 }
    },
    {
        name: "Shadow Maze",
        playerStart: { x: 50, y: 450 },
        platforms: [
            { x: 0, y: 550, width: 200, height: 50 },
            { x: 250, y: 500, width: 100, height: 20 },
            { x: 400, y: 450, width: 100, height: 20 },
            { x: 550, y: 400, width: 100, height: 20 },
            { x: 700, y: 350, width: 100, height: 20 }
        ],
        obstacles: [
            { x: 150, y: 490, width: 70, height: 60 },
            { x: 300, y: 440, width: 70, height: 60 },
            { x: 450, y: 390, width: 70, height: 60 },
            { x: 600, y: 340, width: 70, height: 60 }
        ],
        shadows: [
            { x: 180, y: 500, patrol: [
                { x: 180, y: 500 },
                { x: 280, y: 500 }
            ]},
            { x: 350, y: 450, patrol: [
                { x: 350, y: 450 },
                { x: 480, y: 450 }
            ]},
            { x: 600, y: 400, patrol: [
                { x: 600, y: 400 },
                { x: 680, y: 400 }
            ]}
        ],
        goal: { x: 750, y: 300 }
    }
];

// Initialize and start game
let game;
window.addEventListener('load', () => {
    game = new Game();
});
