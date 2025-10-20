import Projectile from '../entities/Projectile';

/**
 * AutoFireSystem
 * Handles automatic firing of projectiles at nearest enemy
 */
export default class AutoFireSystem {
    constructor(scene) {
        this.scene = scene;
        this.lastFireTime = 0;
        this.fireRate = 350; // 🔥 ms between shots (was 500ms, now 350ms = +43% faster!)
        this.range = 320; // pixels - range for auto-fire
        this.enabled = true;
        this.isFiring = false; // Track if currently in a firing animation
    }

    update(time) {
        if (!this.enabled) return;

        // Don't start new shot if already firing (UNLESS infinity arrows is active - then spam arrows!)
        if (this.isFiring && !this.scene.player.infinityArrowsActive) return;

        // Calculate effective fire rate (apply rapid fire multiplier if active)
        let effectiveFireRate = this.fireRate;

        // 🔥 Apply player power scaling bonus (fire rate increases with level)
        if (this.scene.difficultySystem) {
            const playerPower = this.scene.difficultySystem.getPlayerPowerScaling();
            effectiveFireRate = effectiveFireRate * (1 - playerPower.fireRateBonus); // Lower cooldown = faster
        }

        if (this.scene.abilitySystem && this.scene.abilitySystem.rapidFireActive) {
            effectiveFireRate = effectiveFireRate / 5; // 5x fire rate = 1/5 cooldown
        }

        // Check cooldown
        if (time - this.lastFireTime < effectiveFireRate) return;

        // Find nearest target (enemy or hut)
        const target = this.findNearestTarget();
        if (!target) return;

        // Check if in range
        const distance = Phaser.Math.Distance.Between(
            this.scene.player.x,
            this.scene.player.y,
            target.x,
            target.y
        );

        if (distance > this.range) return;

        // Fire!
        this.fireProjectile(target);
        this.lastFireTime = time;
    }

    fireProjectile(target) {
        // Mark as firing to prevent new shots
        this.isFiring = true;

        // Capture target position NOW (before enemy moves)
        const targetX = target.x;
        const targetY = target.y;

        // Calculate initial angle for animation selection
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        const initialAngle = Phaser.Math.Angle.Between(playerX, playerY, targetX, targetY);

        // Start the shot animation and get callback when it completes
        this.playShootAnimation(() => {
            // This fires when animation completes
            // IMPORTANT: Pass target position to recalculate angle from CURRENT player position
            this.spawnProjectile(targetX, targetY);

            // Mark as no longer firing
            this.isFiring = false;
        }, initialAngle); // Use initial angle for animation selection
    }

    spawnProjectile(targetX, targetY) {
        // CRITICAL: Recalculate angle using CURRENT player position and ORIGINAL target position
        // This fixes aiming when player moves during animation delay
        const playerX = this.scene.player.x;
        const playerY = this.scene.player.y;
        const angle = Phaser.Math.Angle.Between(playerX, playerY, targetX, targetY);

        // Calculate bow offset based on shooting direction
        // This makes arrows spawn from the visual bow position instead of player center
        const bowOffset = this.getBowOffset(angle);
        const spawnX = playerX + bowOffset.x;
        const spawnY = playerY + bowOffset.y;

        // Import Projectile class
        const Projectile = this.scene.projectiles.classType;
        const projectile = new Projectile(
            this.scene,
            spawnX,
            spawnY,
            'arrow'
        );

        // Add to group for tracking
        this.scene.projectiles.add(projectile);

        // Set frame 0 (flying arrow)
        projectile.setFrame(0);

        // Reset stuck state
        projectile.stuckToEnemy = null;
        projectile.stuckOffsetX = 0;
        projectile.stuckOffsetY = 0;

        // Set damage and speed (apply player damage multiplier for berserker mode)
        let baseDamage = 25; // 🔥 Increased from 20 to 25 (+25% damage!)

        // 🔥 Apply player power scaling bonus (damage increases with level)
        if (this.scene.difficultySystem) {
            const playerPower = this.scene.difficultySystem.getPlayerPowerScaling();
            baseDamage = baseDamage * (1 + playerPower.damageBonus); // Higher damage with level
        }

        const damageMultiplier = this.scene.player.damageMultiplier || 1.0;
        projectile.damage = baseDamage * damageMultiplier;
        const speed = 400; // 🔥 Increased from 320 to 400 (+25% speed for more impact!)

        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        projectile.setVelocity(velocityX, velocityY);

        // Rotate arrow to point in direction of movement
        projectile.rotation = angle;

        // Enable ricochet if player has the ability
        if (this.scene.player.ricochetEnabled) {
            projectile.ricochetEnabled = true;
        }

        // Use normal blend mode (no glow)
        projectile.setBlendMode(Phaser.BlendModes.NORMAL);
    }

    /**
     * Get bow position offset based on shooting angle
     * This makes arrows spawn from where the bow visually is
     */
    getBowOffset(angle) {
        const degrees = angle * 180 / Math.PI;
        const normalizedDegrees = ((degrees % 360) + 360) % 360;

        // Offset distance from center (adjusted for 0.75 scale)
        const offsetDist = 20;

        // Calculate offset based on direction
        let offsetX = 0, offsetY = 0;

        if (normalizedDegrees >= 337.5 || normalizedDegrees < 22.5) {
            // RIGHT
            offsetX = offsetDist;
            offsetY = 0;
        } else if (normalizedDegrees >= 22.5 && normalizedDegrees < 67.5) {
            // DOWN-RIGHT
            offsetX = offsetDist * 0.7;
            offsetY = offsetDist * 0.7;
        } else if (normalizedDegrees >= 67.5 && normalizedDegrees < 112.5) {
            // DOWN
            offsetX = 0;
            offsetY = offsetDist;
        } else if (normalizedDegrees >= 112.5 && normalizedDegrees < 157.5) {
            // DOWN-LEFT
            offsetX = -offsetDist * 0.7;
            offsetY = offsetDist * 0.7;
        } else if (normalizedDegrees >= 157.5 && normalizedDegrees < 202.5) {
            // LEFT
            offsetX = -offsetDist;
            offsetY = 0;
        } else if (normalizedDegrees >= 202.5 && normalizedDegrees < 247.5) {
            // UP-LEFT
            offsetX = -offsetDist * 0.7;
            offsetY = -offsetDist * 0.7;
        } else if (normalizedDegrees >= 247.5 && normalizedDegrees < 292.5) {
            // UP
            offsetX = 0;
            offsetY = -offsetDist;
        } else {
            // UP-RIGHT
            offsetX = offsetDist * 0.7;
            offsetY = -offsetDist * 0.7;
        }

        return { x: offsetX, y: offsetY };
    }

    playShootAnimation(onComplete, angle) {
        const player = this.scene.player;

        // Convert angle to direction and get frame range
        const { frameStart, frameEnd, animKey, flipX } = this.getDirectionalFrames(angle);

        // Create animation if it doesn't exist
        if (!this.scene.anims.exists(animKey)) {
            this.scene.anims.create({
                key: animKey,
                frames: this.scene.anims.generateFrameNumbers('player-archer', { start: frameStart, end: frameEnd }),
                frameRate: 20,
                repeat: 0
            });
        }

        // Set flip state for left/right directions
        player.setFlipX(flipX);

        // Play the animation
        player.play(animKey, true);

        // Speed up animation during rapid fire or infinity arrows
        if (player.infinityArrowsActive) {
            player.anims.timeScale = 2.5; // 2.5x faster animation
        } else if (this.scene.abilitySystem && this.scene.abilitySystem.rapidFireActive) {
            player.anims.timeScale = 3.0; // 3x faster animation for rapid fire (even faster than infinity!)
        } else {
            player.anims.timeScale = 1; // Normal speed
        }

        // Mark that we're shooting
        player.isShooting = true;

        // After animation completes
        player.once(`animationcomplete-${animKey}`, () => {
            player.isShooting = false;

            // Restore normal animation speed (so walk/idle animations aren't affected)
            player.anims.timeScale = 1;

            // Call the callback to spawn projectile
            if (onComplete) {
                onComplete();
            }
        });
    }

    /**
     * Get frame range and flip state based on shooting angle
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
     * Find nearest target - prioritizes enemies first, then goblin huts
     * IMPORTANT: Only returns targets that are WITHIN RANGE
     */
    findNearestTarget() {
        // First, try to find enemies WITHIN RANGE (priority)
        const enemy = this.findNearestEnemy();
        if (enemy) {
            const distToEnemy = Phaser.Math.Distance.Between(
                this.scene.player.x,
                this.scene.player.y,
                enemy.x,
                enemy.y
            );

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
        const enemies = this.scene.enemies.getChildren()
            .filter(e => e.active && !e.isDying && e.health > 0);

        if (enemies.length === 0) return null;

        let nearest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            const dist = Phaser.Math.Distance.Between(
                this.scene.player.x,
                this.scene.player.y,
                enemy.x,
                enemy.y
            );

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
            const dist = Phaser.Math.Distance.Between(
                this.scene.player.x,
                this.scene.player.y,
                hut.x,
                hut.y
            );

            if (dist < minDist) {
                minDist = dist;
                nearest = hut;
            }
        }

        return nearest;
    }

    setFireRate(rate) {
        this.fireRate = rate;
    }

    setRange(range) {
        this.range = range;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}
