/**
 * CollisionSystem
 * Handles all collision detection using RAYCAST for arrows
 */
export default class CollisionSystem {
    constructor(scene) {
        this.scene = scene;
        // No need for physics overlap - we use raycast manually
    }

    update() {
        // Check each active arrow against all enemies using raycast
        this.scene.projectiles.getChildren().forEach(arrow => {
            if (!arrow.active || arrow.stuckToEnemy) return;

            // Get arrow tip positions (current and previous)
            const prevTip = arrow.getPrevTipPosition();
            const currTip = arrow.getTipPosition();

            // Check raycast against all enemies
            this.scene.enemies.getChildren().forEach(enemy => {
                if (enemy.isDying || !enemy.active) return;

                // Check if raycast line intersects with enemy hitbox
                if (this.lineIntersectsEnemy(prevTip, currTip, enemy)) {
                    this.onProjectileHitEnemy(arrow, enemy);
                }
            });
        });
    }

    // Check if a line segment intersects with an enemy's hitbox
    lineIntersectsEnemy(p1, p2, enemy) {
        // Enemy hitbox - use simple rectangle based on position
        // Matter Physics body might not be available, so use sprite bounds
        if (!enemy.body) {
            // Fallback: use sprite position and scale
            const width = 35;  // Enemy hitbox width (from Enemy.js)
            const height = 50; // Enemy hitbox height (from Enemy.js)
            const rect = {
                x: enemy.x - width / 2,
                y: enemy.y - height / 2,
                width: width,
                height: height
            };
            return this.lineIntersectsRect(p1, p2, rect);
        }

        // Try to get bounds from Matter Physics body
        if (enemy.body.bounds) {
            const bounds = enemy.body.bounds;
            const rect = {
                x: bounds.min.x,
                y: bounds.min.y,
                width: bounds.max.x - bounds.min.x,
                height: bounds.max.y - bounds.min.y
            };
            return this.lineIntersectsRect(p1, p2, rect);
        }

        // Last resort: use enemy position with default size
        const width = 35;
        const height = 50;
        const rect = {
            x: enemy.x - width / 2,
            y: enemy.y - height / 2,
            width: width,
            height: height
        };
        return this.lineIntersectsRect(p1, p2, rect);
    }

    // Line-Rectangle intersection algorithm
    lineIntersectsRect(p1, p2, rect) {
        // Check if either endpoint is inside the rectangle
        if (this.pointInRect(p1, rect) || this.pointInRect(p2, rect)) {
            return true;
        }

        // Check intersection with each edge of the rectangle
        const edges = [
            { x1: rect.x, y1: rect.y, x2: rect.x + rect.width, y2: rect.y }, // Top
            { x1: rect.x + rect.width, y1: rect.y, x2: rect.x + rect.width, y2: rect.y + rect.height }, // Right
            { x1: rect.x, y1: rect.y + rect.height, x2: rect.x + rect.width, y2: rect.y + rect.height }, // Bottom
            { x1: rect.x, y1: rect.y, x2: rect.x, y2: rect.y + rect.height } // Left
        ];

        for (const edge of edges) {
            if (this.lineSegmentsIntersect(p1.x, p1.y, p2.x, p2.y, edge.x1, edge.y1, edge.x2, edge.y2)) {
                return true;
            }
        }

        return false;
    }

    // Check if point is inside rectangle
    pointInRect(p, rect) {
        return p.x >= rect.x && p.x <= rect.x + rect.width &&
               p.y >= rect.y && p.y <= rect.y + rect.height;
    }

    // Line-Line intersection
    lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) return false; // Parallel lines

        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

        return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    onProjectileHitEnemy(projectile, enemy) {
        if (enemy.isDying) return;
        if (!projectile || !projectile.active) return;
        if (projectile.stuckToEnemy) return; // Already stuck

        // Deal damage to enemy
        enemy.takeDamage(projectile.damage);

        // Change to stuck arrow sprite (Arrow_hit.png)
        projectile.setTexture('arrow-hit');

        // Stop the arrow
        projectile.stop();

        // Store reference to enemy so arrow follows it
        projectile.stuckToEnemy = enemy;
        projectile.stuckOffsetX = projectile.x - enemy.x;
        projectile.stuckOffsetY = projectile.y - enemy.y;
        projectile.stuckRotation = projectile.rotation;

        // Remove glow effect from stuck arrow
        projectile.setBlendMode(Phaser.BlendModes.NORMAL);
        projectile.setAlpha(0.9);

        console.log('🎯 Raycast hit! Arrow stuck to enemy!');
    }
}
