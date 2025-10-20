/**
 * BloodParticleSystem
 * Manages blood particle effects when enemies take damage
 * Particles fly out in different directions and leave persistent blood stains on the ground
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Limited to MAX_BLOOD_STAINS (200) stains to prevent FPS degradation
 * - Uses FIFO queue to remove oldest stains when limit is reached
 * - Efficient Graphics batching
 */
export default class BloodParticleSystem {
    constructor(scene) {
        this.scene = scene;

        // Container for persistent blood stains (will stay on ground)
        this.bloodStains = this.scene.add.graphics();
        this.bloodStains.setDepth(-1); // Below everything else

        // PERFORMANCE: Track blood stains to enforce limit
        this.MAX_BLOOD_STAINS = 200; // Maximum stains before cleanup
        this.bloodStainQueue = []; // FIFO queue for stain management
        this.stainCounter = 0; // Total stains created (for logging)
    }

    /**
     * Spawn blood particles when an enemy takes damage
     * @param {number} x - X position to spawn particles
     * @param {number} y - Y position to spawn particles
     * @param {number} damage - Damage amount (affects particle count)
     * @param {number} hitAngle - Angle from which the hit came (for directional spray)
     */
    spawnBloodParticles(x, y, damage, hitAngle = null) {
        // PERFORMANCE: Reduced particle count for better FPS
        // Number of particles based on damage (more damage = more blood)
        const particleCount = Math.min(2 + Math.floor(damage / 10), 6); // Reduced from 12 to 6 max

        for (let i = 0; i < particleCount; i++) {
            this.createBloodDroplet(x, y, damage, hitAngle);
        }
    }

    /**
     * Create a single blood droplet particle
     */
    createBloodDroplet(x, y, damage, hitAngle) {
        // Blood droplet colors (dark red variations)
        const bloodColors = [0x8B0000, 0xA00000, 0x6B0000, 0x7F0000];
        const color = Phaser.Utils.Array.GetRandom(bloodColors);

        // Random size based on damage
        const size = 2 + Math.random() * 3 + (damage > 20 ? 2 : 0);

        // Create blood droplet graphic
        const droplet = this.scene.add.graphics();
        droplet.fillStyle(color, 1);
        droplet.fillCircle(0, 0, size);
        droplet.x = x;
        droplet.y = y;

        // Calculate spray direction
        let angle;
        if (hitAngle !== null) {
            // Spray away from the hit direction with some randomness
            const spreadAngle = Math.PI / 3; // 60 degree spread
            angle = hitAngle + Math.PI + (Math.random() - 0.5) * spreadAngle;
        } else {
            // Random direction if no hit angle provided
            angle = Math.random() * Math.PI * 2;
        }

        // Calculate velocity (random force)
        const force = 80 + Math.random() * 100;
        const velocityX = Math.cos(angle) * force;
        const velocityY = Math.sin(angle) * force;

        // Landing position (where droplet will fall)
        const travelDistance = 30 + Math.random() * 60;
        const landX = x + Math.cos(angle) * travelDistance;
        const landY = y + Math.sin(angle) * travelDistance;

        // Arc height for the droplet flight
        const arcHeight = -30 - Math.random() * 40;

        // Animate the droplet - fly out in arc, then fall to ground
        this.scene.tweens.add({
            targets: droplet,
            x: landX,
            y: landY,
            duration: 300 + Math.random() * 200,
            ease: 'Quad.easeOut',
            onUpdate: (tween) => {
                // Create arc trajectory
                const progress = tween.progress;
                // Parabolic arc (up then down)
                const arcOffset = Math.sin(progress * Math.PI) * arcHeight;
                droplet.y = y + (landY - y) * progress + arcOffset;
            },
            onComplete: () => {
                // When droplet lands, create persistent blood stain
                this.createBloodStain(landX, landY, size);

                // Destroy the flying droplet
                droplet.destroy();
            }
        });

        // Fade out the droplet as it flies
        this.scene.tweens.add({
            targets: droplet,
            alpha: 0.7,
            duration: 300 + Math.random() * 200,
            ease: 'Linear'
        });
    }

    /**
     * Create a persistent blood stain on the ground
     * PERFORMANCE: Enforces MAX_BLOOD_STAINS limit using FIFO queue
     */
    createBloodStain(x, y, size) {
        // PERFORMANCE: Check if we need to remove old stains (FIFO)
        if (this.bloodStainQueue.length >= this.MAX_BLOOD_STAINS) {
            // Clear ALL stains and redraw only recent ones
            // This is more efficient than selectively removing old stains
            this.bloodStains.clear();

            // Remove oldest 25% of stains from queue (batch removal)
            const removeCount = Math.floor(this.MAX_BLOOD_STAINS * 0.25);
            this.bloodStainQueue.splice(0, removeCount);

            // Redraw remaining stains
            for (const stainData of this.bloodStainQueue) {
                this.drawStain(stainData);
            }

            console.log(`🩸 Blood cleanup: Removed ${removeCount} old stains, kept ${this.bloodStainQueue.length}`);
        }

        // Blood stain colors (darker for ground stains)
        const stainColors = [0x4A0000, 0x5A0000, 0x3A0000, 0x660000];
        const color = Phaser.Utils.Array.GetRandom(stainColors);

        // Splatter shape - irregular circle/ellipse
        const stainSize = size * (1.5 + Math.random() * 0.5);
        const elongation = 0.7 + Math.random() * 0.6; // Slight ellipse

        // Store stain data for potential redraw
        const stainData = {
            x, y, size, color, stainSize, elongation
        };
        this.bloodStainQueue.push(stainData);
        this.stainCounter++;

        // Draw the new stain
        this.drawStain(stainData);
    }

    /**
     * Draw a single blood stain (used for initial draw and redraw after cleanup)
     */
    drawStain(stainData) {
        const { x, y, color, stainSize, elongation } = stainData;

        // Draw on the persistent graphics object
        this.bloodStains.fillStyle(color, 0.6 + Math.random() * 0.2);

        // Create irregular splatter by drawing multiple overlapping circles
        const splatCount = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < splatCount; i++) {
            const offsetX = (Math.random() - 0.5) * stainSize * 0.5;
            const offsetY = (Math.random() - 0.5) * stainSize * 0.5;
            const splatSize = stainSize * (0.6 + Math.random() * 0.6);

            // Draw ellipse for irregular shape
            this.bloodStains.fillEllipse(
                x + offsetX,
                y + offsetY,
                splatSize * elongation,
                splatSize
            );
        }
    }

    /**
     * Clear all blood stains (useful for wave transitions or cleanup)
     */
    clearBloodStains() {
        this.bloodStains.clear();
    }

    /**
     * Destroy the system
     */
    destroy() {
        if (this.bloodStains) {
            this.bloodStains.destroy();
        }
    }
}
