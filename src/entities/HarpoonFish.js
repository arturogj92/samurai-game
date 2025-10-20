import Phaser from 'phaser';

/**
 * HarpoonFish - Top-tier ranged enemy that throws harpoons at the player
 *
 * Features:
 * - Strongest ranged enemy (higher HP and damage than Shaman/Gnoll)
 * - Ranged attack system with harpoon projectiles
 * - Maintains distance from player
 * - Normal death animation spawning skull
 */
export default class HarpoonFish extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'harpoonfish-idle', 0);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.enemyType = 'harpoonfish';

        // HarpoonFish stats - TOP TIER ranged enemy (+10% difficulty)
        this.health = 138; // Higher than Shaman (99) and Gnoll (94) (+10%)
        this.maxHealth = 138;
        this.speed = 72; // Slower due to being stronger (+10%)
        this.damage = 31; // Highest damage (+10%)
        this.goldMin = 5; // Highest gold reward
        this.goldMax = 8;

        // Ranged attack properties
        this.baseAttackCooldown = 2273; // Base cooldown for difficulty scaling
        this.attackCooldown = this.baseAttackCooldown; // Faster attacks (-10%)
        this.lastAttackTime = 0;
        this.attackRange = 380; // Longest attack range (Shaman: 350, Gnoll: 330)
        this.optimalRange = 280; // Preferred distance from player
        this.baseProjectileSpeed = 250; // Base speed for difficulty scaling
        this.projectileSpeed = this.baseProjectileSpeed; // Fastest projectiles (Shaman: 200, Gnoll: 220)

        // Setup physics
        this.setCollideWorldBounds(true);
        this.setScale(0.75); // Same as other enemies

        // Small hitbox for the harpoonfish's body
        this.body.setSize(35, 50);
        this.body.setOffset(78, 90);

        // Set depth for layering
        this.setDepth(this.y);

        // State
        this.isDying = false;
        this.isAttacking = false;
        this.isKnockedBack = false;

        // Guard mode system
        this.isGuard = false;
        this.isActivated = false;
        this.activationRange = 250;
        this.guardPosition = null;

        // Pathfinding system
        this.currentPath = [];
        this.currentWaypointIndex = 0;
        this.pathUpdateInterval = 500;
        this.lastPathUpdate = 0;
        this.waypointReachedDistance = 16;

        // Create animations
        this.createAnimations();

        // Start with idle animation
        this.play('harpoonfish-idle-anim');
    }

    /**
     * Set this harpoonfish as a guard at a specific position
     */
    setAsGuard(guardX, guardY) {
        this.isGuard = true;
        this.isActivated = false;
        this.guardPosition = { x: guardX, y: guardY };
    }

    /**
     * Set this harpoonfish as a HUNTER with extended detection range
     */
    setAsHunter(guardX, guardY) {
        this.isGuard = true;
        this.isActivated = false;
        this.guardPosition = { x: guardX, y: guardY };
        this.activationRange = 800;

        // Enhanced stats for hunters
        this.speed *= 1.5;
        this.damage *= 1.5;
        this.health *= 1.3333;

        // Visual indicator
        this.setTint(0xff6666);

        console.log(`🎯 HARPOONFISH HUNTER spawned! Range: ${this.activationRange}px, Speed: ${this.speed}, Damage: ${this.damage}`);
    }

    /**
     * Make this harpoonfish aggressive and force it to chase the player
     * Used when hut is attacked or nearby enemy is attacked
     */
    setAggressive(playerX, playerY) {
        // If this is a guard, activate it immediately
        if (this.isGuard && !this.isActivated) {
            this.isActivated = true;
            console.log(`💢 HarpoonFish guard activated by aggression system!`);
        }

        // Force immediate path update to chase player
        if (this.scene && this.scene.time) {
            this.lastPathUpdate = 0; // Force path recalculation
        }
    }

    /**
     * Alert nearby enemies when this harpoonfish is attacked
     * @param {number} alertRadius - Distance to alert enemies (default 120)
     */
    alertNearbyEnemies(alertRadius = 120) {
        if (!this.scene || !this.scene.enemies || !this.scene.player) return;

        let alertedCount = 0;
        this.scene.enemies.getChildren().forEach(enemy => {
            // Don't alert self
            if (enemy === this) return;

            // Only alert living enemies
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
            console.log(`⚠️ ${alertedCount} nearby enemies alerted by HarpoonFish!`);
        }
    }

    createAnimations() {
        // HarpoonFish Idle: 8 frames (192x192)
        if (!this.scene.anims.exists('harpoonfish-idle-anim')) {
            this.scene.anims.create({
                key: 'harpoonfish-idle-anim',
                frames: this.scene.anims.generateFrameNumbers('harpoonfish-idle', { start: 0, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // HarpoonFish Run: 6 frames (192x192)
        if (!this.scene.anims.exists('harpoonfish-run-anim')) {
            this.scene.anims.create({
                key: 'harpoonfish-run-anim',
                frames: this.scene.anims.generateFrameNumbers('harpoonfish-run', { start: 0, end: 5 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // HarpoonFish Throw/Attack: 8 frames (192x192)
        if (!this.scene.anims.exists('harpoonfish-throw-anim')) {
            this.scene.anims.create({
                key: 'harpoonfish-throw-anim',
                frames: this.scene.anims.generateFrameNumbers('harpoonfish-throw', { start: 0, end: 7 }),
                frameRate: 12,
                repeat: 0
            });
        }
    }

    update(time, delta) {
        if (this.isDying) return;

        // Update depth for dynamic layering
        this.setDepth(this.y);

        // Don't move or change animations while attacking or being knocked back
        if (this.isAttacking || this.isKnockedBack) return;

        // Check if dead
        if (this.health <= 0) {
            this.startDeath(time);
            return;
        }

        // Get player reference
        const player = this.scene.player;
        if (!player) return;

        const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Guard mode logic
        if (this.isGuard && !this.isActivated) {
            if (distance <= this.activationRange) {
                this.isActivated = true;
                console.log(`🛡️ HarpoonFish guard activated at distance ${Math.floor(distance)}!`);
            } else {
                // Guard is inactive - just idle
                this.setVelocity(0, 0);
                if (this.anims.currentAnim?.key !== 'harpoonfish-idle-anim') {
                    this.play('harpoonfish-idle-anim');
                }
                return;
            }
        }

        // Ranged combat behavior
        if (distance <= this.attackRange) {
            // In attack range - try to attack
            this.rangedBehavior(time, player, distance);
        } else {
            // Out of range - move closer
            this.approachPlayer(time, player);
        }
    }

    /**
     * Ranged behavior - maintain optimal distance and attack
     */
    rangedBehavior(time, player, distance) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);

        // If too close, back away
        if (distance < this.optimalRange * 0.7) {
            // Move away from player
            const velocityX = -Math.cos(angle) * this.speed;
            const velocityY = -Math.sin(angle) * this.speed;
            this.setVelocity(velocityX, velocityY);
            this.setFlipX(velocityX < 0);

            // Play run animation
            if (this.anims.currentAnim?.key !== 'harpoonfish-run-anim') {
                this.play('harpoonfish-run-anim');
            }
        }
        // If at good distance, stop and attack
        else if (distance >= this.optimalRange * 0.7 && distance <= this.optimalRange * 1.3) {
            this.setVelocity(0, 0);
            this.attackPlayer(time, player);
        }
        // If a bit too far but still in range, move closer slowly
        else {
            const velocityX = Math.cos(angle) * (this.speed * 0.5);
            const velocityY = Math.sin(angle) * (this.speed * 0.5);
            this.setVelocity(velocityX, velocityY);
            this.setFlipX(velocityX < 0);

            // Play run animation
            if (this.anims.currentAnim?.key !== 'harpoonfish-run-anim') {
                this.play('harpoonfish-run-anim');
            }
        }
    }

    /**
     * Approach player when out of attack range
     */
    approachPlayer(time, player) {
        // Update path periodically
        if (time - this.lastPathUpdate > this.pathUpdateInterval || this.currentPath.length === 0) {
            this.updatePath(player.x, player.y, time);
        }

        // Follow the path if we have one
        if (this.currentPath.length > 0) {
            this.followPath();
        } else {
            // Fallback: move directly towards player
            const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
            const velocityX = Math.cos(angle) * this.speed;
            const velocityY = Math.sin(angle) * this.speed;
            this.setVelocity(velocityX, velocityY);
            this.setFlipX(velocityX < 0);
        }

        // Play run animation
        if (this.anims.currentAnim?.key !== 'harpoonfish-run-anim') {
            this.play('harpoonfish-run-anim');
        }
    }

    /**
     * Update pathfinding route to target position
     */
    updatePath(targetX, targetY, time) {
        this.lastPathUpdate = time;

        if (this.scene.pathfindingSystem) {
            const newPath = this.scene.pathfindingSystem.findPath(this.x, this.y, targetX, targetY);

            if (newPath && newPath.length > 0) {
                this.currentPath = newPath;
                this.currentWaypointIndex = 0;
            } else {
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

        const waypoint = this.currentPath[this.currentWaypointIndex];
        if (!waypoint) return;

        const distToWaypoint = Phaser.Math.Distance.Between(this.x, this.y, waypoint.x, waypoint.y);

        if (distToWaypoint < this.waypointReachedDistance) {
            this.currentWaypointIndex++;

            if (this.currentWaypointIndex >= this.currentPath.length) {
                this.currentPath = [];
                this.currentWaypointIndex = 0;
                return;
            }
        }

        const currentWaypoint = this.currentPath[this.currentWaypointIndex];
        if (!currentWaypoint) return;

        const angle = Phaser.Math.Angle.Between(this.x, this.y, currentWaypoint.x, currentWaypoint.y);
        const velocityX = Math.cos(angle) * this.speed;
        const velocityY = Math.sin(angle) * this.speed;
        this.setVelocity(velocityX, velocityY);
        this.setFlipX(velocityX < 0);
    }

    /**
     * Throw harpoon projectile at player
     */
    attackPlayer(time, player) {
        if (time - this.lastAttackTime < this.attackCooldown) {
            // In cooldown - play idle if not attacking
            if (!this.isAttacking && this.anims.currentAnim?.key !== 'harpoonfish-idle-anim') {
                this.play('harpoonfish-idle-anim');
            }
            return;
        }

        this.lastAttackTime = time;
        this.isAttacking = true;

        // Freeze movement during attack
        this.setVelocity(0, 0);

        // Face player
        this.setFlipX(player.x < this.x);

        // Play throw animation
        this.play('harpoonfish-throw-anim', true);

        // Fire projectile during animation (frame 4 of 8 frames)
        // At 12fps: (4 / 12) * 1000 = ~333ms
        // IMPORTANT: Re-acquire player position at fire time for accurate aiming
        this.scene.time.delayedCall(333, () => {
            if (!this.isDying && this.scene.player && this.scene.player.active) {
                this.fireProjectile(this.scene.player);
            }
        });

        // Reset attack flag when animation completes
        this.once('animationcomplete', (animation) => {
            if (animation.key === 'harpoonfish-throw-anim') {
                this.isAttacking = false;
                this.play('harpoonfish-idle-anim');
            }
        });
    }

    /**
     * Fire a harpoon projectile at the player with predictive aiming
     */
    fireProjectile(player) {
        // Import Projectile class
        const Projectile = this.scene.projectiles.classType;

        // Use difficulty system for predictive aim and speed scaling (if available)
        let angle;
        if (this.scene.difficultySystem) {
            // Apply difficulty scaling
            const difficulty = this.scene.difficultySystem.getCurrentDifficulty();
            this.projectileSpeed = this.baseProjectileSpeed * difficulty.speedMultiplier;
            this.attackCooldown = this.baseAttackCooldown * difficulty.fireRateMultiplier;

            // Calculate predictive aim with HIGHER accuracy for top-tier enemy
            const aimPoint = this.scene.difficultySystem.calculatePredictiveAim(
                this.x,
                this.y,
                player,
                this.projectileSpeed,
                Math.min(difficulty.accuracy + 0.15, 0.95) // +15% accuracy, max 95%
            );
            angle = aimPoint.angle;
        } else {
            // Fallback to direct aim
            angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        }

        // Create projectile at harpoonfish position
        const projectile = new Projectile(
            this.scene,
            this.x,
            this.y,
            'harpoon'
        );

        // Add to projectiles group
        this.scene.projectiles.add(projectile);

        // Configure projectile (same as ballista)
        projectile.setFrame(0);
        projectile.damage = this.damage;
        projectile.setScale(1.3); // Larger than bones

        // Set velocity towards player (same as ballista)
        const velocityX = Math.cos(angle) * this.projectileSpeed;
        const velocityY = Math.sin(angle) * this.projectileSpeed;
        projectile.setVelocity(velocityX, velocityY);

        // Rotate to point in direction of movement (same as ballista)
        projectile.rotation = angle;

        // Mark as enemy projectile (won't hit enemies)
        projectile.isEnemyProjectile = true;

        // Add subtle metallic tint for harpoon effect (light gray-blue)
        projectile.setTint(0xccccdd);

        console.log(`🔱 HarpoonFish threw harpoon at player (damage: ${this.damage})`);
    }

    /**
     * Take damage with knockback effect
     */
    takeDamage(amount, hitAngle = null) {
        if (this.isDying) return;

        this.health -= amount;

        // Activate guard if hit
        if (this.isGuard && !this.isActivated) {
            this.isActivated = true;
            console.log(`💥 HarpoonFish guard pulled by damage! Now attacking player.`);
        }

        // Alert nearby enemies when attacked
        this.alertNearbyEnemies(120);

        // Critical hit system (20% chance)
        const isCritical = Math.random() < 0.2;
        const displayDamage = isCritical ? amount * 2 : amount;

        // Knockback effect
        if (hitAngle !== null) {
            const knockbackForce = isCritical ? 220 : 65;
            const knockbackDuration = isCritical ? 170 : 80;

            const knockbackVelX = Math.cos(hitAngle) * knockbackForce;
            const knockbackVelY = Math.sin(hitAngle) * knockbackForce;

            this.isKnockedBack = true;
            this.setVelocity(knockbackVelX, knockbackVelY);

            this.scene.time.delayedCall(knockbackDuration, () => {
                this.isKnockedBack = false;
                if (!this.isDying && !this.isAttacking) {
                    this.setVelocity(0, 0);
                }
            });
        }

        // Spawn damage number
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

    /**
     * Start death sequence - spawn skull directly (no explosion)
     */
    startDeath(time) {
        if (this.isDying) return;

        this.isDying = true;
        this.isAttacking = false;
        this.setVelocity(0, 0);

        // Store position and scene reference
        const deathX = this.x;
        const deathY = this.y;
        const scene = this.scene;

        // Fade out the harpoonfish sprite
        scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                // Spawn skull when fade completes
                const skull = scene.physics.add.sprite(deathX, deathY, 'death-skull', 0);
                scene.skulls.add(skull);

                skull.setScale(1.0);
                skull.setDepth(0);
                skull.body.setSize(80, 80);
                skull.body.setOffset(24, 24);

                // Store gold range from this enemy type
                skull.setData('goldMin', this.goldMin);
                skull.setData('goldMax', this.goldMax);

                // Play bouncing skull animation
                skull.play('death-skull-bounce');

                // When animation completes, make it collectible
                skull.once('animationcomplete', () => {
                    skull.setFrame(6);
                    skull.setData('collectible', true);
                });

                // Destroy harpoonfish sprite
                this.destroy();
            }
        });

        // Update game state
        if (scene.gameState) {
            scene.gameState.enemiesKilled++;
            scene.gameState.score += 18; // HarpoonFish worth highest score
            scene.gameState.enemiesThisWave--;

            // Track level statistics
            if (scene.levelSystem) {
                scene.levelSystem.addEnemyKill();
            }

            // 18% chance for bamboo seed from harpoonfish (highest)
            if (Math.random() < 0.18) {
                scene.gameState.resources.bambooSeeds++;
            }
        }

        console.log('🔱 HarpoonFish defeated!');
    }
}
