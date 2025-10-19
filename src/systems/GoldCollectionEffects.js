/**
 * GoldCollectionEffects - Makes gold collection ULTRA DOPAMINIC
 *
 * Features:
 * - Explosive sparkle particles radiating outward
 * - Golden glow particles
 * - Screen shake/camera shake
 * - Flash overlay effect
 * - Floating +GOLD text with scale animation
 * - Combo multiplier for rapid collection
 * - Enhanced magnetic pull with visual feedback
 */

export default class GoldCollectionEffects {
    constructor(scene) {
        this.scene = scene;

        // Cumulative gold tracking
        this.currentGoldValue = 0; // Current +X value to show
        this.comboTimer = null;
        this.comboResetDelay = 3000; // Reset after 3 seconds
        this.currentFloatingText = null; // Track current floating text

        // Flash overlay
        this.createFlashOverlay();

        // Particle emitters
        this.createParticleEmitters();
    }

    createFlashOverlay() {
        // Create a white rectangle overlay for flash effects
        this.flashOverlay = this.scene.add.rectangle(
            0, 0,
            this.scene.cameras.main.width * 2,
            this.scene.cameras.main.height * 2,
            0xFFFFFF,
            0
        );
        this.flashOverlay.setScrollFactor(0); // Fixed to camera
        this.flashOverlay.setDepth(9999); // Always on top
    }

    createParticleEmitters() {
        // Create a simple particle texture if it doesn't exist
        if (!this.scene.textures.exists('particle-white')) {
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xFFFFFF, 1);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture('particle-white', 8, 8);
            graphics.destroy();
        }
    }

    /**
     * Trigger all dopaminic effects when gold is collected
     * @param {Phaser.GameObjects.Sprite} player - The player sprite to position text above
     */
    triggerCollectionEffects(player, amount = 1) {
        // Increment the gold value (+1, +2, +3, etc.)
        this.currentGoldValue++;

        // Trigger effects with increasing intensity based on combo
        this.spawnExplosionParticles(player.x, player.y, this.currentGoldValue);
        this.spawnGlowParticles(player.x, player.y, this.currentGoldValue);
        this.updateFloatingText(player, this.currentGoldValue);
        this.triggerScreenShake(this.currentGoldValue);
        this.triggerFlashEffect(this.currentGoldValue);

        // Reset timer
        this.resetComboTimer();

        return this.currentGoldValue;
    }

    /**
     * Spawn explosive sparkle particles radiating outward
     */
    spawnExplosionParticles(x, y, comboCount) {
        const particleCount = 15 + (comboCount * 5); // More particles with combo
        const colors = [0xFFD700, 0xFFA500, 0xFFFF00, 0xFFE4B5]; // Gold colors

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 200 + Math.random() * 200 + (comboCount * 50);
            const color = Phaser.Utils.Array.GetRandom(colors);

            const particle = this.scene.add.circle(x, y, 3 + Math.random() * 3, color);
            particle.setDepth(100);

            // Physics for particle
            this.scene.physics.add.existing(particle);
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            particle.body.setVelocity(velocityX, velocityY);
            particle.body.setDrag(300);

            // Fade out and scale down
            this.scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.3,
                duration: 500 + Math.random() * 300,
                ease: 'Cubic.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Spawn slower, glowing golden particles
     */
    spawnGlowParticles(x, y, comboCount) {
        const glowCount = 8 + (comboCount * 2);

        for (let i = 0; i < glowCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            const endX = x + Math.cos(angle) * distance;
            const endY = y + Math.sin(angle) * distance - 50; // Float upward

            const glow = this.scene.add.circle(x, y, 5 + Math.random() * 5, 0xFFD700, 0.8);
            glow.setDepth(99);
            glow.setBlendMode(Phaser.BlendModes.ADD); // Additive blending for glow

            // Float upward and fade
            this.scene.tweens.add({
                targets: glow,
                x: endX,
                y: endY,
                alpha: 0,
                scale: 0.2,
                duration: 800 + Math.random() * 400,
                ease: 'Sine.easeOut',
                onComplete: () => glow.destroy()
            });
        }
    }

    /**
     * Update or create floating text showing current gold value (+1, +2, +3, etc.)
     * @param {Phaser.GameObjects.Sprite} player - The player sprite to position text above
     * @param {number} goldValue - The current gold value to display (+1, +2, +3, etc.)
     */
    updateFloatingText(player, goldValue) {
        // Simple text showing current value: "+1", "+2", "+3", etc.
        const text = `+${goldValue}`;

        // Smaller font sizes
        let color = '#FFD700';
        let fontSize = 14; // Small and clean

        // Color changes based on combo
        if (goldValue >= 5) {
            color = '#FF6B00'; // Orange for good combo
        }
        if (goldValue >= 10) {
            color = '#FF1493'; // Pink for great combo
        }
        if (goldValue >= 15) {
            color = '#00FF00'; // Green for mega combo
        }

        // Always destroy old text and create new one
        if (this.currentFloatingText && this.currentFloatingText.active) {
            this.scene.tweens.killTweensOf(this.currentFloatingText);
            this.currentFloatingText.destroy();
        }

        // Create new floating text above player
        this.currentFloatingText = this.scene.add.text(player.x, player.y - 60, text, {
            fontSize: `${fontSize}px`,
            fontFamily: 'Arial Black',
            color: color,
            stroke: '#000000',
            strokeThickness: 3,
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000000',
                blur: 3,
                fill: true
            }
        });
        this.currentFloatingText.setOrigin(0.5);
        this.currentFloatingText.setDepth(101);
        this.currentFloatingText.setScale(0.8);

        // Pulse in animation
        this.scene.tweens.add({
            targets: this.currentFloatingText,
            scale: 1.2,
            duration: 150,
            ease: 'Back.easeOut',
            yoyo: true,
            onComplete: () => {
                // After pulse, float upward slowly
                this.scene.tweens.add({
                    targets: this.currentFloatingText,
                    y: this.currentFloatingText.y - 40,
                    alpha: 0.8,
                    duration: 3000,
                    ease: 'Cubic.easeOut'
                });
            }
        });
    }

    /**
     * Trigger camera shake effect
     */
    triggerScreenShake(comboCount) {
        // Reduced shake intensity for less aggressive feel
        const baseIntensity = 0.002; // Reduced from 0.003
        const comboBonus = comboCount * 0.0003; // Reduced from 0.001
        const intensity = Math.min(baseIntensity + comboBonus, 0.008); // Cap at 0.008
        const duration = 100 + (comboCount * 10); // Reduced from 150 + (comboCount * 20)

        this.scene.cameras.main.shake(duration, intensity);
    }

    /**
     * Trigger white flash overlay effect
     */
    triggerFlashEffect(comboCount) {
        const maxAlpha = 0.3 + (comboCount * 0.05); // Brighter with combo
        const duration = 100 + (comboCount * 10);

        this.flashOverlay.setAlpha(maxAlpha);

        this.scene.tweens.add({
            targets: this.flashOverlay,
            alpha: 0,
            duration: duration,
            ease: 'Cubic.easeOut'
        });
    }

    /**
     * Reset combo timer - called on each gold collection
     */
    resetComboTimer() {
        // Clear existing timer
        if (this.comboTimer) {
            this.comboTimer.remove();
        }

        // Set new timer to reset combo and fade out text (3 seconds)
        this.comboTimer = this.scene.time.delayedCall(this.comboResetDelay, () => {
            // Fade out and destroy current text
            if (this.currentFloatingText && this.currentFloatingText.active) {
                this.scene.tweens.add({
                    targets: this.currentFloatingText,
                    alpha: 0,
                    duration: 300,
                    ease: 'Cubic.easeOut',
                    onComplete: () => {
                        if (this.currentFloatingText) {
                            this.currentFloatingText.destroy();
                            this.currentFloatingText = null;
                        }
                    }
                });
            }

            // Reset gold value back to 0 (so next collection is +1 again)
            this.currentGoldValue = 0;
        });
    }

    /**
     * Enhanced magnetic pull effect with visual feedback
     */
    updateMagneticPull(coins, player) {
        const MAGNET_RANGE = 200; // Increased range for more dopamine
        const MAGNET_SPEED = 400; // Faster pull
        const PULSE_RANGE = 100; // Range at which coins start pulsing

        coins.getChildren().forEach(coin => {
            if (!coin.getData('canCollect')) return;

            const distance = Phaser.Math.Distance.Between(
                player.x, player.y,
                coin.x, coin.y
            );

            // Magnetic pull
            if (distance < MAGNET_RANGE) {
                const angle = Phaser.Math.Angle.Between(coin.x, coin.y, player.x, player.y);

                // Accelerate as coin gets closer
                const pullStrength = 1 - (distance / MAGNET_RANGE);
                const speed = MAGNET_SPEED * (0.5 + pullStrength);

                const velocityX = Math.cos(angle) * speed;
                const velocityY = Math.sin(angle) * speed;
                coin.setVelocity(velocityX, velocityY);

                // Visual feedback: pulse and glow when close
                if (distance < PULSE_RANGE) {
                    // Scale pulse effect
                    if (!coin.getData('isPulsing')) {
                        coin.setData('isPulsing', true);

                        this.scene.tweens.add({
                            targets: coin,
                            scale: 1.3,
                            duration: 200,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });

                        // Add golden tint
                        coin.setTint(0xFFFF00);
                    }
                }
            } else {
                // Outside range - stop and reset
                coin.setVelocity(0, 0);

                if (coin.getData('isPulsing')) {
                    coin.setData('isPulsing', false);
                    this.scene.tweens.killTweensOf(coin);
                    coin.setScale(1.0);
                    coin.clearTint();
                }
            }
        });
    }

    /**
     * Get current gold value (number shown in +X)
     */
    getComboCount() {
        return this.currentGoldValue;
    }

    /**
     * Cleanup
     */
    destroy() {
        if (this.comboTimer) {
            this.comboTimer.remove();
        }
        if (this.flashOverlay) {
            this.flashOverlay.destroy();
        }
    }
}
