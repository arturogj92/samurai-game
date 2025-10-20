import Phaser from 'phaser';

/**
 * Shaman - Ranged enemy that fires magic projectiles at the player
 *
 * Features:
 * - Ranged attack system with magic projectiles
 * - Maintains distance from player
 * - Explosion animation on death before spawning skull
 * - Can be spawned from GoblinHut with 30% chance
 */
export default class Shaman extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'shaman-idle', 0);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.enemyType = 'shaman';

        // Shaman stats - ranged enemy with moderate health and high damage (+10% difficulty)
        this.health = 99; // Between lancer (88) and skull (132) (+10%)
        this.maxHealth = 99;
        this.speed = 77; // Slower than other enemies (stays back) (+10%)
        this.damage = 22; // High damage (+10%)
        this.goldMin = 3; // Medium-high gold reward
        this.goldMax = 5;

        // Ranged attack properties
        this.baseAttackCooldown = 1818; // Base cooldown for difficulty scaling
        this.attackCooldown = this.baseAttackCooldown; // Faster attacks (-10%)
        this.lastAttackTime = 0;
        this.attackRange = 350; // Attack range (similar to GoblinHut)
        this.optimalRange = 250; // Preferred distance from player
        this.baseProjectileSpeed = 200; // Base speed for difficulty scaling
        this.projectileSpeed = this.baseProjectileSpeed; // Speed of magic projectiles

        // Setup physics
        this.setCollideWorldBounds(true);
        this.setScale(0.75); // Same as goblin/skull

        // Small hitbox for the shaman's body
        this.body.setSize(35, 50);
        this.body.setOffset(78, 90);

        // Set depth for layering
        this.setDepth(this.y);

        // State
        this.isDying = false;
        this.isAttacking = false;
        this.isKnockedBack = false;

        // Guard mode system (same as Enemy)
        this.isGuard = false;
        this.isActivated = false;
        this.activationRange = 250;
        this.guardPosition = null;

        // Pathfinding system (same as Enemy)
        this.currentPath = [];
        this.currentWaypointIndex = 0;
        this.pathUpdateInterval = 500;
        this.lastPathUpdate = 0;
        this.waypointReachedDistance = 16;

        // Create animations
        this.createAnimations();

        // Start with idle animation
        this.play('shaman-idle-anim');
    }

    /**
     * Set this shaman as a guard at a specific position
     */
    setAsGuard(guardX, guardY) {
        this.isGuard = true;
        this.isActivated = false;
        this.guardPosition = { x: guardX, y: guardY };
    }

    /**
     * Set this shaman as a HUNTER with extended detection range
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

        console.log(`🎯 SHAMAN HUNTER spawned! Range: ${this.activationRange}px, Speed: ${this.speed}, Damage: ${this.damage}`);
    }

    /**
     * Make this shaman aggressive and force it to chase the player
     * Used when hut is attacked or nearby enemy is attacked
     */
    setAggressive(playerX, playerY) {
        // If this is a guard, activate it immediately
        if (this.isGuard && !this.isActivated) {
            this.isActivated = true;
            console.log(`💢 Shaman guard activated by aggression system!`);
        }

        // Force immediate path update to chase player
        if (this.scene && this.scene.time) {
            this.lastPathUpdate = 0; // Force path recalculation
        }
    }

    /**
     * Alert nearby enemies when this shaman is attacked
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
            console.log(`⚠️ ${alertedCount} nearby enemies alerted by Shaman!`);
        }
    }

    createAnimations() {
        // Shaman Idle: 8 frames (192x192)
        if (!this.scene.anims.exists('shaman-idle-anim')) {
            this.scene.anims.create({
                key: 'shaman-idle-anim',
                frames: this.scene.anims.generateFrameNumbers('shaman-idle', { start: 0, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Shaman Run: 4 frames (192x192)
        if (!this.scene.anims.exists('shaman-walk-anim')) {
            this.scene.anims.create({
                key: 'shaman-walk-anim',
                frames: this.scene.anims.generateFrameNumbers('shaman-run', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Shaman Attack: 10 frames (192x192)
        if (!this.scene.anims.exists('shaman-attack-anim')) {
            this.scene.anims.create({
                key: 'shaman-attack-anim',
                frames: this.scene.anims.generateFrameNumbers('shaman-attack', { start: 0, end: 9 }),
                frameRate: 12,
                repeat: 0
            });
        }

        // Shaman Explosion: 9 frames (128x128) - for death animation
        if (!this.scene.anims.exists('shaman-explosion-anim')) {
            this.scene.anims.create({
                key: 'shaman-explosion-anim',
                frames: this.scene.anims.generateFrameNumbers('shaman-explosion', { start: 0, end: 8 }),
                frameRate: 15,
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
                console.log(`🛡️ Shaman guard activated at distance ${Math.floor(distance)}!`);
            } else {
                // Guard is inactive - just idle
                this.setVelocity(0, 0);
                if (this.anims.currentAnim?.key !== 'shaman-idle-anim') {
                    this.play('shaman-idle-anim');
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

            // Play walk animation
            if (this.anims.currentAnim?.key !== 'shaman-walk-anim') {
                this.play('shaman-walk-anim');
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

            // Play walk animation
            if (this.anims.currentAnim?.key !== 'shaman-walk-anim') {
                this.play('shaman-walk-anim');
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

        // Play walk animation
        if (this.anims.currentAnim?.key !== 'shaman-walk-anim') {
            this.play('shaman-walk-anim');
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
     * Fire magic projectile at player
     */
    attackPlayer(time, player) {
        if (time - this.lastAttackTime < this.attackCooldown) {
            // In cooldown - play idle if not attacking
            if (!this.isAttacking && this.anims.currentAnim?.key !== 'shaman-idle-anim') {
                this.play('shaman-idle-anim');
            }
            return;
        }

        this.lastAttackTime = time;
        this.isAttacking = true;

        // Freeze movement during attack
        this.setVelocity(0, 0);

        // Face player
        this.setFlipX(player.x < this.x);

        // Play attack animation
        this.play('shaman-attack-anim', true);

        // Fire projectile during animation (frame 5 of 10 frames)
        // At 12fps: (5 / 12) * 1000 = ~417ms
        // IMPORTANT: Re-acquire player position at fire time for accurate aiming
        this.scene.time.delayedCall(417, () => {
            if (!this.isDying && this.scene.player && this.scene.player.active) {
                this.fireProjectile(this.scene.player);
            }
        });

        // Reset attack flag when animation completes
        this.once('animationcomplete', (animation) => {
            if (animation.key === 'shaman-attack-anim') {
                this.isAttacking = false;
                this.play('shaman-idle-anim');
            }
        });
    }

    /**
     * Fire a magic projectile at the player with predictive aiming
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

            // Calculate predictive aim
            const aimPoint = this.scene.difficultySystem.calculatePredictiveAim(
                this.x,
                this.y,
                player,
                this.projectileSpeed
            );
            angle = aimPoint.angle;
        } else {
            // Fallback to direct aim
            angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        }

        // Create projectile at shaman position
        const projectile = new Projectile(
            this.scene,
            this.x,
            this.y,
            'shaman-projectile'
        );

        // Add to projectiles group
        this.scene.projectiles.add(projectile);

        // Configure projectile
        projectile.setFrame(0); // Start with first frame
        projectile.damage = this.damage;
        projectile.setScale(1.2); // Larger than arrows

        // Set velocity towards player
        const velocityX = Math.cos(angle) * this.projectileSpeed;
        const velocityY = Math.sin(angle) * this.projectileSpeed;
        projectile.setVelocity(velocityX, velocityY);
        projectile.rotation = angle;

        // Mark as enemy projectile (won't hit enemies)
        projectile.isEnemyProjectile = true;

        // Add purple/magic glow effect
        projectile.setTint(0xaa00ff);

        // Create projectile animation if it doesn't exist
        if (!this.scene.anims.exists('shaman-projectile-anim')) {
            this.scene.anims.create({
                key: 'shaman-projectile-anim',
                frames: this.scene.anims.generateFrameNumbers('shaman-projectile', { start: 0, end: 2 }),
                frameRate: 12,
                repeat: -1
            });
        }

        // Play projectile animation
        projectile.play('shaman-projectile-anim');

        console.log(`🔮 Shaman fired magic projectile at player (damage: ${this.damage})`);
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
            console.log(`💥 Shaman guard pulled by damage! Now attacking player.`);
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
     * Start death sequence - play explosion animation then spawn skull
     */
    startDeath(time) {
        if (this.isDying) return;

        this.isDying = true;
        this.isAttacking = false;
        this.setVelocity(0, 0);

        // Store position and scene reference BEFORE destroying
        const deathX = this.x;
        const deathY = this.y;
        const scene = this.scene; // Save reference because this.scene will be undefined after destroy

        // Create explosion sprite at shaman's position
        const explosion = scene.add.sprite(deathX, deathY, 'shaman-explosion', 0);
        explosion.setScale(1.5); // Make explosion bigger
        explosion.setDepth(100); // On top of everything

        // Play explosion animation
        explosion.play('shaman-explosion-anim');

        // When explosion completes, spawn skull
        explosion.once('animationcomplete', () => {
            // Create skull sprite (using saved scene reference)
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

            // Destroy explosion sprite
            explosion.destroy();
        });

        // Fade out the shaman sprite during explosion
        scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.destroy();
            }
        });

        // Update game state
        if (scene.gameState) {
            scene.gameState.enemiesKilled++;
            scene.gameState.score += 15; // Shamans worth more score
            scene.gameState.enemiesThisWave--;

            // Track level statistics
            if (scene.levelSystem) {
                scene.levelSystem.addEnemyKill();
            }

            // Higher chance for bamboo seed from shaman (15%)
            if (Math.random() < 0.15) {
                scene.gameState.resources.bambooSeeds++;
            }
        }

        console.log('💥 Shaman destroyed with explosion!');
    }
}
