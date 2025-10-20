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

            // If this is an enemy projectile, check collision with player AND obstacles (cover)
            if (arrow.isEnemyProjectile) {
                // First check if projectile hits rocks or trees (cover!)
                let hitObstacle = false;

                // Check rocks
                this.scene.rocks.getChildren().forEach(rock => {
                    if (!rock.active || hitObstacle) return;

                    // Check if raycast line intersects with rock hitbox
                    if (this.lineIntersectsRock(prevTip, currTip, rock)) {
                        this.onProjectileHitRock(arrow, rock);
                        hitObstacle = true;
                    }
                });

                // Check trees if didn't hit rock
                if (!hitObstacle) {
                    this.scene.trees.getChildren().forEach(tree => {
                        if (!tree.active || hitObstacle) return;

                        // Check if raycast line intersects with tree hitbox
                        if (this.lineIntersectsTree(prevTip, currTip, tree)) {
                            this.onProjectileHitTree(arrow, tree);
                            hitObstacle = true;
                        }
                    });
                }

                // Only check player if projectile didn't hit any obstacle
                if (!hitObstacle) {
                    const player = this.scene.player;
                    if (player && player.active) {
                        // Check if raycast line intersects with player hitbox
                        if (this.lineIntersectsPlayer(prevTip, currTip, player)) {
                            this.onProjectileHitPlayer(arrow, player);
                        }
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

        // Track damage dealt statistics
        if (this.scene.levelSystem) {
            this.scene.levelSystem.addDamageDealt(projectile.damage);
        }

        // Check for ricochet BEFORE sticking the arrow
        if (projectile.ricochetEnabled && !projectile.hasRicocheted) {
            // Try to find another enemy to ricochet to
            const nextEnemy = projectile.findNearestEnemy(enemy);

            if (nextEnemy) {
                // Ricochet! Redirect to next enemy
                projectile.redirectTo(nextEnemy.x, nextEnemy.y, 300);
                projectile.hasRicocheted = true;

                // Reduce damage by 70% (only 30% remains)
                projectile.damage *= 0.3;

                console.log('⚡ RICOCHET! Arrow bouncing to another enemy with 30% damage!');

                // Visual feedback - briefly flash the arrow
                projectile.setTint(0xFFFF00); // Yellow flash
                this.scene.time.delayedCall(100, () => {
                    if (projectile.active) {
                        projectile.clearTint();
                    }
                });

                return; // Don't stick the arrow yet, let it continue flying
            }
            // If no enemy found to ricochet to, continue with normal stick behavior below
        }

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

        // Track damage dealt statistics
        if (this.scene.levelSystem) {
            this.scene.levelSystem.addDamageDealt(projectile.damage);
        }

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

    // Check if a line segment intersects with a rock's hitbox
    lineIntersectsRock(p1, p2, rock) {
        if (!rock.body) {
            // Fallback: use sprite position and size (rocks are 64x64, hitbox 30x30)
            const width = 30;
            const height = 30;
            const rect = {
                x: rock.x - width / 2,
                y: rock.y - height / 2,
                width: width,
                height: height
            };
            return this.lineIntersectsRect(p1, p2, rect);
        }

        // Use physics body bounds
        const rect = {
            x: rock.body.x,
            y: rock.body.y,
            width: rock.body.width,
            height: rock.body.height
        };
        return this.lineIntersectsRect(p1, p2, rect);
    }

    onProjectileHitPlayer(projectile, player) {
        if (!projectile || !projectile.active) return;
        if (projectile.stuckToPlayer) return; // Already hit

        // Check if player is invulnerable (shield ability)
        const currentTime = this.scene.time.now;
        if (player.isInvulnerable && player.invulnerabilityEndTime > currentTime) {
            console.log('🛡️ Player is invulnerable! Projectile blocked by shield!');

            // Create shield deflect visual effect
            const deflectFlash = this.scene.add.circle(projectile.x, projectile.y, 20, 0x00ffff, 0.8);
            deflectFlash.setDepth(200);
            this.scene.tweens.add({
                targets: deflectFlash,
                scale: 2.5,
                alpha: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => deflectFlash.destroy()
            });

            // Destroy the projectile
            projectile.destroy();
            return; // Exit early - no damage
        }

        // Store health before damage
        const healthBefore = player.health || 0;

        // Deal damage to player
        if (player.takeDamage) {
            player.takeDamage(projectile.damage);
        }

        // Check if player died from this hit
        const healthAfter = player.health || 0;
        const playerDied = healthAfter <= 0;

        console.log(`🎯 Projectile hit: healthBefore=${healthBefore}, healthAfter=${healthAfter}, died=${playerDied}`);

        // Apply knockback if player survived and has body
        if (!playerDied && player.body) {
            const knockbackForce = 450; // Stronger knockback
            const knockbackDuration = 200; // Duration in ms
            const angle = projectile.rotation;
            const knockbackX = Math.cos(angle) * knockbackForce;
            const knockbackY = Math.sin(angle) * knockbackForce;

            // Set knockback velocity (override current velocity completely for knockback effect)
            player.body.setVelocity(knockbackX, knockbackY);

            // Disable player movement control during knockback
            player.isKnockedBack = true;

            // Re-enable movement control after knockback duration
            this.scene.time.delayedCall(knockbackDuration, () => {
                if (player.active) {
                    player.isKnockedBack = false;
                    // Decelerate to zero smoothly
                    player.body.setVelocity(0, 0);
                }
            });

            console.log(`💥 Knockback applied! Force: ${knockbackForce}, velocity: (${knockbackX.toFixed(1)}, ${knockbackY.toFixed(1)}), duration: ${knockbackDuration}ms`);
        } else if (playerDied) {
            console.log(`💀 Player died - no knockback`);
        } else if (!player.body) {
            console.log(`⚠️ Player has no body - no knockback`);
        }

        // Create impact visual effect before destroying projectile
        const impactFlash = this.scene.add.circle(projectile.x, projectile.y, 15, 0xaa00ff, 0.8);
        impactFlash.setDepth(200);
        this.scene.tweens.add({
            targets: impactFlash,
            scale: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => impactFlash.destroy()
        });

        // Destroy the projectile immediately (no sticking to player)
        projectile.destroy();

        const critText = projectile.isCritical ? ' 💥 CRITICAL HIT!' : '';
        console.log(`🔮 Enemy projectile destroyed on impact! Damage: ${projectile.damage}${critText}`);
    }

    onProjectileHitRock(projectile, rock) {
        if (!projectile || !projectile.active) return;

        // Create rock impact visual effect - stone particles and spark
        const impactX = projectile.x;
        const impactY = projectile.y;

        // Spark flash (orange/yellow for rock impact)
        const spark = this.scene.add.circle(impactX, impactY, 8, 0xffaa00, 0.9);
        spark.setDepth(200);
        this.scene.tweens.add({
            targets: spark,
            scale: 2.5,
            alpha: 0,
            duration: 250,
            ease: 'Power2',
            onComplete: () => spark.destroy()
        });

        // Small stone particles
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 / 4) * i + Math.random() * 0.5;
            const speed = 30 + Math.random() * 40;
            const size = 2 + Math.random() * 3;

            const particle = this.scene.add.rectangle(
                impactX,
                impactY,
                size,
                size,
                0x888888
            );
            particle.setDepth(199);

            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            this.scene.tweens.add({
                targets: particle,
                x: particle.x + vx,
                y: particle.y + vy,
                alpha: 0,
                duration: 400,
                ease: 'Cubic.easeOut',
                onComplete: () => particle.destroy()
            });
        }

        // Destroy the projectile immediately
        projectile.destroy();

        console.log(`🪨 Projectile blocked by rock! Rocks provide tactical cover.`);
    }

    // Check if a line segment intersects with a tree's hitbox
    lineIntersectsTree(p1, p2, tree) {
        if (!tree.body) {
            // Fallback: use sprite position and size (trees have 50x50 hitbox at trunk)
            const width = 50;
            const height = 50;
            const rect = {
                x: tree.x - width / 2,
                y: tree.y - height / 2,
                width: width,
                height: height
            };
            return this.lineIntersectsRect(p1, p2, rect);
        }

        // Use physics body bounds
        const rect = {
            x: tree.body.x,
            y: tree.body.y,
            width: tree.body.width,
            height: tree.body.height
        };
        return this.lineIntersectsRect(p1, p2, rect);
    }

    onProjectileHitTree(projectile, tree) {
        if (!projectile || !projectile.active) return;

        // Create tree impact visual effect - wood splinters and leaves
        const impactX = projectile.x;
        const impactY = projectile.y;

        // Impact flash (brown/green for tree impact)
        const flash = this.scene.add.circle(impactX, impactY, 8, 0x8B4513, 0.8);
        flash.setDepth(200);
        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Wood splinter particles (brown)
        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i + Math.random() * 0.5;
            const speed = 25 + Math.random() * 35;
            const size = 2 + Math.random() * 2;

            const splinter = this.scene.add.rectangle(
                impactX,
                impactY,
                size,
                size * 2, // Elongated for wood splinters
                0x8B4513
            );
            splinter.setDepth(199);

            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            this.scene.tweens.add({
                targets: splinter,
                x: splinter.x + vx,
                y: splinter.y + vy,
                rotation: Math.random() * Math.PI,
                alpha: 0,
                duration: 350,
                ease: 'Cubic.easeOut',
                onComplete: () => splinter.destroy()
            });
        }

        // Leaf particles (green)
        for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 25;
            const size = 3 + Math.random() * 2;

            const leaf = this.scene.add.circle(
                impactX,
                impactY,
                size,
                0x228B22
            );
            leaf.setDepth(199);

            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 30; // Float upward

            this.scene.tweens.add({
                targets: leaf,
                x: leaf.x + vx,
                y: leaf.y + vy,
                alpha: 0,
                duration: 500,
                ease: 'Sine.easeOut',
                onComplete: () => leaf.destroy()
            });
        }

        // Destroy the projectile immediately
        projectile.destroy();

        console.log(`🌳 Projectile blocked by tree! Trees provide tactical cover.`);
    }
}
