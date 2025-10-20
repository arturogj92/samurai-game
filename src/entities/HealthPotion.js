import Phaser from 'phaser';

/**
 * HealthPotion - Collectible item that heals the player
 * Spawns from enemies with 5% drop rate
 * Auto-absorbs on collision with player
 */
export default class HealthPotion extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'health-potion', 0);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.scene = scene;
        this.healAmount = 40; // Heals 40 HP
        this.isCollectible = false; // Start as not collectible
        this.canCollect = false; // For magnetic collection system

        // Physics setup - very small, subtle potion
        this.setScale(0.08); // Much smaller, more subtle
        this.setDepth(50); // Same depth as gold coins
        this.body.setSize(25, 25); // Smaller hitbox
        this.body.setOffset(52, 52); // Center the hitbox

        // Spawn animation: bounce and land
        this.spawnAnimation();
    }

    /**
     * Spawn animation: potion drops and bounces
     */
    spawnAnimation() {
        // Start slightly above and fall down
        this.y -= 50;
        this.alpha = 0;

        // Fade in and drop down
        this.scene.tweens.add({
            targets: this,
            y: this.y + 50,
            alpha: 1,
            duration: 300,
            ease: 'Bounce.easeOut',
            onComplete: () => {
                // Add a gentle pulse animation
                this.pulseAnimation();
                // Mark as collectible after landing (for magnetic collection)
                this.isCollectible = true;
                this.canCollect = true;
            }
        });
    }

    /**
     * Gentle pulsing animation to attract attention
     */
    pulseAnimation() {
        this.scene.tweens.add({
            targets: this,
            scaleX: 0.10, // Pulse to slightly larger (0.08 → 0.10)
            scaleY: 0.10,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Collect the potion and heal the player
     */
    collect(player) {
        if (!this.canCollect) return;

        this.canCollect = false; // Prevent double collection
        this.isCollectible = false;

        console.log(`💊 Potion collected! Healing ${this.healAmount} HP`);

        // Heal the player
        const actualHeal = player.heal(this.healAmount);

        // Show healing number
        if (this.scene.damageNumberSystem) {
            this.scene.damageNumberSystem.spawnHealNumber(
                player.x,
                player.y - 30,
                actualHeal
            );
        }

        // Spawn heal particles FIRST
        this.spawnHealParticles(player.x, player.y);

        // Immediately destroy the potion (no animation needed, already at player)
        this.destroy();
    }

    /**
     * Spawn green healing particles
     */
    spawnHealParticles(x, y) {
        // Create temporary green particles
        const particleCount = 8;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 100 + Math.random() * 50;

            const particle = this.scene.add.circle(x, y, 3, 0x00ff00, 0.8);
            particle.setDepth(1000);

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed - 30,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
}
