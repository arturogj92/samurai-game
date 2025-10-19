import Phaser from 'phaser';

export default class Projectile extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture || 'arrow');

        // CRITICAL: Store scene reference
        this.scene = scene;

        this.damage = 20;
        scene.add.existing(this);
        this.setScale(0.8);

        // Velocity (manual movement, no physics)
        this.velocityX = 0;
        this.velocityY = 0;

        // Previous position for raycast
        this.prevX = x;
        this.prevY = y;

        // Stuck state
        this.stuckToEnemy = null;
        this.stuckOffsetX = 0;
        this.stuckOffsetY = 0;
        this.stuckRotation = 0;

        // Distance from sprite center to arrow tip (for raycast point)
        // Arrow_shot.png: 63x14 pixels, tip at (63, 7)
        // With scale 0.8: tip is ~25 pixels from center
        this.tipDistance = 25;
    }

    // Get the tip position of the arrow (where raycast should start)
    getTipPosition() {
        const tipX = this.x + Math.cos(this.rotation) * this.tipDistance;
        const tipY = this.y + Math.sin(this.rotation) * this.tipDistance;
        return { x: tipX, y: tipY };
    }

    // Get the previous tip position (for raycast line)
    getPrevTipPosition() {
        // Use same rotation as current (arrow doesn't rotate much frame-to-frame)
        const tipX = this.prevX + Math.cos(this.rotation) * this.tipDistance;
        const tipY = this.prevY + Math.sin(this.rotation) * this.tipDistance;
        return { x: tipX, y: tipY };
    }

    update() {
        // If arrow is stuck to an enemy, follow it
        if (this.stuckToEnemy) {
            // Check if enemy is still alive
            if (!this.stuckToEnemy.active || this.stuckToEnemy.isDying) {
                // Enemy died, remove the arrow
                this.setActive(false);
                this.setVisible(false);
                this.stuckToEnemy = null;
                return;
            }

            // Follow the enemy with stored offset
            this.x = this.stuckToEnemy.x + this.stuckOffsetX;
            this.y = this.stuckToEnemy.y + this.stuckOffsetY;

            // Keep the rotation frozen when arrow stuck
            this.rotation = this.stuckRotation;
            return;
        }

        // Store previous position for raycast
        this.prevX = this.x;
        this.prevY = this.y;

        // Move arrow manually (no physics)
        // Velocity is in pixels/second, so divide by 60 FPS
        const deltaTime = 1 / 60; // Assume 60 FPS
        this.x += this.velocityX * deltaTime;
        this.y += this.velocityY * deltaTime;

        // Update rotation to match movement direction
        if (this.velocityX !== 0 || this.velocityY !== 0) {
            this.rotation = Math.atan2(this.velocityY, this.velocityX);
        }

        // Check if off screen (use large bounds to ensure cleanup)
        const worldWidth = 3200;  // From WORLD.width in PhaserConfig
        const worldHeight = 2400; // From WORLD.height in PhaserConfig
        if (this.x < -200 || this.x > worldWidth + 200 ||
            this.y < -200 || this.y > worldHeight + 200) {
            this.setActive(false);
            this.setVisible(false);
        }
    }

    // Set velocity for the arrow
    setVelocity(vx, vy) {
        this.velocityX = vx;
        this.velocityY = vy;
    }

    // Stop the arrow (when it sticks to enemy)
    stop() {
        this.velocityX = 0;
        this.velocityY = 0;
    }
}
