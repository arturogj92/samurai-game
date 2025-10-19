/**
 * AbilitySystem
 * Manages all player abilities with cooldowns and visual effects
 */
export default class AbilitySystem {
    constructor(scene) {
        this.scene = scene;

        // Ability cooldowns (ms)
        this.abilities = {
            dash: {
                cooldown: 3000,
                lastUsed: 0,
                enabled: true
            },
            burst: {
                cooldown: 8000,
                lastUsed: 0,
                enabled: true
            },
            shield: {
                cooldown: 10000,
                lastUsed: 0,
                duration: 3000,
                enabled: true
            },
            chainLightning: {
                cooldown: 12000,
                lastUsed: 0,
                enabled: true
            }
        };

        // Shield state
        this.shieldActive = false;
        this.shieldEndTime = 0;
        this.shieldGraphic = null;
    }

    /**
     * Dash ability (Q) - Quick dash in movement direction
     */
    dash(time) {
        if (!this.canUseAbility('dash', time)) return false;

        const player = this.scene.player;
        const dashDistance = 200;
        const dashDuration = 150; // ms

        // Get current movement direction
        let dashX = player.x;
        let dashY = player.y;

        if (this.scene.cursors.left.isDown || this.scene.keys.A.isDown) {
            dashX -= dashDistance;
        } else if (this.scene.cursors.right.isDown || this.scene.keys.D.isDown) {
            dashX += dashDistance;
        }

        if (this.scene.cursors.up.isDown || this.scene.keys.W.isDown) {
            dashY -= dashDistance;
        } else if (this.scene.cursors.down.isDown || this.scene.keys.S.isDown) {
            dashY += dashDistance;
        }

        // If no direction, dash forward (right)
        if (dashX === player.x && dashY === player.y) {
            dashX += dashDistance * (player.flipX ? -1 : 1);
        }

        // Clamp to world bounds
        dashX = Phaser.Math.Clamp(dashX, 0, this.scene.physics.world.bounds.width);
        dashY = Phaser.Math.Clamp(dashY, 0, this.scene.physics.world.bounds.height);

        // Make player invulnerable during dash
        player.isInvulnerable = true;
        player.setAlpha(0.5);

        // Create dash trail effect
        this.createDashTrail(player.x, player.y, dashX, dashY);

        // Tween to new position
        this.scene.tweens.add({
            targets: player,
            x: dashX,
            y: dashY,
            duration: dashDuration,
            ease: 'Power2',
            onComplete: () => {
                player.setAlpha(1);
                // Keep invulnerability for a bit longer
                this.scene.time.delayedCall(200, () => {
                    player.isInvulnerable = false;
                });
            }
        });

        this.abilities.dash.lastUsed = time;
        console.log('💨 Dash activated!');
        return true;
    }

    /**
     * Burst ability (E) - Fire projectiles in all directions
     */
    burst(time) {
        if (!this.canUseAbility('burst', time)) return false;

        const player = this.scene.player;
        const projectileCount = 12;
        const speed = 500;
        const angleStep = (Math.PI * 2) / projectileCount;

        for (let i = 0; i < projectileCount; i++) {
            const angle = angleStep * i;
            const projectile = this.scene.projectiles.get(player.x, player.y, 'arrow');

            if (!projectile) continue;

            projectile.setActive(true);
            projectile.setVisible(true);
            projectile.body.setAllowGravity(false);
            projectile.setCollideWorldBounds(false);

            projectile.damage = 15; // Less damage than normal shots
            projectile.setScale(0.4);
            projectile.setTint(0xffff00); // Yellow for burst shots

            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;

            projectile.setVelocity(velocityX, velocityY);
            projectile.rotation = angle;
        }

        // Visual effect - flash player
        player.setTint(0xffff00);
        this.scene.time.delayedCall(100, () => {
            player.clearTint();
        });

        this.abilities.burst.lastUsed = time;
        console.log('💥 Burst activated!');
        return true;
    }

    /**
     * Shield ability (R) - Temporary damage immunity
     */
    shield(time) {
        if (!this.canUseAbility('shield', time)) return false;

        const player = this.scene.player;

        // Activate shield
        this.shieldActive = true;
        this.shieldEndTime = time + this.abilities.shield.duration;
        player.isInvulnerable = true;

        // Create shield visual
        this.createShieldGraphic();

        // Schedule shield end
        this.scene.time.delayedCall(this.abilities.shield.duration, () => {
            this.deactivateShield();
        });

        this.abilities.shield.lastUsed = time;
        console.log('🛡️ Shield activated!');
        return true;
    }

    /**
     * Chain Lightning ability (X) - Lightning that jumps between enemies
     */
    chainLightning(time) {
        if (!this.canUseAbility('chainLightning', time)) return false;

        const player = this.scene.player;
        const maxTargets = 5;
        const maxRange = 400;
        const damage = 30;

        // Find nearest enemy
        const enemies = this.scene.enemies.getChildren()
            .filter(e => !e.isDying && e.active);

        if (enemies.length === 0) {
            console.log('⚡ No enemies to target!');
            return false; // Don't consume cooldown if no targets
        }

        // Find initial target
        let currentTarget = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            const dist = Phaser.Math.Distance.Between(
                player.x, player.y,
                enemy.x, enemy.y
            );
            if (dist < minDist && dist < maxRange) {
                minDist = dist;
                currentTarget = enemy;
            }
        }

        if (!currentTarget) {
            console.log('⚡ No enemies in range!');
            return false; // Don't consume cooldown
        }

        // Chain lightning through enemies
        const hitEnemies = new Set();
        let chainCount = 0;
        let lastTarget = { x: player.x, y: player.y };

        while (currentTarget && chainCount < maxTargets) {
            // Draw lightning bolt
            this.drawLightning(lastTarget.x, lastTarget.y, currentTarget.x, currentTarget.y);

            // Damage enemy
            currentTarget.takeDamage(damage);
            hitEnemies.add(currentTarget);
            chainCount++;

            // Find next target
            lastTarget = currentTarget;
            currentTarget = null;
            minDist = Infinity;

            for (const enemy of enemies) {
                if (hitEnemies.has(enemy)) continue; // Skip already hit

                const dist = Phaser.Math.Distance.Between(
                    lastTarget.x, lastTarget.y,
                    enemy.x, enemy.y
                );

                if (dist < minDist && dist < maxRange) {
                    minDist = dist;
                    currentTarget = enemy;
                }
            }
        }

        this.abilities.chainLightning.lastUsed = time;
        console.log(`⚡ Chain Lightning hit ${chainCount} enemies!`);
        return true;
    }

    /**
     * Update method - called every frame
     */
    update(time) {
        // Update shield visual position
        if (this.shieldActive && this.shieldGraphic) {
            this.shieldGraphic.x = this.scene.player.x;
            this.shieldGraphic.y = this.scene.player.y;
        }
    }

    /**
     * Check if ability can be used
     */
    canUseAbility(abilityName, time) {
        const ability = this.abilities[abilityName];
        if (!ability.enabled) return false;

        const timeSinceUse = time - ability.lastUsed;
        if (timeSinceUse < ability.cooldown) {
            const remaining = Math.ceil((ability.cooldown - timeSinceUse) / 1000);
            console.log(`⏱️ ${abilityName} on cooldown: ${remaining}s remaining`);
            return false;
        }

        return true;
    }

    /**
     * Get cooldown percentage (0-1) for UI
     */
    getCooldownPercent(abilityName) {
        const ability = this.abilities[abilityName];
        const time = this.scene.time.now;
        const timeSinceUse = time - ability.lastUsed;

        if (timeSinceUse >= ability.cooldown) return 1; // Ready

        return timeSinceUse / ability.cooldown;
    }

    /**
     * Create dash trail effect
     */
    createDashTrail(x1, y1, x2, y2) {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(4, 0x00ffff, 0.6);
        graphics.lineBetween(x1, y1, x2, y2);

        // Fade out trail
        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 300,
            onComplete: () => graphics.destroy()
        });
    }

    /**
     * Create shield graphic
     */
    createShieldGraphic() {
        if (this.shieldGraphic) {
            this.shieldGraphic.destroy();
        }

        this.shieldGraphic = this.scene.add.graphics();
        this.shieldGraphic.lineStyle(3, 0x00ffff, 0.8);
        this.shieldGraphic.strokeCircle(0, 0, 50);

        this.shieldGraphic.x = this.scene.player.x;
        this.shieldGraphic.y = this.scene.player.y;

        // Pulsing animation
        this.scene.tweens.add({
            targets: this.shieldGraphic,
            alpha: 0.3,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    /**
     * Deactivate shield
     */
    deactivateShield() {
        this.shieldActive = false;
        this.scene.player.isInvulnerable = false;

        if (this.shieldGraphic) {
            this.scene.tweens.add({
                targets: this.shieldGraphic,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    this.shieldGraphic.destroy();
                    this.shieldGraphic = null;
                }
            });
        }

        console.log('🛡️ Shield deactivated');
    }

    /**
     * Draw lightning bolt effect
     */
    drawLightning(x1, y1, x2, y2) {
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3, 0xffff00, 1);

        // Jagged lightning effect
        const segments = 5;
        const points = [{ x: x1, y: y1 }];

        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 40;
            const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 40;
            points.push({ x, y });
        }

        points.push({ x: x2, y: y2 });

        // Draw segments
        for (let i = 0; i < points.length - 1; i++) {
            graphics.lineBetween(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        }

        // Flash and fade
        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 150,
            onComplete: () => graphics.destroy()
        });
    }
}
