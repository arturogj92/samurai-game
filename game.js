// Game Configuration
console.log('🎮 GAME.JS LOADED - Chain Lightning Version v20251014004 ⚡');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// World dimensions (much larger than canvas)
const WORLD = {
    width: 3200,
    height: 2400
};

// Decorative Floor Tiles System
class FloorTile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = type === 'campfire' ? 25 : type === 'rock' ? 15 : 20;
        this.variant = Math.floor(Math.random() * 3); // Random variant for variety
    }

    draw() {
        switch(this.type) {
            case 'campfire':
                this.drawCampfire();
                break;
            case 'rock':
                this.drawRock();
                break;
            case 'bush':
                this.drawBush();
                break;
            case 'grass':
                this.drawGrass();
                break;
            case 'crack':
                this.drawCrack();
                break;
            case 'stone':
                this.drawStone();
                break;
            case 'chest':
                this.drawChest();
                break;
        }
    }

    drawCampfire() {
        // Fire base (stones in circle)
        ctx.fillStyle = '#4A4A4A';
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const x = this.x + Math.cos(angle) * 12;
            const y = this.y + Math.sin(angle) * 12;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Wood logs
        ctx.fillStyle = '#5C4033';
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-10, -2, 20, 4);
        ctx.rotate(Math.PI / 2);
        ctx.fillRect(-10, -2, 20, 4);
        ctx.restore();

        // Fire (animated with time)
        const flicker = Math.sin(performance.now() * 0.005 + this.x) * 0.2 + 0.8;

        // Red flame
        ctx.fillStyle = `rgba(255, 69, 0, ${0.8 * flicker})`;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 15);
        ctx.lineTo(this.x - 6, this.y);
        ctx.lineTo(this.x + 6, this.y);
        ctx.closePath();
        ctx.fill();

        // Yellow flame
        ctx.fillStyle = `rgba(255, 215, 0, ${0.7 * flicker})`;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 10);
        ctx.lineTo(this.x - 4, this.y);
        ctx.lineTo(this.x + 4, this.y);
        ctx.closePath();
        ctx.fill();

        // Glow effect
        ctx.shadowColor = 'rgba(255, 150, 0, 0.5)';
        ctx.shadowBlur = 15 * flicker;
        ctx.fillStyle = `rgba(255, 200, 0, ${0.3 * flicker})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 5, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawRock() {
        // Gray rock with shading
        ctx.fillStyle = '#696969';
        ctx.beginPath();

        // Irregular rock shape
        const points = 6;
        for (let i = 0; i < points; i++) {
            const angle = (Math.PI * 2 * i) / points;
            const radius = this.size * (0.8 + Math.random() * 0.4);
            const x = this.x + Math.cos(angle) * radius;
            const y = this.y + Math.sin(angle) * radius * 0.7;
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#909090';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, this.size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBush() {
        // Dark green bush
        ctx.fillStyle = '#2F4F2F';

        // Multiple overlapping circles for bushy appearance
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 * i) / 5;
            const x = this.x + Math.cos(angle) * 8;
            const y = this.y + Math.sin(angle) * 8;
            ctx.beginPath();
            ctx.arc(x, y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Center circle
        ctx.fillStyle = '#3A5F3A';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Lighter green highlights
        ctx.fillStyle = '#4A7F4A';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, this.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGrass() {
        // Small grass patches
        ctx.strokeStyle = '#3A5F3A';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6 + this.variant;
            const x = this.x + Math.cos(angle) * 8;
            const y = this.y + Math.sin(angle) * 8;

            ctx.beginPath();
            ctx.moveTo(x, y + 5);
            ctx.lineTo(x + (Math.random() - 0.5) * 4, y - 5);
            ctx.stroke();
        }
    }

    drawCrack() {
        // Floor crack/crevice
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y);
        ctx.lineTo(this.x - 5, this.y + 5);
        ctx.lineTo(this.x + 5, this.y - 3);
        ctx.lineTo(this.x + 15, this.y + 2);
        ctx.stroke();

        // Smaller branch cracks
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y + 5);
        ctx.lineTo(this.x - 8, this.y + 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y - 3);
        ctx.lineTo(this.x + 7, this.y - 8);
        ctx.stroke();
    }

    drawStone() {
        // Flat stone tile
        ctx.fillStyle = '#5A5A5A';
        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y - 8);
        ctx.lineTo(this.x + 12, this.y - 8);
        ctx.lineTo(this.x + 15, this.y + 8);
        ctx.lineTo(this.x - 15, this.y + 8);
        ctx.closePath();
        ctx.fill();

        // Stone texture lines
        ctx.strokeStyle = '#4A4A4A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - 3);
        ctx.lineTo(this.x + 10, this.y - 3);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x - 12, this.y + 3);
        ctx.lineTo(this.x + 12, this.y + 3);
        ctx.stroke();
    }

    drawChest() {
        // Wooden chest
        const chestWidth = 24;
        const chestHeight = 18;

        // Chest body (brown)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - chestWidth/2, this.y - chestHeight/2, chestWidth, chestHeight);

        // Chest lid (darker brown)
        ctx.fillStyle = '#654321';
        ctx.fillRect(this.x - chestWidth/2, this.y - chestHeight/2, chestWidth, 6);

        // Metal bands
        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 2;

        // Vertical bands
        ctx.beginPath();
        ctx.moveTo(this.x - chestWidth/2 + 6, this.y - chestHeight/2);
        ctx.lineTo(this.x - chestWidth/2 + 6, this.y + chestHeight/2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.x + chestWidth/2 - 6, this.y - chestHeight/2);
        ctx.lineTo(this.x + chestWidth/2 - 6, this.y + chestHeight/2);
        ctx.stroke();

        // Horizontal band
        ctx.beginPath();
        ctx.moveTo(this.x - chestWidth/2, this.y);
        ctx.lineTo(this.x + chestWidth/2, this.y);
        ctx.stroke();

        // Lock
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y + 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x - chestWidth/2 + 2, this.y + chestHeight/2, chestWidth - 4, 3);
    }
}

// Generate decorative tiles for the world
function generateFloorTiles() {
    const tiles = [];
    const density = 2000; // VERY high spacing (2000px between potential tiles)
    const spawnChance = 0.02; // Only 2% chance to spawn - VERY RARE

    // Grid-based generation with camera culling in mind
    for (let x = 0; x < WORLD.width; x += density) {
        for (let y = 0; y < WORLD.height; y += density) {
            // Random chance to spawn a tile
            if (Math.random() < spawnChance) {
                // Random offset within grid cell
                const offsetX = (Math.random() - 0.5) * density * 0.8;
                const offsetY = (Math.random() - 0.5) * density * 0.8;
                const tileX = x + offsetX;
                const tileY = y + offsetY;

                // Only subtle decorations (NO campfires or chests)
                const tileTypes = ['rock', 'crack', 'grass', 'bush', 'stone'];
                const randomType = tileTypes[Math.floor(Math.random() * tileTypes.length)];

                tiles.push(new FloorTile(tileX, tileY, randomType));
            }
        }
    }

    console.log(`Generated ${tiles.length} decorative floor tiles`);
    return tiles;
}

// Initialize floor tiles
const floorTiles = generateFloorTiles();

// Sprite Animation System
class SpriteAnimator {
    constructor(spritePath, frameWidth, frameHeight, frameCount, fps = 10, loop = true) {
        this.image = new Image();
        this.image.src = spritePath;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.fps = fps;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameDelay = 1000 / fps; // ms per frame
        this.loaded = false;
        this.loop = loop; // Whether animation loops or stops at last frame
        this.finished = false; // True when non-looping animation reaches end

        this.image.onload = () => {
            this.loaded = true;
        };
    }

    update(deltaTime) {
        if (!this.loaded) return;
        if (this.finished) return; // Don't update if animation is finished

        this.frameTimer += deltaTime;

        if (this.frameTimer >= this.frameDelay) {
            if (this.loop) {
                // Loop animation
                this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            } else {
                // Play once and stop at last frame
                this.currentFrame++;
                if (this.currentFrame >= this.frameCount) {
                    this.currentFrame = this.frameCount - 1; // Stay on last frame
                    this.finished = true;
                }
            }
            this.frameTimer = 0;
        }
    }

    draw(ctx, x, y, scale = 1, flipH = false, row = 0) {
        if (!this.loaded) return;

        const drawWidth = this.frameWidth * scale;
        const drawHeight = this.frameHeight * scale;

        // Calculate destination position (centered on x, y)
        let destX = x - drawWidth / 2;
        let destY = y - drawHeight / 2;

        // Calculate source Y based on row (for multi-directional sprites)
        const sourceY = row * this.frameHeight;

        if (flipH) {
            ctx.save();
            ctx.translate(x, y);
            ctx.scale(-1, 1);

            ctx.drawImage(
                this.image,
                this.currentFrame * this.frameWidth, // source x
                sourceY, // source y (row-based for directional sprites)
                this.frameWidth, // source width
                this.frameHeight, // source height
                -drawWidth / 2, // dest x (centered)
                -drawHeight / 2, // dest y (centered)
                drawWidth, // dest width
                drawHeight // dest height
            );

            ctx.restore();
        } else {
            // No flip - direct draw without save/restore
            ctx.drawImage(
                this.image,
                this.currentFrame * this.frameWidth, // source x
                sourceY, // source y (row-based for directional sprites)
                this.frameWidth, // source width
                this.frameHeight, // source height
                destX, // dest x (centered)
                destY, // dest y (centered)
                drawWidth, // dest width
                drawHeight // dest height
            );
        }
    }

    reset() {
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.finished = false;
    }
}

// Sprite collections
const SPRITES = {
    kunoichi: {
        idle: null,
        walk: null,
        run: null,
        attack1: null,
        attack2: null,
        hurt: null,
        dead: null
    },
    ninjaMonk: {
        idle: null,
        walk: null,
        run: null,
        attack1: null,
        attack2: null,
        hurt: null,
        dead: null
    },
    ninjaPeasant: {
        idle: null,
        walk: null,
        run: null,
        attack1: null,
        attack2: null,
        shot: null,
        hurt: null,
        dead: null
    },
    samuraiArcher: {
        idle: null,
        walk: null,
        run: null,
        attack1: null,
        attack2: null,
        attack3: null,
        shot: null,
        hurt: null,
        dead: null,
        jump: null
    }
};

// Arrow sprite (loaded separately)
let arrowSprite = null;

// Background tiles
let backgroundTile107 = null;
let backgroundTile108 = null;
let backgroundTile109 = null;

// Initialize sprites
function initSprites() {
    // Kunoichi sprites (enemies)
    SPRITES.kunoichi.idle = new SpriteAnimator('assets/Kunoichi/Idle.png', 128, 128, 9, 8);
    SPRITES.kunoichi.walk = new SpriteAnimator('assets/Kunoichi/Walk.png', 128, 128, 8, 12);
    SPRITES.kunoichi.run = new SpriteAnimator('assets/Kunoichi/Run.png', 128, 128, 8, 15);
    SPRITES.kunoichi.attack1 = new SpriteAnimator('assets/Kunoichi/Attack_1.png', 128, 128, 6, 12);
    SPRITES.kunoichi.attack2 = new SpriteAnimator('assets/Kunoichi/Attack_2.png', 128, 128, 6, 12);
    SPRITES.kunoichi.hurt = new SpriteAnimator('assets/Kunoichi/Hurt.png', 128, 128, 3, 8);
    SPRITES.kunoichi.dead = new SpriteAnimator('assets/Kunoichi/Dead.png', 128, 128, 10, 8);

    // Ninja Monk sprites
    SPRITES.ninjaMonk.idle = new SpriteAnimator('assets/Ninja_Monk/Idle.png', 128, 128, 7, 8);
    SPRITES.ninjaMonk.walk = new SpriteAnimator('assets/Ninja_Monk/Walk.png', 128, 128, 8, 12);
    SPRITES.ninjaMonk.run = new SpriteAnimator('assets/Ninja_Monk/Run.png', 128, 128, 8, 15);
    SPRITES.ninjaMonk.attack1 = new SpriteAnimator('assets/Ninja_Monk/Attack_1.png', 128, 128, 4, 10);
    SPRITES.ninjaMonk.attack2 = new SpriteAnimator('assets/Ninja_Monk/Attack_2.png', 128, 128, 4, 10);
    SPRITES.ninjaMonk.hurt = new SpriteAnimator('assets/Ninja_Monk/Hurt.png', 128, 128, 3, 8);
    SPRITES.ninjaMonk.dead = new SpriteAnimator('assets/Ninja_Monk/Dead.png', 128, 128, 7, 8);

    // Ninja Peasant sprites
    SPRITES.ninjaPeasant.idle = new SpriteAnimator('assets/Ninja_Peasant/Idle.png', 96, 96, 6, 8);
    SPRITES.ninjaPeasant.walk = new SpriteAnimator('assets/Ninja_Peasant/Walk.png', 96, 96, 8, 12);
    SPRITES.ninjaPeasant.run = new SpriteAnimator('assets/Ninja_Peasant/Run.png', 96, 96, 6, 15);
    SPRITES.ninjaPeasant.attack1 = new SpriteAnimator('assets/Ninja_Peasant/Attack_1.png', 96, 96, 6, 12);
    SPRITES.ninjaPeasant.attack2 = new SpriteAnimator('assets/Ninja_Peasant/Attack_2.png', 96, 96, 4, 12);
    SPRITES.ninjaPeasant.shot = new SpriteAnimator('assets/Ninja_Peasant/Shot.png', 96, 96, 6, 15);
    SPRITES.ninjaPeasant.hurt = new SpriteAnimator('assets/Ninja_Peasant/Hurt.png', 96, 96, 2, 8);
    SPRITES.ninjaPeasant.dead = new SpriteAnimator('assets/Ninja_Peasant/Dead.png', 96, 96, 4, 8);

    // Archer sprites (player) - Now using Archer_Blue.png for all animations
    const archerPath = 'assets/Factions/Knights/Troops/Archer/Blue/Archer_Blue.png';
    SPRITES.samuraiArcher.idle = new SpriteAnimator(archerPath, 192, 192, 6, 8); // Row 0: Idle
    SPRITES.samuraiArcher.walk = new SpriteAnimator(archerPath, 192, 192, 6, 12); // Row 1: Walk
    SPRITES.samuraiArcher.run = new SpriteAnimator(archerPath, 192, 192, 6, 15); // Row 1: Walk (faster)
    SPRITES.samuraiArcher.attack1 = new SpriteAnimator(archerPath, 192, 192, 8, 12); // Row 2-6: Shooting
    SPRITES.samuraiArcher.attack2 = new SpriteAnimator(archerPath, 192, 192, 8, 12); // Row 2-6: Shooting
    SPRITES.samuraiArcher.attack3 = new SpriteAnimator(archerPath, 192, 192, 8, 12); // Row 2-6: Shooting
    SPRITES.samuraiArcher.shot = new SpriteAnimator(archerPath, 192, 192, 8, 15); // Row 2-6: Shooting directions
    SPRITES.samuraiArcher.hurt = new SpriteAnimator(archerPath, 192, 192, 6, 8); // Row 1: Walk (hurt uses walk)
    SPRITES.samuraiArcher.dead = new SpriteAnimator(archerPath, 192, 192, 6, 8); // Row 0: Idle (death uses idle)
    SPRITES.samuraiArcher.jump = new SpriteAnimator(archerPath, 192, 192, 6, 12); // Row 1: Walk (jump uses walk)

    // Load arrow sprite
    arrowSprite = new Image();
    arrowSprite.src = 'assets/Factions/Knights/Troops/Archer/Arrow/Arrow.png';

    // Load background tiles
    backgroundTile107 = new Image();
    backgroundTile107.src = 'assets/2 Dungeon Tileset/1 Tiles/Tile_107.png';
    backgroundTile108 = new Image();
    backgroundTile108.src = 'assets/2 Dungeon Tileset/1 Tiles/Tile_108.png';
    backgroundTile109 = new Image();
    backgroundTile109.src = 'assets/2 Dungeon Tileset/1 Tiles/Tile_109.png';
}

// Initialize sprites when page loads
initSprites();

// Camera system
const camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,

    follow(target) {
        // Center camera on target
        this.x = target.x - this.width / 2;
        this.y = target.y - this.height / 2;

        // Keep camera within world bounds
        this.x = Math.max(0, Math.min(this.x, WORLD.width - this.width));
        this.y = Math.max(0, Math.min(this.y, WORLD.height - this.height));
    }
};

const GAME_STATE = {
    playing: true,
    score: 0,
    wave: 1,
    enemiesKilled: 0,
    isWaveBreak: false,
    waveBreakEndTime: 0,

    // Wave system
    enemiesThisWave: 0,      // Enemigos que quedan por matar en esta wave
    totalEnemiesThisWave: 10, // Total de enemigos para esta wave

    // Recursos persistentes
    resources: {
        bambooSeeds: 5,  // Semillas de bambú - Start with 5
        wood: 0,         // Madera
        gold: 0          // Oro - Only obtainable by selling wood to vendor
    },

    // Modos de herramienta
    axeMode: false,
    axeModeStartTime: 0,

    // Shop
    shopOpen: false,
    purchasesThisWave: 0
};

// Vendedor NPC Class
class Vendor {
    constructor() {
        // Spawn en una posición fija del mundo
        this.x = WORLD.width / 2 + 300;
        this.y = WORLD.height / 2;
        this.size = 32; // Sprite size
        this.interactionRadius = 80;
        this.scale = 1.5; // Smaller sprite scale
        this.frameWidth = 128; // Samurai_Commander sprite frame width
        this.frameHeight = 128; // Samurai_Commander sprite frame height
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.totalFrames = 5; // Idle animation has 5 frames (640px / 128px = 5)
        this.fps = 6; // Smooth animation speed
    }

    update(deltaTime) {
        // Animate the vendor sprite smoothly
        this.frameTimer += deltaTime;
        const frameDelay = 1000 / this.fps;

        if (this.frameTimer >= frameDelay) {
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            this.frameTimer = 0;
        }
    }

    draw() {
        // Draw vendor sprite if loaded
        if (typeof NPC_SPRITES !== 'undefined' && NPC_SPRITES.loaded && NPC_SPRITES.vendor) {
            const sprite = NPC_SPRITES.vendor;
            const spriteWidth = this.frameWidth * this.scale;
            const spriteHeight = this.frameHeight * this.scale;

            // Calculate if player is to the left or right of vendor
            const playerToLeft = ninja.x < this.x;

            // Save context state before flipping
            ctx.save();

            // Flip sprite horizontally if player is to the left
            if (playerToLeft) {
                ctx.translate(this.x * 2, 0);
                ctx.scale(-1, 1);
            }

            ctx.drawImage(
                sprite,
                this.currentFrame * this.frameWidth, 0, // Source x, y
                this.frameWidth, this.frameHeight, // Source width, height
                this.x - spriteWidth / 2,
                this.y - spriteHeight / 2,
                spriteWidth,
                spriteHeight
            );

            // Restore context state
            ctx.restore();

            // Texto - positioned clearly below sprite with shadow
            ctx.textAlign = 'center';
            // Shadow for better visibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.fillText('🪙 VENDEDOR', this.x + 2, this.y + spriteHeight / 2 + 22);
            // Main text
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.fillText('🪙 VENDEDOR', this.x, this.y + spriteHeight / 2 + 20);
        } else {
            // Fallback: simple shape if sprite not loaded
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x - 10, this.y - 30, 20, 30);

            // Cabeza
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x, this.y - 35, 10, 0, Math.PI * 2);
            ctx.fill();

            // Texto - positioned below with shadow
            ctx.textAlign = 'center';
            // Shadow for better visibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.fillText('🪙 VENDEDOR', this.x + 2, this.y + 47);
            // Main text
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 20px "Courier New", monospace';
            ctx.fillText('🪙 VENDEDOR', this.x, this.y + 45);
        }

        // Indicator si el jugador está cerca
        const dist = distance(ninja.x, ninja.y, this.x, this.y);
        if (dist < this.interactionRadius) {
            const spriteHeight = this.frameHeight * this.scale;
            const textY = this.y + spriteHeight / 2 + 35;

            // Show instructions based on wave break
            ctx.textAlign = 'center';
            if (GAME_STATE.isWaveBreak && GAME_STATE.purchasesThisWave < 2) {
                // During wave break - show both options
                // Shadow for better visibility
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.font = 'bold 20px "Courier New", monospace';
                ctx.fillText('Presiona T para Tienda y V para Vender Madera', this.x + 2, textY + 2);

                // Main text in gold
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 20px "Courier New", monospace';
                ctx.fillText('Presiona T para Tienda y V para Vender Madera', this.x, textY);
            } else {
                // Not in wave break - only show V for selling
                // Shadow
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.font = 'bold 20px "Courier New", monospace';
                ctx.fillText('Presiona V para Vender Madera', this.x + 2, textY + 2);

                // Main text in green
                ctx.fillStyle = '#00FF00';
                ctx.font = 'bold 20px "Courier New", monospace';
                ctx.fillText('Presiona V para Vender Madera', this.x, textY);
            }
        }
    }

    isPlayerNear() {
        return distance(ninja.x, ninja.y, this.x, this.y) < this.interactionRadius;
    }
}

const vendor = new Vendor();

// Abilities system
const ABILITIES = {
    dash: {
        key: 'q',
        unlocked: true, // Always unlocked
        cooldown: 3000, // 3 seconds
        lastUsed: 0,
        duration: 200, // Dash animation duration
        distance: 150, // Dash distance

        use(timestamp) {
            if (!this.unlocked) return false;
            if (timestamp - this.lastUsed < this.cooldown) return false;
            if (ninja.isDashing) return false; // Don't dash while already dashing

            // Calculate dash direction based on movement keys
            let dx = 0, dy = 0;
            if (ninja.keys['ArrowUp'] || ninja.keys['w']) dy = -1;
            if (ninja.keys['ArrowDown'] || ninja.keys['s']) dy = 1;
            if (ninja.keys['ArrowLeft'] || ninja.keys['a']) dx = -1;
            if (ninja.keys['ArrowRight'] || ninja.keys['d']) dx = 1;

            // Default to right if no direction
            if (dx === 0 && dy === 0) dx = 1;

            // Normalize and calculate target position
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            let targetX = ninja.x + (dx / magnitude) * this.distance;
            let targetY = ninja.y + (dy / magnitude) * this.distance;

            // Clamp target to world bounds
            targetX = Math.max(ninja.size, Math.min(WORLD.width - ninja.size, targetX));
            targetY = Math.max(ninja.size, Math.min(WORLD.height - ninja.size, targetY));

            // Start smooth dash animation
            ninja.startDash(targetX, targetY, timestamp);

            this.lastUsed = timestamp;

            return true;
        }
    },

    burst: {
        key: 'e',
        unlocked: false, // Locked - must be purchased
        cooldown: 5000, // 5 seconds
        lastUsed: 0,
        projectiles: 12, // Number of shurikens to fire

        use(timestamp) {
            if (!this.unlocked) return false;
            if (timestamp - this.lastUsed < this.cooldown) return false;

            // Fire shurikens in all directions (but respect max limit)
            for (let i = 0; i < this.projectiles; i++) {
                if (shurikens.length >= MAX_SHURIKENS) break; // Stop if we hit the limit
                const angle = (Math.PI * 2 * i) / this.projectiles;
                const targetX = ninja.x + Math.cos(angle) * 1000;
                const targetY = ninja.y + Math.sin(angle) * 1000;
                shurikens.push(new Shuriken(ninja.x, ninja.y, targetX, targetY));
            }

            this.lastUsed = timestamp;

            // Visual effect
            createBurstEffect(ninja.x, ninja.y);

            return true;
        }
    },

    shield: {
        key: 'r',
        unlocked: true, // Always unlocked
        cooldown: 10000, // 10 seconds
        lastUsed: 0,
        duration: 3000, // 3 seconds of invincibility
        active: false,
        endTime: 0,

        use(timestamp) {
            if (!this.unlocked) return false;
            if (timestamp - this.lastUsed < this.cooldown) return false;

            this.active = true;
            this.endTime = timestamp + this.duration;
            this.lastUsed = timestamp;
            ninja.shielded = true;

            return true;
        },

        update(timestamp) {
            if (this.active && timestamp > this.endTime) {
                this.active = false;
                ninja.shielded = false;
            }
        }
    },

    chainLightning: {
        key: 'x',
        unlocked: false, // Locked - must be purchased
        cooldown: 7000, // 7 seconds
        lastUsed: 0,
        maxBounces: 5,
        damageDecay: 0.7, // Each bounce does 70% of previous damage
        baseDamage: 30,
        maxRange: 400, // Max distance to find next target

        use(timestamp) {
            if (!this.unlocked) return false;
            if (timestamp - this.lastUsed < this.cooldown) return false;
            if (enemies.length === 0) return false;

            console.log('⚡ CHAIN LIGHTNING ACTIVATED! Enemies:', enemies.length);

            // Find nearest enemy to player
            let nearestEnemy = null;
            let nearestDist = Infinity;

            for (const enemy of enemies) {
                const dx = enemy.x - ninja.x;
                const dy = enemy.y - ninja.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            }

            if (!nearestEnemy) return false;

            // Chain lightning through enemies
            const hitEnemies = new Set();
            let currentTarget = nearestEnemy;
            let currentDamage = this.baseDamage;
            let previousTarget = { x: ninja.x, y: ninja.y };

            for (let bounce = 0; bounce < this.maxBounces && currentTarget; bounce++) {
                // Damage current target
                currentTarget.health -= currentDamage;
                hitEnemies.add(currentTarget);

                // Create lightning effect from previous to current
                const lightningEffect = new ChainLightningEffect(
                    previousTarget.x,
                    previousTarget.y,
                    currentTarget.x,
                    currentTarget.y
                );
                effects.push(lightningEffect);
                console.log(`  ⚡ Bolt ${bounce + 1}: (${previousTarget.x.toFixed(0)},${previousTarget.y.toFixed(0)}) → (${currentTarget.x.toFixed(0)},${currentTarget.y.toFixed(0)})`);

                // Find next target
                let nextTarget = null;
                let nextDist = Infinity;

                for (const enemy of enemies) {
                    if (hitEnemies.has(enemy)) continue;

                    const dx = enemy.x - currentTarget.x;
                    const dy = enemy.y - currentTarget.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < nextDist && dist <= this.maxRange) {
                        nextDist = dist;
                        nextTarget = enemy;
                    }
                }

                previousTarget = currentTarget;
                currentTarget = nextTarget;
                currentDamage *= this.damageDecay;
            }

            console.log(`⚡ Chain Lightning complete! Total effects: ${effects.length}`);
            this.lastUsed = timestamp;
            return true;
        }
    }
};

// Verify Chain Lightning is loaded
console.log('⚡ Chain Lightning ability loaded:', !!ABILITIES.chainLightning);
console.log('⚡ Chain Lightning key:', ABILITIES.chainLightning?.key);

// Upgrade system - Now purchased with gold
const UPGRADES = {
    dashCooldown: {
        name: "Fast Dash",
        description: "Reduce Dash cooldown by 20%",
        cost: 100,
        purchased: false,
        apply() {
            ABILITIES.dash.cooldown *= 0.8;
            this.purchased = true;
        }
    },
    dashDistance: {
        name: "Long Dash",
        description: "Increase Dash distance by 30%",
        cost: 100,
        purchased: false,
        apply() {
            ABILITIES.dash.distance *= 1.3;
            this.purchased = true;
        }
    },
    burstCooldown: {
        name: "Rapid Burst",
        description: "Reduce Burst cooldown by 20%",
        cost: 150,
        purchased: false,
        apply() {
            ABILITIES.burst.cooldown *= 0.8;
            this.purchased = true;
        }
    },
    burstProjectiles: {
        name: "More Shurikens",
        description: "Burst fires 4 more shurikens",
        cost: 150,
        purchased: false,
        apply() {
            ABILITIES.burst.projectiles += 4;
            this.purchased = true;
        }
    },
    shieldCooldown: {
        name: "Quick Shield",
        description: "Reduce Shield cooldown by 20%",
        cost: 200,
        purchased: false,
        apply() {
            ABILITIES.shield.cooldown *= 0.8;
            this.purchased = true;
        }
    },
    shieldDuration: {
        name: "Long Shield",
        description: "Increase Shield duration by 1 second",
        cost: 200,
        purchased: false,
        apply() {
            ABILITIES.shield.duration += 1000;
            this.purchased = true;
        }
    },
    moveSpeed: {
        name: "Swift Ninja",
        description: "Increase movement speed by 20%",
        cost: 120,
        purchased: false,
        apply() {
            ninja.speed *= 1.2;
            this.purchased = true;
        }
    },
    fireRate: {
        name: "Quick Shot",
        description: "Reduce attack cooldown by 15%",
        cost: 120,
        purchased: false,
        apply() {
            shurikenCooldown *= 0.85;
            this.purchased = true;
        }
    },
    bambooSeeds: {
        name: "Bamboo Seeds Pack",
        description: "Get 5 bamboo seeds",
        cost: 30,
        purchased: false,
        repeatable: true, // Can buy multiple times
        apply() {
            GAME_STATE.resources.bambooSeeds += 5;
            if (!this.repeatable) {
                this.purchased = true;
            }
        }
    },
    unlockBurst: {
        name: "🌟 Unlock Burst Attack",
        description: "Unlock the Burst ability (E) - fires 12 shurikens in all directions",
        cost: 80,
        purchased: false,
        apply() {
            ABILITIES.burst.unlocked = true;
            ABILITIES.burst.lastUsed = performance.now(); // Set to now so it's immediately usable
            this.purchased = true;
        }
    },
    unlockLightning: {
        name: "⚡ Unlock Chain Lightning",
        description: "Unlock the Chain Lightning ability (X) - devastating electric attack that chains between enemies",
        cost: 120,
        purchased: false,
        apply() {
            ABILITIES.chainLightning.unlocked = true;
            ABILITIES.chainLightning.lastUsed = performance.now() - ABILITIES.chainLightning.cooldown; // Make immediately ready
            this.purchased = true;
        }
    }
};

function showShop() {
    // Solo se puede abrir durante wave break
    if (!GAME_STATE.isWaveBreak) {
        return;
    }

    // Check if already purchased 2 items
    if (GAME_STATE.purchasesThisWave >= 2) {
        return;
    }

    GAME_STATE.shopOpen = true;
    GAME_STATE.playing = false;

    const menu = document.getElementById('upgradeMenu');
    const options = document.getElementById('upgradeOptions');
    options.innerHTML = '';

    // Show purchases remaining
    const purchasesRemaining = 2 - GAME_STATE.purchasesThisWave;
    const header = document.createElement('div');
    header.className = 'shop-header';
    header.innerHTML = `<p class="purchases-remaining">Compras restantes: ${purchasesRemaining}/2</p>`;
    options.appendChild(header);

    // Show all upgrades
    Object.keys(UPGRADES).forEach(key => {
        const upgrade = UPGRADES[key];

        // Skip if already purchased and not repeatable
        if (upgrade.purchased && !upgrade.repeatable) return;

        const canAfford = GAME_STATE.resources.gold >= upgrade.cost;

        const card = document.createElement('div');
        card.className = `upgrade-card ${!canAfford ? 'disabled' : ''}`;
        card.innerHTML = `
            <h3>${upgrade.name}</h3>
            <p>${upgrade.description}</p>
            <p class="upgrade-cost">💰 ${upgrade.cost} Gold</p>
        `;

        if (canAfford) {
            card.onclick = () => buyUpgrade(key);
        }

        options.appendChild(card);
    });

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'shop-close-btn';
    closeBtn.textContent = 'Close Shop (T)';
    closeBtn.onclick = closeShop;
    options.appendChild(closeBtn);

    menu.classList.remove('hidden');
}

function buyUpgrade(key) {
    const upgrade = UPGRADES[key];

    if (GAME_STATE.resources.gold >= upgrade.cost && GAME_STATE.purchasesThisWave < 2) {
        GAME_STATE.resources.gold -= upgrade.cost;
        upgrade.apply();
        GAME_STATE.purchasesThisWave++;

        // Check if reached limit
        if (GAME_STATE.purchasesThisWave >= 2) {
            // Close shop automatically
            closeShop();
        } else {
            // Refresh shop to update available upgrades
            showShop();
        }
    }
}

function closeShop() {
    document.getElementById('upgradeMenu').classList.add('hidden');
    GAME_STATE.shopOpen = false;
    GAME_STATE.playing = true;
}

// Visual effects
const effects = [];

class Effect {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.lifetime = 0;
        this.maxLifetime = type === 'dash' ? 300 : type === 'burst' ? 500 : 3000;
    }

    update(deltaTime) {
        this.lifetime += deltaTime;
        return this.lifetime < this.maxLifetime;
    }

    draw() {
        const alpha = 1 - (this.lifetime / this.maxLifetime);

        if (this.type === 'dash') {
            ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20 + this.lifetime / 10, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === 'burst') {
            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.lineWidth = 2;
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                const radius = this.lifetime / 3;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + Math.cos(angle) * radius, this.y + Math.sin(angle) * radius);
                ctx.stroke();
            }
        }
    }
}

function createDashEffect(x, y) {
    effects.push(new Effect(x, y, 'dash'));
}

function createBurstEffect(x, y) {
    effects.push(new Effect(x, y, 'burst'));
}

// Chain Lightning Effect Class
class ChainLightningEffect {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.lifetime = 0;
        this.maxLifetime = 500; // 500ms lightning bolt duration (increased for visibility)
        this.segments = 12; // Number of segments in the lightning bolt
        this.jitter = 15; // How much the lightning zigzags
    }

    update(deltaTime) {
        this.lifetime += deltaTime;
        return this.lifetime < this.maxLifetime;
    }

    draw() {
        const alpha = 1 - (this.lifetime / this.maxLifetime);

        // Draw lightning bolt with zigzag effect - BRIGHT BLUE/WHITE
        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
        ctx.lineWidth = 5;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `rgba(100, 200, 255, ${alpha * 0.8})`;

        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);

        // Create zigzag segments
        for (let i = 1; i < this.segments; i++) {
            const t = i / this.segments;
            const x = this.x1 + (this.x2 - this.x1) * t;
            const y = this.y1 + (this.y2 - this.y1) * t;

            // Add random offset perpendicular to the line
            const dx = this.x2 - this.x1;
            const dy = this.y2 - this.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            const perpX = -dy / length;
            const perpY = dx / length;

            const offset = (Math.random() - 0.5) * this.jitter;
            ctx.lineTo(x + perpX * offset, y + perpY * offset);
        }

        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();

        // Draw bright white core for extra visibility
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgba(255, 255, 255, ${alpha})`;

        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;
    }
}

// Player (Ninja) Class
class Ninja {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 35; // Hitbox size (smaller than sprite)
        this.spriteScale = 0.7; // Adjusted for 192x192 Archer_Blue sprites (was 1.0 for 128x128)
        this.speed = 3; // Reduced from 5 to 3
        this.keys = {};
        this.shielded = false;

        // Health system
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.isInvulnerable = false;
        this.invulnerabilityEndTime = 0;
        this.invulnerabilityDuration = 1500; // 1.5 seconds of iframes

        // Player gets its OWN sprite instances to prevent any sharing issues
        // All animations now use Archer_Blue.png with proper row mapping
        const archerSpritePath = 'assets/Factions/Knights/Troops/Archer/Blue/Archer_Blue.png';
        this.sprites = {
            idle: new SpriteAnimator(archerSpritePath, 192, 192, 6, 8), // Row 0: Idle breathing (6 frames)
            walk: new SpriteAnimator(archerSpritePath, 192, 192, 6, 12), // Row 1: Walking (6 frames)
            run: new SpriteAnimator(archerSpritePath, 192, 192, 6, 15),  // Row 1: Walking faster (6 frames, reuse walk)
            shot: new SpriteAnimator(archerSpritePath, 192, 192, 8, 15), // Rows 2-6: Shooting directions (8 frames)
            protect: new SpriteAnimator(archerSpritePath, 192, 192, 6, 8), // Use idle animation for shield
            hurt: new SpriteAnimator(archerSpritePath, 192, 192, 6, 12, false), // Use walk animation, non-looping
        };

        // Sprite animation state
        this.animationState = 'idle';
        this.previousAnimationState = 'idle';
        this.facingRight = true;
        this.lastMoveX = 0;
        this.lastMoveY = 0;

        // Attack animation state
        this.isAttacking = false;
        this.attackEndTime = 0;
        this.shootingDirection = 'down'; // Track shooting direction: 'up', 'down', 'left', 'right'

        // Hurt animation state
        this.isHurt = false;
        this.hurtEndTime = 0;

        // Dash state
        this.isDashing = false;
        this.dashStartX = 0;
        this.dashStartY = 0;
        this.dashTargetX = 0;
        this.dashTargetY = 0;
        this.dashStartTime = 0;
        this.dashDuration = 200; // ms
        this.dashTrail = []; // Trail positions
    }

    update(timestamp, deltaTime) {
        // Update invulnerability
        if (this.isInvulnerable && timestamp > this.invulnerabilityEndTime) {
            this.isInvulnerable = false;
        }

        // Determine movement
        let isMoving = false;
        let moveX = 0, moveY = 0;

        // Check if attack animation is finished
        if (this.isAttacking && timestamp > this.attackEndTime) {
            this.isAttacking = false;
        }

        // Check if hurt animation is finished
        if (this.isHurt && timestamp > this.hurtEndTime) {
            this.isHurt = false;
        }

        // Handle dash animation
        if (this.isDashing) {
            const elapsed = timestamp - this.dashStartTime;
            const progress = Math.min(elapsed / this.dashDuration, 1);

            // Ease-out cubic interpolation for smooth deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            // Interpolate position
            this.x = this.dashStartX + (this.dashTargetX - this.dashStartX) * easeProgress;
            this.y = this.dashStartY + (this.dashTargetY - this.dashStartY) * easeProgress;

            // Add to trail
            if (this.dashTrail.length === 0 ||
                (this.x !== this.dashTrail[this.dashTrail.length - 1].x ||
                 this.y !== this.dashTrail[this.dashTrail.length - 1].y)) {
                this.dashTrail.push({ x: this.x, y: this.y, alpha: 1 });
            }

            // End dash when complete
            if (progress >= 1) {
                this.isDashing = false;
                this.x = this.dashTargetX;
                this.y = this.dashTargetY;
            }

            this.animationState = 'run';
            isMoving = true;
        } else {
            // Normal movement with world bounds checking (CAN MOVE WHILE ATTACKING!)
            if (this.keys['ArrowUp'] || this.keys['w']) {
                this.y = Math.max(this.size, this.y - this.speed);
                moveY = -1;
                isMoving = true;
            }
            if (this.keys['ArrowDown'] || this.keys['s']) {
                this.y = Math.min(WORLD.height - this.size, this.y + this.speed);
                moveY = 1;
                isMoving = true;
            }
            if (this.keys['ArrowLeft'] || this.keys['a']) {
                this.x = Math.max(this.size, this.x - this.speed);
                moveX = -1;
                isMoving = true;
            }
            if (this.keys['ArrowRight'] || this.keys['d']) {
                this.x = Math.min(WORLD.width - this.size, this.x + this.speed);
                moveX = 1;
                isMoving = true;
            }

            // Update facing direction based on movement (but only when not attacking)
            // When attacking, shooting direction takes priority
            if (moveX !== 0 && !this.isAttacking) {
                this.facingRight = moveX > 0;
            }

            // Update animation state - shield has highest priority, then hurt, then attack, then movement
            if (this.shielded) {
                this.animationState = 'protect';
            } else if (this.isHurt) {
                this.animationState = 'hurt';
            } else if (this.isAttacking) {
                this.animationState = 'shot';
            } else if (isMoving) {
                this.animationState = 'walk';
            } else {
                this.animationState = 'idle';
            }
        }

        // Reset animation if state changed to prevent flickering
        // BUT don't reset idle when returning from shot (prevents blinking during auto-fire)
        if (this.animationState !== this.previousAnimationState) {
            const newSprite = this.sprites[this.animationState];
            if (newSprite) {
                // Don't reset idle animation if coming from shot animation
                const isReturningToIdle = (this.previousAnimationState === 'shot' && this.animationState === 'idle');
                if (!isReturningToIdle) {
                    newSprite.reset();
                }
            }
            this.previousAnimationState = this.animationState;
        }

        // Update current animation using player's OWN sprites
        const currentSprite = this.sprites[this.animationState];
        if (currentSprite) {
            currentSprite.update(deltaTime);
        }
    }

    startAttack(timestamp, targetX, targetY) {
        this.isAttacking = true;
        this.attackEndTime = timestamp + 400;

        // Calculate shooting direction
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Choose direction based on which axis has bigger difference
        if (absDx > absDy) {
            // Horizontal dominates
            this.shootingDirection = dx > 0 ? 'right' : 'left';
        } else {
            // Vertical dominates
            this.shootingDirection = dy > 0 ? 'down' : 'up';
        }

        console.log(`🎯 SHOOT: dir=${this.shootingDirection} | dx=${dx.toFixed(0)} (|${absDx.toFixed(0)}|) dy=${dy.toFixed(0)} (|${absDy.toFixed(0)}|) | player(${this.x.toFixed(0)},${this.y.toFixed(0)}) → target(${targetX.toFixed(0)},${targetY.toFixed(0)})`);

        // Reset animation
        if (this.sprites.shot) {
            this.sprites.shot.reset();
        }
    }

    startDash(targetX, targetY, timestamp) {
        this.isDashing = true;
        this.dashStartX = this.x;
        this.dashStartY = this.y;
        this.dashTargetX = targetX;
        this.dashTargetY = targetY;
        this.dashStartTime = timestamp;
        this.dashTrail = [{ x: this.x, y: this.y, alpha: 1 }];

        // Update facing direction for dash
        if (targetX !== this.x) {
            this.facingRight = targetX > this.x;
        }
    }

    takeDamage(amount, timestamp) {
        // Can't take damage if shielded or invulnerable
        if (this.shielded || this.isInvulnerable) {
            return false;
        }

        this.health -= amount;
        this.isInvulnerable = true;
        this.invulnerabilityEndTime = timestamp + this.invulnerabilityDuration;

        // Trigger hurt animation (3 frames at 8 fps = 375ms)
        this.isHurt = true;
        this.hurtEndTime = timestamp + 375;

        // Reset hurt animation to start from beginning
        const hurtSprite = this.sprites.hurt;
        if (hurtSprite) {
            hurtSprite.reset();
        }

        // Check if dead
        if (this.health <= 0) {
            this.health = 0;
            return true; // Returns true if dead
        }

        return false; // Still alive
    }

    draw() {
        // Draw dash trail with sprite
        if (this.isDashing && this.dashTrail.length > 1) {
            for (let i = 0; i < this.dashTrail.length - 1; i++) {
                const trail = this.dashTrail[i];
                const alpha = (i / this.dashTrail.length) * 0.4;

                ctx.globalAlpha = alpha;
                const trailSprite = this.sprites.run;
                if (trailSprite && trailSprite.loaded) {
                    trailSprite.draw(ctx, trail.x, trail.y, this.spriteScale * 0.8, !this.facingRight, 1); // Row 1 for walk/run
                }
            }
            ctx.globalAlpha = 1.0;
        }

        // Shield is now only visible through the protect sprite animation (no glow effect)

        // Draw archer sprite using player's OWN sprites
        const currentSprite = this.sprites[this.animationState];

        // Calculate sprite row for Archer_Blue.png (all animations use same sprite sheet)
        // Archer_Blue.png rows (0-indexed):
        // Row 0=Idle, Row 1=Walk, Row 2=Up, Row 3=DiagUpRight, Row 4=Right, Row 5=DiagDownRight, Row 6=Down
        let spriteRow = 0;
        let flipH = !this.facingRight;

        // Map animation state to sprite row
        switch (this.animationState) {
            case 'idle':
            case 'protect':
                spriteRow = 0; // Idle animation row
                break;
            case 'walk':
            case 'run':
            case 'hurt':
                spriteRow = 1; // Walk animation row
                break;
            case 'shot':
                // Map shooting direction to sprite row
                switch (this.shootingDirection) {
                    case 'up':
                        spriteRow = 2;
                        flipH = false;
                        console.log(`✅ DRAW: Shooting UP → Row 2, flipH=false`);
                        break;
                    case 'right':
                        spriteRow = 4;
                        flipH = false;
                        console.log(`✅ DRAW: Shooting RIGHT → Row 4, flipH=false`);
                        break;
                    case 'down':
                        spriteRow = 6;
                        flipH = false;
                        console.log(`✅ DRAW: Shooting DOWN → Row 6, flipH=false`);
                        break;
                    case 'left':
                        spriteRow = 4; // Use right row but flipped
                        flipH = true;
                        console.log(`✅ DRAW: Shooting LEFT → Row 4, flipH=true`);
                        break;
                    default:
                        console.warn(`❌ Unknown shooting direction: ${this.shootingDirection}`);
                        spriteRow = 6; // Default to down
                        flipH = false;
                }
                break;
            default:
                spriteRow = 0; // Default to idle
        }
        if (currentSprite && currentSprite.loaded) {
            // No visual glow effect when shielded (removed circle)
            // Shield is only visible through the protect animation sprite itself
            if (this.shielded) {
                currentSprite.draw(ctx, this.x, this.y, this.spriteScale, flipH, spriteRow);
            }
            // Flashing effect when invulnerable
            else if (this.isInvulnerable) {
                const flashSpeed = 100; // Flash every 100ms
                const shouldShow = Math.floor(Date.now() / flashSpeed) % 2 === 0;
                if (shouldShow) {
                    ctx.globalAlpha = 0.5;
                    currentSprite.draw(ctx, this.x, this.y, this.spriteScale, flipH, spriteRow);
                    ctx.globalAlpha = 1.0;
                } else {
                    currentSprite.draw(ctx, this.x, this.y, this.spriteScale, flipH, spriteRow);
                }
            } else {
                currentSprite.draw(ctx, this.x, this.y, this.spriteScale, flipH, spriteRow);
            }
        } else {
            // Fallback: draw simple circle if sprite not loaded
            // Don't draw cyan circle for shield - no visual indicator
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw health bar above character
        const barWidth = 60;
        const barHeight = 8;
        const barX = this.x - barWidth / 2;
        const barY = this.y - 70; // Position above the sprite

        // Background (black with border)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // Health fill
        const healthPercentage = this.health / this.maxHealth;
        const fillWidth = barWidth * healthPercentage;

        // Always red color
        ctx.fillStyle = '#ff0000';
        if (Math.random() < 0.01) console.log('✅ NEW CODE: Red health bar at Y=' + Math.round(barY));
        ctx.fillRect(barX, barY, fillWidth, barHeight);
    }
}

// Arrow Class - now loaded from src/entities/Arrow.js (modular design)
// Class 'Shuriken' is kept as alias for backward compatibility
class Shuriken extends Arrow {
    constructor(x, y, targetX, targetY) {
        super(x, y, targetX, targetY, arrowSprite);
    }

    // Override draw to use ctx from game.js
    draw() {
        super.draw(ctx);
    }
}

// Enemy Class
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30; // Hitbox size (increased from 25)
        this.spriteScale = 0.85; // Scale up sprites (larger for better visibility)
        this.speed = 2.0;
        this.health = 1;

        // Death state
        this.isDying = false;
        this.deathStartTime = 0;
        this.deathDuration = 700; // ms

        // Stuck detection
        this.lastX = x;
        this.lastY = y;
        this.stuckTimer = 0;
        this.stuckThreshold = 200; // ms without significant movement = stuck (reduced for faster detection)

        // Each enemy gets its OWN sprite instances using the same images that work
        this.sprites = {
            idle: new SpriteAnimator('assets/Kunoichi/Idle.png', 128, 128, 9, 8, true),
            walk: new SpriteAnimator('assets/Kunoichi/Walk.png', 128, 128, 8, 12, true),
            dead: new SpriteAnimator('assets/Kunoichi/Dead.png', 128, 128, 10, 8, false), // Don't loop death animation
        };

        // Sprite animation state
        this.animationState = 'walk';
        this.facingRight = true;
    }

    update(playerX, playerY, deltaTime, timestamp, allEnemies) {
        // If dying, don't move
        if (this.isDying) {
            // Update death animation
            const currentSprite = this.sprites[this.animationState];
            if (currentSprite) {
                currentSprite.update(deltaTime);
            }
            return;
        }

        // Check if enemy has moved significantly
        const movementDist = Math.sqrt(
            (this.x - this.lastX) ** 2 + (this.y - this.lastY) ** 2
        );

        if (movementDist < 1.0) {
            // Not moving much, increase stuck timer
            this.stuckTimer += deltaTime;
        } else {
            // Moving fine, reset stuck timer
            this.stuckTimer = 0;
            this.lastX = this.x;
            this.lastY = this.y;
        }

        const isStuck = this.stuckTimer > this.stuckThreshold;

        // Move towards player
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Calculate desired movement
            let moveX = (dx / distance) * this.speed;
            let moveY = (dy / distance) * this.speed;

            // Add separation force from nearby enemies
            let separationX = 0;
            let separationY = 0;
            let nearbyCount = 0;

            for (let other of allEnemies) {
                if (other === this || other.isDying) continue;

                const distToOther = Math.sqrt(
                    (this.x - other.x) ** 2 + (this.y - other.y) ** 2
                );

                // If very close, add separation force
                if (distToOther < this.size + other.size) {
                    // MUCH stronger push if stuck - increased from 3.5 to 5.0
                    const pushStrength = isStuck ? 5.0 : 0.6;
                    const pushX = (this.x - other.x) / distToOther;
                    const pushY = (this.y - other.y) / distToOther;

                    separationX += pushX * pushStrength;
                    separationY += pushY * pushStrength;
                    nearbyCount++;
                }
            }

            // Average the separation force
            if (nearbyCount > 0) {
                separationX /= nearbyCount;
                separationY /= nearbyCount;

                if (isStuck) {
                    // If stuck, prioritize separation over player movement
                    moveX = moveX * 0.1 + separationX * 0.9;
                    moveY = moveY * 0.1 + separationY * 0.9;

                    // MUCH larger jitter to break deadlock - increased from 2.5 to 4.0
                    moveX += (Math.random() - 0.5) * 4.0;
                    moveY += (Math.random() - 0.5) * 4.0;
                } else {
                    // Normal blend
                    moveX = moveX * 0.7 + separationX * 0.3;
                    moveY = moveY * 0.7 + separationY * 0.3;

                    // Small jitter
                    moveX += (Math.random() - 0.5) * 0.4;
                    moveY += (Math.random() - 0.5) * 0.4;
                }
            }

            // Apply movement with collision check
            const newX = this.x + moveX;
            const newY = this.y + moveY;

            let canMoveX = true;
            let canMoveY = true;

            // If stuck for too long, IGNORE collisions temporarily to break free
            if (!isStuck) {
                for (let other of allEnemies) {
                    if (other === this || other.isDying) continue;

                    // Check X movement
                    const distIfMoveX = Math.sqrt(
                        (newX - other.x) ** 2 + (this.y - other.y) ** 2
                    );
                    if (distIfMoveX < this.size + other.size - 10) {
                        canMoveX = false;
                    }

                    // Check Y movement
                    const distIfMoveY = Math.sqrt(
                        (this.x - other.x) ** 2 + (newY - other.y) ** 2
                    );
                    if (distIfMoveY < this.size + other.size - 10) {
                        canMoveY = false;
                    }
                }
            }

            // Apply movement independently for X and Y
            if (canMoveX || isStuck) {
                this.x = Math.max(this.size, Math.min(WORLD.width - this.size, newX));
            }
            if (canMoveY || isStuck) {
                this.y = Math.max(this.size, Math.min(WORLD.height - this.size, newY));
            }

            // Update facing direction
            if (dx !== 0) {
                this.facingRight = dx > 0;
            }

            // Just use walk animation
            this.animationState = 'walk';
        } else {
            this.animationState = 'idle';
        }

        // Update THIS enemy's own animation
        const currentSprite = this.sprites[this.animationState];
        if (currentSprite) {
            currentSprite.update(deltaTime);
        }
    }

    startDeath(timestamp) {
        this.isDying = true;
        this.deathStartTime = timestamp;
        this.animationState = 'dead';

        // Reset death animation to start from beginning
        const deathSprite = this.sprites.dead;
        if (deathSprite) {
            deathSprite.reset();
        }
    }

    isDeathAnimationComplete(timestamp) {
        return this.isDying && (timestamp - this.deathStartTime) > this.deathDuration;
    }

    draw() {
        // Fade out if dying (but keep visible at 30% opacity permanently)
        if (this.isDying) {
            const elapsed = performance.now() - this.deathStartTime;
            const fadeProgress = Math.min(elapsed / this.deathDuration, 1);
            // Keep at minimum 30% opacity forever
            ctx.globalAlpha = Math.max(0.3, 1 - (fadeProgress * 0.7));
        }

        // Draw enemy sprite using its OWN sprite instance
        const currentSprite = this.sprites[this.animationState];
        if (currentSprite && currentSprite.loaded) {
            currentSprite.draw(ctx, this.x, this.y, this.spriteScale, !this.facingRight);
        } else {
            // Fallback: draw simple circle if sprite not loaded
            ctx.fillStyle = '#f00';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Reset alpha
        if (this.isDying) {
            ctx.globalAlpha = 1.0;
        }
    }
}

// Blood Puddle Class - Permanent blood stains on ground
class BloodPuddle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 15 + 20; // 20-35 pixels radius for puddle
        this.opacity = 0.7 + Math.random() * 0.2; // 0.7-0.9 opacity
        this.rotation = Math.random() * Math.PI * 2; // Random rotation
        this.color = Math.random() > 0.5 ? '#8B0000' : '#DC143C'; // Dark red or crimson

        // Create random splatter pattern
        this.splatters = [];
        const splatterCount = Math.floor(Math.random() * 5) + 3; // 3-7 splatters
        for (let i = 0; i < splatterCount; i++) {
            this.splatters.push({
                offsetX: (Math.random() - 0.5) * this.size * 1.5,
                offsetY: (Math.random() - 0.5) * this.size * 1.5,
                size: Math.random() * 8 + 4 // 4-12 pixels
            });
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // Main puddle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw splatters around puddle
        for (let splatter of this.splatters) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(
                this.x + splatter.offsetX,
                this.y + splatter.offsetY,
                splatter.size,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // Add some darker center for depth
        ctx.fillStyle = '#5A0000'; // Darker red
        ctx.globalAlpha = this.opacity * 0.6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Blood Particle Class
class BloodParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4 - 2; // Upward bias
        this.size = Math.random() * 6 + 4; // Larger particles for realistic blood stains (4-10 pixels)
        this.lifetime = 0;
        this.maxLifetime = 1000; // 1 second
        this.color = Math.random() > 0.5 ? '#8B0000' : '#DC143C'; // Dark red or crimson
        this.settled = false; // Whether particle has settled on ground
        this.settledY = 0; // Y position where it settled
    }

    update(deltaTime) {
        // Only update physics if not settled
        if (!this.settled) {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.15; // Gravity
            this.vx *= 0.98; // Air resistance

            // Check if particle has settled (low velocity and has fallen)
            if (Math.abs(this.vx) < 0.1 && this.vy > 0 && this.vy < 0.5 && this.lifetime > 200) {
                this.settled = true;
                this.settledY = this.y;
                this.vx = 0;
                this.vy = 0;
            }
        }

        this.lifetime += deltaTime;
    }

    draw() {
        // Keep particles visible permanently (don't fade out completely)
        const alpha = Math.max(0.7, 1 - (this.lifetime / this.maxLifetime));
        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    isDead() {
        return this.lifetime >= this.maxLifetime;
    }
}

// Bamboo Class con 3 etapas de crecimiento
class Bamboo {
    constructor(x, y, currentWave) {
        this.x = x;
        this.y = y;
        this.size = 15;
        this.plantedWave = currentWave;
        // Crecimiento en 1-3 rondas
        this.wavesToGrow = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
        this.matureWave = this.plantedWave + this.wavesToGrow;
        this.hits = 0; // Golpes recibidos
        this.maxHits = 1; // Golpes necesarios para talar - un solo golpe para claridad visual
        this.shakeTime = 0; // Timestamp del último golpe
        this.shakeDuration = 300; // Duración del shake en ms

        // Animación de disparo al plantar
        this.spawnTime = performance.now(); // Tiempo de creación
        this.shootDuration = 400; // Duración de la animación en ms
        this.shootDistance = 60; // Distancia desde donde "dispara"
    }

    update(currentWave) {
        // No need to do anything, growth is based on wave comparison
    }

    getGrowthStage(currentWave) {
        const wavesGrown = currentWave - this.plantedWave;

        if (wavesGrown === 0) {
            return 'seed'; // Recién plantado
        } else if (wavesGrown < this.wavesToGrow) {
            return 'growing'; // Creciendo
        } else {
            return 'mature'; // Maduro
        }
    }

    canHarvest(currentWave) {
        return this.getGrowthStage(currentWave) === 'mature';
    }

    hit() {
        this.hits++;
        this.shakeTime = performance.now(); // Registrar tiempo del golpe para animación
        return this.hits >= this.maxHits;
    }

    draw() {
        const currentStage = this.getGrowthStage(GAME_STATE.wave);

        // Calcular animación de disparo al plantar
        let shootOffsetY = 0;
        const timeSinceSpawn = performance.now() - this.spawnTime;

        if (timeSinceSpawn < this.shootDuration) {
            // Easing function para efecto de "disparo" suave (ease-out cubic)
            const progress = timeSinceSpawn / this.shootDuration;
            const easeOut = 1 - Math.pow(1 - progress, 3);
            shootOffsetY = this.shootDistance * (1 - easeOut);
        }

        // Aplicar efecto de shake cuando es golpeado
        let shakeX = 0;
        let shakeY = 0;
        const timeSinceHit = performance.now() - this.shakeTime;

        if (timeSinceHit < this.shakeDuration) {
            const shakeIntensity = 5 * (1 - timeSinceHit / this.shakeDuration); // Disminuye con el tiempo
            shakeX = (Math.random() - 0.5) * shakeIntensity;
            shakeY = (Math.random() - 0.5) * shakeIntensity;
        }

        // Guardar contexto para aplicar shake y animación de disparo
        ctx.save();
        ctx.translate(shakeX, shakeY + shootOffsetY);

        if (currentStage === 'seed') {
            // Etapa 1: Semilla/brote pequeño (MUCHO MÁS GRANDE)
            ctx.fillStyle = '#8B4513'; // Marrón tierra
            ctx.beginPath();
            ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
            ctx.fill();

            // Brote verde pequeño (más grande)
            ctx.fillStyle = '#90EE90';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - 12);
            ctx.lineTo(this.x - 8, this.y);
            ctx.lineTo(this.x + 8, this.y);
            ctx.closePath();
            ctx.fill();

        } else if (currentStage === 'growing') {
            // Etapa 2: Creciendo - mediano (MUCHO MÁS GRANDE)
            const height = 50;
            const width = 8;

            // Tallo mediano
            ctx.fillStyle = '#7CFC00'; // Verde lima
            ctx.fillRect(this.x - width/2, this.y - height, width, height);

            // Segmentos
            ctx.strokeStyle = '#228B22';
            ctx.lineWidth = 3;
            for (let i = 0; i < 2; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x - 8, this.y - (i * 24) - 10);
                ctx.lineTo(this.x + 8, this.y - (i * 24) - 10);
                ctx.stroke();
            }

            // Hojas pequeñas (más grandes)
            ctx.fillStyle = '#32CD32';
            ctx.beginPath();
            ctx.ellipse(this.x - 12, this.y - height, 12, 6, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.x + 12, this.y - height, 12, 6, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

        } else {
            // Etapa 3: Maduro - grande y completo (MUCHO MÁS GRANDE)
            const height = 90;
            const width = 12;

            // Tallo grande
            ctx.fillStyle = '#228B22'; // Verde oscuro
            ctx.fillRect(this.x - width/2, this.y - height, width, height);

            // Segmentos
            ctx.strokeStyle = '#1C6E1C';
            ctx.lineWidth = 3;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(this.x - 12, this.y - (i * 30) - 15);
                ctx.lineTo(this.x + 12, this.y - (i * 30) - 15);
                ctx.stroke();
            }

            // Hojas grandes (mucho más grandes)
            ctx.fillStyle = '#32CD32';
            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                const offsetX = Math.cos(angle) * 18;
                const offsetY = Math.sin(angle) * 10;
                ctx.beginPath();
                ctx.ellipse(this.x + offsetX, this.y - height + offsetY, 14, 8, angle, 0, Math.PI * 2);
                ctx.fill();
            }

            // Indicador listo para talar (más grande)
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 20px Arial';
            ctx.fillText('✓', this.x - 10, this.y - height - 8);
        }

        // Mostrar indicador de golpes si está siendo talado
        if (this.hits > 0 && currentStage === 'mature') {
            ctx.fillStyle = '#FF0000';
            ctx.font = 'bold 12px Arial';
            ctx.fillText(`${this.hits}/${this.maxHits}`, this.x - 12, this.y + 15);
        }

        // Restaurar contexto después del shake
        ctx.restore();
    }
}

// WoodDrop Class - Madera que cae al suelo
class WoodDrop {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 18; // Aumentado de 8 a 18 para mejor visibilidad
        this.collected = false;
        this.spawnTime = performance.now();
        this.lifetime = 30000; // 30 seconds before auto-despawn

        // Física: Velocidad inicial en dirección aleatoria
        const angle = Math.random() * Math.PI * 2;
        const speed = 6 + Math.random() * 8; // Velocidad aleatoria entre 6-14 (más disparada)
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.friction = 0.92; // Desaceleración
        this.hasSettled = false; // Solo activar imán cuando la madera ha caído al suelo
    }

    update(playerX, playerY) {
        const magnetRange = 120; // Rango de atracción magnética
        const dist = distance(this.x, this.y, playerX, playerY);

        // Si aún no se ha asentado, aplicar fricción para detenerse
        if (!this.hasSettled) {
            this.vx *= this.friction;
            this.vy *= this.friction;

            // Detectar cuando la madera se ha detenido (ha "caído al suelo")
            const currentSpeed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
            if (currentSpeed < 0.1) {
                this.hasSettled = true;
                this.vx = 0;
                this.vy = 0;
            }
        }

        // Efecto imán: solo funciona DESPUÉS de que la madera ha caído al suelo
        if (this.hasSettled && dist < magnetRange && dist > 5) {
            // Calcular dirección hacia el jugador
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const angle = Math.atan2(dy, dx);

            // Fuerza de atracción aumenta cuando está más cerca
            const attractionStrength = 0.3 + (1 - dist / magnetRange) * 0.5;

            // Aplicar fuerza de atracción
            this.vx += Math.cos(angle) * attractionStrength;
            this.vy += Math.sin(angle) * attractionStrength;

            // Limitar velocidad máxima cuando es atraída
            const maxSpeed = 8;
            const currentSpeed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
            if (currentSpeed > maxSpeed) {
                this.vx = (this.vx / currentSpeed) * maxSpeed;
                this.vy = (this.vy / currentSpeed) * maxSpeed;
            }
        }

        // Aplicar velocidad a la posición
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        // Efecto de pulso para hacerla más visible
        const timeSinceSpawn = performance.now() - this.spawnTime;
        const pulseSpeed = 0.003;
        const pulseScale = 1 + Math.sin(timeSinceSpawn * pulseSpeed) * 0.1;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(pulseScale, pulseScale);
        ctx.translate(-this.x, -this.y);

        // Glow/aura dorada alrededor de la madera
        const glowAlpha = 0.3 + Math.sin(timeSinceSpawn * pulseSpeed) * 0.2;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.globalAlpha = glowAlpha;

        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Dibujar madera principal
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - this.size, this.y - this.size/2, this.size * 2, this.size);

        // Borde más grueso y visible
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - this.size, this.y - this.size/2, this.size * 2, this.size);

        // Detalles de madera (anillos)
        ctx.strokeStyle = '#A0522D';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x - this.size + (i * 10), this.y - this.size/2);
            ctx.lineTo(this.x - this.size + (i * 10), this.y + this.size/2);
            ctx.stroke();
        }

        // Icono flotante más grande
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('🪵', this.x - 10, this.y - 20);

        ctx.restore();
    }
}

// WoodSellParticle - Madera que vuela del jugador al vendedor
class WoodSellParticle {
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.size = 12;
        this.spawnTime = performance.now();
        this.collected = false;

        // Velocidad inicial hacia el vendedor
        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 8;
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
    }

    update() {
        // Efecto imán hacia el vendedor (atracción fuerte)
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Radio de absorción aumentado para prevenir órbita (debe ser mayor que maxSpeed)
        const absorptionRadius = 20;

        if (dist > absorptionRadius) {
            const angle = Math.atan2(dy, dx);
            const attractionStrength = 0.8; // Atracción fuerte

            this.vx += Math.cos(angle) * attractionStrength;
            this.vy += Math.sin(angle) * attractionStrength;

            // Limitar velocidad
            const maxSpeed = 15;
            const currentSpeed = Math.sqrt(this.vx ** 2 + this.vy ** 2);
            if (currentSpeed > maxSpeed) {
                this.vx = (this.vx / currentSpeed) * maxSpeed;
                this.vy = (this.vy / currentSpeed) * maxSpeed;
            }

            this.x += this.vx;
            this.y += this.vy;
        } else {
            // Llegó al vendedor - radio de absorción aumentado previene órbita
            this.collected = true;
        }
    }

    draw() {
        const timeSinceSpawn = performance.now() - this.spawnTime;
        const pulseSpeed = 0.01;
        const pulseScale = 1 + Math.sin(timeSinceSpawn * pulseSpeed) * 0.15;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(pulseScale, pulseScale);
        ctx.translate(-this.x, -this.y);

        // Glow brillante
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;

        // Dibujar madera pequeña
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - this.size, this.y - this.size/2, this.size * 2, this.size);

        // Borde
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.size, this.y - this.size/2, this.size * 2, this.size);

        ctx.shadowBlur = 0;

        // Icono
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('🪵', this.x - 8, this.y - 15);

        ctx.restore();
    }
}

// FloatingText - Texto flotante para mostrar oro ganado
class FloatingText {
    constructor(x, y, text, color = '#FFD700') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.lifetime = 0;
        this.maxLifetime = 1500; // 1.5 segundos
        this.vy = -2; // Velocidad hacia arriba
        this.alpha = 1;
    }

    update(deltaTime) {
        this.lifetime += deltaTime;
        this.y += this.vy;

        // Fade out gradualmente
        this.alpha = 1 - (this.lifetime / this.maxLifetime);
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;

        // Sombra para mejor visibilidad
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);

        ctx.restore();
    }

    isDead() {
        return this.lifetime >= this.maxLifetime;
    }
}

// Game Objects
const ninja = new Ninja(WORLD.width / 2, WORLD.height / 2);
const shurikens = [];
const enemies = [];

// Verify HTML elements exist
console.log('🔍 Checking HTML elements:');
console.log('  abilityQ:', !!document.getElementById('abilityQ'));
console.log('  abilityE:', !!document.getElementById('abilityE'));
console.log('  abilityR:', !!document.getElementById('abilityR'));
console.log('  abilityX:', !!document.getElementById('abilityX'));
console.log('  cooldownX:', !!document.getElementById('cooldownX'));
const bamboos = [];
const woodDrops = [];
const woodSellParticles = []; // Partículas de madera cuando vendes
const floatingTexts = []; // Textos flotantes (+oro, etc.)
const bloodParticles = [];
const bloodPuddles = []; // Permanent blood stains on ground

let lastShurikenTime = 0;
let shurikenCooldown = 500; // ms between shurikens

let lastEnemySpawnTime = 0;
let enemySpawnRate = 1000; // ms between enemy spawns

// Shooting range - character only shoots enemies within this distance
const SHOOTING_RANGE = 350; // pixels

// Maximum number of shurikens allowed to prevent lag
const MAX_SHURIKENS = 80;

let lastFrameTime = 0;

// FPS tracking
let fps = 60;
let frameCount = 0;
let lastFpsUpdate = 0;

// Keyboard Input
document.addEventListener('keydown', (e) => {
    ninja.keys[e.key] = true;

    // Handle abilities
    const key = e.key.toLowerCase();
    const timestamp = performance.now();

    if (key === ABILITIES.dash.key) {
        ABILITIES.dash.use(timestamp);
    } else if (key === ABILITIES.burst.key) {
        ABILITIES.burst.use(timestamp);
    } else if (key === ABILITIES.shield.key) {
        ABILITIES.shield.use(timestamp);
    } else if (key === ABILITIES.chainLightning.key) {
        console.log('❌ X key pressed! Attempting to use Chain Lightning...');
        const success = ABILITIES.chainLightning.use(timestamp);
        console.log('❌ Chain Lightning result:', success);
    } else if (key === 'p') {
        // Plantar bambú con dispersión si hay bambú cercano
        if (GAME_STATE.resources.bambooSeeds > 0) {
            const plantPos = findBambooPlantPosition(ninja.x, ninja.y);
            bamboos.push(new Bamboo(plantPos.x, plantPos.y, GAME_STATE.wave));
            GAME_STATE.resources.bambooSeeds--;
        }
    } else if (key === 'h') {
        // Activar/desactivar modo hacha
        GAME_STATE.axeMode = !GAME_STATE.axeMode;
        if (GAME_STATE.axeMode) {
            GAME_STATE.axeModeStartTime = timestamp;
        }
    } else if (key === 'v') {
        // Vender madera al vendedor con animación
        if (vendor.isPlayerNear() && GAME_STATE.resources.wood > 0) {
            GAME_STATE.resources.wood--;
            // Crear partícula de madera que vuela hacia el vendedor
            woodSellParticles.push(new WoodSellParticle(ninja.x, ninja.y, vendor.x, vendor.y));
        }
    } else if (key === 't') {
        // Abrir/cerrar tienda
        if (GAME_STATE.shopOpen) {
            closeShop();
        } else {
            showShop();
        }
    }
});

document.addEventListener('keyup', (e) => {
    ninja.keys[e.key] = false;
});

// Helper Functions
function findNearestEnemy() {
    if (enemies.length === 0) return null;

    let nearest = null;
    let minDist = Infinity;

    for (let enemy of enemies) {
        // Skip enemies that are dying
        if (enemy.isDying) continue;

        const dist = distance(ninja.x, ninja.y, enemy.x, enemy.y);
        if (dist < minDist) {
            minDist = dist;
            nearest = enemy;
        }
    }

    return nearest;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Optimized: Squared distance (avoids expensive sqrt for collision detection)
function distanceSquared(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

// Easing function for smooth animations
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function spawnEnemy() {
    // Spawn at random position around the player (outside camera view)
    const spawnDistance = 600; // Increased for larger canvas
    const angle = Math.random() * Math.PI * 2;

    let x = ninja.x + Math.cos(angle) * spawnDistance;
    let y = ninja.y + Math.sin(angle) * spawnDistance;

    // Clamp to world bounds
    x = Math.max(20, Math.min(WORLD.width - 20, x));
    y = Math.max(20, Math.min(WORLD.height - 20, y));

    enemies.push(new Enemy(x, y));
}

function checkCollisions() {
    // Check shuriken-enemy collisions (CIRCULAR HITBOX: arrow tip hitbox vs enemy hitbox)
    for (let i = shurikens.length - 1; i >= 0; i--) {
        // Skip arrows that are already stuck
        if (shurikens[i].isStuck) continue;

        for (let j = enemies.length - 1; j >= 0; j--) {
            // Skip dying enemies
            if (enemies[j].isDying) continue;

            // Get arrow tip circular hitbox
            const tipHitbox = shurikens[i].getTipHitbox();

            // Circle-to-circle collision detection
            // Two circles collide if distance between centers < sum of radii
            const distSq = distanceSquared(
                tipHitbox.x, tipHitbox.y,
                enemies[j].x, enemies[j].y
            );
            const combinedRadius = tipHitbox.radius + enemies[j].size;
            const combinedRadiusSq = combinedRadius * combinedRadius;

            if (distSq < combinedRadiusSq) {
                // Hit! Arrow tip hitbox touched enemy hitbox
                const enemyX = enemies[j].x;
                const enemyY = enemies[j].y;

                // Stick arrow to enemy instead of removing it
                shurikens[i].stickToEnemy(enemies[j]);

                // Start death animation instead of removing immediately
                enemies[j].startDeath(performance.now());

                // Create blood puddle on ground (permanent)
                bloodPuddles.push(new BloodPuddle(enemyX, enemyY));

                // Create blood particles (OPTIMIZED: reduced from 25 to 12 for better performance)
                for (let k = 0; k < 12; k++) {
                    bloodParticles.push(new BloodParticle(enemyX, enemyY));
                }

                GAME_STATE.score += 10;
                GAME_STATE.enemiesKilled++;
                GAME_STATE.enemiesThisWave--;

                // Gold removed - only obtainable by selling wood to vendor

                // Random chance to get a bamboo seed (10% chance)
                if (Math.random() < 0.1) {
                    GAME_STATE.resources.bambooSeeds++;
                }

                // Check if all enemies in this wave are killed
                if (GAME_STATE.enemiesThisWave <= 0) {
                    // Check if all enemies are dead or dying
                    const aliveEnemies = enemies.filter(e => !e.isDying).length;
                    if (aliveEnemies === 0) {
                        startWaveBreak();
                    }
                }

                break;
            }
        }
    }

    // Check ninja-enemy collisions - skip if shielded, invulnerable, or enemy is dying (OPTIMIZED)
    if (!ninja.shielded && !ninja.isInvulnerable) {
        for (let enemy of enemies) {
            if (enemy.isDying) continue; // Don't collide with dying enemies

            // Optimized: Use squared distance
            const distSq = distanceSquared(ninja.x, ninja.y, enemy.x, enemy.y);
            const hitRadiusSum = ninja.size + enemy.size;
            const hitRadiusSumSq = hitRadiusSum * hitRadiusSum;

            if (distSq < hitRadiusSumSq) {
                // Take damage (20 HP per hit)
                const isDead = ninja.takeDamage(20, performance.now());
                if (isDead) {
                    gameOver();
                }
                break; // Only one enemy can hit per frame
            }
        }
    }
}

// Función para encontrar una posición adecuada para plantar bambú
// Si hay bambú muy cerca, dispersa la plantación a los alrededores
function findBambooPlantPosition(x, y) {
    const minDistance = 70; // Distancia mínima entre bambús
    const scatterRadius = 120; // Radio de dispersión cuando hay bambú cerca
    const maxAttempts = 10; // Intentos máximos para encontrar posición

    // Verificar si hay bambú muy cerca de la posición deseada
    let hasBambooNearby = false;
    for (let bamboo of bamboos) {
        const dist = distance(x, y, bamboo.x, bamboo.y);
        if (dist < minDistance) {
            hasBambooNearby = true;
            break;
        }
    }

    // Si no hay bambú cerca, plantar en la posición original
    if (!hasBambooNearby) {
        return { x: x, y: y };
    }

    // Hay bambú cerca, buscar una posición aleatoria en los alrededores
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generar ángulo y distancia aleatorios para dispersión
        const angle = Math.random() * Math.PI * 2;
        const dist = minDistance + Math.random() * scatterRadius;

        const newX = x + Math.cos(angle) * dist;
        const newY = y + Math.sin(angle) * dist;

        // Verificar que la nueva posición no esté muy cerca de otro bambú
        let isPositionGood = true;
        for (let bamboo of bamboos) {
            const distToBamboo = distance(newX, newY, bamboo.x, bamboo.y);
            if (distToBamboo < minDistance) {
                isPositionGood = false;
                break;
            }
        }

        // Verificar que esté dentro de los límites del canvas (con margen)
        if (isPositionGood && newX > 50 && newX < canvas.width - 50 &&
            newY > 50 && newY < canvas.height - 50) {
            return { x: newX, y: newY };
        }
    }

    // Si no encuentra posición después de varios intentos,
    // usar posición con pequeño offset aleatorio
    const smallOffset = 80;
    const randomAngle = Math.random() * Math.PI * 2;
    return {
        x: x + Math.cos(randomAngle) * smallOffset,
        y: y + Math.sin(randomAngle) * smallOffset
    };
}

function checkBambooAxeCollision() {
    if (!GAME_STATE.axeMode) return;

    const axeRange = 80; // Rango del hacha (aumentado para mejor jugabilidad)

    for (let i = bamboos.length - 1; i >= 0; i--) {
        const bamboo = bamboos[i];
        const dist = distance(ninja.x, ninja.y, bamboo.x, bamboo.y);

        if (dist < axeRange && bamboo.canHarvest(GAME_STATE.wave)) {
            // Golpear bambú
            const isCut = bamboo.hit();

            if (isCut) {
                // Bambú talado! Crear madera en el suelo
                for (let j = 0; j < 3; j++) {
                    const offsetX = (Math.random() - 0.5) * 30;
                    const offsetY = (Math.random() - 0.5) * 30;
                    woodDrops.push(new WoodDrop(bamboo.x + offsetX, bamboo.y + offsetY));
                }

                // Eliminar bambú
                bamboos.splice(i, 1);
            }

            // El hacha se desactiva automáticamente al terminar la animación
            break;
        }
    }
}

function checkWoodPickup() {
    const pickupRange = 30;
    const currentTime = performance.now();

    for (let i = woodDrops.length - 1; i >= 0; i--) {
        const wood = woodDrops[i];

        // Auto-despawn after lifetime expires
        if (currentTime - wood.spawnTime > wood.lifetime) {
            woodDrops.splice(i, 1);
            continue;
        }

        const dist = distance(ninja.x, ninja.y, wood.x, wood.y);

        if (dist < pickupRange && !wood.collected) {
            // Recoger madera
            GAME_STATE.resources.wood++;
            wood.collected = true;
            woodDrops.splice(i, 1);
        }
    }
}

function startWaveBreak() {
    GAME_STATE.wave++;
    GAME_STATE.isWaveBreak = true;
    GAME_STATE.waveBreakEndTime = performance.now() + 30000; // 30 seconds

    // Reset shop purchases for this wave
    GAME_STATE.purchasesThisWave = 0;

    // Clear all enemies
    enemies.length = 0;

    // Calculate enemies for next wave (increases with wave number)
    GAME_STATE.totalEnemiesThisWave = 10 + (GAME_STATE.wave * 5);

    // Update bamboos to check for growth
    for (let bamboo of bamboos) {
        bamboo.update(GAME_STATE.wave);
    }

    // Show wave break UI
    const waveBreak = document.getElementById('waveBreak');
    document.getElementById('breakWave').textContent = GAME_STATE.wave - 1;
    waveBreak.classList.remove('hidden');

    updateWaveBreakCountdown();
}

function updateWaveBreakCountdown() {
    if (!GAME_STATE.isWaveBreak) return;

    const remaining = Math.ceil((GAME_STATE.waveBreakEndTime - performance.now()) / 1000);

    if (remaining > 0) {
        document.getElementById('countdown').textContent = remaining;
        setTimeout(updateWaveBreakCountdown, 100);
    } else {
        endWaveBreak();
    }
}

function endWaveBreak() {
    GAME_STATE.isWaveBreak = false;
    document.getElementById('waveBreak').classList.add('hidden');

    // Spawn all enemies for this wave
    GAME_STATE.enemiesThisWave = GAME_STATE.totalEnemiesThisWave;
    for (let i = 0; i < GAME_STATE.totalEnemiesThisWave; i++) {
        spawnEnemy();
    }
}

function gameOver() {
    GAME_STATE.playing = false;
    document.getElementById('finalScore').textContent = GAME_STATE.score;
    document.getElementById('gameOver').classList.remove('hidden');

    // Reset resources on game over
    GAME_STATE.resources = {
        bambooSeeds: 0,
        wood: 0,
        gold: 0
    };
    GAME_STATE.axeMode = false;
    GAME_STATE.axeModeStartTime = 0;

    // Reset player health for next game
    ninja.health = ninja.maxHealth;
    ninja.isInvulnerable = false;

    // Clear all bamboos, wood drops, and blood puddles
    bamboos.length = 0;
    woodDrops.length = 0;
    bloodPuddles.length = 0;
}

function updateHUD() {
    document.getElementById('score').textContent = GAME_STATE.score;
    document.getElementById('wave').textContent = GAME_STATE.wave;
    document.getElementById('enemies').textContent = enemies.length;

    // Update resources display (with FPS and shuriken count)
    const resourcesHud = document.getElementById('resourcesHud');
    if (resourcesHud) {
        resourcesHud.innerHTML = `
            🌱 Seeds: ${GAME_STATE.resources.bambooSeeds} |
            🪵 Wood: ${GAME_STATE.resources.wood} |
            💰 Gold: ${GAME_STATE.resources.gold} |
            FPS: ${fps} |
            Arrows: ${shurikens.length}
        `;
    }

    // Update ability cooldowns
    const timestamp = performance.now();

    updateAbilityUI('Q', ABILITIES.dash, timestamp);
    updateAbilityUI('E', ABILITIES.burst, timestamp);
    updateAbilityUI('R', ABILITIES.shield, timestamp);
    updateAbilityUI('X', ABILITIES.chainLightning, timestamp);
}

function updateAbilityUI(key, ability, timestamp) {
    const abilityEl = document.getElementById(`ability${key}`);
    const cooldownEl = document.getElementById(`cooldown${key}`);

    // Check if ability is locked
    if (ability.unlocked === false) {
        abilityEl.classList.add('locked');
        abilityEl.classList.remove('cooldown', 'ready');
        cooldownEl.style.width = '0%';
        return;
    }

    // If unlocked, remove locked class
    abilityEl.classList.remove('locked');

    const timeSinceUse = timestamp - ability.lastUsed;
    const cooldownRemaining = ability.cooldown - timeSinceUse;

    if (cooldownRemaining <= 0) {
        abilityEl.classList.remove('cooldown');
        abilityEl.classList.add('ready');
        cooldownEl.style.width = '100%';
    } else {
        abilityEl.classList.add('cooldown');
        abilityEl.classList.remove('ready');
        const percentage = ((ability.cooldown - cooldownRemaining) / ability.cooldown) * 100;
        cooldownEl.style.width = percentage + '%';
    }
}

function drawBackground() {
    // Draw tiled background using tiles 107, 108, and 109
    if (backgroundTile107 && backgroundTile108 && backgroundTile109) {
        const tileSize = 16; // Tiles are 16x16 pixels
        const tiles = [backgroundTile107, backgroundTile108, backgroundTile109];

        // Calculate visible tile range
        const startX = Math.floor(camera.x / tileSize) * tileSize;
        const startY = Math.floor(camera.y / tileSize) * tileSize;
        const endX = camera.x + camera.width + tileSize;
        const endY = camera.y + camera.height + tileSize;

        // Draw tiles in a pattern
        for (let y = startY; y < endY; y += tileSize) {
            for (let x = startX; x < endX; x += tileSize) {
                // Use a deterministic pattern based on position
                // This ensures the same tile appears in the same place consistently
                const tileIndex = (Math.floor(x / tileSize) + Math.floor(y / tileSize)) % 3;
                const tile = tiles[tileIndex];

                ctx.drawImage(tile, x, y, tileSize, tileSize);
            }
        }
    }

    // Draw world border
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, WORLD.width, WORLD.height);
}

// Main Game Loop
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    // Calculate FPS
    frameCount++;
    if (timestamp - lastFpsUpdate >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFpsUpdate = timestamp;
    }

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Only update game logic if playing (not paused by upgrade menu)
    if (GAME_STATE.playing) {
        // Update ninja
        ninja.update(timestamp, deltaTime);

        // Update vendor animation
        vendor.update(deltaTime);

        // Update abilities
        ABILITIES.shield.update(timestamp);

        // Check bamboo axe collision
        checkBambooAxeCollision();

        // Check wood pickup
        checkWoodPickup();

        // Update wood drops physics (con efecto imán)
        for (let wood of woodDrops) {
            wood.update(ninja.x, ninja.y);
        }

        // Update wood sell particles (venta al vendedor)
        for (let i = woodSellParticles.length - 1; i >= 0; i--) {
            const particle = woodSellParticles[i];
            particle.update();

            // Si llegó al vendedor, dar oro y eliminar partícula
            if (particle.collected) {
                GAME_STATE.resources.gold += 10;
                // Crear texto flotante mostrando el oro ganado
                floatingTexts.push(new FloatingText(vendor.x, vendor.y - 40, '+10 💰', '#FFD700'));
                woodSellParticles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            floatingTexts[i].update(deltaTime);
            if (floatingTexts[i].isDead()) {
                floatingTexts.splice(i, 1);
            }
        }

        // Update camera to follow ninja
        camera.follow(ninja);

        // Auto-fire shurikens at nearest enemy (only if within range)
        if (timestamp - lastShurikenTime > shurikenCooldown) {
            const target = findNearestEnemy();
            if (target && shurikens.length < MAX_SHURIKENS) {
                // Check if enemy is within shooting range
                const distToTarget = distance(ninja.x, ninja.y, target.x, target.y);
                if (distToTarget <= SHOOTING_RANGE) {
                    // Make character face the direction they're shooting
                    ninja.facingRight = target.x > ninja.x;

                    shurikens.push(new Shuriken(ninja.x, ninja.y, target.x, target.y));
                    ninja.startAttack(timestamp, target.x, target.y); // Trigger attack animation with target direction
                    lastShurikenTime = timestamp;
                }
            }
        }

        // Update shurikens
        for (let i = shurikens.length - 1; i >= 0; i--) {
            shurikens[i].update();
            if (shurikens[i].isOffWorld()) {
                shurikens.splice(i, 1);
            }
        }

        // Update enemies
        for (let enemy of enemies) {
            enemy.update(ninja.x, ninja.y, deltaTime, timestamp, enemies);
        }

        // Remove dead enemies (after death animation completes) to prevent lag
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemies[i].isDeathAnimationComplete(timestamp)) {
                const deadEnemy = enemies[i];

                // Remove arrows stuck to this enemy
                for (let j = shurikens.length - 1; j >= 0; j--) {
                    if (shurikens[j].stuckToEnemy === deadEnemy) {
                        shurikens.splice(j, 1);
                    }
                }

                enemies.splice(i, 1);
            }
        }

        // Update blood particles and remove old ones to prevent lag
        for (let i = bloodParticles.length - 1; i >= 0; i--) {
            bloodParticles[i].update(deltaTime);
            if (bloodParticles[i].isDead()) {
                bloodParticles.splice(i, 1);
            }
        }

        // Check collisions
        checkCollisions();

        // Update effects (but don't draw them yet - they'll be drawn after camera transform)
        for (let i = effects.length - 1; i >= 0; i--) {
            if (!effects[i].update(deltaTime)) {
                effects.splice(i, 1);
            }
        }
    }

    // Always render (even when paused)
    // Save context and translate for camera
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw background grid
    drawBackground();

    // Draw decorative floor tiles (only visible tiles for performance)
    const visibleTiles = floorTiles.filter(tile => {
        return tile.x >= camera.x - 50 &&
               tile.x <= camera.x + camera.width + 50 &&
               tile.y >= camera.y - 50 &&
               tile.y <= camera.y + camera.height + 50;
    });

    for (let tile of visibleTiles) {
        tile.draw();
    }

    // Draw blood puddles (rendered on top of floor tiles, permanent)
    for (let puddle of bloodPuddles) {
        puddle.draw();
    }

    // Draw bamboos
    for (let bamboo of bamboos) {
        bamboo.draw();
    }

    // Draw wood drops
    for (let wood of woodDrops) {
        wood.draw();
    }

    // Draw wood sell particles (madera volando al vendedor)
    for (let particle of woodSellParticles) {
        particle.draw();
    }

    // Draw blood particles
    for (let particle of bloodParticles) {
        particle.draw();
    }

    // Draw vendor
    vendor.draw();

    // Draw everything
    ninja.draw();

    // Draw axe if active
    if (GAME_STATE.axeMode) {
        ctx.save();
        ctx.translate(ninja.x, ninja.y);

        // Animación de swing/golpe (péndulo)
        const timeSinceStart = performance.now() - GAME_STATE.axeModeStartTime;
        const swingDuration = 300; // Duración del golpe en ms
        const swingProgress = Math.min(timeSinceStart / swingDuration, 1);

        // Desactivar hacha automáticamente al terminar la animación
        if (swingProgress >= 1) {
            GAME_STATE.axeMode = false;
        }

        // Ángulo del swing: de -120° a 30° (golpe de arriba hacia abajo)
        const startAngle = -Math.PI * 0.66; // -120°
        const endAngle = Math.PI * 0.16;    // 30°
        const axeRotation = startAngle + (endAngle - startAngle) * easeOutCubic(swingProgress);

        ctx.rotate(axeRotation);

        // Draw axe handle (más largo)
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-4, 0, 8, 40);

        // Draw axe blade (más grande y detallada)
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.moveTo(-20, 0);
        ctx.lineTo(20, 0);
        ctx.lineTo(15, -15);
        ctx.lineTo(-15, -15);
        ctx.closePath();
        ctx.fill();

        // Borde del filo
        ctx.strokeStyle = '#A9A9A9';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Efecto de brillo en el filo
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(10, -8);
        ctx.lineTo(7, -12);
        ctx.lineTo(-7, -12);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.restore();
    }

    for (let shuriken of shurikens) {
        shuriken.draw();
    }
    for (let enemy of enemies) {
        enemy.draw();
    }

    // Draw effects (lightning, dash, burst) - drawn with camera transform
    for (let effect of effects) {
        effect.draw();
    }

    // Draw floating texts (encima de todo)
    for (let text of floatingTexts) {
        text.draw();
    }

    // Restore context
    ctx.restore();

    // Update HUD
    updateHUD();

    // Continue loop (always, even when paused)
    requestAnimationFrame(gameLoop);
}

// Resize canvas to fill window
function resizeCanvas() {
    // Set canvas size to exact window dimensions
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Update camera dimensions to match new canvas size
    camera.width = canvas.width;
    camera.height = canvas.height;

    console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
}

// Initial resize
resizeCanvas();

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Continue to Next Wave button handler
document.getElementById('continueWaveBtn').addEventListener('click', () => {
    if (GAME_STATE.isWaveBreak) {
        endWaveBreak();
    }
});

// Start game
console.log('Samurai Survivor - Game Starting!');
console.log(`World size: ${WORLD.width}x${WORLD.height}`);
console.log(`Canvas size: ${canvas.width}x${canvas.height}`);

// Spawn initial enemies for wave 1
GAME_STATE.enemiesThisWave = GAME_STATE.totalEnemiesThisWave;
for (let i = 0; i < GAME_STATE.totalEnemiesThisWave; i++) {
    spawnEnemy();
}

// Start game loop
requestAnimationFrame(gameLoop);

// ========================================
// MOBILE CONTROLS
// ========================================

// Detect if device is mobile
function isMobileDevice() {
    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
        ('ontouchstart' in window)
    );
}

// Initialize mobile controls
const mobileControls = document.getElementById('mobileControls');
if (isMobileDevice()) {
    mobileControls.classList.remove('hidden');
    console.log('Mobile device detected - touch controls enabled');
} else {
    console.log('Desktop device - keyboard controls');
}

// Touch event handlers for mobile controls
function simulateKeyEvent(key, isDown) {
    const event = new KeyboardEvent(isDown ? 'keydown' : 'keyup', {
        key: key,
        code: `Key${key.toUpperCase()}`,
        bubbles: true,
        cancelable: true
    });
    document.dispatchEvent(event);
}

// Setup touch controls for all buttons
const allButtons = document.querySelectorAll('[data-key]');
allButtons.forEach(button => {
    const key = button.getAttribute('data-key');

    // Prevent default touch behaviors
    button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        simulateKeyEvent(key, true);
        button.style.opacity = '0.8';
    }, { passive: false });

    button.addEventListener('touchend', (e) => {
        e.preventDefault();
        simulateKeyEvent(key, false);
        button.style.opacity = '1';
    }, { passive: false });

    button.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        simulateKeyEvent(key, false);
        button.style.opacity = '1';
    }, { passive: false });
});

// Prevent zoom on double tap for mobile
document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });

// Prevent pinch zoom
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

// Tutorial Modal - Show only first time using localStorage
const tutorialModal = document.getElementById('tutorialModal');
const closeTutorialBtn = document.getElementById('closeTutorial');
const hasSeenTutorial = localStorage.getItem('samuraiGameTutorialSeen');

if (!tutorialModal || !closeTutorialBtn) {
    console.error('Tutorial elements not found!');
} else {
    if (!hasSeenTutorial) {
        // Show tutorial on first visit
        tutorialModal.classList.remove('hidden');
        GAME_STATE.playing = false; // Pause game while tutorial is showing
    }

    closeTutorialBtn.addEventListener('click', function() {
        tutorialModal.classList.add('hidden');
        localStorage.setItem('samuraiGameTutorialSeen', 'true');
        GAME_STATE.playing = true; // Resume game
    });
}
