/**
 * Arrow class - Projectile that flies towards enemies
 * The arrow sprite points RIGHT by default, so we calculate rotation accordingly
 */
class Arrow {
    constructor(x, y, targetX, targetY, arrowSprite) {
        this.x = x;
        this.y = y;
        this.size = 8;
        this.speed = 6;
        this.sprite = arrowSprite;

        // Calculate direction vector to target
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize velocity
        this.vx = (dx / distance) * this.speed;
        this.vy = (dy / distance) * this.speed;

        // Calculate angle for rotation and tip calculation
        this.angle = Math.atan2(dy, dx);

        // Hitbox configuration - CIRCULAR HITBOX for better collision detection
        this.tipRadius = 12; // Radius of circular hitbox at arrow tip
        this.tipDistanceForward = 60; // Distance forward from center to tip hitbox center

        // Stuck state
        this.isStuck = false;
        this.stuckToEnemy = null; // Reference to enemy it's stuck to
        this.stuckOffsetX = 0; // Offset from enemy center
        this.stuckOffsetY = 0;
    }

    update() {
        if (this.isStuck && this.stuckToEnemy) {
            // Follow the enemy it's stuck to
            this.x = this.stuckToEnemy.x + this.stuckOffsetX;
            this.y = this.stuckToEnemy.y + this.stuckOffsetY;
        } else if (!this.isStuck) {
            // Normal flight
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    // Calculate tip hitbox position - returns circular hitbox at arrow tip
    getTipHitbox() {
        // Simple calculation: position the circular hitbox forward along the flight direction
        // No perpendicular offset needed - circular hitbox works in all directions
        return {
            x: this.x + Math.cos(this.angle) * this.tipDistanceForward,
            y: this.y + Math.sin(this.angle) * this.tipDistanceForward,
            radius: this.tipRadius
        };
    }

    // Stick the arrow to an enemy
    stickToEnemy(enemy) {
        this.isStuck = true;
        this.stuckToEnemy = enemy;
        // Calculate offset from enemy center so arrow stays in place relative to enemy
        this.stuckOffsetX = this.x - enemy.x;
        this.stuckOffsetY = this.y - enemy.y;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Use the stored angle for rotation
        ctx.rotate(this.angle);

        const arrowWidth = 120;
        const arrowHeight = 120;

        // Draw yellow glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, arrowWidth * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Draw arrow sprite (no filters for performance)
        ctx.globalAlpha = 1.0;
        const usingSprite = this.sprite && this.sprite.complete;

        if (usingSprite) {
            // USING SPRITE - it points UP by default
            ctx.drawImage(
                this.sprite,
                -arrowWidth / 2,
                -arrowHeight / 2,
                arrowWidth,
                arrowHeight
            );
        } else {
            // USING FALLBACK - it points RIGHT by default
            this.drawFallbackArrow(ctx);
        }

        ctx.restore();

        // DEBUG: Visualize tip hitbox and sprite bounds (draw after restore so it's not rotated)
        if (!this.isStuck) {
            const tipHitbox = this.getTipHitbox();
            ctx.save();

            // Draw sprite bounds (red box)
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x - arrowWidth/2, this.y - arrowHeight/2, arrowWidth, arrowHeight);

            // Draw center point (yellow)
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Draw the ACTUAL visual tip of the arrow (rotated sprite tip)
            // This shows where the sprite's visual tip actually is
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            // Visual tip is at the front-right of the sprite when pointing right
            const visualTipX = arrowWidth / 2 - 10; // Slightly inside the edge
            const visualTipY = 0; // Centered vertically

            // Draw a green circle at the VISUAL tip
            ctx.fillStyle = 'lime';
            ctx.beginPath();
            ctx.arc(visualTipX, visualTipY, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Draw tip CIRCULAR HITBOX (RED - this is what collides)
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red fill
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(tipHitbox.x, tipHitbox.y, tipHitbox.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw line from center to tip hitbox center (cyan)
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(tipHitbox.x, tipHitbox.y);
            ctx.stroke();

            // Show angle and direction info
            const angleDeg = (this.angle * 180 / Math.PI).toFixed(0);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            const text = `${angleDeg}° | GREEN=Visual | RED=Hitbox`;
            ctx.strokeText(text, tipHitbox.x + 15, tipHitbox.y - 10);
            ctx.fillText(text, tipHitbox.x + 15, tipHitbox.y - 10);

            ctx.restore();
        }
    }

    drawFallbackArrow(ctx) {
        ctx.fillStyle = '#FFFFFF';

        // Shaft (horizontal, pointing right)
        ctx.fillRect(-36, -4.5, 60, 9);

        // Head (triangle pointing right)
        ctx.beginPath();
        ctx.moveTo(24, 0);
        ctx.lineTo(12, -10.5);
        ctx.lineTo(12, 10.5);
        ctx.closePath();
        ctx.fill();

        // Feathers (on left side)
        ctx.fillStyle = '#E0F0FF';
        ctx.beginPath();
        ctx.moveTo(-36, 0);
        ctx.lineTo(-43.5, -6);
        ctx.lineTo(-43.5, 6);
        ctx.closePath();
        ctx.fill();
    }

    isOffWorld() {
        const worldSize = 10000;
        return this.x < -worldSize || this.x > worldSize * 2 ||
               this.y < -worldSize || this.y > worldSize * 2;
    }
}

// Export for use in game.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Arrow;
}
