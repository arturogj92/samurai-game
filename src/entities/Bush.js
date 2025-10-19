import Phaser from 'phaser';

/**
 * Bush - Animated terrain decoration with collision
 *
 * Features:
 * - Random bush type (1-4)
 * - Animated sprite (8 frame animation)
 * - Depth sorting for proper layering
 * - Static physics body for collision detection
 */
export default class Bush extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, bushType = null) {
        // If no bush type specified, pick random (1-4)
        const type = bushType || Phaser.Math.Between(1, 4);
        const textureKey = `bush-${type}`;

        super(scene, x, y, textureKey, 0);

        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true = static body

        // Bush properties
        this.bushType = type;
        this.textureKey = textureKey;
        this.setScale(1.0);

        // Set depth based on Y position for proper layering
        // Bushes use their base Y position for depth sorting
        this.setDepth(y);

        // Configure collision body - bushes are 128x128
        this.body.setSize(50, 40); // Smaller collision area (reduced)
        this.body.setOffset(39, 65); // Position at bottom of bush

        // Create animation immediately if it doesn't exist
        this.createAnimation(scene);

        // Start animation with slight random offset for variety
        const randomDelay = Phaser.Math.Between(0, 1000);
        scene.time.delayedCall(randomDelay, () => {
            // Double-check animation exists before playing
            if (scene.anims.exists(`${this.textureKey}-rustle`)) {
                this.play(`${this.textureKey}-rustle`);
            }
        });

        console.log(`🌿 Bush type ${type} created at (${Math.floor(x)}, ${Math.floor(y)})`);
    }

    createAnimation(scene) {
        const animKey = `${this.textureKey}-rustle`;

        // Only create if it doesn't already exist
        if (!scene.anims.exists(animKey)) {
            try {
                // Bush sprite: 1024x128 = 8 frames of 128x128 each (perfect squares)
                console.log(`🔍 Creating animation for ${this.textureKey}`);

                scene.anims.create({
                    key: animKey,
                    frames: scene.anims.generateFrameNumbers(this.textureKey, { start: 0, end: 7 }),
                    frameRate: 12, // Faster rustling animation
                    repeat: -1 // Loop forever
                });

                console.log(`✅ Created animation: ${animKey} with 8 frames (0-7)`);
            } catch (error) {
                console.error(`❌ Failed to create bush animation for ${this.textureKey}:`, error);
                console.error('Error details:', error);
            }
        } else {
            console.log(`ℹ️ Animation ${animKey} already exists, skipping creation`);
        }
    }

    /**
     * Get the collision radius for this bush
     * Used for preventing overlapping placement
     */
    getCollisionRadius() {
        // Bushes are 128x128, use a reasonable collision area
        return 50;
    }
}
