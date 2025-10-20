/**
 * AbilitySystem
 * Manages all player abilities with cooldowns and visual effects
 */
export default class AbilitySystem {
    constructor(scene) {
        this.scene = scene;

        // Ability cooldowns (ms)
        // Set lastUsed to -999999 so abilities start fully charged
        this.abilities = {
            dash: {
                cooldown: 3000,
                lastUsed: -999999,
                enabled: true
            },
            burst: {
                cooldown: 8000,
                lastUsed: -999999,
                enabled: true
            },
            shield: {
                cooldown: 10000,
                lastUsed: -999999,
                duration: 3000,
                enabled: true
            },
            chainLightning: {
                cooldown: 12000,
                lastUsed: -999999,
                enabled: true
            },
            berserker: {
                cooldown: 15000,
                lastUsed: -999999,
                duration: 6000,
                enabled: true
            },
            summon: {
                cooldown: 20000,
                lastUsed: -999999,
                enabled: true
            },
            ricochet: {
                cooldown: 10000, // 10 seconds cooldown
                lastUsed: -999999,
                duration: 5000, // 5 seconds active
                enabled: true
            },
            arrowStorm: {
                cooldown: 15000, // 15 seconds cooldown
                lastUsed: -999999,
                duration: 3000, // 3 seconds of arrow rain
                enabled: true
            },
            prism: {
                cooldown: 15000, // 15 seconds cooldown
                lastUsed: -999999,
                duration: 10000, // 10 seconds active
                enabled: true
            },
            infinityArrows: {
                cooldown: 30000, // 30 seconds cooldown (ultimate ability) - Reduced from 35s
                lastUsed: -999999,
                duration: 4000, // 4 seconds active - DOUBLED from 2s for BESTIA MODE
                enabled: true
            }
        };

        // Shield state
        this.shieldActive = false;
        this.shieldEndTime = 0;
        this.shieldGraphic = null;
        this.shieldParticles = [];
        this.lastShieldParticleTime = 0;

        // Burst charging state
        this.isChargingBurst = false;
        this.burstChargeStartTime = 0;
        this.burstChargeLevel = 0; // 0-1 (max 3 seconds)
        this.originalPlayerSpeed = 300; // Default player speed
        this.burstChargeGraphic = null;

        // Berserker state
        this.berserkerActive = false;
        this.berserkerEndTime = 0;
        this.berserkerGraphic = null;
        this.originalSpeed = null;
        this.originalFireRate = null;

        // Ricochet state
        this.ricochetActive = false;
        this.ricochetEndTime = 0;
        this.ricochetGraphic = null;

        // Tutorial state
        this.hasShownHoldETutorial = false;

        // Prism state
        this.prismActive = false;
        this.prismEndTime = 0;
        this.prismGraphic = null;
        this.prismAngle = 0; // Current orbital angle
        this.prismRadius = 80; // Orbital radius
        this.prismOrbitSpeed = (Math.PI * 2) / 2500; // Full rotation in 2.5 seconds (radians per ms)
        this.prismDetectionRadius = 50; // Distance to detect projectiles
        this.processedProjectiles = new Set(); // Track which projectiles we've already split

        // Infinity Arrows state
        this.infinityArrowsActive = false;
        this.infinityArrowsEndTime = 0;
        this.infinityArrowsGraphic = null;
        this.originalAutoFireCooldown = null;

        // Rapid Fire (post-dash) state
        this.rapidFireActive = false;
        this.rapidFireEndTime = 0;
    }

    /**
     * Dash ability (Q) - Quick dash in movement direction - ENHANCED VERSION
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
        player.setAlpha(0.7);

        // Start position effects
        this.createDashStartEffect(player.x, player.y);

        // Create enhanced dash trail effect
        this.createDashTrail(player.x, player.y, dashX, dashY);

        // Create afterimage trail
        this.createAfterimageTrail(player, dashX, dashY, dashDuration);

        // Create speed lines
        this.createSpeedLines(player.x, player.y, dashX, dashY, dashDuration);

        // Add dash glow to player
        player.setTint(0x00ffff);

        // Tween to new position
        this.scene.tweens.add({
            targets: player,
            x: dashX,
            y: dashY,
            duration: dashDuration,
            ease: 'Power2',
            onComplete: () => {
                player.setAlpha(1);
                player.clearTint();

                // End position effects
                this.createDashEndEffect(dashX, dashY);

                // Activate rapid fire for 1 second (5x fire rate)
                this.rapidFireActive = true;
                this.rapidFireEndTime = time + 1000; // 1 second duration
                console.log('🔥 Rapid Fire activated! (5x fire rate for 1s)');

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
     * Start charging burst (called when E is pressed down)
     */
    startChargingBurst(time) {
        if (!this.canUseAbility('burst', time)) return false;
        if (this.isChargingBurst) return false; // Already charging

        const player = this.scene.player;

        // Start charging
        this.isChargingBurst = true;
        this.burstChargeStartTime = time;
        this.burstChargeLevel = 0;
        this.originalPlayerSpeed = player.maxSpeed || 300;

        // Visual effect - start glow
        player.setTint(0xffff00);

        // Notify all MiniArchers to start charging
        if (this.scene.miniArchers && this.scene.miniArchers.length > 0) {
            this.scene.miniArchers.forEach(miniArcher => {
                if (miniArcher && miniArcher.active) {
                    miniArcher.startChargingBurst();
                }
            });
        }

        console.log('⚡ Burst charging started!');
        return true;
    }

    /**
     * Release burst (called when E is released)
     */
    releaseBurst(time) {
        if (!this.isChargingBurst) return false;

        const player = this.scene.player;
        const projectileCount = 12;
        const speed = 500;
        const angleStep = (Math.PI * 2) / projectileCount;

        // Calculate charge level (0-1, max 3 seconds)
        const chargeTime = time - this.burstChargeStartTime;
        const chargeLevel = Math.min(chargeTime / 3000, 1);

        // Tutorial: Show "HOLD E!" if released too quickly
        if (chargeTime < 300) { // Less than 0.3 seconds
            this.showHoldETutorial();
        }

        // Scale based on charge: 0.7 to 1.2
        const arrowScale = 0.7 + (chargeLevel * 0.5);
        // Damage based on charge: 9 to 30
        const arrowDamage = 9 + (chargeLevel * 21);

        // Stop charging
        this.isChargingBurst = false;
        this.burstChargeLevel = 0;

        // Destroy charge visual
        if (this.burstChargeGraphic) {
            this.burstChargeGraphic.destroy();
            this.burstChargeGraphic = null;
        }

        // Restore player speed
        player.maxSpeed = this.originalPlayerSpeed;

        // Create explosion effect at center
        this.createBurstExplosion(player.x, player.y);

        // Screen flash
        this.createBurstFlash();

        // Camera shake (stronger with more charge)
        this.scene.cameras.main.shake(250, 0.006 + (chargeLevel * 0.004));

        // Rainbow colors for projectiles
        const colors = [0xffff00, 0xff9900, 0xff0000, 0xff00ff, 0x9900ff, 0x0000ff,
                      0x00ffff, 0x00ff00, 0x99ff00, 0xffff99, 0xff6699, 0x66ffff];

        for (let i = 0; i < projectileCount; i++) {
            const angle = angleStep * i;

            // Create projectile directly (same way as MouseFireSystem)
            const Projectile = this.scene.projectiles.classType;
            const projectile = new Projectile(
                this.scene,
                player.x,
                player.y,
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

            // Scale and damage based on charge level
            projectile.damage = arrowDamage;
            projectile.setScale(arrowScale);
            projectile.setTint(colors[i]);

            // Enable ricochet if player has the ability
            if (player.ricochetEnabled) {
                projectile.ricochetEnabled = true;
            }

            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;

            projectile.setVelocity(velocityX, velocityY);
            projectile.rotation = angle;

            // Add trail effect to each projectile
            this.createProjectileTrail(projectile, angle, colors[i]);
        }

        // Notify all MiniArchers to release burst with same charge level
        if (this.scene.miniArchers && this.scene.miniArchers.length > 0) {
            this.scene.miniArchers.forEach(miniArcher => {
                if (miniArcher && miniArcher.active) {
                    miniArcher.releaseBurst(chargeLevel);
                }
            });
        }

        player.clearTint();

        this.abilities.burst.lastUsed = time;
        console.log(`💥 Burst released! Charge: ${(chargeLevel * 100).toFixed(0)}% | Scale: ${arrowScale.toFixed(2)} | Damage: ${arrowDamage.toFixed(0)}`);
        return true;
    }

    /**
     * Shield ability (R) - Temporary damage immunity - ENHANCED VERSION
     */
    shield(time) {
        if (!this.canUseAbility('shield', time)) return false;

        const player = this.scene.player;

        // Activate shield
        this.shieldActive = true;
        this.shieldEndTime = time + this.abilities.shield.duration;
        player.isInvulnerable = true;

        // CRITICAL: Set invulnerabilityEndTime to prevent MainScene from clearing it
        player.invulnerabilityEndTime = time + this.abilities.shield.duration + 100;

        // Create activation effect
        this.createShieldActivationEffect(player.x, player.y);

        // Create shield visual
        this.createShieldGraphic();

        // Schedule shield end
        this.scene.time.delayedCall(this.abilities.shield.duration, () => {
            this.deactivateShield();
        });

        this.abilities.shield.lastUsed = time;
        console.log('🛡️ Shield activated! isInvulnerable:', player.isInvulnerable, 'endTime:', player.invulnerabilityEndTime);
        return true;
    }

    /**
     * Chain Lightning ability (X) - Lightning that jumps between enemies and huts
     */
    chainLightning(time) {
        console.log('⚡ chainLightning called');
        if (!this.canUseAbility('chainLightning', time)) return false;

        const player = this.scene.player;
        const maxTargets = 5;
        const maxRange = 400;
        const damage = 30;

        // Gather all possible targets (enemies + goblin huts)
        const enemies = this.scene.enemies.getChildren()
            .filter(e => !e.isDying && e.active);

        const huts = this.scene.goblinHuts.getChildren()
            .filter(h => h.active && !h.isDestroyed);

        // Combine all targets
        const allTargets = [...enemies, ...huts];

        console.log(`⚡ Found ${enemies.length} enemies and ${huts.length} huts (${allTargets.length} total targets)`);

        if (allTargets.length === 0) {
            console.log('⚡ No targets available!');
            return false; // Don't consume cooldown if no targets
        }

        // Find initial target (closest to player)
        let currentTarget = null;
        let minDist = Infinity;

        for (const target of allTargets) {
            const dist = Phaser.Math.Distance.Between(
                player.x, player.y,
                target.x, target.y
            );
            if (dist < minDist && dist < maxRange) {
                minDist = dist;
                currentTarget = target;
            }
        }

        if (!currentTarget) {
            console.log('⚡ No targets in range!');
            return false; // Don't consume cooldown
        }

        // Chain lightning through all targets
        const hitTargets = new Set();
        let chainCount = 0;
        let lastTarget = { x: player.x, y: player.y };

        while (currentTarget && chainCount < maxTargets) {
            // Draw lightning bolt
            this.drawLightning(lastTarget.x, lastTarget.y, currentTarget.x, currentTarget.y);

            // Damage target (works for both enemies and huts)
            currentTarget.takeDamage(damage);
            hitTargets.add(currentTarget);
            chainCount++;

            // Find next target
            lastTarget = currentTarget;
            currentTarget = null;
            minDist = Infinity;

            for (const target of allTargets) {
                if (hitTargets.has(target)) continue; // Skip already hit

                const dist = Phaser.Math.Distance.Between(
                    lastTarget.x, lastTarget.y,
                    target.x, target.y
                );

                if (dist < minDist && dist < maxRange) {
                    minDist = dist;
                    currentTarget = target;
                }
            }
        }

        this.abilities.chainLightning.lastUsed = time;
        console.log(`⚡ Chain Lightning hit ${chainCount} targets!`);
        return true;
    }

    /**
     * Ricochet ability (G) - Timed buff that makes arrows bounce
     */
    ricochet(time) {
        if (!this.canUseAbility('ricochet', time)) return false;

        const player = this.scene.player;

        // Activate ricochet mode
        this.ricochetActive = true;
        this.ricochetEndTime = time + this.abilities.ricochet.duration;
        player.ricochetEnabled = true;

        // Create activation effect
        this.createRicochetActivationEffect(player.x, player.y);

        // Create ricochet aura
        this.createRicochetAura();

        // Apply yellow tint to player
        player.setTint(0xffaa00);

        // Schedule ricochet end
        this.scene.time.delayedCall(this.abilities.ricochet.duration, () => {
            this.deactivateRicochet();
        });

        this.abilities.ricochet.lastUsed = time;
        console.log('⚡ RICOCHET ACTIVATED! Arrows will bounce for 5 seconds!');
        return true;
    }

    /**
     * Update method - called every frame
     */
    update(time, delta) {
        // Update shield visual position and effects
        if (this.shieldActive && this.shieldGraphic) {
            this.shieldGraphic.x = this.scene.player.x;
            this.shieldGraphic.y = this.scene.player.y;

            // Constant blue color throughout duration
            const shieldColor = 0x0099ff; // Blue constant

            // Update player tint color (always blue)
            const player = this.scene.player;
            if (player) {
                player.setTint(shieldColor);
            }
        }

        // Update berserker aura position
        if (this.berserkerActive && this.berserkerGraphic) {
            this.berserkerGraphic.x = this.scene.player.x;
            this.berserkerGraphic.y = this.scene.player.y;
        }

        // Update ricochet aura position
        if (this.ricochetActive && this.ricochetGraphic) {
            this.ricochetGraphic.x = this.scene.player.x;
            this.ricochetGraphic.y = this.scene.player.y;
        }

        // Update prism orbital position and check projectiles
        if (this.prismActive && this.prismGraphic) {
            const player = this.scene.player;

            // Update orbital angle (continuous rotation)
            this.prismAngle += this.prismOrbitSpeed * delta;

            // Calculate prism position based on orbital angle
            const prismX = player.x + Math.cos(this.prismAngle) * this.prismRadius;
            const prismY = player.y + Math.sin(this.prismAngle) * this.prismRadius;

            this.prismGraphic.x = prismX;
            this.prismGraphic.y = prismY;

            // Rotate prism sprite for visual effect
            this.prismGraphic.rotation += 0.05;

            // Check all projectiles for proximity to prism
            this.checkProjectilesNearPrism(prismX, prismY, time);
        }

        // Update infinity arrows aura position
        if (this.infinityArrowsActive && this.infinityArrowsGraphic) {
            this.infinityArrowsGraphic.x = this.scene.player.x;
            this.infinityArrowsGraphic.y = this.scene.player.y;
        }

        // Deactivate rapid fire after duration
        if (this.rapidFireActive && time >= this.rapidFireEndTime) {
            this.rapidFireActive = false;
            console.log('🔥 Rapid Fire ended');
        }

        // Update burst charging
        if (this.isChargingBurst) {
            const player = this.scene.player;
            const chargeTime = time - this.burstChargeStartTime;
            const chargeLevel = Math.min(chargeTime / 3000, 1); // 0-1 over 3 seconds
            this.burstChargeLevel = chargeLevel;

            // Update MiniArchers charge level
            if (this.scene.miniArchers && this.scene.miniArchers.length > 0) {
                this.scene.miniArchers.forEach(miniArcher => {
                    if (miniArcher && miniArcher.active && miniArcher.isChargingBurst) {
                        miniArcher.burstChargeLevel = chargeLevel;
                    }
                });
            }

            // Reduce player speed progressively (300 -> 0 over 3 seconds)
            const speedMultiplier = 1 - chargeLevel;
            player.maxSpeed = this.originalPlayerSpeed * speedMultiplier;

            // Also slow down current velocity
            if (player.body) {
                player.body.velocity.x *= speedMultiplier;
                player.body.velocity.y *= speedMultiplier;
            }

            // Update visual charging effect
            this.updateBurstChargeVisual(player.x, player.y, chargeLevel);
        }
    }

    /**
     * Check if ability can be used
     * During berserker mode, cooldowns recover 4x faster (except berserker itself)
     */
    canUseAbility(abilityName, time) {
        const ability = this.abilities[abilityName];
        if (!ability.enabled) return false;

        let timeSinceUse = time - ability.lastUsed;
        let effectiveCooldown = ability.cooldown;

        // ⚡ Apply player cooldown reduction upgrade
        if (this.scene.player && this.scene.player.cooldownReduction && this.scene.player.cooldownReduction > 0) {
            effectiveCooldown = ability.cooldown * (1 - this.scene.player.cooldownReduction);
        }

        // Berserker mode: cooldowns recover 4x faster (75% cooldown reduction)
        if (this.berserkerActive && abilityName !== 'berserker') {
            timeSinceUse *= 4; // Effectively cuts cooldown time to 25%
        }

        if (timeSinceUse < effectiveCooldown) {
            const remaining = Math.ceil((effectiveCooldown - timeSinceUse) / 1000);
            console.log(`⏱️ ${abilityName} on cooldown: ${remaining}s remaining`);
            return false;
        }

        return true;
    }

    /**
     * Get cooldown percentage (0-1) for UI
     * During berserker mode, cooldowns are 4x faster (75% cooldown reduction)
     */
    getCooldownPercent(abilityName) {
        const ability = this.abilities[abilityName];
        const time = this.scene.time.now;
        let timeSinceUse = time - ability.lastUsed;
        let effectiveCooldown = ability.cooldown;

        // ⚡ Apply player cooldown reduction upgrade
        if (this.scene.player && this.scene.player.cooldownReduction && this.scene.player.cooldownReduction > 0) {
            effectiveCooldown = ability.cooldown * (1 - this.scene.player.cooldownReduction);
        }

        // Berserker mode: cooldowns recover 4x faster (75% cooldown reduction)
        if (this.berserkerActive && abilityName !== 'berserker') {
            timeSinceUse *= 4; // Effectively cuts cooldown time to 25%
        }

        if (timeSinceUse >= effectiveCooldown) return 1; // Ready

        return timeSinceUse / effectiveCooldown;
    }

    /**
     * Create dash trail effect - ENHANCED VERSION
     */
    createDashTrail(x1, y1, x2, y2) {
        const graphics = this.scene.add.graphics();

        // Draw multiple trail layers for glow effect
        // Outer glow (wide, transparent)
        graphics.lineStyle(20, 0x00ffff, 0.15);
        graphics.lineBetween(x1, y1, x2, y2);

        // Middle glow
        graphics.lineStyle(12, 0x00ffff, 0.3);
        graphics.lineBetween(x1, y1, x2, y2);

        // Inner trail (bright)
        graphics.lineStyle(6, 0x00ffff, 0.6);
        graphics.lineBetween(x1, y1, x2, y2);

        // Core (brightest)
        graphics.lineStyle(3, 0xffffff, 0.8);
        graphics.lineBetween(x1, y1, x2, y2);

        // Fade out trail
        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => graphics.destroy()
        });
    }

    /**
     * Create dash start effect - Burst of energy
     */
    createDashStartEffect(x, y) {
        // Expanding cyan ring
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, 0x00ffff, 0.8);
        ring.strokeCircle(x, y, 20);

        this.scene.tweens.add({
            targets: ring,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });

        // Particle burst
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const particle = this.scene.add.circle(x, y, 4, 0x00ffff, 0.8);

            const distance = Phaser.Math.Between(30, 50);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.2,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Create afterimage trail - Ghost images of the player
     */
    createAfterimageTrail(player, targetX, targetY, duration) {
        const afterimageCount = 8;
        const interval = duration / afterimageCount;

        for (let i = 0; i < afterimageCount; i++) {
            this.scene.time.delayedCall(i * interval, () => {
                // Create a sprite copy of the player
                const afterimage = this.scene.add.sprite(player.x, player.y, player.texture.key);
                afterimage.setFrame(player.frame.name);
                afterimage.setFlipX(player.flipX);
                afterimage.setScale(player.scaleX, player.scaleY);
                afterimage.setTint(0x00ffff);
                afterimage.setAlpha(0.5);

                // Fade out
                this.scene.tweens.add({
                    targets: afterimage,
                    alpha: 0,
                    scale: afterimage.scaleX * 0.8,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => afterimage.destroy()
                });
            });
        }
    }

    /**
     * Create speed lines effect
     */
    createSpeedLines(x1, y1, x2, y2, duration) {
        const lineCount = 20;
        const angle = Math.atan2(y2 - y1, x2 - x1);

        for (let i = 0; i < lineCount; i++) {
            this.scene.time.delayedCall(i * (duration / lineCount), () => {
                const graphics = this.scene.add.graphics();

                // Random position around the path
                const t = Math.random();
                const centerX = x1 + (x2 - x1) * t;
                const centerY = y1 + (y2 - y1) * t;

                // Offset perpendicular to movement
                const perpAngle = angle + Math.PI / 2;
                const offset = (Math.random() - 0.5) * 100;
                const startX = centerX + Math.cos(perpAngle) * offset;
                const startY = centerY + Math.sin(perpAngle) * offset;

                // Speed line in movement direction
                const lineLength = Phaser.Math.Between(20, 50);
                const endX = startX - Math.cos(angle) * lineLength;
                const endY = startY - Math.sin(angle) * lineLength;

                graphics.lineStyle(2, 0x00ffff, 0.6);
                graphics.lineBetween(startX, startY, endX, endY);

                // Fade out
                this.scene.tweens.add({
                    targets: graphics,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => graphics.destroy()
                });
            });
        }
    }

    /**
     * Create dash end effect - Impact landing
     */
    createDashEndEffect(x, y) {
        // Impact flash
        const flash = this.scene.add.circle(x, y, 15, 0xffffff, 0.8);

        this.scene.tweens.add({
            targets: flash,
            scale: 2.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Impact ring
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, 0x00ffff, 0.7);
        ring.strokeCircle(x, y, 20);

        this.scene.tweens.add({
            targets: ring,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });

        // Ground impact particles
        const impactParticleCount = 16;
        for (let i = 0; i < impactParticleCount; i++) {
            const angle = (Math.PI * 2 * i) / impactParticleCount;
            const particle = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), 0x00ffff);

            const distance = Phaser.Math.Between(20, 40);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(250, 400),
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Slight camera shake
        this.scene.cameras.main.shake(100, 0.003);
    }

    /**
     * Create shield graphic - ENHANCED VERSION with hexagonal pattern
     */
    createShieldGraphic() {
        if (this.shieldGraphic) {
            this.shieldGraphic.destroy();
        }

        const player = this.scene.player;

        // Container for shield graphics (simple like berserker)
        this.shieldGraphic = this.scene.add.container(player.x, player.y);
        this.shieldGraphic.setDepth(player.depth - 1); // Behind player

        // Apply blue tint to player sprite
        player.setTint(0x00ccff);

        // Only sparkle particles (no glow, no hexagon, no rings)
        this.createShieldSparkles();

        // Initialize particles array
        this.shieldParticles = [];
    }

    /**
     * Spawn orbital particles around shield
     */
    spawnShieldOrbitalParticle(color) {
        const player = this.scene.player;
        const angle = Math.random() * Math.PI * 2;
        const radius = 35 + Math.random() * 10;

        const particle = this.scene.add.circle(
            player.x + Math.cos(angle) * radius,
            player.y + Math.sin(angle) * radius,
            3,
            color
        );
        particle.setAlpha(0.8);
        particle.setDepth(60);

        // Orbit animation
        this.scene.tweens.add({
            targets: particle,
            angle: angle + Math.PI * 2,
            duration: 1000,
            ease: 'Linear',
            onUpdate: () => {
                particle.x = player.x + Math.cos(particle.angle) * radius;
                particle.y = player.y + Math.sin(particle.angle) * radius;
            },
            onComplete: () => {
                particle.destroy();
            }
        });

        // Fade out
        this.scene.tweens.add({
            targets: particle,
            alpha: 0,
            duration: 800,
            delay: 200
        });
    }

    /**
     * Deactivate shield
     */
    deactivateShield() {
        this.shieldActive = false;

        // Clear player tint
        this.scene.player.clearTint();

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

        // Only remove invulnerability if shield was the one that set it
        // Wait a bit to avoid instant damage after shield ends
        this.scene.time.delayedCall(100, () => {
            this.scene.player.isInvulnerable = false;
        });

        console.log('🛡️ Shield deactivated');
    }

    /**
     * Draw lightning bolt effect - ENHANCED VERSION
     */
    drawLightning(x1, y1, x2, y2) {
        // Screen shake for impact
        this.scene.cameras.main.shake(200, 0.005);

        // CRITICAL: Show origin point at player position
        this.createLightningOriginEffect(x1, y1);

        // Main lightning bolt with glow
        this.drawMainLightningBolt(x1, y1, x2, y2);

        // Add branching bolts for more drama
        this.drawBranchingBolts(x1, y1, x2, y2);

        // Impact explosion at target
        this.createLightningImpact(x2, y2);

        // Electric sparks along the path
        this.createElectricSparks(x1, y1, x2, y2);

        // Screen flash effect
        this.createLightningFlash();
    }

    /**
     * Draw main lightning bolt with electric glow
     */
    drawMainLightningBolt(x1, y1, x2, y2) {
        const graphics = this.scene.add.graphics();

        // Generate jagged lightning path with more segments for smoother look
        const segments = 8;
        const points = [{ x: x1, y: y1 }]; // First point is EXACT player position (no randomization)

        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 50;
            const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 50;
            points.push({ x, y });
        }
        points.push({ x: x2, y: y2 });

        // Draw outer glow (cyan/white) - FIRST segment is THICKER
        for (let i = 0; i < points.length - 1; i++) {
            const lineWidth = i === 0 ? 20 : 12; // First segment 66% thicker
            const alpha = i === 0 ? 0.5 : 0.3; // First segment more visible
            graphics.lineStyle(lineWidth, 0xccffff, alpha);
            graphics.lineBetween(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        }

        // Draw middle glow (bright cyan) - FIRST segment is THICKER
        for (let i = 0; i < points.length - 1; i++) {
            const lineWidth = i === 0 ? 10 : 6; // First segment 66% thicker
            const alpha = i === 0 ? 0.8 : 0.6; // First segment more visible
            graphics.lineStyle(lineWidth, 0x00ffff, alpha);
            graphics.lineBetween(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        }

        // Draw core (bright white-yellow) - FIRST segment is THICKER
        for (let i = 0; i < points.length - 1; i++) {
            const lineWidth = i === 0 ? 4 : 2; // First segment 100% thicker
            graphics.lineStyle(lineWidth, 0xffffff, 1);
            graphics.lineBetween(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
        }

        // Animate and fade (EXTENDED duration for visibility)
        this.scene.tweens.add({
            targets: graphics,
            alpha: 0,
            duration: 500, // Increased from 200ms to 500ms
            ease: 'Power2',
            onComplete: () => graphics.destroy()
        });
    }

    /**
     * Draw branching lightning bolts
     */
    drawBranchingBolts(x1, y1, x2, y2) {
        const branchCount = Phaser.Math.Between(2, 4);

        for (let b = 0; b < branchCount; b++) {
            const graphics = this.scene.add.graphics();

            // Pick a random point along the main bolt to branch from
            const t = Math.random() * 0.7 + 0.15; // Between 15% and 85%
            const branchStartX = x1 + (x2 - x1) * t;
            const branchStartY = y1 + (y2 - y1) * t;

            // Random branch direction
            const angle = Math.random() * Math.PI * 2;
            const length = Phaser.Math.Between(40, 100);
            const branchEndX = branchStartX + Math.cos(angle) * length;
            const branchEndY = branchStartY + Math.sin(angle) * length;

            // Generate branch path
            const segments = 3;
            const points = [{ x: branchStartX, y: branchStartY }];

            for (let i = 1; i < segments; i++) {
                const t2 = i / segments;
                const x = branchStartX + (branchEndX - branchStartX) * t2 + (Math.random() - 0.5) * 20;
                const y = branchStartY + (branchEndY - branchStartY) * t2 + (Math.random() - 0.5) * 20;
                points.push({ x, y });
            }
            points.push({ x: branchEndX, y: branchEndY });

            // Draw branch glow
            graphics.lineStyle(6, 0x66ffff, 0.4);
            for (let i = 0; i < points.length - 1; i++) {
                graphics.lineBetween(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
            }

            // Draw branch core
            graphics.lineStyle(1.5, 0xffffff, 0.8);
            for (let i = 0; i < points.length - 1; i++) {
                graphics.lineBetween(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
            }

            // Fade out with slight delay (EXTENDED duration)
            this.scene.tweens.add({
                targets: graphics,
                alpha: 0,
                duration: 400, // Increased from 150ms to 400ms
                delay: b * 20,
                onComplete: () => graphics.destroy()
            });
        }
    }

    /**
     * Create electric spark particles along the lightning path
     */
    createElectricSparks(x1, y1, x2, y2) {
        const sparkCount = 15;

        for (let i = 0; i < sparkCount; i++) {
            const t = Math.random();
            const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 30;
            const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30;

            const spark = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), 0xffffff);

            // Random velocity
            const vx = (Math.random() - 0.5) * 100;
            const vy = (Math.random() - 0.5) * 100;

            this.scene.tweens.add({
                targets: spark,
                x: x + vx,
                y: y + vy,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(400, 600), // Increased from 150-300ms to 400-600ms
                ease: 'Power2',
                onComplete: () => spark.destroy()
            });
        }
    }

    /**
     * Create impact explosion at target
     */
    createLightningImpact(x, y) {
        // Main impact flash
        const impact = this.scene.add.circle(x, y, 20, 0xffffff, 0.9);

        this.scene.tweens.add({
            targets: impact,
            scale: 3,
            alpha: 0,
            duration: 600, // Increased from 300ms to 600ms
            ease: 'Power2',
            onComplete: () => impact.destroy()
        });

        // Electric ring
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, 0x00ffff, 0.8);
        ring.strokeCircle(x, y, 15);

        this.scene.tweens.add({
            targets: ring,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 700, // Increased from 400ms to 700ms
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });

        // Impact sparks
        const impactSparkCount = 20;
        for (let i = 0; i < impactSparkCount; i++) {
            const angle = (Math.PI * 2 * i) / impactSparkCount;
            const distance = Phaser.Math.Between(20, 60);
            const spark = this.scene.add.circle(x, y, Phaser.Math.Between(2, 5), 0x00ffff);

            this.scene.tweens.add({
                targets: spark,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(500, 800), // Increased from 200-400ms to 500-800ms
                ease: 'Power3',
                onComplete: () => spark.destroy()
            });
        }
    }

    /**
     * Create screen flash effect
     */
    createLightningFlash() {
        const flash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xffffff,
            0.3
        );
        flash.setScrollFactor(0);
        flash.setDepth(1000);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 100,
            onComplete: () => flash.destroy()
        });
    }

    /**
     * Create lightning origin effect - Shows clearly where lightning starts (player position)
     */
    createLightningOriginEffect(x, y) {
        // Bright central flash at player position (VERY visible)
        const originFlash = this.scene.add.circle(x, y, 12, 0xffffff, 1);
        originFlash.setDepth(100); // High depth to be visible

        this.scene.tweens.add({
            targets: originFlash,
            scale: 2.5,
            alpha: 0,
            duration: 500, // Increased from 250ms to 500ms
            ease: 'Power2',
            onComplete: () => originFlash.destroy()
        });

        // Electric ring expanding from player
        const originRing = this.scene.add.graphics();
        originRing.lineStyle(4, 0x00ffff, 1);
        originRing.strokeCircle(x, y, 8);
        originRing.setDepth(100);

        this.scene.tweens.add({
            targets: originRing,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 600, // Increased from 300ms to 600ms
            ease: 'Power2',
            onComplete: () => originRing.destroy()
        });

        // Second ring for emphasis
        this.scene.time.delayedCall(50, () => {
            const ring2 = this.scene.add.graphics();
            ring2.lineStyle(3, 0xccffff, 0.8);
            ring2.strokeCircle(x, y, 10);
            ring2.setDepth(100);

            this.scene.tweens.add({
                targets: ring2,
                scaleX: 2.5,
                scaleY: 2.5,
                alpha: 0,
                duration: 550, // Increased from 250ms to 550ms
                ease: 'Power2',
                onComplete: () => ring2.destroy()
            });
        });

        // Electric particles bursting from player origin
        const burstParticleCount = 16;
        for (let i = 0; i < burstParticleCount; i++) {
            const angle = (Math.PI * 2 * i) / burstParticleCount;
            const particle = this.scene.add.circle(x, y, 3, 0x00ffff, 1);
            particle.setDepth(100);

            const distance = Phaser.Math.Between(20, 40);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.3,
                duration: 500, // Increased from 200ms to 500ms
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Glowing aura around player (pulsing effect)
        const aura = this.scene.add.circle(x, y, 18, 0x00ffff, 0.4);
        aura.setDepth(99);

        this.scene.tweens.add({
            targets: aura,
            scale: 1.8,
            alpha: 0,
            duration: 500, // Increased from 200ms to 500ms
            ease: 'Power2',
            onComplete: () => aura.destroy()
        });
    }

    /**
     * BURST EFFECTS
     */

    /**
     * Create burst charging effect
     */
    createBurstChargingEffect(x, y) {
        // Pulsing rings during charge
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 70, () => {
                const ring = this.scene.add.graphics();
                ring.lineStyle(2, 0xffff00, 0.6);
                ring.strokeCircle(x, y, 10);

                this.scene.tweens.add({
                    targets: ring,
                    scaleX: 3,
                    scaleY: 3,
                    alpha: 0,
                    duration: 200,
                    ease: 'Power2',
                    onComplete: () => ring.destroy()
                });
            });
        }

        // Energy particles gathering
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const distance = 80;
            const particle = this.scene.add.circle(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                3,
                0xffff00
            );

            this.scene.tweens.add({
                targets: particle,
                x: x,
                y: y,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Create burst explosion at center
     */
    createBurstExplosion(x, y) {
        // Main explosion flash
        const explosion = this.scene.add.circle(x, y, 20, 0xffffff, 0.9);

        this.scene.tweens.add({
            targets: explosion,
            scale: 4,
            alpha: 0,
            duration: 400,
            ease: 'Power3',
            onComplete: () => explosion.destroy()
        });

        // Multiple expanding rings
        const colors = [0xffff00, 0xff9900, 0xff0000];
        for (let i = 0; i < 3; i++) {
            const ring = this.scene.add.graphics();
            ring.lineStyle(3, colors[i], 0.7);
            ring.strokeCircle(x, y, 15 + i * 5);

            this.scene.tweens.add({
                targets: ring,
                scaleX: 4,
                scaleY: 4,
                alpha: 0,
                duration: 500,
                delay: i * 50,
                ease: 'Power2',
                onComplete: () => ring.destroy()
            });
        }

        // Explosion particles
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const particle = this.scene.add.circle(x, y, Phaser.Math.Between(3, 6), 0xffff00);

            const distance = Phaser.Math.Between(40, 80);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(300, 500),
                ease: 'Power3',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Create burst screen flash
     */
    createBurstFlash() {
        const flash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xffff00,
            0.4
        );
        flash.setScrollFactor(0);
        flash.setDepth(1000);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 150,
            onComplete: () => flash.destroy()
        });
    }

    /**
     * Create trail for projectiles
     */
    createProjectileTrail(projectile, angle, color) {
        // Create periodic trail particles
        const trailInterval = this.scene.time.addEvent({
            delay: 30,
            callback: () => {
                if (!projectile.active) {
                    trailInterval.remove();
                    return;
                }

                const trail = this.scene.add.circle(projectile.x, projectile.y, 3, color, 0.6);

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
    }

    /**
     * SHIELD EFFECTS
     */

    /**
     * Create shield activation effect
     */
    createShieldActivationEffect(x, y) {
        // Expanding activation wave
        const wave = this.scene.add.graphics();
        wave.lineStyle(4, 0x00ffff, 0.8);
        wave.strokeCircle(x, y, 10);

        this.scene.tweens.add({
            targets: wave,
            scaleX: 5,
            scaleY: 5,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => wave.destroy()
        });

        // Activation flash
        const flash = this.scene.add.circle(x, y, 15, 0xffffff, 0.8);

        this.scene.tweens.add({
            targets: flash,
            scale: 3,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Particle burst
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const particle = this.scene.add.circle(x, y, 4, 0x00ffff);

            const distance = Phaser.Math.Between(30, 60);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.2,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Create sparkle particles around shield
     */
    createShieldSparkles() {
        // Continuously spawn sparkles while shield is active
        const sparkleEvent = this.scene.time.addEvent({
            delay: 150,
            callback: () => {
                if (!this.shieldActive) {
                    sparkleEvent.remove();
                    return;
                }

                const player = this.scene.player;
                const angle = Math.random() * Math.PI * 2;
                const distance = Phaser.Math.Between(25, 35);
                const x = player.x + Math.cos(angle) * distance;
                const y = player.y + Math.sin(angle) * distance;

                const sparkle = this.scene.add.circle(x, y, 2, 0xffffff, 0.8);

                this.scene.tweens.add({
                    targets: sparkle,
                    alpha: 0,
                    scale: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => sparkle.destroy()
                });
            },
            loop: true
        });
    }

    /**
     * Update burst charge visual effect - ENHANCED CIRCLE
     */
    updateBurstChargeVisual(x, y, chargeLevel) {
        // Destroy previous graphic
        if (this.burstChargeGraphic) {
            this.burstChargeGraphic.destroy();
        }

        // Create charging circle that grows with charge level
        this.burstChargeGraphic = this.scene.add.graphics();

        // Circle grows from 30 to 80 pixels
        const radius = 30 + (chargeLevel * 50);
        const alpha = 0.4 + (chargeLevel * 0.4); // 0.4 to 0.8

        // Outer glow ring (wide, transparent)
        this.burstChargeGraphic.lineStyle(8, 0xffff00, alpha * 0.3);
        this.burstChargeGraphic.strokeCircle(x, y, radius);

        // Middle ring (medium)
        this.burstChargeGraphic.lineStyle(5, 0xffff00, alpha * 0.6);
        this.burstChargeGraphic.strokeCircle(x, y, radius * 0.85);

        // Inner bright ring
        this.burstChargeGraphic.lineStyle(3, 0xffffff, alpha * 0.8);
        this.burstChargeGraphic.strokeCircle(x, y, radius * 0.7);

        // Inner glow fill
        this.burstChargeGraphic.fillStyle(0xffff00, alpha * 0.2);
        this.burstChargeGraphic.fillCircle(x, y, radius * 0.6);

        // Spawn energy particles around the edge
        if (Math.random() < 0.3 + (chargeLevel * 0.5)) { // More particles as charge increases
            const angle = Math.random() * Math.PI * 2;
            const distance = radius;
            const particle = this.scene.add.circle(
                x + Math.cos(angle) * distance,
                y + Math.sin(angle) * distance,
                3 + (chargeLevel * 3),
                0xffff00,
                0.9
            );

            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.2,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Screen shake increases with charge (only when >50% charged)
        if (chargeLevel > 0.5 && Math.random() < 0.08) {
            this.scene.cameras.main.shake(40, 0.002 * chargeLevel);
        }
    }

    /**
     * BERSERKER MODE ABILITY (Z)
     * Increases damage, attack speed, and movement speed for limited duration
     */
    berserker(time) {
        if (!this.canUseAbility('berserker', time)) return false;

        const player = this.scene.player;

        // Activate berserker mode
        this.berserkerActive = true;
        this.berserkerEndTime = time + this.abilities.berserker.duration;

        // Store original values
        this.originalSpeed = player.speed;
        this.originalFireRate = this.scene.autoFireSystem ? this.scene.autoFireSystem.fireRate : 500;

        // Apply buffs
        player.speed = this.originalSpeed * 1.5; // +50% movement speed
        player.damageMultiplier = 2.0; // +100% damage (2x damage)

        // Increase fire rate (reduce delay between shots)
        if (this.scene.autoFireSystem) {
            this.scene.autoFireSystem.fireRate = this.originalFireRate * 0.33; // Shoot 3x faster
        }

        // Create activation effect
        this.createBerserkerActivationEffect(player.x, player.y);

        // Create berserker aura
        this.createBerserkerAura();

        // Apply red tint to player
        player.setTint(0xff0000);

        // Apply red tint to all summoned MiniArchers
        if (this.scene.miniArchers && this.scene.miniArchers.length > 0) {
            this.scene.miniArchers.forEach(miniArcher => {
                if (miniArcher && miniArcher.active) {
                    miniArcher.setTint(0xff0000);
                }
            });
        }

        // Schedule berserker end
        this.scene.time.delayedCall(this.abilities.berserker.duration, () => {
            this.deactivateBerserker();
        });

        this.abilities.berserker.lastUsed = time;
        console.log('🔥 Berserker Mode activated! Damage: 2x, Speed: +50%, Fire Rate: 3x, Cooldowns: -75% (4x faster)');
        return true;
    }

    /**
     * Summon ability (F) - Spawn 5 mini archers that follow and fight
     * They appear one by one with portal effects
     */
    summon(time) {
        if (!this.canUseAbility('summon', time)) return false;

        const player = this.scene.player;

        // Create initial activation effect at center
        this.createSummonActivationEffect(player.x, player.y);

        // Import MiniArcher class
        import('../entities/MiniArcher.js').then((module) => {
            const MiniArcher = module.default;

            // Spawn 5 mini archers in a circle around player
            const archerCount = 5;
            const spawnRadius = 60; // Distance from player
            const angleStep = (Math.PI * 2) / archerCount;
            const spawnDelay = 120; // ms between each spawn

            // Create mini archers one by one with delays
            for (let i = 0; i < archerCount; i++) {
                this.scene.time.delayedCall(i * spawnDelay, () => {
                    const angle = angleStep * i;
                    const spawnX = player.x + Math.cos(angle) * spawnRadius;
                    const spawnY = player.y + Math.sin(angle) * spawnRadius;

                    // Calculate follow offset (they'll maintain this relative position)
                    const offsetX = Math.cos(angle) * 50;
                    const offsetY = Math.sin(angle) * 50;

                    // Create portal effect at spawn position
                    this.createPortalSpawnEffect(spawnX, spawnY);

                    // Delay archer creation slightly after portal appears
                    this.scene.time.delayedCall(150, () => {
                        // Create mini archer
                        const miniArcher = new MiniArcher(this.scene, spawnX, spawnY, offsetX, offsetY);

                        // Store in scene for updates
                        if (!this.scene.miniArchers) {
                            this.scene.miniArchers = [];
                        }
                        this.scene.miniArchers.push(miniArcher);

                        // Apply red tint if berserker mode is active
                        if (this.berserkerActive) {
                            miniArcher.setTint(0xff0000);
                        }

                        console.log(`🏹 Mini archer ${i + 1}/5 spawned!`);
                    });
                });
            }
        });

        this.abilities.summon.lastUsed = time;
        return true;
    }

    /**
     * Deactivate berserker mode
     */
    deactivateBerserker() {
        this.berserkerActive = false;

        const player = this.scene.player;

        // Restore original values
        if (this.originalSpeed !== null) {
            player.speed = this.originalSpeed;
        }
        player.damageMultiplier = 1.0; // Reset damage multiplier

        // Restore fire rate
        if (this.scene.autoFireSystem && this.originalFireRate !== null) {
            this.scene.autoFireSystem.fireRate = this.originalFireRate;
        }

        // Clear player tint
        player.clearTint();

        // Clear tint from all summoned MiniArchers
        if (this.scene.miniArchers && this.scene.miniArchers.length > 0) {
            this.scene.miniArchers.forEach(miniArcher => {
                if (miniArcher && miniArcher.active) {
                    miniArcher.clearTint();
                }
            });
        }

        // Destroy berserker aura
        if (this.berserkerGraphic) {
            this.scene.tweens.add({
                targets: this.berserkerGraphic,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (this.berserkerGraphic) {
                        this.berserkerGraphic.destroy();
                        this.berserkerGraphic = null;
                    }
                }
            });
        }

        console.log('🔥 Berserker Mode deactivated');
    }

    /**
     * BERSERKER VISUAL EFFECTS
     */

    /**
     * Create berserker activation effect
     */
    createBerserkerActivationEffect(x, y) {
        // Expanding red energy wave
        const wave = this.scene.add.graphics();
        wave.lineStyle(4, 0xff0000, 0.9);
        wave.strokeCircle(x, y, 15);

        this.scene.tweens.add({
            targets: wave,
            scaleX: 6,
            scaleY: 6,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => wave.destroy()
        });

        // Secondary pulse
        this.scene.time.delayedCall(100, () => {
            const pulse = this.scene.add.graphics();
            pulse.lineStyle(3, 0xff3333, 0.7);
            pulse.strokeCircle(x, y, 20);

            this.scene.tweens.add({
                targets: pulse,
                scaleX: 4,
                scaleY: 4,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => pulse.destroy()
            });
        });

        // Activation flash
        const flash = this.scene.add.circle(x, y, 20, 0xffffff, 0.9);

        this.scene.tweens.add({
            targets: flash,
            scale: 4,
            alpha: 0,
            duration: 400,
            ease: 'Power3',
            onComplete: () => flash.destroy()
        });

        // Particle burst - fiery particles
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const colors = [0xff0000, 0xff3300, 0xff6600, 0xff0033];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particle = this.scene.add.circle(x, y, Phaser.Math.Between(3, 6), color);

            const distance = Phaser.Math.Between(40, 80);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(300, 600),
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Screen flash
        const screenFlash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xff0000,
            0.5
        );
        screenFlash.setScrollFactor(0);
        screenFlash.setDepth(1000);

        this.scene.tweens.add({
            targets: screenFlash,
            alpha: 0,
            duration: 200,
            onComplete: () => screenFlash.destroy()
        });

        // Camera shake
        this.scene.cameras.main.shake(300, 0.008);
    }

    /**
     * Create berserker aura around player
     */
    createBerserkerAura() {
        if (this.berserkerGraphic) {
            this.berserkerGraphic.destroy();
        }

        const player = this.scene.player;

        // Container for berserker graphics (just particles, no glow)
        this.berserkerGraphic = this.scene.add.container(player.x, player.y);
        this.berserkerGraphic.setDepth(player.depth - 1); // Behind player

        // Only fiery sparkle particles (no glow circles)
        this.createBerserkerSparkles();
    }

    /**
     * Create fiery sparkle particles around berserker aura
     */
    createBerserkerSparkles() {
        // Continuously spawn fire sparkles while berserker is active
        const sparkleEvent = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.berserkerActive) {
                    sparkleEvent.remove();
                    return;
                }

                const player = this.scene.player;
                const angle = Math.random() * Math.PI * 2;
                const distance = Phaser.Math.Between(28, 40);
                const x = player.x + Math.cos(angle) * distance;
                const y = player.y + Math.sin(angle) * distance;

                const colors = [0xff0000, 0xff3300, 0xff6600, 0xffaa00];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const sparkle = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.9);

                // Float upward
                this.scene.tweens.add({
                    targets: sparkle,
                    y: y - Phaser.Math.Between(20, 40),
                    alpha: 0,
                    scale: 0,
                    duration: Phaser.Math.Between(400, 700),
                    ease: 'Power2',
                    onComplete: () => sparkle.destroy()
                });
            },
            loop: true
        });
    }

    /**
     * Create summon activation effect
     */
    createSummonActivationEffect(x, y) {
        // Golden energy waves (summoning circle)
        const waveCount = 3;
        for (let i = 0; i < waveCount; i++) {
            this.scene.time.delayedCall(i * 100, () => {
                const wave = this.scene.add.graphics();
                wave.lineStyle(3, 0xffcc00, 0.8);
                wave.strokeCircle(x, y, 20 + i * 15);

                this.scene.tweens.add({
                    targets: wave,
                    scaleX: 2,
                    scaleY: 2,
                    alpha: 0,
                    duration: 600,
                    ease: 'Power2',
                    onComplete: () => wave.destroy()
                });
            });
        }

        // Golden flash
        const flash = this.scene.add.circle(x, y, 25, 0xffffff, 0.8);

        this.scene.tweens.add({
            targets: flash,
            scale: 3,
            alpha: 0,
            duration: 400,
            ease: 'Power3',
            onComplete: () => flash.destroy()
        });

        // Particle burst - golden particles
        for (let i = 0; i < 25; i++) {
            const angle = (Math.PI * 2 * i) / 25;
            const colors = [0xffff00, 0xffcc00, 0xffaa00];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particle = this.scene.add.circle(x, y, Phaser.Math.Between(3, 5), color);

            const distance = Phaser.Math.Between(50, 90);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(400, 700),
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Camera shake
        this.scene.cameras.main.shake(200, 0.004);
    }

    /**
     * Create portal spawn effect for individual mini archers
     */
    createPortalSpawnEffect(x, y) {
        // Portal ring that expands from center
        const portalRing = this.scene.add.graphics();
        portalRing.lineStyle(3, 0xffcc00, 0.9);
        portalRing.strokeCircle(x, y, 5);

        this.scene.tweens.add({
            targets: portalRing,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => portalRing.destroy()
        });

        // Bright flash at spawn point
        const flash = this.scene.add.circle(x, y, 8, 0xffffff, 1);

        this.scene.tweens.add({
            targets: flash,
            scale: 2.5,
            alpha: 0,
            duration: 250,
            ease: 'Power3',
            onComplete: () => flash.destroy()
        });

        // Swirling particles around spawn point
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const colors = [0xffff00, 0xffcc00, 0xffaa00];
            const color = colors[Math.floor(Math.random() * colors.length)];

            // Start particles at outer radius, spiral inward
            const startRadius = 30;
            const particle = this.scene.add.circle(
                x + Math.cos(angle) * startRadius,
                y + Math.sin(angle) * startRadius,
                3,
                color,
                0.9
            );

            // Spiral particles inward toward center
            this.scene.tweens.add({
                targets: particle,
                x: x,
                y: y,
                alpha: 0,
                scale: 0.2,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Rising particles (from ground up)
        for (let i = 0; i < 8; i++) {
            this.scene.time.delayedCall(i * 30, () => {
                const offsetX = (Math.random() - 0.5) * 20;
                const particle = this.scene.add.circle(
                    x + offsetX,
                    y + 10,
                    2,
                    0xffcc00,
                    0.8
                );

                this.scene.tweens.add({
                    targets: particle,
                    y: y - 30,
                    alpha: 0,
                    duration: 400,
                    ease: 'Power2',
                    onComplete: () => particle.destroy()
                });
            });
        }

        // Small camera shake
        this.scene.cameras.main.shake(80, 0.002);
    }

    /**
     * Show tutorial message when player releases E too quickly
     */
    showHoldETutorial() {
        // Only show once per game
        if (this.hasShownHoldETutorial) return;
        this.hasShownHoldETutorial = true;

        // Don't spam the message - destroy previous if exists
        if (this.holdETutorialText) {
            this.holdETutorialText.destroy();
        }

        // Create tutorial text
        this.holdETutorialText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            200,
            'HOLD E TO CHARGE!',
            {
                fontSize: '42px',
                fontFamily: 'Arial',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 6,
                fontStyle: 'bold'
            }
        );
        this.holdETutorialText.setOrigin(0.5);
        this.holdETutorialText.setScrollFactor(0);
        this.holdETutorialText.setDepth(9999);
        this.holdETutorialText.setAlpha(0);

        // Fade in animation
        this.scene.tweens.add({
            targets: this.holdETutorialText,
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });

        // Pulse effect
        this.scene.tweens.add({
            targets: this.holdETutorialText,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 400,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        });

        // Fade out and destroy after 2.5 seconds
        this.scene.time.delayedCall(2500, () => {
            if (this.holdETutorialText) {
                this.scene.tweens.add({
                    targets: this.holdETutorialText,
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        if (this.holdETutorialText) {
                            this.holdETutorialText.destroy();
                            this.holdETutorialText = null;
                        }
                    }
                });
            }
        });

        console.log('💡 Tutorial: HOLD E TO CHARGE shown');
    }

    /**
     * RICOCHET VISUAL EFFECTS
     */

    /**
     * Create ricochet activation effect
     */
    createRicochetActivationEffect(x, y) {
        // Yellow/orange energy wave
        const wave = this.scene.add.graphics();
        wave.lineStyle(3, 0xffaa00, 0.9);
        wave.strokeCircle(x, y, 15);

        this.scene.tweens.add({
            targets: wave,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => wave.destroy()
        });

        // Activation flash
        const flash = this.scene.add.circle(x, y, 20, 0xffff00, 0.8);

        this.scene.tweens.add({
            targets: flash,
            scale: 3,
            alpha: 0,
            duration: 400,
            ease: 'Power3',
            onComplete: () => flash.destroy()
        });

        // Particle burst - yellow/orange particles
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const colors = [0xffff00, 0xffaa00, 0xff9900];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particle = this.scene.add.circle(x, y, Phaser.Math.Between(3, 5), color);

            const distance = Phaser.Math.Between(30, 60);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: Phaser.Math.Between(300, 500),
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }

        // Small camera shake
        this.scene.cameras.main.shake(150, 0.003);
    }

    /**
     * Create ricochet deactivation effect
     */
    createRicochetDeactivationEffect(x, y) {
        // Simple fade out ring
        const ring = this.scene.add.graphics();
        ring.lineStyle(2, 0x666666, 0.6);
        ring.strokeCircle(x, y, 25);

        this.scene.tweens.add({
            targets: ring,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });
    }

    /**
     * Create ricochet aura around player
     */
    createRicochetAura() {
        if (this.ricochetGraphic) {
            this.ricochetGraphic.destroy();
        }

        const player = this.scene.player;

        // Container for ricochet graphics
        this.ricochetGraphic = this.scene.add.container(player.x, player.y);
        this.ricochetGraphic.setDepth(player.depth - 1); // Behind player

        // Only sparkle particles (no glow)
        this.createRicochetSparkles();
    }

    /**
     * Create sparkle particles around ricochet aura
     */
    createRicochetSparkles() {
        // Continuously spawn sparkles while ricochet is active
        const sparkleEvent = this.scene.time.addEvent({
            delay: 100,
            callback: () => {
                if (!this.ricochetActive) {
                    sparkleEvent.remove();
                    return;
                }

                const player = this.scene.player;
                const angle = Math.random() * Math.PI * 2;
                const distance = Phaser.Math.Between(28, 40);
                const x = player.x + Math.cos(angle) * distance;
                const y = player.y + Math.sin(angle) * distance;

                const colors = [0xffff00, 0xffaa00, 0xff9900];
                const color = colors[Math.floor(Math.random() * colors.length)];
                const sparkle = this.scene.add.circle(x, y, Phaser.Math.Between(2, 4), color, 0.9);

                // Float upward
                this.scene.tweens.add({
                    targets: sparkle,
                    y: y - Phaser.Math.Between(20, 40),
                    alpha: 0,
                    scale: 0,
                    duration: Phaser.Math.Between(400, 700),
                    ease: 'Power2',
                    onComplete: () => sparkle.destroy()
                });
            },
            loop: true
        });
    }

    /**
     * Deactivate ricochet mode
     */
    deactivateRicochet() {
        this.ricochetActive = false;

        const player = this.scene.player;

        // Clear player tint
        player.clearTint();

        // Disable ricochet
        player.ricochetEnabled = false;

        // Destroy ricochet aura
        if (this.ricochetGraphic) {
            this.scene.tweens.add({
                targets: this.ricochetGraphic,
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    if (this.ricochetGraphic) {
                        this.ricochetGraphic.destroy();
                        this.ricochetGraphic = null;
                    }
                }
            });
        }

        // Create deactivation effect
        this.createRicochetDeactivationEffect(player.x, player.y);

        console.log('❌ Ricochet deactivated');
    }

    /**
     * Arrow Storm ability (M) - Rain of arrows from the sky at cursor position
     */
    arrowStorm(time) {
        if (!this.canUseAbility('arrowStorm', time)) return false;

        // Get cursor position in world coordinates
        const pointer = this.scene.input.activePointer;
        const targetX = pointer.worldX;
        const targetY = pointer.worldY;

        const player = this.scene.player;
        const arrowCount = 30;
        const duration = this.abilities.arrowStorm.duration;
        const radius = 150; // Area radius where arrows will fall
        const damage = 1; // Base damage per arrow (low damage but high volume)

        // Spawn arrows over time (no indicator)
        for (let i = 0; i < arrowCount; i++) {
            const delay = (i / arrowCount) * duration; // Spread over duration

            this.scene.time.delayedCall(delay, () => {
                // Random position within radius
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * radius;
                const finalX = targetX + Math.cos(angle) * distance;
                const finalY = targetY + Math.sin(angle) * distance;

                // Start arrow high above the target
                const startY = finalY - 400;

                // Create the arrow projectile
                const Projectile = this.scene.projectiles.classType;
                const arrow = new Projectile(
                    this.scene,
                    finalX,
                    startY,
                    'arrow'
                );

                // Add to group for tracking
                this.scene.projectiles.add(arrow);

                // Set frame 0 (flying arrow)
                arrow.setFrame(0);

                // Reset stuck state
                arrow.stuckToEnemy = null;
                arrow.stuckOffsetX = 0;
                arrow.stuckOffsetY = 0;

                // Set damage (affected by berserker)
                arrow.damage = damage * (player.damageMultiplier || 1);

                // Rotate arrow to point down
                arrow.rotation = Math.PI / 2; // 90 degrees = pointing down

                // Enable ricochet if player has the ability active
                if (player.ricochetEnabled) {
                    arrow.ricochetEnabled = true;
                }

                // Set depth so arrows appear above ground but below UI
                arrow.setDepth(100);

                // Create trail effect
                this.createArrowStormTrail(arrow);

                // Animate arrow falling down with tween (stops at exact position)
                const fallDuration = 500; // ms to fall

                // Update prevX/prevY for collision detection before tween starts
                arrow.prevX = arrow.x;
                arrow.prevY = arrow.y;

                this.scene.tweens.add({
                    targets: arrow,
                    y: finalY,
                    duration: fallDuration,
                    ease: 'Cubic.easeIn',
                    onUpdate: () => {
                        // Update prevX/prevY every frame for collision detection
                        // This allows the raycast system to work with tween movement
                        if (arrow.active && !arrow.stuckToEnemy && !arrow.stuckToHut && !arrow.stuckToGround) {
                            arrow.prevX = arrow.x;
                            arrow.prevY = arrow.y - 10; // Previous Y was slightly higher
                        }
                    },
                    onComplete: () => {
                        // Only land if arrow hasn't hit an enemy/hut already
                        if (!arrow.stuckToEnemy && !arrow.stuckToHut) {
                            // Arrow landed - stop it exactly here
                            arrow.velocityX = 0;
                            arrow.velocityY = 0;

                            // Change to stuck texture (arrow-hit = arrow without tip)
                            arrow.setTexture('arrow-hit');

                            // Create impact effect
                            this.createArrowStormImpact(finalX, finalY);

                            // Mark arrow as "stuck to ground" so it doesn't move
                            arrow.stuckToGround = true;

                            // Despawn arrow after 2 seconds
                            this.scene.time.delayedCall(2000, () => {
                                if (arrow && arrow.active) {
                                    arrow.destroy();
                                }
                            });
                        }
                    }
                });
            });
        }

        this.abilities.arrowStorm.lastUsed = time;
        console.log(`🌧️ Arrow Storm activated at (${targetX.toFixed(0)}, ${targetY.toFixed(0)})! 30 arrows incoming!`);
        return true;
    }

    /**
     * Create target indicator on ground where arrows will fall
     */
    createArrowStormTargetIndicator(x, y, radius, duration) {
        // Pulsing circle indicator
        const indicator = this.scene.add.graphics();
        indicator.lineStyle(3, 0xff6600, 0.7);
        indicator.strokeCircle(x, y, radius);
        indicator.setDepth(1);

        // Inner circle
        const innerCircle = this.scene.add.graphics();
        innerCircle.lineStyle(2, 0xffaa00, 0.5);
        innerCircle.strokeCircle(x, y, radius * 0.7);
        innerCircle.setDepth(1);

        // Pulsing animation
        this.scene.tweens.add({
            targets: [indicator, innerCircle],
            alpha: 0.3,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: Math.ceil(duration / 1000)
        });

        // Warning flash
        const warning = this.scene.add.circle(x, y, radius, 0xff0000, 0.2);
        warning.setDepth(1);

        this.scene.tweens.add({
            targets: warning,
            alpha: 0,
            duration: 300,
            onComplete: () => warning.destroy()
        });

        // Clean up after duration
        this.scene.time.delayedCall(duration, () => {
            indicator.destroy();
            innerCircle.destroy();
        });

        // Screen shake warning
        this.scene.cameras.main.shake(100, 0.002);
    }

    /**
     * Create trail effect for falling arrows
     */
    createArrowStormTrail(arrow) {
        const trailEvent = this.scene.time.addEvent({
            delay: 40,
            callback: () => {
                if (!arrow.active) {
                    trailEvent.remove();
                    return;
                }

                const trail = this.scene.add.circle(
                    arrow.x,
                    arrow.y - 10,
                    3,
                    0xffaa00,
                    0.6
                );
                trail.setDepth(arrow.depth - 1);

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

        // Clean up trail when arrow is destroyed
        arrow.once('destroy', () => {
            trailEvent.remove();
        });
    }

    /**
     * Create impact effect when arrow hits ground
     */
    createArrowStormImpact(x, y) {
        // Impact flash
        const flash = this.scene.add.circle(x, y, 8, 0xffff00, 0.8);
        flash.setDepth(50);

        this.scene.tweens.add({
            targets: flash,
            scale: 2,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Impact ring
        const ring = this.scene.add.graphics();
        ring.lineStyle(2, 0xffaa00, 0.7);
        ring.strokeCircle(x, y, 5);
        ring.setDepth(50);

        this.scene.tweens.add({
            targets: ring,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });

        // Impact particles
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            const particle = this.scene.add.circle(
                x,
                y,
                2,
                0xff9900,
                0.8
            );
            particle.setDepth(50);

            const distance = Phaser.Math.Between(10, 20);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: 250,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * PRISM ABILITY (T) - Orbital prism that triples projectiles
     */
    prism(time) {
        if (!this.canUseAbility('prism', time)) return false;

        const player = this.scene.player;

        // Activate prism
        this.prismActive = true;
        this.prismEndTime = time + this.abilities.prism.duration;
        this.prismAngle = 0; // Start at angle 0
        this.processedProjectiles.clear(); // Reset processed projectiles

        // Create activation effect
        this.createPrismActivationEffect(player.x, player.y);

        // Create prism visual
        this.createPrismGraphic();

        // Schedule prism end
        this.scene.time.delayedCall(this.abilities.prism.duration, () => {
            this.deactivatePrism();
        });

        this.abilities.prism.lastUsed = time;
        console.log('💎 PRISM ACTIVATED! Projectiles will triple for 10 seconds!');
        return true;
    }

    /**
     * Create prism graphic - crystalline orbital sprite
     */
    createPrismGraphic() {
        if (this.prismGraphic) {
            this.prismGraphic.destroy();
        }

        const player = this.scene.player;

        // Create prism as a graphics object (diamond shape with rainbow gradient)
        this.prismGraphic = this.scene.add.graphics();

        // Calculate initial position
        const prismX = player.x + Math.cos(this.prismAngle) * this.prismRadius;
        const prismY = player.y + Math.sin(this.prismAngle) * this.prismRadius;

        this.prismGraphic.x = prismX;
        this.prismGraphic.y = prismY;
        this.prismGraphic.setDepth(player.depth + 1); // Above player

        // Draw diamond shape (prism)
        const size = 20;
        this.prismGraphic.lineStyle(3, 0xffffff, 0.9);
        this.prismGraphic.fillStyle(0x00ffff, 0.6);
        this.prismGraphic.beginPath();
        this.prismGraphic.moveTo(0, -size); // Top
        this.prismGraphic.lineTo(size, 0); // Right
        this.prismGraphic.lineTo(0, size); // Bottom
        this.prismGraphic.lineTo(-size, 0); // Left
        this.prismGraphic.closePath();
        this.prismGraphic.fillPath();
        this.prismGraphic.strokePath();

        // Add inner glow
        this.prismGraphic.fillStyle(0xffffff, 0.4);
        this.prismGraphic.fillCircle(0, 0, size * 0.4);

        // Create orbital trail effect
        this.createPrismTrail();
    }

    /**
     * Create continuous trail effect for orbiting prism
     */
    createPrismTrail() {
        const trailEvent = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (!this.prismActive || !this.prismGraphic) {
                    trailEvent.remove();
                    return;
                }

                // Rainbow colors cycling
                const colors = [0xff0000, 0xff9900, 0xffff00, 0x00ff00, 0x00ffff, 0x0099ff, 0x9900ff];
                const colorIndex = Math.floor((Date.now() / 100) % colors.length);
                const color = colors[colorIndex];

                const trail = this.scene.add.circle(
                    this.prismGraphic.x,
                    this.prismGraphic.y,
                    4,
                    color,
                    0.6
                );
                trail.setDepth(this.prismGraphic.depth - 1);

                this.scene.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 0.2,
                    duration: 400,
                    ease: 'Power2',
                    onComplete: () => trail.destroy()
                });
            },
            loop: true
        });
    }

    /**
     * Check all projectiles near prism and split them
     */
    checkProjectilesNearPrism(prismX, prismY, time) {
        const projectiles = this.scene.projectiles.getChildren();

        for (const projectile of projectiles) {
            if (!projectile.active) continue;
            if (this.processedProjectiles.has(projectile)) continue; // Already processed

            // CRITICAL: Only split ALLIED projectiles (player + minions), NOT enemy projectiles
            if (projectile.isEnemyProjectile) continue;

            // Calculate distance to prism
            const dist = Phaser.Math.Distance.Between(
                projectile.x, projectile.y,
                prismX, prismY
            );

            // If projectile is close enough, split it
            if (dist < this.prismDetectionRadius) {
                this.splitProjectile(projectile, time);
                this.processedProjectiles.add(projectile); // Mark as processed
            }
        }
    }

    /**
     * Split a projectile into 3 projectiles (center + ±25° spread)
     */
    splitProjectile(originalProjectile, time) {
        const player = this.scene.player;

        // Get original projectile properties
        const originalAngle = originalProjectile.rotation;
        // CRITICAL FIX: Projectiles use custom velocityX/velocityY, not physics body
        const originalSpeed = Math.sqrt(
            originalProjectile.velocityX ** 2 +
            originalProjectile.velocityY ** 2
        );
        const originalDamage = originalProjectile.damage || 10;

        // Angles for the 3 projectiles (center, left, right)
        const spreadAngle = 25 * (Math.PI / 180); // 25 degrees in radians
        const angles = [
            originalAngle, // Center (unchanged)
            originalAngle - spreadAngle, // Left
            originalAngle + spreadAngle // Right
        ];

        // Colors for visual distinction
        const colors = [0xffffff, 0xff00ff, 0x00ffff]; // White, magenta, cyan

        // CRITICAL FIX: Spawn new projectiles AHEAD of the prism
        // Calculate spawn offset (push them forward in their direction)
        const spawnOffset = 100; // Distance ahead of prism (increased to prevent getting stuck)

        // Create 3 new projectiles
        const newProjectiles = [];
        for (let i = 0; i < 3; i++) {
            const angle = angles[i];

            // Calculate spawn position AHEAD in the direction of travel
            const spawnX = originalProjectile.x + Math.cos(angle) * spawnOffset;
            const spawnY = originalProjectile.y + Math.sin(angle) * spawnOffset;

            // Create new projectile at offset position
            const Projectile = this.scene.projectiles.classType;
            const newProj = new Projectile(
                this.scene,
                spawnX,
                spawnY,
                'arrow'
            );

            // Add to group
            this.scene.projectiles.add(newProj);

            // Set properties
            newProj.setFrame(0);
            newProj.damage = originalDamage * 0.7; // 70% damage each
            newProj.rotation = angle;
            newProj.setTint(colors[i]);

            // CRITICAL: Reset all stuck states (prevent arrows from being frozen)
            newProj.stuckToEnemy = null;
            newProj.stuckOffsetX = 0;
            newProj.stuckOffsetY = 0;
            newProj.stuckToHut = null;
            newProj.stuckToGround = false;

            // Enable ricochet if player has it
            if (player.ricochetEnabled) {
                newProj.ricochetEnabled = true;
            }

            // Set velocity
            const velocityX = Math.cos(angle) * originalSpeed;
            const velocityY = Math.sin(angle) * originalSpeed;
            newProj.setVelocity(velocityX, velocityY);

            // Initialize prevX/prevY for raycast collision detection
            newProj.prevX = newProj.x;
            newProj.prevY = newProj.y;

            // Mark as already processed (don't split again)
            this.processedProjectiles.add(newProj);

            newProjectiles.push(newProj);
        }

        // Create split visual effect
        this.createPrismSplitEffect(originalProjectile.x, originalProjectile.y);

        // Destroy original projectile
        originalProjectile.destroy();

        console.log('💎 Projectile SPLIT into 3!');
    }

    /**
     * Create visual effect when prism splits a projectile
     */
    createPrismSplitEffect(x, y) {
        // Flash at split point
        const flash = this.scene.add.circle(x, y, 12, 0xffffff, 0.9);
        flash.setDepth(100);

        this.scene.tweens.add({
            targets: flash,
            scale: 2.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });

        // Rainbow ring
        const ring = this.scene.add.graphics();
        ring.lineStyle(3, 0x00ffff, 0.8);
        ring.strokeCircle(x, y, 8);
        ring.setDepth(100);

        this.scene.tweens.add({
            targets: ring,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });

        // Sparkle particles
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const colors = [0xff0000, 0xff9900, 0xffff00, 0x00ff00, 0x00ffff, 0x0099ff, 0x9900ff];
            const color = colors[i % colors.length];

            const particle = this.scene.add.circle(x, y, 3, color, 0.9);
            particle.setDepth(100);

            const distance = Phaser.Math.Between(15, 30);
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0,
                duration: 300,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Create prism activation effect - CLEAN VERSION
     */
    createPrismActivationEffect(x, y) {
        // Single rainbow ring expanding
        const ring = this.scene.add.graphics();
        ring.lineStyle(4, 0x00ffff, 0.9);
        ring.strokeCircle(x, y, 20);

        this.scene.tweens.add({
            targets: ring,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });

        // Bright central flash
        const flash = this.scene.add.circle(x, y, 15, 0xffffff, 1);

        this.scene.tweens.add({
            targets: flash,
            scale: 2.5,
            alpha: 0,
            duration: 300,
            ease: 'Power3',
            onComplete: () => flash.destroy()
        });

        // Rainbow sparkles (fewer, cleaner)
        const colors = [0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0xff00ff];
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            const color = colors[i % colors.length];
            const sparkle = this.scene.add.circle(x, y, 4, color, 0.9);

            const distance = Phaser.Math.Between(30, 60);
            this.scene.tweens.add({
                targets: sparkle,
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                scale: 0.2,
                duration: 400,
                ease: 'Power2',
                onComplete: () => sparkle.destroy()
            });
        }

        // Light camera shake
        this.scene.cameras.main.shake(150, 0.003);
    }

    /**
     * Deactivate prism
     */
    deactivatePrism() {
        this.prismActive = false;
        this.processedProjectiles.clear();

        const player = this.scene.player;

        // Destroy prism graphic
        if (this.prismGraphic) {
            // Fade out animation
            this.scene.tweens.add({
                targets: this.prismGraphic,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => {
                    if (this.prismGraphic) {
                        this.prismGraphic.destroy();
                        this.prismGraphic = null;
                    }
                }
            });
        }

        console.log('💎 Prism deactivated');
    }

    /**
     * INFINITY ARROWS ABILITY (C) - 8x fire rate for 4 seconds (ULTIMATE BESTIA MODE)
     */
    infinityArrows(time) {
        if (!this.canUseAbility('infinityArrows', time)) return false;

        const player = this.scene.player;

        // Store original fire rate
        if (this.scene.autoFireSystem) {
            this.originalAutoFireCooldown = this.scene.autoFireSystem.fireRate;
        }

        // Activate infinity arrows
        this.infinityArrowsActive = true;
        this.infinityArrowsEndTime = time + this.abilities.infinityArrows.duration;

        // Set flag on player so AutoFireSystem can bypass animation delay
        player.infinityArrowsActive = true;

        // Apply 8x fire rate multiplier (affects both player and minions) - BESTIA MODE!
        player.fireRateMultiplier = 8.0;
        if (this.scene.autoFireSystem) {
            this.scene.autoFireSystem.fireRate = this.originalAutoFireCooldown / 8.0;
        }

        // Reduce damage by 30% to balance the extreme fire rate
        player.damageMultiplier = 0.7;

        // Create subtle activation effects (just rings, no aura)
        this.createInfinityArrowsActivationEffect(player.x, player.y);

        // Schedule deactivation
        this.scene.time.delayedCall(this.abilities.infinityArrows.duration, () => {
            this.deactivateInfinityArrows();
        });

        this.abilities.infinityArrows.lastUsed = time;
        console.log('♾️ INFINITY ARROWS ACTIVATED! Fire rate: 8x, Damage: -30% (balanced) for 4 seconds (affects player + minions)!');
        return true;
    }

    /**
     * Create subtle activation effect for Infinity Arrows (just rings)
     */
    createInfinityArrowsActivationEffect(x, y) {
        // Simple expanding rings - subtle effect
        for (let i = 0; i < 3; i++) {
            this.scene.time.delayedCall(i * 50, () => {
                const ring = this.scene.add.circle(x, y, 20, 0xFFD700, 0);
                ring.setStrokeStyle(2, 0xFFFFFF, 0.7);
                ring.setDepth(1000);

                this.scene.tweens.add({
                    targets: ring,
                    radius: 200,
                    alpha: 0,
                    duration: 600,
                    ease: 'Power2',
                    onComplete: () => ring.destroy()
                });
            });
        }
    }

    /**
     * Create visual aura for Infinity Arrows mode
     */
    createInfinityArrowsAura() {
        const player = this.scene.player;

        // Create glowing golden aura container
        this.infinityArrowsGraphic = this.scene.add.container(player.x, player.y);
        this.infinityArrowsGraphic.setDepth(player.depth - 1);

        // Multiple rotating rings
        for (let i = 0; i < 3; i++) {
            const ring = this.scene.add.circle(0, 0, 40 + i * 15, 0xFFD700, 0);
            ring.setStrokeStyle(2, 0xFFFFFF, 0.6 - i * 0.15);
            this.infinityArrowsGraphic.add(ring);

            // Rotate each ring at different speeds
            this.scene.tweens.add({
                targets: ring,
                angle: 360,
                duration: 2000 - i * 500,
                repeat: -1,
                ease: 'Linear'
            });
        }

        // Add infinity symbol
        const infinityText = this.scene.add.text(0, 0, '∞', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#FFD700',
            stroke: '#FFFFFF',
            strokeThickness: 3
        });
        infinityText.setOrigin(0.5);
        infinityText.setAlpha(0.8);
        this.infinityArrowsGraphic.add(infinityText);

        // Pulse animation for infinity symbol
        this.scene.tweens.add({
            targets: infinityText,
            scale: 1.2,
            alpha: 1,
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Continuous sparkles
        this.createInfinityArrowsSparkles();
    }

    /**
     * Create continuous sparkles for Infinity Arrows aura
     */
    createInfinityArrowsSparkles() {
        const player = this.scene.player;

        const sparkleInterval = this.scene.time.addEvent({
            delay: 50,
            callback: () => {
                if (!this.infinityArrowsActive) {
                    sparkleInterval.destroy();
                    return;
                }

                // Random sparkles around player
                for (let i = 0; i < 3; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 30 + Math.random() * 40;
                    const x = player.x + Math.cos(angle) * distance;
                    const y = player.y + Math.sin(angle) * distance;

                    const sparkle = this.scene.add.circle(x, y, 2 + Math.random() * 3, 0xFFFFFF);
                    sparkle.setDepth(1000);
                    sparkle.setAlpha(0.8);

                    this.scene.tweens.add({
                        targets: sparkle,
                        alpha: 0,
                        scale: 0,
                        y: y - 20,
                        duration: 400,
                        ease: 'Power2',
                        onComplete: () => sparkle.destroy()
                    });
                }
            },
            loop: true
        });
    }

    /**
     * Deactivate Infinity Arrows
     */
    deactivateInfinityArrows() {
        this.infinityArrowsActive = false;

        const player = this.scene.player;

        // Clear flag on player
        player.infinityArrowsActive = false;

        // Restore original fire rate multiplier (for minions)
        player.fireRateMultiplier = 1.0;

        // Restore original damage multiplier
        player.damageMultiplier = 1.0;

        // Restore original fire rate
        if (this.scene.autoFireSystem && this.originalAutoFireCooldown !== null) {
            this.scene.autoFireSystem.fireRate = this.originalAutoFireCooldown;
            this.originalAutoFireCooldown = null;
        }

        // Destroy aura graphic
        if (this.infinityArrowsGraphic) {
            this.scene.tweens.add({
                targets: this.infinityArrowsGraphic,
                alpha: 0,
                scale: 0,
                duration: 300,
                onComplete: () => {
                    if (this.infinityArrowsGraphic) {
                        this.infinityArrowsGraphic.destroy();
                        this.infinityArrowsGraphic = null;
                    }
                }
            });
        }

        // Deactivation effect
        this.createInfinityArrowsDeactivationEffect(player.x, player.y);

        console.log('♾️ Infinity Arrows deactivated');
    }

    /**
     * Create deactivation effect for Infinity Arrows
     */
    createInfinityArrowsDeactivationEffect(x, y) {
        // Collapsing ring
        const ring = this.scene.add.circle(x, y, 100, 0xFFD700, 0);
        ring.setStrokeStyle(3, 0xFFFFFF, 0.8);
        ring.setDepth(1000);

        this.scene.tweens.add({
            targets: ring,
            radius: 0,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => ring.destroy()
        });

        // Particle implosion
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const distance = 80;
            const startX = x + Math.cos(angle) * distance;
            const startY = y + Math.sin(angle) * distance;

            const particle = this.scene.add.circle(startX, startY, 3, 0xFFD700);
            particle.setDepth(1000);

            this.scene.tweens.add({
                targets: particle,
                x: x,
                y: y,
                alpha: 0,
                duration: 250,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
}
