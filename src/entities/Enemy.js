import Phaser from 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'goblin') {
        // Get the initial sprite key based on enemy type
        let initialSpriteKey = 'goblin-torch';
        if (type === 'lancer') initialSpriteKey = 'lancer-idle';
        if (type === 'skull') initialSpriteKey = 'skull-idle';
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
        this.isKnockedBack = false; // Track if enemy is being knocked back

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

    /**
     * Set this enemy as a HUNTER - rare enemy with extended detection range
     * Hunters can detect the player from very far away
     */
    setAsHunter(guardX, guardY) {
        this.isGuard = true;
        this.isActivated = false;
        this.guardPosition = { x: guardX, y: guardY };
        this.activationRange = 800; // MUCH longer range (vs normal 250px)

        // Enhanced stats for hunters
        this.speed *= 1.5; // 50% faster
        this.damage *= 1.5; // 50% more damage
        this.health *= 1.3333; // 33.33% more health (1/3 more)

        // Visual indicator - red tint to show this is a special enemy
        this.setTint(0xff6666);

        console.log(`🎯 HUNTER spawned! Range: ${this.activationRange}px, Speed: ${this.speed}, Damage: ${this.damage}`);
    }

    /**
     * Make this enemy aggressive and force it to chase the player
     * Used when hut is attacked or nearby enemy is attacked
     */
    setAggressive(playerX, playerY) {
        // If this is a guard, activate it immediately
        if (this.isGuard && !this.isActivated) {
            this.isActivated = true;
            console.log(`💢 ${this.enemyType} guard activated by aggression system!`);
        }

        // Force immediate path update to chase player
        if (this.scene && this.scene.time) {
            this.lastPathUpdate = 0; // Force path recalculation
        }
    }

    /**
     * Alert nearby enemies when this enemy is attacked
     * @param {number} alertRadius - Distance to alert enemies (default 120)
     */
    alertNearbyEnemies(alertRadius = 120) {
        if (!this.scene || !this.scene.enemies || !this.scene.player) return;

        let alertedCount = 0;
        this.scene.enemies.getChildren().forEach(enemy => {
            // Don't alert self
            if (enemy === this) return;

            // Only alert living, inactive guards
            if (enemy.isDying) return;

            // Check distance
            const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (distance <= alertRadius) {
                // Alert this nearby enemy
                if (enemy.setAggressive) {
                    enemy.setAggressive(this.scene.player.x, this.scene.player.y);
                    alertedCount++;
                }
            }
        });

        if (alertedCount > 0) {
            console.log(`⚠️ ${alertedCount} nearby enemies alerted!`);
        }
    }

    configureStats() {
        // Get current level for HP scaling (default to 5 if not available)
        const currentLevel = this.scene?.levelSystem?.currentLevel || 5;

        // HP scaling multipliers based on level (early game friendlier)
        let hpMultiplier = 1.0; // Level 5 = full HP (challenge)
        if (currentLevel <= 2) {
            hpMultiplier = 0.7; // Level 1-2: -30% HP (more accessible)
        } else if (currentLevel <= 4) {
            hpMultiplier = 0.85; // Level 3-4: -15% HP (balanced)
        }

        switch (this.enemyType) {
            case 'skull':
                this.health = Math.floor(132 * hpMultiplier); // Scales with level
                this.maxHealth = this.health;
                this.speed = 99; // Moderate speed
                this.damage = 33; // Devastating damage
                this.attackCooldown = 1364; // Faster attack rate
                this.goldMin = 12; // 💰 High gold reward (x3)
                this.goldMax = 20; // 💰 (was 4-7, now 12-20)
                break;
            case 'lancer':
                this.health = Math.floor(88 * hpMultiplier); // Scales with level
                this.maxHealth = this.health;
                this.speed = 110; // Faster than goblin
                this.damage = 17;
                this.attackCooldown = 1091; // ms
                this.goldMin = 6; // 💰 Medium gold reward (x3)
                this.goldMax = 12; // 💰 (was 2-4, now 6-12)
                break;
            case 'goblin':
            default:
                this.health = Math.floor(55 * hpMultiplier); // Scales with level
                this.maxHealth = this.health;
                this.speed = 88; // Slower than player
                this.damage = 11;
                this.attackCooldown = 909; // ms
                this.goldMin = 3; // 💰 Low gold reward (x3)
                this.goldMax = 6; // 💰 (was 1-2, now 3-6)
                break;
        }
        this.lastAttackTime = 0;

        // Log HP scaling for debugging
        if (currentLevel <= 4) {
            console.log(`🎯 Level ${currentLevel}: ${this.enemyType} HP scaled to ${this.health} (${Math.floor(hpMultiplier * 100)}%)`);
        }
    }

    configurePhysics() {
        switch (this.enemyType) {
            case 'skull':
                // Skull has 192x192 frames (same as goblin)
                this.setScale(0.75); // Scale down from 192 to ~144
                // Medium hitbox for skull
                this.body.setSize(38, 55); // Slightly larger than goblin
                this.body.setOffset(77, 88); // Center on the skull's body
                break;
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

        if (type === 'skull') {
            // Skull has separate spritesheets for each animation
            // Each spritesheet is a single row of frames (192x192 each)

            if (!this.scene.anims.exists(`${type}-idle-anim`)) {
                // Idle: 8 frames in skull-idle spritesheet
                this.scene.anims.create({
                    key: `${type}-idle-anim`,
                    frames: this.scene.anims.generateFrameNumbers('skull-idle', { start: 0, end: 7 }),
                    frameRate: 12,
                    repeat: -1
                });
            }

            if (!this.scene.anims.exists(`${type}-walk-anim`)) {
                // Run: 6 frames in skull-run spritesheet
                this.scene.anims.create({
                    key: `${type}-walk-anim`,
                    frames: this.scene.anims.generateFrameNumbers('skull-run', { start: 0, end: 5 }),
                    frameRate: 10,
                    repeat: -1
                });
            }

            if (!this.scene.anims.exists(`${type}-attack-anim`)) {
                // Attack: 7 frames in skull-attack spritesheet
                this.scene.anims.create({
                    key: `${type}-attack-anim`,
                    frames: this.scene.anims.generateFrameNumbers('skull-attack', { start: 0, end: 6 }),
                    frameRate: 12,
                    repeat: 0
                });
            }
        } else if (type === 'lancer') {
            // Lancer has separate spritesheets for each animation
            // Each spritesheet is a single row of frames (256x256 each)

            if (!this.scene.anims.exists(`${type}-idle-anim`)) {
                // Idle: 7 frames in lancer-idle spritesheet
                this.scene.anims.create({
                    key: `${type}-idle-anim`,
                    frames: this.scene.anims.generateFrameNumbers('lancer-idle', { start: 0, end: 6 }),
                    frameRate: 12,
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
                    frameRate: 12,
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

        // CRITICAL: Don't move or change animations while attacking or being knocked back
        if (this.isAttacking || this.isKnockedBack) return;

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

        // Alert nearby enemies when attacked
        this.alertNearbyEnemies(120);

        // 20% chance for critical hit - ¡MÁS DOPAMINA!
        const isCritical = Math.random() < 0.2;
        const displayDamage = isCritical ? amount * 2 : amount;

        // Apply knockback effect if we have a hit angle
        if (hitAngle !== null) {
            // Different knockback strength for normal vs critical hits
            const knockbackForce = isCritical ? 220 : 65; // Stronger knockback for crits
            const knockbackDuration = isCritical ? 170 : 80; // Longer knockback for crits

            // Calculate knockback velocity based on arrow direction
            const knockbackVelX = Math.cos(hitAngle) * knockbackForce;
            const knockbackVelY = Math.sin(hitAngle) * knockbackForce;

            // Mark enemy as being knocked back to prevent update() from overriding velocity
            this.isKnockedBack = true;

            // Apply immediate knockback velocity
            this.setVelocity(knockbackVelX, knockbackVelY);

            // Return to normal movement after brief knockback
            this.scene.time.delayedCall(knockbackDuration, () => {
                // Reset knockback flag and velocity
                this.isKnockedBack = false;

                // Only reset velocity if not dying
                if (!this.isDying && !this.isAttacking) {
                    this.setVelocity(0, 0);
                }
            });
        }

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

        // 🔥 COMBO SYSTEM: Calculate base gold and apply kill streak bonus!
        const baseGold = Phaser.Math.Between(this.goldMin, this.goldMax);
        let finalGold = baseGold;

        // Apply combo bonus if combo system exists
        if (this.scene.comboSystem) {
            finalGold = this.scene.comboSystem.onKill(baseGold);
        }

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

        // Store the FINAL gold value with combo bonus applied! 🔥
        skull.setData('goldValue', finalGold);
        // Keep min/max for backwards compatibility but they won't be used
        skull.setData('goldMin', this.goldMin);
        skull.setData('goldMax', this.goldMax);

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

            // Track level statistics
            if (this.scene.levelSystem) {
                this.scene.levelSystem.addEnemyKill();
            }

            // Random chance for bamboo seed
            if (Math.random() < 0.1) {
                this.scene.gameState.resources.bambooSeeds++;
            }
        }
    }
}
