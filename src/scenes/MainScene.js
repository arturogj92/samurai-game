import Phaser from 'phaser';
import { WORLD } from '../config/PhaserConfig';
import Enemy from '../entities/Enemy';
import Projectile from '../entities/Projectile';
import GoblinHut from '../entities/GoblinHut';
import Tree from '../entities/Tree';
import Bush from '../entities/Bush';
import Rock from '../entities/Rock';
import Sheep from '../entities/Sheep';
import HealthPotion from '../entities/HealthPotion';
import AutoFireSystem from '../systems/AutoFireSystem';
import EnemySpawnSystem from '../systems/EnemySpawnSystem';
import CollisionSystem from '../systems/CollisionSystem';
import AbilitySystem from '../systems/AbilitySystem';
import DamageNumberSystem from '../systems/DamageNumberSystem';
import BloodParticleSystem from '../systems/BloodParticleSystem';
import TilemapManager from '../systems/TilemapManager';
import GoldCollectionEffects from '../systems/GoldCollectionEffects';
import PathfindingSystem from '../systems/PathfindingSystem';
import LevelSystem from '../systems/LevelSystem';
import DifficultySystem from '../systems/DifficultySystem';
import UpgradeSystem from '../systems/UpgradeSystem';
import AbilityUpgradeSystem from '../systems/AbilityUpgradeSystem';
import ComboSystem from '../systems/ComboSystem'; // 🔥 NEW: Kill streak system
import AbilityBarUI from '../ui/AbilityBarUI';
import GoldUI from '../ui/GoldUI';
import LevelCompletePanel from '../ui/LevelCompletePanel';
import AbilityShopUI from '../ui/AbilityShopUI';
import StartingAbilitySelectionUI from '../ui/StartingAbilitySelectionUI';
import SlotAssignmentUI from '../ui/SlotAssignmentUI';
import UpgradeShopUI from '../ui/UpgradeShopUI';
import AbilityUpgradeUI from '../ui/AbilityUpgradeUI';
import PlayerStatsUI from '../ui/PlayerStatsUI';
import { ABILITY_POOL, getRandomAbilities } from '../config/AbilityPool';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    init(data) {
        // Receive or create LevelSystem
        this.levelSystem = data.levelSystem || new LevelSystem();
        console.log('📊 Starting Level', this.levelSystem.currentLevel);
    }

    create() {
        console.log('✅ MainScene: Scene started');

        // Start tracking level statistics
        this.levelSystem.startLevel();

        // Generate random shop abilities for this level
        this.generateShopAbilities();

        // Set custom cursor (crosshair style)
        this.input.setDefaultCursor('crosshair');

        // Create world bounds (larger than viewport)
        this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);

        // Create background (simple tile pattern for now)
        this.createBackground();

        // Initialize game state
        // On level 1, start paused if player hasn't chosen starting ability yet
        const shouldStartPaused = this.levelSystem.currentLevel === 1;

        this.gameState = {
            playing: !shouldStartPaused, // false on level 1, true on level 2+
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
            purchasesThisWave: 0,

            // NEW SLOT-BASED ABILITY SYSTEM
            abilitySlots: {
                Q: null, // Empty slot
                E: null,
                R: null,
                T: null,
                F: null
            },
            ownedAbilities: [], // Abilities player owns but hasn't assigned to slots yet
            availableAbilitiesThisLevel: [], // 3 random abilities shown in shop this level
            hasChosenStartingAbility: false // Track if player chose starting ability
        };

        // PERFORMANCE: Global enemy limit to prevent FPS degradation
        this.MAX_ENEMIES = 50; // Maximum concurrent enemies (prevents infinite spawning lag)
        this.enemyCleanupDistance = 1000; // Clean up enemies beyond this distance from player

        // Game over/victory flags
        this.gameOverShown = false;
        this.victoryShown = false;

        // Pause physics immediately on level 1 before creating huts
        // This prevents initial guard spawning before ability selection
        if (shouldStartPaused) {
            this.physics.pause();
            console.log('⏸️ Game paused on level 1 - waiting for ability selection');
        }

        // Groups for game objects
        this.enemies = this.physics.add.group({
            classType: Enemy,
            runChildUpdate: true
        });
        this.projectiles = this.physics.add.group({
            classType: Projectile,
            runChildUpdate: false  // Disabled - we update manually to get correct delta time
        });
        this.bamboos = this.add.group();
        this.woodDrops = this.physics.add.group();
        this.skulls = this.physics.add.group(); // Collectible skulls from dead enemies
        this.goldCoins = this.physics.add.group(); // Gold coins from collected skulls
        this.healthPotions = this.physics.add.group({ classType: HealthPotion }); // Health potions from enemies
        this.goblinHuts = this.physics.add.group({
            runChildUpdate: true
        }); // Goblin spawning buildings
        this.trees = this.physics.add.staticGroup(); // Terrain decorations with collision
        this.bushes = this.add.group(); // Bush decorations (no collision)
        this.rocks = this.physics.add.staticGroup(); // Rock decorations with collision
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
        this.difficultySystem = new DifficultySystem(this);
        this.difficultySystem.logDifficulty(); // Log current difficulty settings

        // Initialize upgrade systems
        this.upgradeSystem = new UpgradeSystem(this);
        this.abilityUpgradeSystem = new AbilityUpgradeSystem(this);

        // 🔥 Initialize combo/streak system
        this.comboSystem = new ComboSystem(this);

        // Apply any existing upgrades to player stats
        this.upgradeSystem.applyUpgrades();

        // Initialize UI
        this.abilityBarUI = new AbilityBarUI(this, this.abilitySystem);
        this.goldUI = new GoldUI(this);
        this.levelCompletePanel = new LevelCompletePanel(this, this.levelSystem);
        this.abilityShopUI = new AbilityShopUI(this);
        this.startingAbilitySelectionUI = new StartingAbilitySelectionUI(this);
        this.slotAssignmentUI = new SlotAssignmentUI(this);
        this.upgradeShopUI = new UpgradeShopUI(this);
        this.abilityUpgradeUI = new AbilityUpgradeUI(this);
        this.playerStatsUI = new PlayerStatsUI(this);

        // Setup camera to follow player
        this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Setup input
        this.setupInput();

        // Setup skull collection
        this.physics.add.overlap(this.player, this.skulls, this.collectSkull, null, this);

        // Setup gold coin collection
        this.physics.add.overlap(this.player, this.goldCoins, this.collectGoldCoin, null, this);

        // Health potion collection uses magnetic system (no overlap needed)

        // Setup environmental collision - player cannot walk through these objects
        this.physics.add.collider(this.player, this.trees);
        this.physics.add.collider(this.player, this.rocks);
        // Bushes are decorative only - no collision
        this.physics.add.collider(this.player, this.sheep);
        this.physics.add.collider(this.player, this.goblinHuts);

        // Setup enemy collision with environment - enemies cannot walk through huts/trees/rocks
        this.physics.add.collider(this.enemies, this.goblinHuts);
        this.physics.add.collider(this.enemies, this.trees);
        this.physics.add.collider(this.enemies, this.rocks);

        // Setup enemy-to-enemy collision - prevents enemies from stacking on same position
        this.physics.add.collider(this.enemies, this.enemies);

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

        // Global console commands for testing (accessible via browser console)
        window.enableRicochet = () => {
            this.player.ricochetEnabled = true;
            console.log('⚡ RICOCHET ENABLED! Arrows will bounce once to another enemy!');
        };
        window.disableRicochet = () => {
            this.player.ricochetEnabled = false;
            console.log('❌ Ricochet disabled');
        };

        console.log('✅ MainScene: Setup complete');
        console.log('💡 Console commands: enableRicochet(), disableRicochet()');

        // Show starting ability selection on level 1 if not chosen yet
        if (this.levelSystem.currentLevel === 1 && !this.gameState.hasChosenStartingAbility) {
            this.showStartingAbilitySelection();
        }
    }

    /**
     * Show the starting ability selection UI
     */
    showStartingAbilitySelection() {
        console.log('🎯 Showing starting ability selection...');

        // Pause game while selecting
        this.physics.pause();
        this.gameState.playing = false;

        this.startingAbilitySelectionUI.open((selectedAbility) => {
            console.log(`✅ Player selected: ${selectedAbility.name}`);

            // Add ability to owned abilities
            this.gameState.ownedAbilities.push(selectedAbility.id);
            this.gameState.hasChosenStartingAbility = true;

            // Register ability with upgrade system (starts at level 1)
            if (this.abilityUpgradeSystem) {
                this.abilityUpgradeSystem.registerAbility(selectedAbility.id);
            }

            // Open slot assignment UI
            this.slotAssignmentUI.open(selectedAbility.id, (slotKey) => {
                console.log(`📍 Assigned ${selectedAbility.name} to slot ${slotKey}`);

                // Assign to selected slot
                this.gameState.abilitySlots[slotKey] = selectedAbility.id;

                // Spawn initial guards for all huts (they were waiting for game to start)
                this.goblinHuts.getChildren().forEach(hut => {
                    if (hut.needsInitialSpawn) {
                        hut.spawnInitialGuards();
                        hut.needsInitialSpawn = false;
                    }
                });

                // Resume game
                this.physics.resume();
                this.gameState.playing = true;
                console.log('▶️ Game started! Initial guards spawned.');
            });
        });
    }

    createGoblinHuts() {
        // Get level configuration
        const levelConfig = this.levelSystem.getCurrentLevelConfig();
        const hutCount = levelConfig.hutCount;
        const spawnRateMultiplier = levelConfig.spawnRateMultiplier;
        const fireRateMultiplier = levelConfig.fireRateMultiplier;

        // Player starts at center
        const centerX = WORLD.width / 2;
        const centerY = WORLD.height / 2;

        // Predefined positions for up to 5 huts
        const hutPositions = [
            { x: centerX - 400, y: centerY - 400 },  // Upper-left
            { x: centerX + 400, y: centerY - 400 },  // Upper-right
            { x: centerX - 400, y: centerY + 400 },  // Lower-left
            { x: centerX + 400, y: centerY + 400 },  // Lower-right
            { x: centerX, y: centerY - 500 }         // Directly above
        ];

        // Create only the number of huts for this level
        for (let i = 0; i < hutCount && i < hutPositions.length; i++) {
            const pos = hutPositions[i];
            const hut = new GoblinHut(
                this,
                pos.x,
                pos.y,
                spawnRateMultiplier,
                fireRateMultiplier,
                this.levelSystem.currentLevel  // Pass current level for dynamic spawn rates
            );
            this.goblinHuts.add(hut);
        }

        console.log(`🏠 Level ${levelConfig.level}: Created ${hutCount} goblin huts (spawn x${spawnRateMultiplier.toFixed(1)}, fire x${fireRateMultiplier.toFixed(1)})`);

        // Spawn initial enemies on level 1 only
        if (this.levelSystem.currentLevel === 1) {
            this.spawnInitialEnemies();
        }
    }

    spawnInitialEnemies() {
        // Spawn 2 initial enemies near the first hut (but outside it)
        const centerX = WORLD.width / 2;
        const centerY = WORLD.height / 2;

        // First hut is at upper-left: (centerX - 400, centerY - 400)
        const hutX = centerX - 400;
        const hutY = centerY - 400;

        // Spawn enemies at random positions around the hut (150-250 pixels away)
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 150 + Math.random() * 100; // 150-250 pixels from hut

            const enemyX = hutX + Math.cos(angle) * distance;
            const enemyY = hutY + Math.sin(angle) * distance;

            // Random enemy type
            const enemyTypes = ['goblin', 'lancer', 'skull'];
            const randomType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];

            const enemy = new Enemy(this, enemyX, enemyY, randomType);
            this.enemies.add(enemy);
        }

        console.log('🎯 Level 1: Spawned 2 initial enemies near first hut');
    }

    createRandomTrees() {
        const centerX = WORLD.width / 2;
        const centerY = WORLD.height / 2;

        // Get dynamic hut positions based on level
        const levelConfig = this.levelSystem.getCurrentLevelConfig();
        const allHutPositions = [
            { x: centerX - 400, y: centerY - 400 }, // Hut 1: Upper-left
            { x: centerX + 400, y: centerY - 400 }, // Hut 2: Upper-right
            { x: centerX - 400, y: centerY + 400 }, // Hut 3: Lower-left
            { x: centerX + 400, y: centerY + 400 }, // Hut 4: Lower-right
            { x: centerX, y: centerY - 500 }        // Hut 5: Directly above
        ];

        // Only use hut positions that exist in this level
        const hutPositions = allHutPositions.slice(0, levelConfig.hutCount);

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
            this.trees.add(tree); // staticGroup adds physics body automatically
            tree.setupPhysics(); // Configure collision box after physics body is added
            treesCreated++;
        }

        console.log(`🌳 Created ${treesCreated} random trees (${attempts} attempts)`);
    }

    createRandomBushes() {
        const centerX = WORLD.width / 2;
        const centerY = WORLD.height / 2;

        // Get dynamic hut positions based on level
        const levelConfig = this.levelSystem.getCurrentLevelConfig();
        const allHutPositions = [
            { x: centerX - 400, y: centerY - 400 }, // Hut 1: Upper-left
            { x: centerX + 400, y: centerY - 400 }, // Hut 2: Upper-right
            { x: centerX - 400, y: centerY + 400 }, // Hut 3: Lower-left
            { x: centerX + 400, y: centerY + 400 }, // Hut 4: Lower-right
            { x: centerX, y: centerY - 500 }        // Hut 5: Directly above
        ];

        // Only use hut positions that exist in this level
        const hutPositions = allHutPositions.slice(0, levelConfig.hutCount);

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
            this.rocks.add(rock); // staticGroup adds physics body automatically
            rock.setupPhysics(); // Configure collision box after physics body is added
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

        // Set player depth based on FEET position for proper layering with environment
        // Player sprite is 192x192 scaled to 0.75 = 144px, bottom = y + 72
        this.player.setDepth(this.player.y + 72);

        // Player properties
        this.player.health = 100;
        this.player.maxHealth = 100;
        this.player.speed = 200;
        this.player.damageMultiplier = 1.0; // Damage multiplier (affected by berserker mode)
        this.player.isShooting = false; // Track if playing shot animation
        this.player.ricochetEnabled = false; // Ricochet ability - arrows bounce once to another enemy
        this.player.isKnockedBack = false; // Track if player is being knocked back (disables movement control)

        // Player methods
        this.player.takeDamage = (amount) => {
            // Check if player is invulnerable (shield ability) - SAFEGUARD
            const currentTime = this.time.now;
            if (this.player.isInvulnerable && this.player.invulnerabilityEndTime > currentTime) {
                console.log('🛡️ Damage blocked by shield! (takeDamage safeguard)');
                return; // No damage taken
            }

            this.player.health -= amount;
            this.player.health = Math.max(0, this.player.health);

            // Track statistics
            this.levelSystem.addDamageTaken(amount);

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

            // Check if dead
            if (this.player.health <= 0) {
                this.gameState.playing = false;
                // Stop player movement immediately
                this.player.setVelocity(0, 0);
                this.showGameOver();
            }
        };

        // Player heal method
        this.player.heal = (amount) => {
            const oldHealth = this.player.health;
            this.player.health = Math.min(this.player.maxHealth, this.player.health + amount);
            const actualHeal = this.player.health - oldHealth;

            console.log(`💚 Player healed for ${actualHeal} HP (${oldHealth} → ${this.player.health})`);

            // Flash green to indicate healing
            this.player.setTint(0x00ff00);
            this.time.delayedCall(200, () => {
                this.player.clearTint();
            });

            return actualHeal; // Return actual amount healed
        };

        // Create player animations
        this.createPlayerAnimations();

        // Create death skull animation
        this.createDeathAnimations();

        // Create health bar (in MainScene for correct depth)
        this.createHealthBar();

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

    createHealthBar() {
        const width = 60;
        const height = 6;

        // Container for health bar
        this.healthBarContainer = this.add.container(0, 0);
        this.healthBarContainer.setScrollFactor(0); // Fixed to screen
        this.healthBarContainer.setDepth(1); // Low depth so modals appear above

        // Outer shadow (drop shadow effect)
        this.healthBarOuterShadow = this.add.rectangle(2, 2, width + 6, height + 6, 0x000000, 0.6)
            .setOrigin(0.5, 0.5);

        // Outer glow (epic glow effect)
        this.healthBarGlow = this.add.rectangle(0, 0, width + 8, height + 8, 0xFF0000, 0.4)
            .setOrigin(0.5, 0.5);

        // Main outer border (thick black border)
        this.healthBarOuterBorder = this.add.rectangle(0, 0, width + 4, height + 4, 0x1a1a1a, 1)
            .setOrigin(0.5, 0.5);

        // Secondary border (light border for contrast)
        this.healthBarSecondaryBorder = this.add.rectangle(0, 0, width + 2, height + 2, 0xCCCCCC, 1)
            .setOrigin(0.5, 0.5);

        // Background (dark with slight transparency)
        this.healthBarBg = this.add.rectangle(0, 0, width, height, 0x2a2a2a, 0.95)
            .setOrigin(0.5, 0.5);

        // Background gradient overlay (darker bottom)
        this.healthBarBgGradient = this.add.rectangle(0, 1, width, height / 2, 0x000000, 0.3)
            .setOrigin(0.5, 0.5);

        // Health fill (main health bar)
        this.healthBarFill = this.add.rectangle(-width/2, 0, width, height, 0x00ff00)
            .setOrigin(0, 0.5);

        // Health fill top highlight (bright shine on top)
        this.healthBarTopHighlight = this.add.rectangle(-width/2, -height/2 + 1, width, 2, 0xFFFFFF, 0.5)
            .setOrigin(0, 0.5);

        // Inner glow on health bar (makes it pop)
        this.healthBarInnerGlow = this.add.rectangle(-width/2, 0, width, height - 2, 0xFFFFFF, 0.2)
            .setOrigin(0, 0.5);

        // Add all elements to container in correct order
        this.healthBarContainer.add([
            this.healthBarOuterShadow,
            this.healthBarGlow,
            this.healthBarOuterBorder,
            this.healthBarSecondaryBorder,
            this.healthBarBg,
            this.healthBarBgGradient,
            this.healthBarFill,
            this.healthBarInnerGlow,
            this.healthBarTopHighlight
        ]);

        // Store original width for scaling
        this.healthBarMaxWidth = width;

        // Apply initial visibility state (in case it was set before creation)
        if (this.healthBarVisible === false) {
            this.healthBarContainer.setVisible(false);
            console.log('🏥 Health bar created in MainScene with depth 1 (hidden)');
        } else {
            this.healthBarVisible = true;
            console.log('🏥 Health bar created in MainScene with depth 1 (visible)');
        }
    }

    hideHealthBar() {
        this.healthBarVisible = false;
        if (this.healthBarContainer) {
            this.healthBarContainer.setVisible(false);
            console.log('❌ Health bar hidden (MainScene)');
        } else {
            console.log('⚠️ Health bar will be hidden when created (MainScene)');
        }
    }

    showHealthBar() {
        this.healthBarVisible = true;
        if (this.healthBarContainer) {
            this.healthBarContainer.setVisible(true);
            console.log('✅ Health bar shown (MainScene)');
        } else {
            console.log('⚠️ Health bar will be shown when created (MainScene)');
        }
    }

    interpolateColor(color1, color2, factor) {
        const r1 = (color1 >> 16) & 0xFF;
        const g1 = (color1 >> 8) & 0xFF;
        const b1 = color1 & 0xFF;

        const r2 = (color2 >> 16) & 0xFF;
        const g2 = (color2 >> 8) & 0xFF;
        const b2 = color2 & 0xFF;

        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);

        return (r << 16) | (g << 8) | b;
    }

    setupInput() {
        // Keyboard controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            Q: Phaser.Input.Keyboard.KeyCodes.Q, // Ability Slot 1
            E: Phaser.Input.Keyboard.KeyCodes.E, // Ability Slot 2
            R: Phaser.Input.Keyboard.KeyCodes.R, // Ability Slot 3
            T: Phaser.Input.Keyboard.KeyCodes.T, // Ability Slot 4
            F: Phaser.Input.Keyboard.KeyCodes.F, // Ability Slot 5
            P: Phaser.Input.Keyboard.KeyCodes.P, // DEBUG: Add gold
            O: Phaser.Input.Keyboard.KeyCodes.O, // DEBUG: Spawn enemies
            H: Phaser.Input.Keyboard.KeyCodes.H, // Axe mode
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

        // Get gold value from skull (already has combo bonus applied!) 🔥
        const goldAmount = skull.getData('goldValue') || Phaser.Math.Between(
            skull.getData('goldMin') || 1,
            skull.getData('goldMax') || 1
        );

        console.log(`💀 Skull collected! Gold: ${goldAmount} (with combo bonus already applied)`);

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

        // Store gold value in coin data
        goldCoin.setData('goldValue', goldAmount);

        // Play spawn animation
        goldCoin.play('gold-spawn-anim');

        // When spawn animation completes, switch to idle sprite
        goldCoin.once('animationcomplete', () => {
            goldCoin.setTexture('gold-idle');
            goldCoin.setData('canCollect', true); // Mark as ready for magnetic collection
        });

        // 💊 Dynamic potion drop rate (scales with level difficulty)
        // Base 8% for levels 1-5, decreases for higher levels
        const levelConfig = this.levelSystem.getCurrentLevelConfig();
        const potionDropRate = levelConfig?.potionDropRate || 0.08;

        if (Math.random() < potionDropRate) {
            console.log(`💊 Health potion spawned (${(potionDropRate * 100).toFixed(1)}% chance) at`, skullX, skullY);
            const potion = new HealthPotion(this, skullX, skullY);
            this.healthPotions.add(potion);
        }

        // Destroy skull after disappear animation completes
        skull.once('animationcomplete', () => {
            skull.destroy();
        });
    }

    collectGoldCoin(player, coin) {
        // Only collect if spawn animation is complete
        if (!coin.getData('canCollect')) return;

        // Get gold value from coin data (set when skull was collected)
        let goldValue = coin.getData('goldValue') || 1; // Default to 1 if not set

        // Stop any pulsing animation
        if (coin.getData('isPulsing')) {
            this.tweens.killTweensOf(coin);
        }

        // Apply level 1 gold bonus (20% extra)
        const isLevel1 = this.levelSystem.currentLevel === 1;
        if (isLevel1) {
            goldValue = Math.floor(goldValue * 1.2);
        }

        // 💰 Apply gold bonus upgrade
        if (this.player.goldBonus && this.player.goldBonus > 0) {
            goldValue = Math.floor(goldValue * (1 + this.player.goldBonus));
        }

        // 🍀 LUCK SYSTEM: Check for double gold proc!
        let finalGoldValue = goldValue;
        let luckProc = false;

        if (this.player.luckChance && this.player.luckChance > 0) {
            const roll = Math.random();
            if (roll < this.player.luckChance) {
                // LUCK PROC! Double the gold! 🍀💰
                finalGoldValue = goldValue * 2;
                luckProc = true;

                // Epic visual feedback for luck proc!
                const luckText = this.add.text(
                    this.player.x,
                    this.player.y - 80,
                    '🍀 LUCKY! 🍀',
                    {
                        fontSize: '28px',
                        fontFamily: 'Arial',
                        color: '#00FF00',
                        stroke: '#000000',
                        strokeThickness: 6,
                        fontStyle: 'bold'
                    }
                );
                luckText.setOrigin(0.5);
                luckText.setScrollFactor(1);
                luckText.setDepth(3000);

                // Animate luck text
                this.tweens.add({
                    targets: luckText,
                    y: luckText.y - 40,
                    alpha: 0,
                    duration: 1500,
                    ease: 'Cubic.easeOut',
                    onComplete: () => luckText.destroy()
                });

                // Small screen shake for extra juice!
                this.cameras.main.shake(150, 0.002);

                console.log(`🍀 LUCK PROC! Gold doubled: ${goldValue} → ${finalGoldValue} (${(this.player.luckChance * 100).toFixed(0)}% chance)`);
            }
        }

        // TRIGGER ALL THE DOPAMINIC EFFECTS! 🔥💰🎉
        // Pass the player object so text appears above player
        this.goldCollectionEffects.triggerCollectionEffects(this.player, finalGoldValue);

        // Give gold to player (variable amount based on enemy type + combo bonus!)
        this.gameState.resources.gold = (this.gameState.resources.gold || 0) + finalGoldValue;

        // Track statistics
        this.levelSystem.addGold(finalGoldValue);

        const bonusText = isLevel1 ? ' (+20% LV1 BONUS!)' : '';
        console.log(`💰 Gold collected: +${finalGoldValue} (Total: ${this.gameState.resources.gold})${bonusText}`);

        // Destroy coin
        coin.destroy();
    }

    collectHealthPotion(player, potion) {
        // Delegate to the HealthPotion's own collect method
        if (potion.isCollectible) {
            potion.collect(player);
        }
    }

    updateGoldMagnet() {
        // Use the enhanced magnetic pull with visual feedback from GoldCollectionEffects
        this.goldCollectionEffects.updateMagneticPull(this.goldCoins, this.player);
    }

    updatePotionMagnet() {
        // Magnetic pull for health potions - same system as gold
        if (!this.player || !this.healthPotions) return;

        let magnetRange = 150; // Base range
        const magnetStrength = 300; // Pull speed

        // 🧲 Apply pickup radius multiplier upgrade
        if (this.player.pickupRadiusMultiplier && this.player.pickupRadiusMultiplier > 1.0) {
            magnetRange = magnetRange * this.player.pickupRadiusMultiplier;
        }

        this.healthPotions.getChildren().forEach(potion => {
            // Only attract potions that have finished their spawn animation
            if (!potion.canCollect) return;

            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                potion.x, potion.y
            );

            // If close enough, collect immediately
            if (distance < 30) {
                potion.collect(this.player);
                return;
            }

            // If within magnetic range, pull towards player
            if (distance < magnetRange) {
                const angle = Phaser.Math.Angle.Between(
                    potion.x, potion.y,
                    this.player.x, this.player.y
                );

                const velocityX = Math.cos(angle) * magnetStrength;
                const velocityY = Math.sin(angle) * magnetStrength;

                potion.setVelocity(velocityX, velocityY);
            } else {
                // Stop movement if out of range
                potion.setVelocity(0, 0);
            }
        });
    }

    update(time, delta) {
        if (!this.gameState.playing) return;

        // Update player depth for dynamic layering with environment (Y-based sorting)
        // Use player's FEET position (bottom of sprite) for depth sorting
        // Player sprite is 192x192 scaled to 0.75 = 144px
        // Bottom position = center Y + half height = y + 72
        const playerBottomY = this.player.y + 72;
        this.player.setDepth(playerBottomY);

        // Handle ability input
        this.handleAbilityInput(time);

        // Handle debug input
        this.handleDebugInput();

        // Update player movement
        this.updatePlayerMovement();

        // Update modular systems
        this.enemySpawnSystem.update(time);
        this.autoFireSystem.update(time);
        this.abilitySystem.update(time, delta);
        this.collisionSystem.update(); // RAYCAST collision detection
        this.upgradeSystem.update(time); // Handle regeneration and other upgrade effects
        this.comboSystem.update(time); // 🔥 Check for streak timeout

        // CRITICAL: Manually update projectiles with correct delta time
        // runChildUpdate has a bug where it doesn't pass delta correctly on different refresh rates
        this.projectiles.getChildren().forEach(projectile => {
            if (projectile.active && projectile.preUpdate) {
                projectile.preUpdate(time, delta);
            }
        });

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

        // Update magnetic attraction for health potions
        this.updatePotionMagnet();

        // Update UI
        this.abilityBarUI.update();
        if (this.goldUI) {
            this.goldUI.update();
        }
        if (this.playerStatsUI) {
            this.playerStatsUI.update();
        }

        // PERFORMANCE: Periodic cleanup (every 2 seconds)
        if (!this.lastCleanupTime) this.lastCleanupTime = 0;
        if (time - this.lastCleanupTime > 2000) {
            this.performanceCleanup();
            this.lastCleanupTime = time;
        }

        // Check for victory condition
        this.checkVictoryCondition();

        // Update health bar position and appearance (only if visible)
        if (this.healthBarVisible && this.player && this.healthBarContainer) {
            const healthPercent = this.player.health / this.player.maxHealth;

            // Convert world coordinates to screen coordinates
            const camera = this.cameras.main;
            const screenX = this.player.x - camera.scrollX;
            const screenY = this.player.y - camera.scrollY - 42; // Higher above player's head

            // Position health bar above player's head in screen space
            this.healthBarContainer.x = screenX;
            this.healthBarContainer.y = screenY;

            // Smooth width transition with tween-like effect
            const targetWidth = this.healthBarMaxWidth * healthPercent;
            const currentWidth = this.healthBarFill.displayWidth;
            const lerpSpeed = 0.2;
            const newWidth = currentWidth + (targetWidth - currentWidth) * lerpSpeed;

            this.healthBarFill.displayWidth = newWidth;
            this.healthBarTopHighlight.displayWidth = newWidth;
            this.healthBarInnerGlow.displayWidth = newWidth;

            // Color gradient based on health percentage (vibrant gaming colors)
            let color, glowColor;
            if (healthPercent > 0.6) {
                // Bright green to lime green (100% to 60%)
                const t = (healthPercent - 0.6) / 0.4;
                color = this.interpolateColor(0x7FFF00, 0x00FF00, t);
                glowColor = 0x00FF00;
            } else if (healthPercent > 0.35) {
                // Yellow to orange (60% to 35%)
                const t = (healthPercent - 0.35) / 0.25;
                color = this.interpolateColor(0xFF8C00, 0xFFFF00, t);
                glowColor = 0xFFFF00;
            } else if (healthPercent > 0.15) {
                // Orange to red-orange (35% to 15%)
                const t = (healthPercent - 0.15) / 0.2;
                color = this.interpolateColor(0xFF4500, 0xFF8C00, t);
                glowColor = 0xFF4500;
            } else {
                // Red to dark red (15% to 0%)
                const t = healthPercent / 0.15;
                color = this.interpolateColor(0x8B0000, 0xFF0000, t);
                glowColor = 0xFF0000;
            }

            this.healthBarFill.setFillStyle(color, 1);
            this.healthBarGlow.setFillStyle(glowColor);

            // Dynamic pulsing effects
            if (healthPercent < 0.25 && healthPercent > 0) {
                // Intense pulse when critically low
                const pulse = Math.sin(this.time.now / 120) * 0.2 + 0.8;
                this.healthBarGlow.setAlpha(0.3 + (1 - pulse) * 0.4);
                this.healthBarGlow.setScale(1 + (1 - pulse) * 0.15);
            } else if (healthPercent < 0.5) {
                // Moderate pulse when low
                const pulse = Math.sin(this.time.now / 200) * 0.1 + 0.9;
                this.healthBarGlow.setAlpha(0.25 + (1 - pulse) * 0.15);
                this.healthBarGlow.setScale(1);
            } else {
                // Normal state
                this.healthBarGlow.setAlpha(0.2);
                this.healthBarGlow.setScale(1);
            }
        }
    }

    handleAbilityInput(time) {
        // Q Slot
        if (Phaser.Input.Keyboard.JustDown(this.keys.Q)) {
            this.activateAbilitySlot('Q', time);
        }
        if (Phaser.Input.Keyboard.JustUp(this.keys.Q)) {
            this.releaseAbilitySlot('Q', time);
        }

        // E Slot
        if (Phaser.Input.Keyboard.JustDown(this.keys.E)) {
            this.activateAbilitySlot('E', time);
        }
        if (Phaser.Input.Keyboard.JustUp(this.keys.E)) {
            this.releaseAbilitySlot('E', time);
        }

        // R Slot
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.activateAbilitySlot('R', time);
        }
        if (Phaser.Input.Keyboard.JustUp(this.keys.R)) {
            this.releaseAbilitySlot('R', time);
        }

        // T Slot
        if (Phaser.Input.Keyboard.JustDown(this.keys.T)) {
            this.activateAbilitySlot('T', time);
        }
        if (Phaser.Input.Keyboard.JustUp(this.keys.T)) {
            this.releaseAbilitySlot('T', time);
        }

        // F Slot
        if (Phaser.Input.Keyboard.JustDown(this.keys.F)) {
            this.activateAbilitySlot('F', time);
        }
        if (Phaser.Input.Keyboard.JustUp(this.keys.F)) {
            this.releaseAbilitySlot('F', time);
        }
    }

    /**
     * Activate ability in a slot
     */
    activateAbilitySlot(slotKey, time) {
        const abilityId = this.gameState.abilitySlots[slotKey];

        if (!abilityId) {
            console.log(`🔒 Slot ${slotKey} is empty!`);
            return;
        }

        // Call the ability using its ID
        if (this.abilitySystem[abilityId]) {
            this.abilitySystem[abilityId](time);
        } else if (abilityId === 'burst') {
            // Special handling for burst (hold to charge)
            this.abilitySystem.startChargingBurst(time);
        } else {
            console.warn(`⚠️ Ability ${abilityId} not found in AbilitySystem`);
        }
    }

    /**
     * Release ability in a slot (for hold abilities like burst)
     */
    releaseAbilitySlot(slotKey, time) {
        const abilityId = this.gameState.abilitySlots[slotKey];

        if (!abilityId) return;

        // Only burst needs release handling
        if (abilityId === 'burst') {
            this.abilitySystem.releaseBurst(time);
        }
    }

    handleDebugInput() {
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

        // DEBUG: Add gold (P)
        if (Phaser.Input.Keyboard.JustDown(this.keys.P)) {
            const goldAmount = 100;
            this.gameState.resources.gold = (this.gameState.resources.gold || 0) + goldAmount;

            // Trigger gold UI vibration effect
            if (this.goldUI) {
                this.goldUI.vibrate();
            }

            console.log(`💰 DEBUG: Added ${goldAmount} gold (Total: ${this.gameState.resources.gold})`);
        }

        // DEBUG: Spawn skulls only (O) - potions come from collecting skulls
        if (Phaser.Input.Keyboard.JustDown(this.keys.O)) {
            const spawnCount = 10; // Spawn 10 skulls
            for (let i = 0; i < spawnCount; i++) {
                // Spawn in a circle around the player
                const angle = (Math.PI * 2 / spawnCount) * i;
                const distance = 100 + Math.random() * 50; // 100-150 pixels away
                const x = this.player.x + Math.cos(angle) * distance;
                const y = this.player.y + Math.sin(angle) * distance;

                // Create collectible skull with gold
                const skull = this.physics.add.sprite(x, y, 'death-skull', 0);
                this.skulls.add(skull);
                skull.setScale(1.0);
                skull.setDepth(0);
                skull.body.setSize(80, 80);
                skull.body.setOffset(24, 24);
                skull.setData('goldValue', 10);
                skull.play('death-skull-bounce');
                skull.on('animationcomplete', () => {
                    skull.setFrame(6);
                    skull.setData('collectible', true);
                });
            }
            console.log(`💀 DEBUG: Spawned ${spawnCount} skulls around player`);
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
        // Don't control movement if game is over (player is dead)
        if (!this.gameState.playing) {
            this.player.setVelocity(0, 0); // Ensure player stays stopped
            return;
        }

        // Don't control movement if player is being knocked back
        if (this.player.isKnockedBack) {
            return; // Skip movement control, let knockback velocity play out
        }

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

    /**
     * PERFORMANCE: Cleanup resources to maintain FPS
     * Called every 2 seconds from update()
     */
    performanceCleanup() {
        let cleanupCount = 0;

        // 1. Clean up distant enemies (beyond cleanup distance)
        const enemies = this.enemies.getChildren();
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            if (!enemy || !enemy.active) continue;

            const dist = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                enemy.x, enemy.y
            );

            // Remove enemies very far from player (but not guards near huts)
            if (dist > this.enemyCleanupDistance && !enemy.isGuard) {
                enemy.destroy();
                cleanupCount++;
            }
        }

        // 2. Clean up inactive/stuck projectiles
        const projectiles = this.projectiles.getChildren();
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];
            if (!proj || !proj.active) {
                // Already inactive, remove from group
                this.projectiles.remove(proj, true, true);
                cleanupCount++;
            }
        }

        // 3. Log cleanup statistics (only if something was cleaned)
        if (cleanupCount > 0) {
            const totalEnemies = this.enemies.getChildren().filter(e => e.active).length;
            const totalProjectiles = this.projectiles.getChildren().filter(p => p.active).length;
            console.log(`🧹 Performance cleanup: Removed ${cleanupCount} objects | Enemies: ${totalEnemies}/${this.MAX_ENEMIES} | Projectiles: ${totalProjectiles}`);
        }
    }

    /**
     * Check if enemy spawn is allowed (respects MAX_ENEMIES limit)
     */
    canSpawnEnemy() {
        const aliveEnemies = this.enemies.getChildren()
            .filter(e => e.active && !e.isDying && e.health > 0);
        return aliveEnemies.length < this.MAX_ENEMIES;
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
            this.levelComplete();
        }
    }

    levelComplete() {
        // Prevent multiple calls
        if (this.victoryShown) return;
        this.victoryShown = true;

        // End level tracking
        this.levelSystem.endLevel();

        // 🎯 LEVEL COMPLETION GOLD BONUS!
        const levelBonuses = {
            1: 50,   // Level 1: +50 gold
            2: 75,   // Level 2: +75 gold
            3: 100,  // Level 3: +100 gold
            4: 150,  // Level 4: +150 gold
            5: 250   // Level 5: +250 gold (VICTORY!)
        };

        const currentLevel = this.levelSystem.currentLevel;
        const bonus = levelBonuses[currentLevel] || 0;

        if (bonus > 0) {
            // Give bonus gold
            this.gameState.resources.gold = (this.gameState.resources.gold || 0) + bonus;

            // Track statistics
            this.levelSystem.addGold(bonus);

            // Show epic gold collection effect for level completion!
            if (this.goldCollectionEffects) {
                this.goldCollectionEffects.triggerCollectionEffects(this.player, bonus);
            }

            console.log(`🎉 LEVEL ${currentLevel} COMPLETE! Bonus: +${bonus} gold (Total: ${this.gameState.resources.gold})`);
        }

        console.log('✅ Level Complete!');

        // Show elegant side panel with stats (no blocking!)
        this.levelCompletePanel.show();

        // Game continues! Player can still move and play
    }

    startNextLevel() {
        // Reset victory flag to allow next level completion check
        this.victoryShown = false;

        console.log(`🎮 Starting Level ${this.levelSystem.currentLevel}...`);

        // COPY player statistics BEFORE level transition
        const playerStats = {
            health: this.player.health,
            maxHealth: this.player.maxHealth,
            speed: this.player.speed,
            damageMultiplier: this.player.damageMultiplier,
            ricochetEnabled: this.player.ricochetEnabled
        };

        console.log('📊 Preserving player stats:', playerStats);

        // Start tracking new level statistics
        this.levelSystem.startLevel();

        // Generate new random shop abilities for this level
        this.generateShopAbilities();

        // Reset player position to center of world
        if (this.player) {
            this.player.setPosition(WORLD.width / 2, WORLD.height / 2);
            this.player.setVelocity(0, 0); // Stop any movement

            // RESTORE player statistics after repositioning
            this.player.health = playerStats.health;
            this.player.maxHealth = playerStats.maxHealth;
            this.player.speed = playerStats.speed;
            this.player.damageMultiplier = playerStats.damageMultiplier;
            this.player.ricochetEnabled = playerStats.ricochetEnabled;

            console.log('🏠 Player reset to center:', this.player.x, this.player.y);
            console.log('✅ Stats restored - HP:', this.player.health, 'MaxHP:', this.player.maxHealth, 'Speed:', this.player.speed);
        }

        // Clear all current enemies
        this.enemies.clear(true, true);

        // Clear all current goblin huts
        this.goblinHuts.clear(true, true);

        // Clear environmental objects
        this.trees.clear(true, true);
        this.bushes.clear(true, true);
        this.rocks.clear(true, true);

        // Recreate level with new configuration
        this.createGoblinHuts();
        this.createRandomTrees();
        this.createRandomBushes();
        this.createRandomRocks();

        // Reinitialize pathfinding with new obstacles
        if (this.pathfindingSystem) {
            this.pathfindingSystem.markObstacles();
        }

        console.log(`✅ Level ${this.levelSystem.currentLevel} loaded!`);
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
        overlay.setDepth(20000);

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
        victoryText.setDepth(20001);

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
        statsText.setDepth(20001);

        // Restart button background
        const buttonBg = this.add.rectangle(
            this.cameras.main.width / 2,
            450,
            220,
            60,
            0x00aa00
        );
        buttonBg.setScrollFactor(0);
        buttonBg.setDepth(20002);
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
        buttonText.setDepth(20003);

        // Button hover effect
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x00ff00);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x00aa00);
        });

        // Button click - restart game
        buttonBg.on('pointerdown', () => {
            // Show health bar before restarting
            this.showHealthBar();
            this.scene.restart();
        });
    }

    showGameOver() {
        // Prevent multiple game over screens
        if (this.gameOverShown) return;
        this.gameOverShown = true;

        console.log('💀 Game Over!');

        // Hide health bar so it doesn't appear above the restart button
        this.hideHealthBar();

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
        overlay.setDepth(20000); // MUY por encima de todo, incluyendo la barra de vida (10000)

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
        gameOverText.setDepth(20001);

        // Statistics text with level and damage
        const scoreText = this.add.text(
            this.cameras.main.width / 2,
            280,
            `Score: ${this.gameState.score}
Enemies Killed: ${this.gameState.enemiesKilled}
Level Reached: ${this.levelSystem.currentLevel}
Damage Dealt: ${Math.floor(this.levelSystem.stats.damageDealt)}`,
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#ffffff',
                align: 'center',
                lineSpacing: 4
            }
        );
        scoreText.setOrigin(0.5);
        scoreText.setScrollFactor(0);
        scoreText.setDepth(20001);

        // Restart button background
        const buttonBg = this.add.rectangle(
            this.cameras.main.width / 2,
            380,
            200,
            60,
            0x00aa00
        );
        buttonBg.setScrollFactor(0);
        buttonBg.setDepth(20002); // Por encima de todo
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
        buttonText.setDepth(20003); // Por encima de todo

        // Button hover effect
        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(0x00ff00);
        });

        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(0x00aa00);
        });

        // Button click - restart game
        buttonBg.on('pointerdown', () => {
            // Show health bar before restarting
            this.showHealthBar();
            // Reset to level 1 and restart
            this.levelSystem.resetToLevel1();
            this.scene.restart();
        });
    }

    /**
     * Generate random shop abilities for the current level
     * These abilities stay the same throughout the level to prevent shop reroll exploit
     */
    generateShopAbilities() {
        const { getRandomAbilities } = require('../config/AbilityPool.js');
        const ownedIds = this.gameState.ownedAbilities || [];
        this.gameState.availableAbilitiesThisLevel = getRandomAbilities(3, ownedIds);

        console.log(`🛒 Generated ${this.gameState.availableAbilitiesThisLevel.length} shop abilities for Level ${this.levelSystem.currentLevel}`);
    }
}
