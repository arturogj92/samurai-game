import Phaser from 'phaser';
import { WORLD } from '../config/PhaserConfig';
import Enemy from '../entities/Enemy';
import Projectile from '../entities/Projectile';
import GoblinHut from '../entities/GoblinHut';
import Tree from '../entities/Tree';
import Bush from '../entities/Bush';
import Rock from '../entities/Rock';
import Sheep from '../entities/Sheep';
import AutoFireSystem from '../systems/AutoFireSystem';
import EnemySpawnSystem from '../systems/EnemySpawnSystem';
import CollisionSystem from '../systems/CollisionSystem';
import AbilitySystem from '../systems/AbilitySystem';
import DamageNumberSystem from '../systems/DamageNumberSystem';
import BloodParticleSystem from '../systems/BloodParticleSystem';
import TilemapManager from '../systems/TilemapManager';
import GoldCollectionEffects from '../systems/GoldCollectionEffects';
import PathfindingSystem from '../systems/PathfindingSystem';
import AbilityBarUI from '../ui/AbilityBarUI';
import GoldUI from '../ui/GoldUI';

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

        // Game over/victory flags
        this.gameOverShown = false;
        this.victoryShown = false;

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
        this.skulls = this.physics.add.group(); // Collectible skulls from dead enemies
        this.goldCoins = this.physics.add.group(); // Gold coins from collected skulls
        this.goblinHuts = this.physics.add.group({
            runChildUpdate: true
        }); // Goblin spawning buildings
        this.trees = this.add.group(); // Terrain decorations
        this.bushes = this.add.group(); // Bush decorations
        this.rocks = this.add.group(); // Rock decorations
        this.sheep = this.add.group(); // Sheep creatures

        // Create player
        this.createPlayerPlaceholder();

        // Initialize modular systems
        this.autoFireSystem = new AutoFireSystem(this);
        this.enemySpawnSystem = new EnemySpawnSystem(this);
        this.enemySpawnSystem.disable(); // Disable automatic spawning - enemies spawn from huts only
        this.collisionSystem = new CollisionSystem(this);
        this.abilitySystem = new AbilitySystem(this);
        this.damageNumberSystem = new DamageNumberSystem(this);
        this.bloodParticleSystem = new BloodParticleSystem(this);
        this.goldCollectionEffects = new GoldCollectionEffects(this);

        // Initialize UI
        this.abilityBarUI = new AbilityBarUI(this, this.abilitySystem);
        this.goldUI = new GoldUI(this);

        // Setup camera to follow player
        this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Setup input
        this.setupInput();

        // Setup skull collection
        this.physics.add.overlap(this.player, this.skulls, this.collectSkull, null, this);

        // Setup gold coin collection
        this.physics.add.overlap(this.player, this.goldCoins, this.collectGoldCoin, null, this);

        // Setup environmental collision - player cannot walk through these objects
        this.physics.add.collider(this.player, this.trees);
        this.physics.add.collider(this.player, this.rocks);
        this.physics.add.collider(this.player, this.bushes);
        this.physics.add.collider(this.player, this.sheep);

        // Initialize wave
        this.gameState.enemiesThisWave = 0;
        this.gameState.totalEnemiesThisWave = 10;

        // Create goblin huts
        this.createGoblinHuts();

        // Create random trees
        this.createRandomTrees();

        // Create random bushes
        this.createRandomBushes();

        // Create random rocks
        this.createRandomRocks();

        // Create random sheep
        this.createRandomSheep();

        // Initialize pathfinding system AFTER all obstacles are created
        this.pathfindingSystem = new PathfindingSystem(this);
        this.pathfindingSystem.markObstacles();

        // Note: Collision between projectiles and huts is handled by CollisionSystem using raycast
        // No need for physics overlap

        console.log('✅ MainScene: Setup complete');
    }

    createGoblinHuts() {
        // Create 5 goblin huts spread out around the player start position (center of world) - Level 1
        // Player starts at WORLD.width/2, WORLD.height/2
        const centerX = WORLD.width / 2;
        const centerY = WORLD.height / 2;

        // Create 5 huts in a spread pattern around the player (farther apart)
        // Hut 1: Upper-left from player
        const hut1 = new GoblinHut(this, centerX - 400, centerY - 400);

        // Hut 2: Upper-right from player
        const hut2 = new GoblinHut(this, centerX + 400, centerY - 400);

        // Hut 3: Lower-left from player
        const hut3 = new GoblinHut(this, centerX - 400, centerY + 400);

        // Hut 4: Lower-right from player
        const hut4 = new GoblinHut(this, centerX + 400, centerY + 400);

        // Hut 5: Directly above player (farther out)
        const hut5 = new GoblinHut(this, centerX, centerY - 500);

        this.goblinHuts.add(hut1);
        this.goblinHuts.add(hut2);
        this.goblinHuts.add(hut3);
        this.goblinHuts.add(hut4);
        this.goblinHuts.add(hut5);

        console.log('🏠 Created 5 goblin huts spread around player at', centerX, centerY);
    }

    createRandomTrees() {
        const centerX = WORLD.width / 2;
        const centerY = WORLD.height / 2;

        // Hut positions (MUST match createGoblinHuts exactly!)
        const hutPositions = [
            { x: centerX - 400, y: centerY - 400 }, // Hut 1: Upper-left
            { x: centerX + 400, y: centerY - 400 }, // Hut 2: Upper-right
            { x: centerX - 400, y: centerY + 400 }, // Hut 3: Lower-left
            { x: centerX + 400, y: centerY + 400 }, // Hut 4: Lower-right
            { x: centerX, y: centerY - 500 }        // Hut 5: Directly above
        ];

        // Collision radii
        const HUT_COLLISION_RADIUS = 300; // Don't spawn trees within 300px of huts (increased from 250px)
        const PLAYER_COLLISION_RADIUS = 250; // Don't spawn trees too close to player start
        const TREE_MIN_DISTANCE = 120; // Minimum distance between trees (reduced for better density)

        // Number of trees to spawn - increased for better world coverage
        const NUM_TREES = 50;

        let treesCreated = 0;
        let attempts = 0;
        const MAX_ATTEMPTS = NUM_TREES * 15; // More attempts for better distribution

        while (treesCreated < NUM_TREES && attempts < MAX_ATTEMPTS) {
            attempts++;

            // Random position in world with better margins
            const x = Phaser.Math.Between(150, WORLD.width - 150);
            const y = Phaser.Math.Between(150, WORLD.height - 150);

            // Check collision with player spawn
            const distToPlayer = Phaser.Math.Distance.Between(x, y, centerX, centerY);
            if (distToPlayer < PLAYER_COLLISION_RADIUS) {
                continue; // Too close to player, try again
            }

            // Check collision with huts
            let tooCloseToHut = false;
            for (const hut of hutPositions) {
                const distToHut = Phaser.Math.Distance.Between(x, y, hut.x, hut.y);
                if (distToHut < HUT_COLLISION_RADIUS) {
                    tooCloseToHut = true;
                    break;
                }
            }
            if (tooCloseToHut) {
                continue; // Too close to a hut, try again
            }

            // Check collision with other trees
            let tooCloseToTree = false;
            const existingTrees = this.trees.getChildren();
            for (const tree of existingTrees) {
                const distToTree = Phaser.Math.Distance.Between(x, y, tree.x, tree.y);
                if (distToTree < TREE_MIN_DISTANCE) {
                    tooCloseToTree = true;
                    break;
                }
            }
            if (tooCloseToTree) {
                continue; // Too close to another tree, try again
            }

            // Position is valid! Create tree
            const tree = new Tree(this, x, y);
            this.trees.add(tree);
            treesCreated++;
        }

        console.log(`🌳 Created ${treesCreated} random trees (${attempts} attempts)`);
    }

    createRandomBushes() {
        const centerX = WORLD.width / 2;
        const centerY = WORLD.height / 2;

        // Hut positions (MUST match createGoblinHuts exactly!)
        const hutPositions = [
            { x: centerX - 400, y: centerY - 400 }, // Hut 1: Upper-left
            { x: centerX + 400, y: centerY - 400 }, // Hut 2: Upper-right
            { x: centerX - 400, y: centerY + 400 }, // Hut 3: Lower-left
            { x: centerX + 400, y: centerY + 400 }, // Hut 4: Lower-right
            { x: centerX, y: centerY - 500 }        // Hut 5: Directly above
        ];

        // Collision radii
        const HUT_COLLISION_RADIUS = 250; // Don't spawn bushes within 250px of huts (increased from 200px)
        const PLAYER_COLLISION_RADIUS = 200; // Don't spawn bushes too close to player start
        const TREE_MIN_DISTANCE = 80; // Minimum distance from trees
        const BUSH_MIN_DISTANCE = 60; // Minimum distance between bushes

        // Number of bushes to spawn - fewer than trees, but varied types
        const NUM_BUSHES = 30;

        let bushesCreated = 0;
        let attempts = 0;
        const MAX_ATTEMPTS = NUM_BUSHES * 15;

        while (bushesCreated < NUM_BUSHES && attempts < MAX_ATTEMPTS) {
            attempts++;

            // Random position in world with better margins
            const x = Phaser.Math.Between(150, WORLD.width - 150);
            const y = Phaser.Math.Between(150, WORLD.height - 150);

            // Check collision with player spawn
            const distToPlayer = Phaser.Math.Distance.Between(x, y, centerX, centerY);
            if (distToPlayer < PLAYER_COLLISION_RADIUS) {
                continue; // Too close to player, try again
            }

            // Check collision with huts
            let tooCloseToHut = false;
            for (const hut of hutPositions) {
                const distToHut = Phaser.Math.Distance.Between(x, y, hut.x, hut.y);
                if (distToHut < HUT_COLLISION_RADIUS) {
                    tooCloseToHut = true;
                    break;
                }
            }
            if (tooCloseToHut) {
                continue; // Too close to a hut, try again
            }

            // Check collision with trees
            let tooCloseToTree = false;
            const existingTrees = this.trees.getChildren();
            for (const tree of existingTrees) {
                const distToTree = Phaser.Math.Distance.Between(x, y, tree.x, tree.y);
                if (distToTree < TREE_MIN_DISTANCE) {
                    tooCloseToTree = true;
                    break;
                }
            }
            if (tooCloseToTree) {
                continue; // Too close to a tree, try again
            }

            // Check collision with other bushes
            let tooCloseToBush = false;
            const existingBushes = this.bushes.getChildren();
            for (const bush of existingBushes) {
                const distToBush = Phaser.Math.Distance.Between(x, y, bush.x, bush.y);
                if (distToBush < BUSH_MIN_DISTANCE) {
                    tooCloseToBush = true;
                    break;
                }
            }
            if (tooCloseToBush) {
                continue; // Too close to another bush, try again
            }

            // Position is valid! Create bush with random type (1-4)
            const bush = new Bush(this, x, y);
            this.bushes.add(bush);
            bushesCreated++;
        }

        console.log(`🌿 Created ${bushesCreated} random bushes (${attempts} attempts)`);
    }

    createRandomRocks() {
        const centerX = WORLD.width / 2;
        const centerY = WORLD.height / 2;

        // Number of rocks - small decorations scattered around
        const NUM_ROCKS = 40;
        const ROCK_MIN_DISTANCE = 50; // Small collision radius

        let rocksCreated = 0;
        let attempts = 0;
        const MAX_ATTEMPTS = NUM_ROCKS * 10;

        while (rocksCreated < NUM_ROCKS && attempts < MAX_ATTEMPTS) {
            attempts++;

            const x = Phaser.Math.Between(100, WORLD.width - 100);
            const y = Phaser.Math.Between(100, WORLD.height - 100);

            // Simple collision check with other rocks
            let tooCloseToRock = false;
            const existingRocks = this.rocks.getChildren();
            for (const rock of existingRocks) {
                const distToRock = Phaser.Math.Distance.Between(x, y, rock.x, rock.y);
                if (distToRock < ROCK_MIN_DISTANCE) {
                    tooCloseToRock = true;
                    break;
                }
            }
            if (tooCloseToRock) {
                continue;
            }

            // Create rock with random type (1-4)
            const rock = new Rock(this, x, y);
            this.rocks.add(rock);
            rocksCreated++;
        }

        console.log(`🪨 Created ${rocksCreated} random rocks (${attempts} attempts)`);
    }

    createRandomSheep() {
        const centerX = WORLD.width / 2;
        const centerY = WORLD.height / 2;

        // Few sheep scattered around (not too many)
        const NUM_SHEEP = 5;
        const SHEEP_MIN_DISTANCE = 150; // Keep sheep apart from each other

        let sheepCreated = 0;
        let attempts = 0;
        const MAX_ATTEMPTS = NUM_SHEEP * 20;

        while (sheepCreated < NUM_SHEEP && attempts < MAX_ATTEMPTS) {
            attempts++;

            const x = Phaser.Math.Between(200, WORLD.width - 200);
            const y = Phaser.Math.Between(200, WORLD.height - 200);

            // Check distance from player spawn
            const distToPlayer = Phaser.Math.Distance.Between(x, y, centerX, centerY);
            if (distToPlayer < 300) {
                continue; // Too close to player
            }

            // Check collision with other sheep
            let tooCloseToSheep = false;
            const existingSheep = this.sheep.getChildren();
            for (const otherSheep of existingSheep) {
                const distToSheep = Phaser.Math.Distance.Between(x, y, otherSheep.x, otherSheep.y);
                if (distToSheep < SHEEP_MIN_DISTANCE) {
                    tooCloseToSheep = true;
                    break;
                }
            }
            if (tooCloseToSheep) {
                continue;
            }

            // Create sheep
            const newSheep = new Sheep(this, x, y);
            this.sheep.add(newSheep);
            sheepCreated++;
        }

        console.log(`🐑 Created ${sheepCreated} sheep (${attempts} attempts)`);
    }

    // projectileHitHut removed - now handled by CollisionSystem with raycast
    // This allows arrows to stick to huts like they do with enemies

    createBackground() {
        // Create tilemap system using TilemapManager
        // This allows for different terrains, elevations, and obstacles in the future
        this.tilemapManager = new TilemapManager(this);
        this.tilemapManager.create();

        console.log('✅ Tilemap system initialized with green grass terrain');
    }

    createPlayerPlaceholder() {
        // Create player sprite with new Knights Archer asset (192x192 frames)
        this.player = this.physics.add.sprite(WORLD.width / 2, WORLD.height / 2, 'player-archer', 0);
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.75); // Scale down slightly (192 -> ~144)

        // CRITICAL: Reduce player hitbox size (sprite is 192x192, way too big!)
        this.player.body.setSize(35, 50); // Small hitbox around player body
        this.player.body.setOffset(78, 90); // Center on player torso (adjusted for 192x192)

        // Set player depth based on Y position for proper layering with environment
        this.player.setDepth(this.player.y);

        // Player properties
        this.player.health = 100;
        this.player.maxHealth = 100;
        this.player.speed = 200;
        this.player.damageMultiplier = 1.0; // Damage multiplier (affected by berserker mode)
        this.player.isInvulnerable = false;
        this.player.invulnerabilityEndTime = 0;
        this.player.isShooting = false; // Track if playing shot animation

        // Player methods
        this.player.takeDamage = (amount) => {
            // DEBUG
            console.log('💔 takeDamage called! amount:', amount, 'isInvulnerable:', this.player.isInvulnerable);

            if (this.player.isInvulnerable) {
                console.log('✅ Damage blocked by invulnerability!');
                return;
            }

            this.player.health -= amount;
            this.player.health = Math.max(0, this.player.health);

            // Show damage number (red color for player damage)
            if (this.damageNumberSystem) {
                this.damageNumberSystem.spawnDamageNumber(
                    this.player.x,
                    this.player.y,
                    Math.floor(amount),
                    false, // not critical
                    true   // isPlayerDamage = true (shows in red)
                );
            }

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
                this.showGameOver();
            }
        };

        // Create player animations
        this.createPlayerAnimations();

        // Create death skull animation
        this.createDeathAnimations();

        console.log('✅ Player created at:', this.player.x, this.player.y);
    }

    createPlayerAnimations() {
        // Knights Archer spritesheet animations
        // Spritesheet is 8 columns x 7 rows, 192x192 frames
        // Based on the spritesheet layout:
        // Row 0 (0-7): Idle animation - bow down, legs still
        // Row 1 (8-15): Walk animation - bow down, legs moving
        // Row 2 (16-23): Attack/Shot - bow raised (ONLY used when shooting)
        // Rows 3-6: Attack variants - bow raised (not used for walking)

        // Create IDLE animation from row 0 only (legs still)
        // Row 0 has 6 frames (0-5)
        if (!this.anims.exists('player-idle')) {
            this.anims.create({
                key: 'player-idle',
                frames: this.anims.generateFrameNumbers('player-archer', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Create WALK animation from row 1 only (legs moving)
        // Row 1 has 6 frames (8-13)
        if (!this.anims.exists('player-walk')) {
            this.anims.create({
                key: 'player-walk',
                frames: this.anims.generateFrameNumbers('player-archer', { start: 8, end: 13 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Play idle by default
        this.player.play('player-idle');
    }

    createDeathAnimations() {
        // Death skull animation - using top row only (frames 0-6)
        // Sprite sheet is 896x256 = 7 frames x 2 rows, each frame 128x128
        // Top row (frames 0-6): bouncing skull animation
        // Bottom row (frames 7-13): disappear/collect animation

        if (!this.anims.exists('death-skull-bounce')) {
            this.anims.create({
                key: 'death-skull-bounce',
                frames: this.anims.generateFrameNumbers('death-skull', { start: 0, end: 6 }),
                frameRate: 12,
                repeat: 0 // Play once
            });
        }

        // Disappear animation (bottom row)
        if (!this.anims.exists('death-skull-disappear')) {
            this.anims.create({
                key: 'death-skull-disappear',
                frames: this.anims.generateFrameNumbers('death-skull', { start: 7, end: 13 }),
                frameRate: 15,
                repeat: 0 // Play once
            });
        }

        // Gold coin spawn animation (7 frames)
        if (!this.anims.exists('gold-spawn-anim')) {
            this.anims.create({
                key: 'gold-spawn-anim',
                frames: this.anims.generateFrameNumbers('gold-spawn', { start: 0, end: 6 }),
                frameRate: 12,
                repeat: 0 // Play once
            });
        }
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
            Z: Phaser.Input.Keyboard.KeyCodes.Z, // Berserker Mode
            F: Phaser.Input.Keyboard.KeyCodes.F, // Summon Mini Archers
            P: Phaser.Input.Keyboard.KeyCodes.P, // Plant bamboo
            H: Phaser.Input.Keyboard.KeyCodes.H, // Axe mode
            V: Phaser.Input.Keyboard.KeyCodes.V, // Sell wood
            T: Phaser.Input.Keyboard.KeyCodes.T, // Shop
            B: Phaser.Input.Keyboard.KeyCodes.B, // Toggle hitbox debug
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE // DEBUG: Manual fire arrow
        });
    }

    collectSkull(player, skull) {
        // Only collect if the skull animation is complete and it's marked as collectible
        if (!skull.getData('collectible')) return;

        // Get skull position
        const skullX = skull.x;
        const skullY = skull.y;

        // Mark as not collectible to prevent double collection
        skull.setData('collectible', false);

        // Play disappear animation (bottom row frames 7-13)
        skull.play('death-skull-disappear');

        // Spawn gold coin at skull position
        const goldCoin = this.physics.add.sprite(skullX, skullY, 'gold-spawn', 0);
        this.goldCoins.add(goldCoin);
        goldCoin.setScale(1.0); // Keep original size (128px)
        goldCoin.setDepth(50);
        goldCoin.body.setSize(20, 20); // Very small hitbox - player must be on top of coin
        goldCoin.body.setOffset(54, 54); // Center the tiny hitbox (128px sprite, so (128-20)/2 = 54)

        // Play spawn animation
        goldCoin.play('gold-spawn-anim');

        // When spawn animation completes, switch to idle sprite
        goldCoin.once('animationcomplete', () => {
            goldCoin.setTexture('gold-idle');
            goldCoin.setData('canCollect', true); // Mark as ready for magnetic collection
        });

        // Destroy skull after disappear animation completes
        skull.once('animationcomplete', () => {
            skull.destroy();
        });
    }

    collectGoldCoin(player, coin) {
        // Only collect if spawn animation is complete
        if (!coin.getData('canCollect')) return;

        // Stop any pulsing animation
        if (coin.getData('isPulsing')) {
            this.tweens.killTweensOf(coin);
        }

        // TRIGGER ALL THE DOPAMINIC EFFECTS! 🔥💰🎉
        // Pass the player object so text appears above player
        this.goldCollectionEffects.triggerCollectionEffects(this.player, 1);

        // Give 1 gold to player
        this.gameState.resources.gold = (this.gameState.resources.gold || 0) + 1;

        // Destroy coin
        coin.destroy();
    }

    updateGoldMagnet() {
        // Use the enhanced magnetic pull with visual feedback from GoldCollectionEffects
        this.goldCollectionEffects.updateMagneticPull(this.goldCoins, this.player);
    }

    update(time, delta) {
        if (!this.gameState.playing) return;

        // Update invulnerability
        if (this.player.isInvulnerable && time > this.player.invulnerabilityEndTime) {
            this.player.isInvulnerable = false;
        }

        // Update player depth for dynamic layering with environment (Y-based sorting)
        this.player.setDepth(this.player.y);

        // Handle ability input
        this.handleAbilityInput(time);

        // Update player movement
        this.updatePlayerMovement();

        // Update modular systems
        this.enemySpawnSystem.update(time);
        this.autoFireSystem.update(time);
        this.abilitySystem.update(time);
        this.collisionSystem.update(); // RAYCAST collision detection

        // Update mini archers (summoned allies)
        if (this.miniArchers && this.miniArchers.length > 0) {
            // Update all mini archers
            for (let i = this.miniArchers.length - 1; i >= 0; i--) {
                const miniArcher = this.miniArchers[i];
                if (miniArcher && miniArcher.active) {
                    miniArcher.update();
                } else {
                    // Remove destroyed archers
                    this.miniArchers.splice(i, 1);
                }
            }
        }

        // Update magnetic attraction for gold coins
        this.updateGoldMagnet();

        // Update UI
        this.abilityBarUI.update();
        if (this.goldUI) {
            this.goldUI.update();
        }

        // Check for victory condition
        this.checkVictoryCondition();
    }

    handleAbilityInput(time) {
        // Dash (Q)
        if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
            this.abilitySystem.dash(time);
        }

        // Burst (E) - Hold to charge
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            this.abilitySystem.startChargingBurst(time);
        }
        // Release burst when E is released
        if (Phaser.Input.Keyboard.JustUp(this.keys.E)) {
            this.abilitySystem.releaseBurst(time);
        }

        // Shield (R)
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.abilitySystem.shield(time);
        }

        // Chain Lightning (X)
        if (Phaser.Input.Keyboard.JustDown(this.keys.X)) {
            console.log('⚡ X key pressed - attempting chain lightning');
            this.abilitySystem.chainLightning(time);
        }

        // Berserker Mode (Z)
        if (Phaser.Input.Keyboard.JustDown(this.keys.Z)) {
            this.abilitySystem.berserker(time);
        }

        // Summon Mini Archers (F)
        if (Phaser.Input.Keyboard.JustDown(this.keys.F)) {
            this.abilitySystem.summon(time);
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

        // Update sprite flip based on horizontal movement direction
        if (velocityX < 0) {
            // Moving left - flip sprite horizontally
            this.player.setFlipX(true);
        } else if (velocityX > 0) {
            // Moving right - face right (no flip)
            this.player.setFlipX(false);
        }
        // If velocityX === 0, keep current flip direction

        // Update animation based on movement - don't interrupt shot animation
        if (!this.player.isShooting) {
            const isMoving = velocityX !== 0 || velocityY !== 0;

            if (isMoving) {
                // Player is moving - use walk animation (row 1, legs moving)
                if (this.player.anims.currentAnim?.key !== 'player-walk') {
                    this.player.play('player-walk');
                }
            } else {
                // Player is still - use idle animation (row 0, legs still)
                if (this.player.anims.currentAnim?.key !== 'player-idle') {
                    this.player.play('player-idle');
                }
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

    checkVictoryCondition() {
        // Prevent multiple checks
        if (this.victoryShown || this.gameOverShown) return;

        // Count alive enemies
        const aliveEnemies = this.enemies.getChildren()
            .filter(e => e.active && !e.isDying && e.health > 0);

        // Count alive huts
        const aliveHuts = this.goblinHuts.getChildren()
            .filter(h => h.active && !h.isDestroyed);

        // Victory if all enemies AND huts are destroyed
        if (aliveEnemies.length === 0 && aliveHuts.length === 0) {
            this.showVictory();
        }
    }

    showVictory() {
        // Prevent multiple victory screens
        if (this.victoryShown) return;
        this.victoryShown = true;
        this.gameState.playing = false;

        console.log('🎉 VICTORY!');

        // Create semi-transparent black overlay
        const overlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.7
        );
        overlay.setScrollFactor(0);
        overlay.setDepth(10000);

        // YOU WIN text
        const victoryText = this.add.text(
            this.cameras.main.width / 2,
            150,
            'YOU WIN!',
            {
                fontSize: '72px',
                fontFamily: 'Arial',
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 8
            }
        );
        victoryText.setOrigin(0.5);
        victoryText.setScrollFactor(0);
        victoryText.setDepth(10001);

        // Calculate survival time
        const survivalTime = Math.floor(this.time.now / 1000);
        const minutes = Math.floor(survivalTime / 60);
        const seconds = survivalTime % 60;

        // Statistics text
        const statsText = this.add.text(
            this.cameras.main.width / 2,
            280,
            `🏆 VICTORY STATS 🏆

Score: ${this.gameState.score}
Enemies Killed: ${this.gameState.enemiesKilled}
Gold Collected: ${this.gameState.resources.gold}
Time: ${minutes}m ${seconds}s`,
            {
                fontSize: '22px',
                fontFamily: 'Arial',
                color: '#ffffff',
                align: 'center',
                lineSpacing: 8
            }
        );
        statsText.setOrigin(0.5);
        statsText.setScrollFactor(0);
        statsText.setDepth(10001);

        // Restart button background
        const buttonBg = this.add.rectangle(
            this.cameras.main.width / 2,
            450,
            220,
            60,
            0x00aa00
        );
        buttonBg.setScrollFactor(0);
        buttonBg.setDepth(10002);
        buttonBg.setInteractive({ useHandCursor: true });

        // Restart button text
        const buttonText = this.add.text(
            this.cameras.main.width / 2,
            450,
            'PLAY AGAIN',
            {
                fontSize: '28px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        buttonText.setOrigin(0.5);
        buttonText.setScrollFactor(0);
        buttonText.setDepth(10003);

        // Button hover effect
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x00ff00);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x00aa00);
        });

        // Button click - restart game
        buttonBg.on('pointerdown', () => {
            this.scene.restart();
        });
    }

    showGameOver() {
        // Prevent multiple game over screens
        if (this.gameOverShown) return;
        this.gameOverShown = true;

        console.log('💀 Game Over!');

        // Create semi-transparent black overlay
        const overlay = this.add.rectangle(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            this.cameras.main.width,
            this.cameras.main.height,
            0x000000,
            0.7
        );
        overlay.setScrollFactor(0); // Fixed to camera
        overlay.setDepth(10000); // MUY por encima de todo

        // Game Over text
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            150,
            'GAME OVER',
            {
                fontSize: '64px',
                fontFamily: 'Arial',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 8
            }
        );
        gameOverText.setOrigin(0.5);
        gameOverText.setScrollFactor(0);
        gameOverText.setDepth(10001);

        // Score text
        const scoreText = this.add.text(
            this.cameras.main.width / 2,
            280,
            `Score: ${this.gameState.score}\nEnemies Killed: ${this.gameState.enemiesKilled}`,
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ffffff',
                align: 'center'
            }
        );
        scoreText.setOrigin(0.5);
        scoreText.setScrollFactor(0);
        scoreText.setDepth(10001);

        // Restart button background
        const buttonBg = this.add.rectangle(
            this.cameras.main.width / 2,
            380,
            200,
            60,
            0x00aa00
        );
        buttonBg.setScrollFactor(0);
        buttonBg.setDepth(10002);
        buttonBg.setInteractive({ useHandCursor: true });

        // Restart button text
        const buttonText = this.add.text(
            this.cameras.main.width / 2,
            380,
            'RESTART',
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                fontStyle: 'bold'
            }
        );
        buttonText.setOrigin(0.5);
        buttonText.setScrollFactor(0);
        buttonText.setDepth(10003);

        // Button hover effect
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x00ff00);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x00aa00);
        });

        // Button click - restart game
        buttonBg.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}
