import Projectile from '../entities/Projectile';

/**
 * AutoFireSystem
 * Handles automatic firing of projectiles at nearest enemy
 */
export default class AutoFireSystem {
    constructor(scene) {
        this.scene = scene;
        this.lastFireTime = 0;
        this.fireRate = 500; // ms between shots
        this.range = 350; // pixels - max range to fire (same for enemies and huts)
        this.enabled = true;
        this.isFiring = false; // Track if currently in a firing animation
    }

    update(time) {
        if (!this.enabled) return;

        // Don't start new shot if already firing
        if (this.isFiring) return;

        // Check cooldown
        if (time - this.lastFireTime < this.fireRate) return;

        // Find nearest target (enemy or hut)
        const target = this.findNearestTarget();
        if (!target) {
            // console.log('🎯 No targets found');
            return;
        }

        // Check if in range
        const distance = Phaser.Math.Distance.Between(
            this.scene.player.x,
            this.scene.player.y,
            target.x,
            target.y
        );

        if (distance > this.range) {
            // console.log(`🎯 Target too far: ${Math.round(distance)}px > ${this.range}px`);
            return;
        }

        // Fire!
        // console.log('🏹 FIRING at target!', distance);
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

        console.log(`🎯 Auto-spawn: Recalculated angle = ${(angle * 180 / Math.PI).toFixed(1)}°`);

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
        const baseDamage = 20;
        const damageMultiplier = this.scene.player.damageMultiplier || 1.0;
        projectile.damage = baseDamage * damageMultiplier;
        const speed = 320; // Reduced from 400 for better visibility

        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        projectile.setVelocity(velocityX, velocityY);

        // Rotate arrow to point in direction of movement
        projectile.rotation = angle;

        // Add glow effect to make it more visible
        projectile.setBlendMode(Phaser.BlendModes.ADD);

        // Raycast will detect collisions automatically!
        console.log('🏹 Arrow spawned with raycast collision!');
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

        // Mark that we're shooting
        player.isShooting = true;

        // After animation completes
        player.once(`animationcomplete-${animKey}`, () => {
            player.isShooting = false;

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

        console.log(`🎯 Auto-fire angle: ${degrees.toFixed(1)}° → ${animKey} (frames ${frameStart}-${frameEnd}, flip=${flipX})`);

        return { frameStart, frameEnd, animKey, flipX };
    }

    /**
     * Find nearest target - prioritizes enemies first, then goblin huts
     */
    findNearestTarget() {
        // First, try to find enemies (priority)
        const enemy = this.findNearestEnemy();
        if (enemy) {
            console.log('🎯 AutoFire: Found enemy target');
            return enemy;
        }

        // If no enemies, target nearest goblin hut
        const hut = this.findNearestHut();
        if (hut) {
            console.log('🏠 AutoFire: Found hut target (no enemies available)');
        } else {
            console.log('❌ AutoFire: No targets found');
        }
        return hut;
    }

    findNearestEnemy() {
        const enemies = this.scene.enemies.getChildren()
            .filter(e => !e.isDying && e.active);

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
