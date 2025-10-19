import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'goblin') {
        // Get the initial sprite key based on enemy type
        const initialSpriteKey = type === 'lancer' ? 'lancer-idle' : 'goblin-torch';
        super(scene, x, y, initialSpriteKey, 0);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.enemyType = type;

        // Configure stats based on enemy type
        this.configureStats();

        // Setup physics
        this.setCollideWorldBounds(true);

        // Configure scale and hitbox based on type
        this.configurePhysics();

        // Set enemy depth based on Y position for proper layering with environment
        this.setDepth(this.y);

        // Create animations for this enemy
        this.createAnimations();

        // Start with idle animation
        this.play(`${type}-idle-anim`);

        // State
        this.isDying = false;
        this.deathStartTime = 0;
        this.isAttacking = false; // Track if attack animation is playing

        // Guard mode system
        this.isGuard = false; // Whether this enemy is a guard
        this.isActivated = false; // Whether guard has been activated by player proximity
        this.activationRange = 250; // Distance at which guard activates (pixels)
        this.guardPosition = null; // Position to guard (hut location)

        // Pathfinding system
        this.currentPath = []; // Array of waypoints {x, y}
        this.currentWaypointIndex = 0; // Current waypoint we're moving to
        this.pathUpdateInterval = 500; // Recalculate path every 500ms
        this.lastPathUpdate = 0; // Timestamp of last path calculation
        this.waypointReachedDistance = 16; // Distance to consider waypoint reached (half of grid cell)

        // Debug: Create hitbox visualization (will be drawn in update)
        // DISABLED for now - causing errors
        // this.debugGraphics = scene.add.graphics();
    }

    /**
     * Set this enemy as a guard at a specific position
     */
    setAsGuard(guardX, guardY) {
        this.isGuard = true;
        this.isActivated = false;
        this.guardPosition = { x: guardX, y: guardY };
    }

    configureStats() {
        switch (this.enemyType) {
            case 'lancer':
                this.health = 80;
                this.maxHealth = 80;
                this.speed = 100; // Faster than goblin
                this.damage = 15;
                this.attackCooldown = 1200; // ms
                break;
            case 'goblin':
            default:
                this.health = 50;
                this.maxHealth = 50;
                this.speed = 80; // Slower than player
                this.damage = 10;
                this.attackCooldown = 1000; // ms
                break;
        }
        this.lastAttackTime = 0;
    }

    configurePhysics() {
        switch (this.enemyType) {
            case 'lancer':
                // Lancer has 256x256 frames
                this.setScale(0.6); // Scale down from 256 to ~154
                // Hitbox adjusted for 256x256 sprite
                this.body.setSize(40, 60); // Slightly larger hitbox for lancer
                this.body.setOffset(108, 120); // Center on the character's torso
                break;
            case 'goblin':
            default:
                // Goblin has 192x192 frames
                this.setScale(0.75); // Scale down from 192 to ~144
                // Very small hitbox - just the body/torso
                this.body.setSize(35, 50); // Very tight hitbox around character body
                this.body.setOffset(78, 90); // Center on the character's torso
                break;
        }
    }

    createAnimations() {
        const type = this.enemyType;

        if (type === 'lancer') {
            // Lancer has separate spritesheets for each animation
            // Each spritesheet is a single row of frames (256x256 each)

            if (!this.scene.anims.exists(`${type}-idle-anim`)) {
                // Idle: 7 frames in lancer-idle spritesheet
                this.scene.anims.create({
                    key: `${type}-idle-anim`,
                    frames: this.scene.anims.generateFrameNumbers('lancer-idle', { start: 0, end: 6 }),
                    frameRate: 8,
                    repeat: -1
                });
            }

            if (!this.scene.anims.exists(`${type}-walk-anim`)) {
                // Run: 6 frames in lancer-run spritesheet
                this.scene.anims.create({
                    key: `${type}-walk-anim`,
                    frames: this.scene.anims.generateFrameNumbers('lancer-run', { start: 0, end: 5 }),
                    frameRate: 10,
                    repeat: -1
                });
            }

            if (!this.scene.anims.exists(`${type}-attack-anim`)) {
                // Attack: 8 frames in lancer-attack spritesheet
                this.scene.anims.create({
                    key: `${type}-attack-anim`,
                    frames: this.scene.anims.generateFrameNumbers('lancer-attack', { start: 0, end: 7 }),
                    frameRate: 12,
                    repeat: 0
                });
            }
        } else {
            // Goblin Torch spritesheet animations
            // Spritesheet is 7 columns x 5 rows, 192x192 frames
            // Row 0 (0-6): Idle
            // Row 1 (7-13): Walk
            // Row 2 (14-20): Attack

            // Only create animations if they don't exist yet
            if (!this.scene.anims.exists(`${type}-idle-anim`)) {
                // Idle (Row 0)
                this.scene.anims.create({
                    key: `${type}-idle-anim`,
                    frames: this.scene.anims.generateFrameNumbers('goblin-torch', { start: 0, end: 6 }),
                    frameRate: 6,
                    repeat: -1
                });
            }

            if (!this.scene.anims.exists(`${type}-walk-anim`)) {
                // Walk (Row 1) - only 6 frames (7-12), frame 13 is empty
                this.scene.anims.create({
                    key: `${type}-walk-anim`,
                    frames: this.scene.anims.generateFrameNumbers('goblin-torch', { start: 7, end: 12 }),
                    frameRate: 10,
                    repeat: -1
                });
            }

            if (!this.scene.anims.exists(`${type}-attack-anim`)) {
                // Attack (Row 2) - Row 2 appears to have frames with attack effects, use all
                this.scene.anims.create({
                    key: `${type}-attack-anim`,
                    frames: this.scene.anims.generateFrameNumbers('goblin-torch', { start: 14, end: 19 }),
                    frameRate: 12,
                    repeat: 0
                });
            }
        }
    }

    update(time, delta) {
        // Update debug graphics position to match hitbox
        // DISABLED for now - causing errors
        /*
        if (this.debugGraphics && this.body) {
            this.debugGraphics.clear();
            this.debugGraphics.lineStyle(2, 0x00ff00, 1); // Green line, 2px thick
            this.debugGraphics.strokeRect(
                this.body.x,
                this.body.y,
                this.body.width,
                this.body.height
            );
        }
        */

        if (this.isDying) return;

        // Update depth for dynamic layering with environment (Y-based sorting)
        this.setDepth(this.y);

        // CRITICAL: Don't move or change animations while attacking
        if (this.isAttacking) return;

        // Check if enemy is dead
        if (this.health <= 0) {
            this.startDeath(time);
            return;
        }

        // Move towards player
        const player = this.scene.player;
        if (!player) return;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Guard mode logic: Check if guard should activate
        if (this.isGuard && !this.isActivated) {
            // Check if player is within activation range
            if (distance <= this.activationRange) {
                // Activate the guard!
                this.isActivated = true;
                console.log(`🛡️ Guard ${this.enemyType} activated at distance ${Math.floor(distance)}!`);
            } else {
                // Guard is inactive - just idle
                this.setVelocity(0, 0);
                if (this.anims.currentAnim?.key !== `${this.enemyType}-idle-anim`) {
                    this.play(`${this.enemyType}-idle-anim`);
                }
                return;
            }
        }

        // If close enough, attack. Otherwise, move towards player using pathfinding
        if (distance < 50) {
            this.setVelocity(0, 0);
            this.attackPlayer(time);
        } else {
            // Update path periodically or if we don't have one
            if (time - this.lastPathUpdate > this.pathUpdateInterval || this.currentPath.length === 0) {
                this.updatePath(player.x, player.y, time);
            }

            // Follow the path if we have one
            if (this.currentPath.length > 0) {
                this.followPath();
            } else {
                // Fallback: move directly towards player if no path found
                const velocityX = Math.cos(angle) * this.speed;
                const velocityY = Math.sin(angle) * this.speed;
                this.setVelocity(velocityX, velocityY);

                // Flip sprite based on direction
                this.setFlipX(velocityX < 0);
            }

            // Play walk animation (only change if different)
            if (this.anims.currentAnim?.key !== `${this.enemyType}-walk-anim`) {
                this.play(`${this.enemyType}-walk-anim`);
            }
        }
    }

    /**
     * Update pathfinding route to target position
     */
    updatePath(targetX, targetY, time) {
        this.lastPathUpdate = time;

        // Only calculate path if pathfinding system exists
        if (this.scene.pathfindingSystem) {
            const newPath = this.scene.pathfindingSystem.findPath(this.x, this.y, targetX, targetY);

            if (newPath && newPath.length > 0) {
                this.currentPath = newPath;
                this.currentWaypointIndex = 0;
            } else {
                // No path found - clear current path to use fallback movement
                this.currentPath = [];
                this.currentWaypointIndex = 0;
            }
        }
    }

    /**
     * Follow the current pathfinding route
     */
    followPath() {
        if (this.currentPath.length === 0) return;

        // Get current waypoint
        const waypoint = this.currentPath[this.currentWaypointIndex];
        if (!waypoint) return;

        // Calculate distance to current waypoint
        const distToWaypoint = Phaser.Math.Distance.Between(this.x, this.y, waypoint.x, waypoint.y);

        // If reached waypoint, move to next one
        if (distToWaypoint < this.waypointReachedDistance) {
            this.currentWaypointIndex++;

            // If reached end of path, clear it (will recalculate on next update)
            if (this.currentWaypointIndex >= this.currentPath.length) {
                this.currentPath = [];
                this.currentWaypointIndex = 0;
                return;
            }

            // Get next waypoint
            const nextWaypoint = this.currentPath[this.currentWaypointIndex];
            if (!nextWaypoint) return;

            // Update waypoint reference
            waypoint.x = nextWaypoint.x;
            waypoint.y = nextWaypoint.y;
        }

        // Move towards current waypoint
        const angle = Phaser.Math.Angle.Between(this.x, this.y, waypoint.x, waypoint.y);
        const velocityX = Math.cos(angle) * this.speed;
        const velocityY = Math.sin(angle) * this.speed;
        this.setVelocity(velocityX, velocityY);

        // Flip sprite based on direction
        this.setFlipX(velocityX < 0);
    }

    attackPlayer(time) {
        if (time - this.lastAttackTime < this.attackCooldown) {
            // In cooldown - play idle animation ONLY if not currently attacking
            if (!this.isAttacking && this.anims.currentAnim?.key !== `${this.enemyType}-idle-anim`) {
                this.play(`${this.enemyType}-idle-anim`);
            }
            return;
        }

        this.lastAttackTime = time;
        this.isAttacking = true;

        // FREEZE movement completely during attack
        this.setVelocity(0, 0);

        // Play attack animation with onComplete callback to reset flag
        this.play(`${this.enemyType}-attack-anim`, true);

        // Listen for animation complete event
        this.once('animationcomplete', (animation) => {
            if (animation.key === `${this.enemyType}-attack-anim`) {
                this.isAttacking = false;
                // Return to idle after attack completes
                this.play(`${this.enemyType}-idle-anim`);
            }
        });

        // Deal damage to player DELAYED to match the hit frame in animation
        // Attack animation: 6 frames at 12fps
        // Hit occurs around frame 3: (3 / 12) * 1000 = 250ms
        this.scene.time.delayedCall(250, () => {
            // Check player still exists and is in range
            if (this.scene.player && !this.scene.player.isInvulnerable && !this.isDying) {
                const distance = Phaser.Math.Distance.Between(
                    this.x, this.y,
                    this.scene.player.x, this.scene.player.y
                );
                // Only deal damage if still close enough (player didn't run away)
                if (distance < 60) {
                    this.scene.player.takeDamage(this.damage);
                }
            }
        });
    }

    takeDamage(amount, hitAngle = null) {
        if (this.isDying) return;

        this.health -= amount;

        // If this is a guard and not yet activated, activate it when taking damage ("pull" mechanic)
        if (this.isGuard && !this.isActivated) {
            this.isActivated = true;
            console.log(`💥 Guard ${this.enemyType} pulled by damage! Now chasing player.`);
        }

        // 20% chance for critical hit - ¡MÁS DOPAMINA!
        const isCritical = Math.random() < 0.2;
        const displayDamage = isCritical ? amount * 2 : amount;

        // Spawn floating damage number
        if (this.scene.damageNumberSystem) {
            this.scene.damageNumberSystem.spawnDamageNumber(
                this.x,
                this.y,
                Math.floor(displayDamage),
                isCritical
            );
        }

        // Spawn blood particles
        if (this.scene.bloodParticleSystem) {
            this.scene.bloodParticleSystem.spawnBloodParticles(
                this.x,
                this.y,
                amount,
                hitAngle
            );
        }

        // Flash red when hit
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => {
            this.clearTint();
        });

        if (this.health <= 0) {
            this.startDeath(this.scene.time.now);
        }
    }

    startDeath(time) {
        if (this.isDying) return;

        this.isDying = true;
        this.deathStartTime = time;
        this.isAttacking = false; // Clear attack state
        this.setVelocity(0, 0);

        // Store position for skull
        const deathX = this.x;
        const deathY = this.y;

        // Create skull sprite with physics and add to skulls group
        const skull = this.scene.physics.add.sprite(deathX, deathY, 'death-skull', 0);
        this.scene.skulls.add(skull);

        skull.setScale(1.0); // Keep original size (128px)
        skull.setDepth(0); // Ground level
        skull.body.setSize(80, 80); // Smaller hitbox for easier collection
        skull.body.setOffset(24, 24); // Center the hitbox

        // Play the bouncing skull animation
        skull.play('death-skull-bounce');

        // When animation completes, make it collectible
        skull.on('animationcomplete', () => {
            // Set to last frame of animation (frame 6 - settled skull)
            skull.setFrame(6);
            // Mark as collectible
            skull.setData('collectible', true);
        });

        // Fade out the enemy sprite while skull animation plays
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 400,
            onComplete: () => {
                // Destroy the enemy sprite completely
                this.destroy();
            }
        });

        // Update game state
        if (this.scene.gameState) {
            this.scene.gameState.enemiesKilled++;
            this.scene.gameState.score += 10;
            this.scene.gameState.enemiesThisWave--;

            // Random chance for bamboo seed
            if (Math.random() < 0.1) {
                this.scene.gameState.resources.bambooSeeds++;
            }
        }
    }
}
