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
        // Check each active arrow against all enemies and huts using raycast
        this.scene.projectiles.getChildren().forEach(arrow => {
            if (!arrow.active || arrow.stuckToEnemy || arrow.stuckToHut || arrow.stuckToPlayer) return;

            // Get arrow tip positions (current and previous)
            const prevTip = arrow.getPrevTipPosition();
            const currTip = arrow.getTipPosition();

            // If this is an enemy projectile, check collision with player
            if (arrow.isEnemyProjectile) {
                const player = this.scene.player;
                if (player && player.active) {
                    // Check if raycast line intersects with player hitbox
                    if (this.lineIntersectsPlayer(prevTip, currTip, player)) {
                        this.onProjectileHitPlayer(arrow, player);
                    }
                }
            } else {
                // Player projectile - check against enemies and huts

                // Check raycast against all enemies
                this.scene.enemies.getChildren().forEach(enemy => {
                    if (enemy.isDying || !enemy.active) return;

                    // Check if raycast line intersects with enemy hitbox
                    if (this.lineIntersectsEnemy(prevTip, currTip, enemy)) {
                        this.onProjectileHitEnemy(arrow, enemy);
                    }
                });

                // Check raycast against all goblin huts
                this.scene.goblinHuts.getChildren().forEach(hut => {
                    if (hut.isDestroyed || !hut.active) return;

                    // Check if raycast line intersects with hut hitbox
                    if (this.lineIntersectsHut(prevTip, currTip, hut)) {
                        this.onProjectileHitHut(arrow, hut);
                    }
                });
            }
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

    // Check if a line segment intersects with a hut's hitbox
    lineIntersectsHut(p1, p2, hut) {
        if (!hut.body) {
            // Fallback: use sprite position and size
            const width = hut.width * 0.6;  // Match reduced hitbox from GoblinHut.js
            const height = hut.height * 0.6;
            const rect = {
                x: hut.x - width / 2,
                y: hut.y - height / 2,
                width: width,
                height: height
            };
            return this.lineIntersectsRect(p1, p2, rect);
        }

        // Use physics body bounds
        const rect = {
            x: hut.body.x,
            y: hut.body.y,
            width: hut.body.width,
            height: hut.body.height
        };
        return this.lineIntersectsRect(p1, p2, rect);
    }

    onProjectileHitEnemy(projectile, enemy) {
        if (enemy.isDying) return;
        if (!projectile || !projectile.active) return;
        if (projectile.stuckToEnemy || projectile.stuckToHut) return; // Already stuck

        // Deal damage to enemy and pass arrow angle for knockback
        enemy.takeDamage(projectile.damage, projectile.rotation);

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

    onProjectileHitHut(projectile, hut) {
        if (hut.isDestroyed) return;
        if (!projectile || !projectile.active) return;
        if (projectile.stuckToEnemy || projectile.stuckToHut) return; // Already stuck

        // Deal damage to hut
        hut.takeDamage(projectile.damage);

        // Change to stuck arrow sprite (Arrow_hit.png)
        projectile.setTexture('arrow-hit');

        // Stop the arrow
        projectile.stop();

        // Store reference to hut so arrow stays in place
        projectile.stuckToHut = hut;
        projectile.stuckRotation = projectile.rotation;

        // Remove glow effect from stuck arrow
        projectile.setBlendMode(Phaser.BlendModes.NORMAL);
        projectile.setAlpha(0.9);

        console.log('🎯 Raycast hit! Arrow stuck to hut!');
    }

    // Check if a line segment intersects with player's hitbox
    lineIntersectsPlayer(p1, p2, player) {
        if (!player.body) {
            // Fallback: use sprite position and size
            const width = 40;  // Approximate player hitbox width
            const height = 60; // Approximate player hitbox height
            const rect = {
                x: player.x - width / 2,
                y: player.y - height / 2,
                width: width,
                height: height
            };
            return this.lineIntersectsRect(p1, p2, rect);
        }

        // Use physics body bounds
        const rect = {
            x: player.body.x,
            y: player.body.y,
            width: player.body.width,
            height: player.body.height
        };
        return this.lineIntersectsRect(p1, p2, rect);
    }

    onProjectileHitPlayer(projectile, player) {
        if (!projectile || !projectile.active) return;
        if (projectile.stuckToPlayer) return; // Already stuck

        // Store health before damage
        const healthBefore = player.health || 0;

        // Deal damage to player
        if (player.takeDamage) {
            player.takeDamage(projectile.damage);
        }

        // Check if player died from this hit
        const healthAfter = player.health || 0;
        const playerDied = healthAfter <= 0;

        console.log(`🎯 Arrow hit: healthBefore=${healthBefore}, healthAfter=${healthAfter}, died=${playerDied}`);

        // Apply knockback if player survived and has body
        if (!playerDied && player.body) {
            const knockbackForce = 450; // Stronger knockback
            const angle = projectile.rotation;
            const knockbackX = Math.cos(angle) * knockbackForce;
            const knockbackY = Math.sin(angle) * knockbackForce;

            // Get current velocity
            const currentVelX = player.body.velocity.x || 0;
            const currentVelY = player.body.velocity.y || 0;

            // ADD knockback to current velocity (so you always feel it)
            player.body.setVelocity(
                currentVelX + knockbackX,
                currentVelY + knockbackY
            );

            console.log(`💥 Knockback applied! Force: ${knockbackForce}, added: (${knockbackX.toFixed(1)}, ${knockbackY.toFixed(1)}), result: (${(currentVelX + knockbackX).toFixed(1)}, ${(currentVelY + knockbackY).toFixed(1)})`);
        } else if (playerDied) {
            console.log(`💀 Player died - no knockback`);
        } else if (!player.body) {
            console.log(`⚠️ Player has no body - no knockback`);
        }

        // Change to stuck arrow sprite (Arrow_hit.png)
        projectile.setTexture('arrow-hit');

        // Stop the arrow
        projectile.stop();

        // Store reference to player so arrow follows them
        projectile.stuckToPlayer = player;
        projectile.stuckOffsetX = projectile.x - player.x;
        projectile.stuckOffsetY = projectile.y - player.y;
        projectile.stuckRotation = projectile.rotation;

        // Keep tint on stuck arrow
        projectile.setAlpha(0.9);

        const critText = projectile.isCritical ? ' 💥 CRITICAL HIT!' : '';
        console.log(`🎯 Enemy arrow stuck to player! Damage: ${projectile.damage}${critText}`);
    }
}
