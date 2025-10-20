/**
 * GoldUI
 * Displays the player's gold count with icon next to ability bar
 */
export default class GoldUI {
    constructor(scene) {
        this.scene = scene;

        // Position at top right corner
        const x = this.scene.cameras.main.width - 10; // Right edge with padding
        const y = 25; // Top with padding

        // Create gold text (right-aligned to prevent overflow)
        this.goldText = this.scene.add.text(x, y, '0', {
            font: 'bold 32px Arial',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.goldText.setScrollFactor(0);
        this.goldText.setOrigin(1, 0.5); // Right aligned, vertically centered - grows to the left
        this.goldText.setDepth(10000); // Always on top of everything (UI layer)

        // Create gold icon (to the left of text, dynamically positioned)
        this.goldIcon = this.scene.add.image(0, y - 3, 'gold-idle');
        this.goldIcon.setScrollFactor(0); // Fixed to camera
        this.goldIcon.setScale(0.6); // Icon (128px -> ~77px) - slightly larger for visibility
        this.goldIcon.setOrigin(0.5, 0.5);
        this.goldIcon.setDepth(10000); // Always on top of everything (UI layer)

        // Vibration state
        this.isVibrating = false;
        this.vibrationTimer = 0;
        this.originalX = x;
        this.originalY = y - 3; // Adjusted for icon alignment
    }

    update() {
        // Update gold text display
        const gold = this.scene.gameState.resources.gold || 0;
        this.goldText.setText(gold.toString());

        // Position icon dynamically to the left of text
        const textLeftEdge = this.goldText.x - this.goldText.width;
        const iconX = textLeftEdge - 50; // 50px gap between icon and text
        const iconY = this.originalY;

        // Handle vibration animation
        if (this.isVibrating) {
            this.vibrationTimer += 16; // ~16ms per frame at 60fps

            // Vibrate for 300ms
            if (this.vibrationTimer < 300) {
                // Shake effect
                const shakeAmount = 3;
                const offsetX = (Math.random() - 0.5) * shakeAmount;
                const offsetY = (Math.random() - 0.5) * shakeAmount;

                this.goldIcon.setPosition(
                    iconX + offsetX,
                    iconY + offsetY
                );
            } else {
                // Reset position and stop vibrating
                this.goldIcon.setPosition(iconX, iconY);
                this.isVibrating = false;
                this.vibrationTimer = 0;
            }
        } else {
            // Normal position (no vibration)
            this.goldIcon.setPosition(iconX, iconY);
        }
    }

    vibrate() {
        this.isVibrating = true;
        this.vibrationTimer = 0;

        // Scale pulse effect disabled - keeping static size
        // this.scene.tweens.add({
        //     targets: [this.goldIcon, this.goldText],
        //     scaleX: '+=0.2',
        //     scaleY: '+=0.2',
        //     duration: 150,
        //     yoyo: true,
        //     ease: 'Quad.easeOut'
        // });
    }
}
