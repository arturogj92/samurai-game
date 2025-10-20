import Phaser from 'phaser';

/**
 * Tree - Animated terrain decoration with collision
 *
 * Features:
 * - Random tree type (1-4)
 * - Animated sprite (12 frame animation)
 * - Depth sorting for proper layering
 * - Static physics body for collision detection
 */
export default class Tree extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, treeType = null) {
        // For now, only use tree-1 until we verify it works
        const type = 1;
        const textureKey = `tree-${type}`;

        super(scene, x, y, textureKey, 0);

        // Add to scene - staticGroup will handle physics
        scene.add.existing(this);

        // Tree properties
        this.treeType = type;
        this.textureKey = textureKey;
        this.setScale(1.0);

        // Set depth based on BOTTOM of sprite for proper layering
        // Tree sprite is 120x200, so we need to add half the height to get the base
        // The sprite origin is at center (0.5, 0.5) by default
        // So the bottom Y position is: y + (height / 2)
        const spriteHeight = 200; // Tree sprite height
        const bottomY = y + (spriteHeight / 2); // Base of the tree
        this.setDepth(bottomY);

        // Create animation immediately if it doesn't exist
        this.createAnimation(scene);

        // Start animation with slight random offset for variety
        const randomDelay = Phaser.Math.Between(0, 1000);
        scene.time.delayedCall(randomDelay, () => {
            // Double-check animation exists before playing
            if (scene.anims.exists(`${this.textureKey}-sway`)) {
                this.play(`${this.textureKey}-sway`);
            }
        });

        console.log(`🌳 Tree type ${type} created at (${Math.floor(x)}, ${Math.floor(y)})`);
    }

    /**
     * Setup physics body - called AFTER adding to staticGroup
     */
    setupPhysics() {
        if (!this.body) {
            console.warn('⚠️ Tree: No physics body found! Make sure tree is added to staticGroup first.');
            return;
        }

        // Configure collision body - balanced trunk collision at the base
        // Tree sprite is 120x200, collision covers trunk base
        this.body.setSize(50, 50); // Trunk collision - square at base
        this.body.setOffset(35, 150); // Position at very bottom (150 + 50 = 200)

        console.log(`🔧 Tree physics configured: size 50x50 at offset (35, 150)`);
    }

    createAnimation(scene) {
        const animKey = `${this.textureKey}-sway`;

        // Only create if it doesn't already exist
        if (!scene.anims.exists(animKey)) {
            try {
                // Tree1 sprite: 1536x256 with 8 frames of 120x200 each
                // Frames start at offset(40,45) with spacing(72,0)
                console.log(`🔍 Creating animation for ${this.textureKey}`);

                scene.anims.create({
                    key: animKey,
                    frames: scene.anims.generateFrameNumbers(this.textureKey, { start: 0, end: 7 }),
                    frameRate: 12, // Faster sway animation
                    repeat: -1 // Loop forever
                });

                console.log(`✅ Created animation: ${animKey} with 8 frames (0-7)`);
            } catch (error) {
                console.error(`❌ Failed to create tree animation for ${this.textureKey}:`, error);
                console.error('Error details:', error);
            }
        } else {
            console.log(`ℹ️ Animation ${animKey} already exists, skipping creation`);
        }
    }

    /**
     * Get the collision radius for this tree
     * Used for preventing overlapping placement
     */
    getCollisionRadius() {
        // Trees are 128x128, but we want a smaller collision area
        // focusing on the trunk/base
        return 50;
    }
}
