/**
 * GoldUI
 * Displays the player's gold count with icon next to ability bar
 */
export default class GoldUI {
    constructor(scene) {
        this.scene = scene;

        // Position at top right corner
        const x = this.scene.cameras.main.width - 30; // Right edge with padding
        const y = 25; // Top with padding

        // Create gold icon (using G_Idle.png)
        this.goldIcon = this.scene.add.image(x - 65, y - 3, 'gold-idle');
        this.goldIcon.setScrollFactor(0); // Fixed to camera
        this.goldIcon.setScale(0.6); // Icon (128px -> ~77px) - slightly larger for visibility
        this.goldIcon.setOrigin(0.5, 0.5);
        this.goldIcon.setDepth(10000); // Always on top of everything (UI layer)

        // Create gold text (to the right of icon)
        this.goldText = this.scene.add.text(x - 30, y, '0', {
            font: 'bold 32px Arial',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        this.goldText.setScrollFactor(0);
        this.goldText.setOrigin(0, 0.5); // Left aligned, vertically centered
        this.goldText.setDepth(10000); // Always on top of everything (UI layer)

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
                    this.originalX - 65 + offsetX,
                    this.originalY + offsetY
                );
            } else {
                // Reset position and stop vibrating
                this.goldIcon.setPosition(
                    this.originalX - 65,
                    this.originalY
                );
                this.isVibrating = false;
                this.vibrationTimer = 0;
            }
        }
    }

    vibrate() {
        this.isVibrating = true;
        this.vibrationTimer = 0;

        // Scale pulse effect for icon and text
        this.scene.tweens.add({
            targets: [this.goldIcon, this.goldText],
            scaleX: '+=0.2',
            scaleY: '+=0.2',
            duration: 150,
            yoyo: true,
            ease: 'Quad.easeOut'
        });
    }
}
