import Phaser from 'phaser';
import { WORLD } from '../config/PhaserConfig';
import Enemy from '../entities/Enemy';
import Projectile from '../entities/Projectile';
import AutoFireSystem from '../systems/AutoFireSystem';
import MouseFireSystem from '../systems/MouseFireSystem';
import EnemySpawnSystem from '../systems/EnemySpawnSystem';
import CollisionSystem from '../systems/CollisionSystem';
import AbilitySystem from '../systems/AbilitySystem';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        console.log('✅ MainScene: Scene started');

        // Create world bounds (larger than viewport)
        this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);

        // Create background (simple tile pattern for now)
        this.createBackground();

        // Initialize game state
        this.gameState = {
            playing: true,
            score: 0,
            wave: 1,
            enemiesKilled: 0,
            isWaveBreak: false,
            resources: {
                bambooSeeds: 5,
                wood: 0,
                gold: 0
            },
            axeMode: false,
            shopOpen: false,
            purchasesThisWave: 0
        };

        // Groups for game objects
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });
        this.projectiles = this.physics.add.group({
            classType: Projectile,
            runChildUpdate: true
        });
        this.bamboos = this.add.group();
        this.woodDrops = this.physics.add.group();

        // Create player
        this.createPlayerPlaceholder();

        // Initialize modular systems
        this.autoFireSystem = new AutoFireSystem(this);
        this.mouseFireSystem = new MouseFireSystem(this);
        this.enemySpawnSystem = new EnemySpawnSystem(this);
        this.collisionSystem = new CollisionSystem(this);
        this.abilitySystem = new AbilitySystem(this);

        // Setup camera to follow player
        this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Setup input
        this.setupInput();

        // Initialize wave
        this.gameState.enemiesThisWave = 0;
        this.gameState.totalEnemiesThisWave = 10;

        console.log('✅ MainScene: Setup complete');
    }

    createBackground() {
        // Create a tiled background
        const graphics = this.add.graphics();
        graphics.fillStyle(0x1a1a1a, 1);
        graphics.fillRect(0, 0, WORLD.width, WORLD.height);

        // Add some simple tile pattern
        graphics.lineStyle(1, 0x2a2a2a, 0.3);
        const tileSize = 64;
        for (let x = 0; x < WORLD.width; x += tileSize) {
            graphics.lineBetween(x, 0, x, WORLD.height);
        }
        for (let y = 0; y < WORLD.height; y += tileSize) {
            graphics.lineBetween(0, y, WORLD.width, y);
        }
    }

    createPlayerPlaceholder() {
        // Create player sprite with new Knights Archer asset (192x192 frames)
        this.player = this.physics.add.sprite(WORLD.width / 2, WORLD.height / 2, 'player-archer', 0);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.75); // Scale down slightly (192 -> ~144)

        // CRITICAL: Reduce player hitbox size (sprite is 192x192, way too big!)
        this.player.body.setSize(35, 50); // Small hitbox around player body
        this.player.body.setOffset(78, 90); // Center on player torso (adjusted for 192x192)

        // Player properties
        this.player.health = 100;
        this.player.maxHealth = 100;
        this.player.speed = 200;
        this.player.isInvulnerable = false;
        this.player.invulnerabilityEndTime = 0;
        this.player.isShooting = false; // Track if playing shot animation

        // Player methods
        this.player.takeDamage = (amount) => {
            if (this.player.isInvulnerable) return;

            this.player.health -= amount;
            this.player.health = Math.max(0, this.player.health);

            // Flash red
            this.player.setTint(0xff0000);
            this.time.delayedCall(100, () => {
                this.player.clearTint();
            });

            // Invulnerability frames
            this.player.isInvulnerable = true;
            this.player.invulnerabilityEndTime = this.time.now + 1500;

            // Check if dead
            if (this.player.health <= 0) {
                this.gameState.playing = false;
                // console.log('💀 Player died!');
            }
        };

        // Create player animations
        this.createPlayerAnimations();

        console.log('✅ Player created at:', this.player.x, this.player.y);
    }

    createPlayerAnimations() {
        // Knights Archer spritesheet animations
        // Spritesheet is 8 columns x 7 rows, 192x192 frames
        // Based on the spritesheet layout:
        // Row 0 (0-7): Idle/Walk animation (main) - bow down
        // Row 1 (8-15): Idle/Walk animation (variant) - bow down
        // Row 2 (16-23): Attack/Shot - bow raised (ONLY used when shooting)
        // Rows 3-6: Attack variants - bow raised (not used for walking)

        // Create idle/walk animation from rows 0-1 (bow down, peaceful state)
        // Row 0 has 6 frames (0-5), Row 1 has 6 frames (8-13)
        if (!this.anims.exists('player-idle-anim')) {
            this.anims.create({
                key: 'player-idle-anim',
                frames: [
                    ...this.anims.generateFrameNumbers('player-archer', { start: 0, end: 5 }),   // Row 0: 6 frames
                    ...this.anims.generateFrameNumbers('player-archer', { start: 8, end: 13 })   // Row 1: 6 frames
                ],
                frameRate: 8,
                repeat: -1
            });
        }

        // Play idle by default
        this.player.play('player-idle-anim');
    }

    setupInput() {
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            Q: Phaser.Input.Keyboard.KeyCodes.Q, // Dash
            E: Phaser.Input.Keyboard.KeyCodes.E, // Burst
            R: Phaser.Input.Keyboard.KeyCodes.R, // Shield
            X: Phaser.Input.Keyboard.KeyCodes.X, // Chain Lightning
            P: Phaser.Input.Keyboard.KeyCodes.P, // Plant bamboo
            H: Phaser.Input.Keyboard.KeyCodes.H, // Axe mode
            V: Phaser.Input.Keyboard.KeyCodes.V, // Sell wood
            T: Phaser.Input.Keyboard.KeyCodes.T, // Shop
            B: Phaser.Input.Keyboard.KeyCodes.B, // Toggle hitbox debug
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE // DEBUG: Manual fire arrow
        });

        // Mouse controls - shoot arrows on click
        this.input.on('pointerdown', (pointer) => {
            if (!this.gameState.playing) return;

            // Get world coordinates from camera (pointer gives screen coords)
            const worldX = pointer.worldX;
            const worldY = pointer.worldY;

            // Fire arrow toward mouse position
            this.mouseFireSystem.fireAtPosition(worldX, worldY, this.time.now);
        });
    }

    update(time, delta) {
        if (!this.gameState.playing) return;

        // Update invulnerability
        if (this.player.isInvulnerable && time > this.player.invulnerabilityEndTime) {
            this.player.isInvulnerable = false;
        }

        // Handle ability input
        this.handleAbilityInput(time);

        // Update player movement
        this.updatePlayerMovement();

        // Update modular systems
        this.enemySpawnSystem.update(time);
        this.autoFireSystem.update(time);
        this.abilitySystem.update(time);
        this.collisionSystem.update(); // RAYCAST collision detection
    }

    handleAbilityInput(time) {
        // Dash (Q)
        if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
            this.abilitySystem.dash(time);
        }

        // Burst (E)
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            this.abilitySystem.burst(time);
        }

        // Shield (R)
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.abilitySystem.shield(time);
        }

        // Chain Lightning (X)
        if (Phaser.Input.Keyboard.JustDown(this.keys.X)) {
            this.abilitySystem.chainLightning(time);
        }

        // Toggle hitbox debug (B)
        if (Phaser.Input.Keyboard.JustDown(this.keys.B)) {
            // Toggle Phaser's built-in debug rendering
            const currentDebug = this.physics.world.drawDebug;
            this.physics.world.drawDebug = !currentDebug;

            // Create debug graphics if it doesn't exist
            if (!this.physics.world.debugGraphic) {
                this.physics.world.createDebugGraphic();
            }

            // Toggle visibility
            if (this.physics.world.debugGraphic) {
                this.physics.world.debugGraphic.visible = !currentDebug;
            }

            console.log('🎯 Hitbox debug:', !currentDebug ? 'ON' : 'OFF');
        }

        // DEBUG: Manual fire arrow (SPACE)
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            // Fire arrow to the right
            const angle = 0; // 0 = right, Math.PI/2 = down, Math.PI = left, -Math.PI/2 = up
            this.autoFireSystem.spawnProjectile(angle);
            console.log('🏹 DEBUG: Manual arrow fired');
        }
    }

    updatePlayerMovement() {
        const speed = this.player.speed;
        let velocityX = 0;
        let velocityY = 0;

        // Handle movement input
        if (this.cursors.left.isDown || this.keys.A.isDown) {
            velocityX = -speed;
        } else if (this.cursors.right.isDown || this.keys.D.isDown) {
            velocityX = speed;
        }

        if (this.cursors.up.isDown || this.keys.W.isDown) {
            velocityY = -speed;
        } else if (this.cursors.down.isDown || this.keys.S.isDown) {
            velocityY = speed;
        }

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707; // 1/sqrt(2)
            velocityY *= 0.707;
        }

        this.player.setVelocity(velocityX, velocityY);

        // Update animation - ALWAYS use idle (rows 0-1) unless shooting
        // Don't interrupt shot animation
        if (!this.player.isShooting) {
            // Always play idle animation (bow down) when not shooting
            // Whether moving or standing still, use the same peaceful idle animation
            // Only change animation if it's different (prevents flickering)
            if (this.player.anims.currentAnim?.key !== 'player-idle-anim') {
                this.player.play('player-idle-anim');
            }
        }
    }

    getDirectionFromVelocity(vx, vy) {
        // Calculate angle from velocity (-180 to 180)
        const angle = Math.atan2(vy, vx) * (180 / Math.PI);

        // Convert to 8-way direction
        if (angle >= -22.5 && angle < 22.5) return 'east';           // Right
        if (angle >= 22.5 && angle < 67.5) return 'south-east';      // Down-Right
        if (angle >= 67.5 && angle < 112.5) return 'south';          // Down
        if (angle >= 112.5 && angle < 157.5) return 'south-west';    // Down-Left
        if (angle >= 157.5 || angle < -157.5) return 'west';         // Left
        if (angle >= -157.5 && angle < -112.5) return 'north-west';  // Up-Left
        if (angle >= -112.5 && angle < -67.5) return 'north';        // Up
        if (angle >= -67.5 && angle < -22.5) return 'north-east';    // Up-Right

        return 'south'; // fallback
    }
}
