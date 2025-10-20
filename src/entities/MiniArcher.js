import Phaser from 'phaser';
import Projectile from './Projectile';

/**
 * MiniArcher - Summoned ally that follows player and shoots enemies
 */
export default class MiniArcher extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, offsetX = 0, offsetY = 0) {
        super(scene, x, y, 'player-archer');

        // Add to scene
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configure sprite
        this.setScale(0.5); // Half size
        this.setDepth(50); // Above ground, below UI

        // Follow behavior
        this.followOffsetX = offsetX;
        this.followOffsetY = offsetY;

        // Combat properties
        this.lastFireTime = 0;
        this.fireRate = 800; // Slower than player (800ms vs 500ms)
        this.range = 250; // Shorter range than player
        this.damage = 2.4; // 20% damage compared to player base (12)
        this.isShooting = false; // Track if playing shot animation (prevents movement anim interruption)

        // Burst ability (synchronized with player)
        this.isChargingBurst = false;
        this.burstChargeGraphic = null;
        this.burstChargeLevel = 0;

        // Lifetime
        this.lifetime = 4000; // 4 seconds
        this.spawnTime = scene.time.now;

        // Track active timers for cleanup
        this.activeTimers = [];

        // Play idle animation
        if (!scene.anims.exists('player-idle')) {
            scene.anims.create({
                key: 'player-idle',
                frames: scene.anims.generateFrameNumbers('player-archer', { start: 0, end: 5 }),
                frameRate: 12,
                repeat: -1
            });
        }
        this.play('player-idle');

        // Fade in effect
        this.setAlpha(0);
        scene.tweens.add({
            targets: this,
            alpha: 0.8, // Slightly transparent to differentiate from player
            duration: 300,
            ease: 'Power2'
        });
    }

    update() {
        const currentTime = this.scene.time.now;

        // Check lifetime
        const age = currentTime - this.spawnTime;
        if (age >= this.lifetime) {
            this.despawn();
            return;
        }

        // Fade out in last second
        if (age >= this.lifetime - 1000) {
            const fadeProgress = (age - (this.lifetime - 1000)) / 1000;
            this.setAlpha(0.8 * (1 - fadeProgress));
        }

        // Follow player
        this.followPlayer();

        // Auto-fire at enemies
        this.autoFire(currentTime);

        // Update burst charging effect if charging
        if (this.isChargingBurst) {
            this.updateBurstChargeVisual();
        }
    }

    followPlayer() {
        if (!this.scene.player) return;

        const player = this.scene.player;
        const targetX = player.x + this.followOffsetX;
        const targetY = player.y + this.followOffsetY;

        // Store old position to calculate movement
        const oldX = this.x;
        const oldY = this.y;

        // Smooth follow using lerp
        const followSpeed = 0.1;
        this.x = Phaser.Math.Linear(this.x, targetX, followSpeed);
        this.y = Phaser.Math.Linear(this.y, targetY, followSpeed);

        // Calculate actual movement distance
        const dx = this.x - oldX;
        const dy = this.y - oldY;
        const distanceMoved = Math.sqrt(dx * dx + dy * dy);

        // Update animation based on movement - don't interrupt shot animation
        if (!this.isShooting) {
            const isMoving = distanceMoved > 0.5; // Threshold to detect movement

            if (isMoving) {
                // Walking - play walk animation
                if (!this.scene.anims.exists('player-walk')) {
                    this.scene.anims.create({
                        key: 'player-walk',
                        frames: this.scene.anims.generateFrameNumbers('player-archer', { start: 8, end: 13 }),
                        frameRate: 10,
                        repeat: -1
                    });
                }
                if (this.anims.currentAnim?.key !== 'player-walk') {
                    this.play('player-walk');
                }

                // Face movement direction
                if (Math.abs(dx) > 0.1) {
                    this.setFlipX(dx < 0);
                }
            } else {
                // Idle - play idle animation
                if (this.anims.currentAnim?.key !== 'player-idle') {
                    this.play('player-idle');
                }
            }
        }
    }

    autoFire(currentTime) {
        // Apply berserker mode fire rate multiplier if active
        const fireRateMultiplier = this.scene.player?.fireRateMultiplier || 1.0;
        const effectiveFireRate = this.fireRate / fireRateMultiplier;

        // Check cooldown
        if (currentTime - this.lastFireTime < effectiveFireRate) return;

        // Find nearest target (enemy or hut)
        const target = this.findNearestTarget();
        if (!target) return;

        // Check range
        const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
        if (distance > this.range) return;

        // Fire!
        this.fireProjectile(target);
        this.lastFireTime = currentTime;
    }

    /**
     * Find nearest target - prioritizes enemies first, then goblin huts
     * Only returns targets that are WITHIN RANGE
     */
    findNearestTarget() {
        // First, try to find enemies WITHIN RANGE (priority)
        const enemy = this.findNearestEnemy();
        if (enemy) {
            const distToEnemy = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);

            // If enemy is within range, target it
            if (distToEnemy <= this.range) {
                return enemy;
            }

            // Enemy exists but is too far - look for huts instead
        }

        // No enemies in range, target nearest goblin hut
        const hut = this.findNearestHut();
        return hut;
    }

    findNearestEnemy() {
        if (!this.scene.enemies) return null;

        const enemies = this.scene.enemies.getChildren()
            .filter(e => e.active && !e.isDying && e.health > 0);

        if (enemies.length === 0) return null;

        let nearest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }

        return nearest;
    }

    findNearestHut() {
        if (!this.scene.goblinHuts) return null;

        const huts = this.scene.goblinHuts.getChildren()
            .filter(h => h.active && !h.isDestroyed);

        if (huts.length === 0) return null;

        let nearest = null;
        let minDist = Infinity;

        for (const hut of huts) {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, hut.x, hut.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = hut;
            }
        }

        return nearest;
    }

    fireProjectile(target) {
        // Calculate angle to target
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);

        // Create projectile
        const projectile = new Projectile(this.scene, this.x, this.y, 'arrow');
        this.scene.projectiles.add(projectile);

        // Apply berserker mode damage multiplier if active
        const damageMultiplier = this.scene.player?.damageMultiplier || 1.0;

        // Configure projectile
        projectile.setFrame(0);
        projectile.damage = this.damage * damageMultiplier;
        projectile.setScale(0.7); // Smaller arrows for mini archers

        // Enable ricochet if player has the ability
        if (this.scene.player?.ricochetEnabled) {
            projectile.ricochetEnabled = true;
        }

        // Set velocity
        const speed = 300;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        projectile.setVelocity(velocityX, velocityY);
        projectile.rotation = angle;

        // Visual effect (slightly less bright)
        projectile.setAlpha(0.7);

        // Play shoot animation
        this.playShootAnimation(angle);
    }

    playShootAnimation(angle) {
        // Mark as shooting to prevent movement animation interruption
        this.isShooting = true;

        // Get directional frames using same 8-way system as player
        const { frameStart, frameEnd, animKey, flipX } = this.getDirectionalFrames(angle);

        // Create animation if it doesn't exist (reusing player animations)
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.scene.anims.generateFrameNumbers('player-archer', {
                    start: frameStart,
                    end: frameEnd
                }),
                frameRate: 20,
                repeat: 0
            });
        }

        this.setFlipX(flipX);
        this.play(animKey, true);

        // Return to idle after animation
        this.once(`animationcomplete-${animKey}`, () => {
            this.isShooting = false; // Animation finished, allow movement animations again
            if (this.active) {
                this.play('player-idle');
            }
        });
    }

    /**
     * Get frame range and flip state based on shooting angle (8-way directional system)
     * Same system used by player in AutoFireSystem
     * Archer_Blue.png (8 frames per row, 192x192):
     * Row 0 (0-7): Idle
     * Row 1 (8-15): Walk
     * Row 2 (16-23): Shoot UP
     * Row 3 (24-31): Diagonal Up-Right
     * Row 4 (32-39): Shoot RIGHT
     * Row 5 (40-47): Diagonal Down-Right
     * Row 6 (48-55): Shoot DOWN
     */
    getDirectionalFrames(angle) {
        // Convert angle from radians to degrees
        const degrees = angle * 180 / Math.PI;

        // Normalize to 0-360
        const normalizedDegrees = ((degrees % 360) + 360) % 360;

        // Determine direction (8-way)
        let frameStart, frameEnd, animKey, flipX = false;

        if (normalizedDegrees >= 337.5 || normalizedDegrees < 22.5) {
            // RIGHT (0°)
            frameStart = 32; frameEnd = 39;
            animKey = 'player-shot-right';
            flipX = false;
        } else if (normalizedDegrees >= 22.5 && normalizedDegrees < 67.5) {
            // DOWN-RIGHT (45°)
            frameStart = 40; frameEnd = 47;
            animKey = 'player-shot-down-right';
            flipX = false;
        } else if (normalizedDegrees >= 67.5 && normalizedDegrees < 112.5) {
            // DOWN (90°)
            frameStart = 48; frameEnd = 55;
            animKey = 'player-shot-down';
            flipX = false;
        } else if (normalizedDegrees >= 112.5 && normalizedDegrees < 157.5) {
            // DOWN-LEFT (135°)
            frameStart = 40; frameEnd = 47;
            animKey = 'player-shot-down-left';
            flipX = true; // Flip the down-right animation
        } else if (normalizedDegrees >= 157.5 && normalizedDegrees < 202.5) {
            // LEFT (180°)
            frameStart = 32; frameEnd = 39;
            animKey = 'player-shot-left';
            flipX = true; // Flip the right animation
        } else if (normalizedDegrees >= 202.5 && normalizedDegrees < 247.5) {
            // UP-LEFT (225°)
            frameStart = 24; frameEnd = 31;
            animKey = 'player-shot-up-left';
            flipX = true; // Flip the up-right animation
        } else if (normalizedDegrees >= 247.5 && normalizedDegrees < 292.5) {
            // UP (270°)
            frameStart = 16; frameEnd = 23;
            animKey = 'player-shot-up';
            flipX = false;
        } else {
            // UP-RIGHT (315°)
            frameStart = 24; frameEnd = 31;
            animKey = 'player-shot-up-right';
            flipX = false;
        }

        return { frameStart, frameEnd, animKey, flipX };
    }

    /**
     * Start charging burst (called when player starts charging)
     */
    startChargingBurst() {
        this.isChargingBurst = true;
        this.burstChargeLevel = 0;

        // Visual effect - yellow tint
        this.setTint(0xffff00);
    }

    /**
     * Update burst charge visual effect
     */
    updateBurstChargeVisual() {
        // Destroy previous graphic
        if (this.burstChargeGraphic) {
            this.burstChargeGraphic.destroy();
        }

        // Create charging circle that pulses
        this.burstChargeGraphic = this.scene.add.graphics();

        const radius = 15 + (this.burstChargeLevel * 10);
        const alpha = 0.3 + (this.burstChargeLevel * 0.3);

        // Outer glow ring
        this.burstChargeGraphic.lineStyle(4, 0xffff00, alpha * 0.5);
        this.burstChargeGraphic.strokeCircle(this.x, this.y, radius);

        // Inner bright ring
        this.burstChargeGraphic.lineStyle(2, 0xffffff, alpha);
        this.burstChargeGraphic.strokeCircle(this.x, this.y, radius * 0.6);
    }

    /**
     * Release burst attack - shoots arrows in all directions
     * @param {number} chargeLevel - Charge level from 0-1
     */
    releaseBurst(chargeLevel) {
        // Stop charging
        this.isChargingBurst = false;
        this.burstChargeLevel = 0;

        // Destroy charge visual
        if (this.burstChargeGraphic) {
            this.burstChargeGraphic.destroy();
            this.burstChargeGraphic = null;
        }

        // Clear tint (restore berserker tint if active)
        if (this.scene.abilitySystem?.berserkerActive) {
            this.setTint(0xff0000);
        } else {
            this.clearTint();
        }

        const projectileCount = 8; // Fewer than player's 12
        const speed = 300; // Same as regular arrows
        const angleStep = (Math.PI * 2) / projectileCount;

        // Scale based on charge level (like player): 0.5 to 1.0
        const arrowScale = 0.5 + (chargeLevel * 0.5);
        // Damage based on charge: 1.8 to 6 (20% of player's 9-30)
        const baseDamage = 1.8 + (chargeLevel * 4.2);

        // Apply berserker mode damage multiplier if active
        const damageMultiplier = this.scene.player?.damageMultiplier || 1.0;
        const burstDamage = baseDamage * damageMultiplier;

        // Rainbow colors for projectiles (same as player burst)
        const colors = [0xffff00, 0xff9900, 0xff0000, 0xff00ff, 0x9900ff, 0x0000ff,
                      0x00ffff, 0x00ff00];

        for (let i = 0; i < projectileCount; i++) {
            const angle = angleStep * i;

            // Create projectile
            const projectile = new Projectile(this.scene, this.x, this.y, 'arrow');
            this.scene.projectiles.add(projectile);

            // Configure projectile
            projectile.setFrame(0);
            projectile.damage = burstDamage;
            projectile.setScale(arrowScale * 0.7); // Smaller than player (player: 0.7-1.2, minion: 0.35-0.7)
            projectile.setTint(colors[i]);

            // Enable ricochet if player has the ability
            if (this.scene.player?.ricochetEnabled) {
                projectile.ricochetEnabled = true;
            }

            // Set velocity
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            projectile.setVelocity(velocityX, velocityY);
            projectile.rotation = angle;

            // Add trail effect
            this.createProjectileTrail(projectile, colors[i]);
        }

        // Visual effects
        this.createBurstEffect();

        console.log(`🌟 MiniArcher burst! ${projectileCount} arrows fired!`);
    }

    /**
     * Create visual effects for burst
     */
    createBurstEffect() {
        // Small explosion ring
        const ring = this.scene.add.graphics();
        ring.lineStyle(2, 0xffff00, 0.7);
        ring.strokeCircle(this.x, this.y, 15);

        this.scene.tweens.add({
            targets: ring,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });

        // Flash
        const flash = this.scene.add.circle(this.x, this.y, 10, 0xffffff, 0.7);

        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Small camera shake
        this.scene.cameras.main.shake(100, 0.003);
    }

    /**
     * Create trail for burst projectiles
     */
    createProjectileTrail(projectile, color) {
        // Create periodic trail particles
        const trailInterval = this.scene.time.addEvent({
            delay: 30,
            callback: () => {
                // Safety check: ensure scene still exists
                if (!this.scene || !projectile.active) {
                    trailInterval.remove();
                    return;
                }

                const trail = this.scene.add.circle(projectile.x, projectile.y, 2, color, 0.5);

                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 0.2,
                    duration: 200,
                    ease: 'Power2',
                    onComplete: () => trail.destroy()
                });
            },
            loop: true
        });

        // Track timer for cleanup
        this.activeTimers.push(trailInterval);
    }

    despawn() {
        // Clean up all active timers
        for (const timer of this.activeTimers) {
            if (timer) {
                timer.remove();
            }
        }
        this.activeTimers = [];

        // Clean up burst charge graphic
        if (this.burstChargeGraphic) {
            this.burstChargeGraphic.destroy();
            this.burstChargeGraphic = null;
        }

        // Fade out and destroy
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            scale: 0.3,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                this.destroy();
            }
        });
    }
}
