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
        this.damage = 10; // Half damage compared to player base (20)

        // Lifetime
        this.lifetime = 4000; // 4 seconds
        this.spawnTime = scene.time.now;

        // Play idle animation
        if (!scene.anims.exists('player-idle')) {
            scene.anims.create({
                key: 'player-idle',
                frames: scene.anims.generateFrameNumbers('player-archer', { start: 0, end: 5 }),
                frameRate: 8,
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

        // Update animation based on movement
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

    autoFire(currentTime) {
        // Check cooldown
        if (currentTime - this.lastFireTime < this.fireRate) return;

        // Find nearest enemy
        const target = this.findNearestEnemy();
        if (!target) return;

        // Check range
        const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
        if (distance > this.range) return;

        // Fire!
        this.fireProjectile(target);
        this.lastFireTime = currentTime;
    }

    findNearestEnemy() {
        if (!this.scene.enemies) return null;

        const enemies = this.scene.enemies.getChildren()
            .filter(e => !e.isDying && e.active);

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

    fireProjectile(target) {
        // Calculate angle to target
        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);

        // Create projectile
        const projectile = new Projectile(this.scene, this.x, this.y, 'arrow');
        this.scene.projectiles.add(projectile);

        // Configure projectile
        projectile.setFrame(0);
        projectile.damage = this.damage;
        projectile.setScale(0.7); // Smaller arrows for mini archers

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
        // Determine direction for animation
        const degrees = angle * 180 / Math.PI;
        const normalizedDegrees = ((degrees % 360) + 360) % 360;

        let animKey, flipX = false;

        // Simplified 4-direction shooting
        if (normalizedDegrees >= 315 || normalizedDegrees < 45) {
            // RIGHT
            animKey = 'player-shot-right';
            flipX = false;
        } else if (normalizedDegrees >= 45 && normalizedDegrees < 135) {
            // DOWN
            animKey = 'player-shot-down';
            flipX = false;
        } else if (normalizedDegrees >= 135 && normalizedDegrees < 225) {
            // LEFT
            animKey = 'player-shot-left';
            flipX = true;
        } else {
            // UP
            animKey = 'player-shot-up';
            flipX = false;
        }

        // Create animations if they don't exist (reusing player animations)
        if (!this.scene.anims.exists(animKey)) {
            this.createShootAnimations();
        }

        this.setFlipX(flipX);
        this.play(animKey, true);

        // Return to idle after animation
        this.once(`animationcomplete-${animKey}`, () => {
            if (this.active) {
                this.play('player-idle');
            }
        });
    }

    createShootAnimations() {
        // Create all shooting animations (same as player but can be called multiple times)
        const animations = [
            { key: 'player-shot-up', start: 16, end: 23 },
            { key: 'player-shot-down', start: 48, end: 55 },
            { key: 'player-shot-right', start: 32, end: 39 },
            { key: 'player-shot-left', start: 32, end: 39 }
        ];

        animations.forEach(anim => {
            if (!this.scene.anims.exists(anim.key)) {
                this.scene.anims.create({
                    key: anim.key,
                    frames: this.scene.anims.generateFrameNumbers('player-archer', {
                        start: anim.start,
                        end: anim.end
                    }),
                    frameRate: 20,
                    repeat: 0
                });
            }
        });
    }

    despawn() {
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
