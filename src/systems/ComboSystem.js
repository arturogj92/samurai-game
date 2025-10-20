/**
 * ComboSystem.js
 * Tracks kill streaks and provides gold multiplier bonuses
 *
 * Features:
 * - Track consecutive kills without timeout
 * - Gold multipliers at milestones (5, 10, 15, 20+ kills)
 * - Visual feedback with epic text and effects
 * - Auto-reset after 10 seconds without kills
 */

export default class ComboSystem {
    constructor(scene) {
        this.scene = scene;

        // Streak tracking
        this.currentStreak = 0;
        this.lastKillTime = 0;
        this.STREAK_TIMEOUT = 5000; // 5 seconds to maintain streak

        // Milestone thresholds and their bonuses
        // 🔥 Added 3-kill milestone for earlier dopamine hit!
        this.MILESTONES = [
            { kills: 20, bonus: 0.50, text: 'GODLIKE!', color: '#FF00FF', scale: 1.5 },
            { kills: 15, bonus: 0.30, text: 'DOMINATING!', color: '#FF4500', scale: 1.3 },
            { kills: 10, bonus: 0.20, text: 'RAMPAGE!', color: '#FF8C00', scale: 1.2 },
            { kills: 5, bonus: 0.10, text: 'STREAK!', color: '#FFD700', scale: 1.1 },
            { kills: 3, bonus: 0.05, text: 'KILLING SPREE!', color: '#32CD32', scale: 1.0 } // 🔥 NEW: Early feedback!
        ];

        // UI elements
        this.streakText = null;
        this.comboContainer = null;

        // Create UI
        this.createUI();
    }

    /**
     * Create streak UI display
     */
    createUI() {
        const camera = this.scene.cameras.main;

        // Container for streak display (top-right corner)
        this.comboContainer = this.scene.add.container(camera.width - 120, 80);
        this.comboContainer.setScrollFactor(0);
        this.comboContainer.setDepth(1000);
        this.comboContainer.setAlpha(0); // Start hidden

        // Streak counter text
        this.streakText = this.scene.add.text(0, 0, '', {
            fontSize: '32px',
            fontFamily: 'Arial',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6,
            fontStyle: 'bold',
            align: 'center'
        });
        this.streakText.setOrigin(0.5);

        // Streak label
        this.streakLabel = this.scene.add.text(0, 30, 'COMBO', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        });
        this.streakLabel.setOrigin(0.5);

        this.comboContainer.add([this.streakText, this.streakLabel]);
    }

    /**
     * Called when player kills an enemy
     * @param {number} baseGold - Base gold amount from enemy
     * @returns {number} - Final gold amount with combo multiplier
     */
    onKill(baseGold) {
        const currentTime = this.scene.time.now;

        // Check if streak expired (5 seconds since last kill)
        if (currentTime - this.lastKillTime > this.STREAK_TIMEOUT && this.currentStreak > 0) {
            this.resetStreak();
        }

        // Increment streak
        this.currentStreak++;
        this.lastKillTime = currentTime;

        // Calculate gold multiplier based on current streak
        const multiplier = this.getStreakMultiplier();
        const bonusGold = Math.floor(baseGold * multiplier);
        const finalGold = baseGold + bonusGold;

        // Update UI
        this.updateStreakUI();

        // Check for milestone reached
        this.checkMilestone();

        console.log(`🔥 Combo x${this.currentStreak}! Gold: ${baseGold} + ${bonusGold} bonus = ${finalGold} (${Math.floor(multiplier * 100)}% bonus)`);

        return finalGold;
    }

    /**
     * Get gold multiplier for current streak
     * @returns {number} - Multiplier (0.0 - 0.5)
     */
    getStreakMultiplier() {
        // Find highest milestone reached
        for (const milestone of this.MILESTONES) {
            if (this.currentStreak >= milestone.kills) {
                return milestone.bonus;
            }
        }
        return 0; // No bonus below 5 kills
    }

    /**
     * Check if a milestone was just reached and show celebration
     */
    checkMilestone() {
        // Check each milestone
        for (const milestone of this.MILESTONES) {
            // Exact match = milestone just reached!
            if (this.currentStreak === milestone.kills) {
                this.celebrateMilestone(milestone);
                return;
            }
        }
    }

    /**
     * Show epic celebration for reaching a milestone
     */
    celebrateMilestone(milestone) {
        const camera = this.scene.cameras.main;

        // Epic text in center of screen
        const epicText = this.scene.add.text(
            camera.width / 2,
            camera.height / 2 - 50,
            milestone.text,
            {
                fontSize: `${48 * milestone.scale}px`,
                fontFamily: 'Arial',
                color: milestone.color,
                stroke: '#000000',
                strokeThickness: 8,
                fontStyle: 'bold'
            }
        );
        epicText.setOrigin(0.5);
        epicText.setScrollFactor(0);
        epicText.setDepth(2000);
        epicText.setScale(0);

        // Subtitle showing bonus
        const bonusText = this.scene.add.text(
            camera.width / 2,
            camera.height / 2 + 10,
            `+${Math.floor(milestone.bonus * 100)}% GOLD!`,
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                color: '#FFD700',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        bonusText.setOrigin(0.5);
        bonusText.setScrollFactor(0);
        bonusText.setDepth(2000);
        bonusText.setAlpha(0);

        // Animate epic text - pop in
        this.scene.tweens.add({
            targets: epicText,
            scale: 1.2,
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Pulse effect
                this.scene.tweens.add({
                    targets: epicText,
                    scale: 1.0,
                    duration: 100,
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => {
                        // Fade out
                        this.scene.tweens.add({
                            targets: epicText,
                            alpha: 0,
                            y: epicText.y - 30,
                            duration: 500,
                            delay: 300,
                            onComplete: () => epicText.destroy()
                        });
                    }
                });
            }
        });

        // Animate bonus text - fade in after epic text
        this.scene.tweens.add({
            targets: bonusText,
            alpha: 1,
            duration: 300,
            delay: 200,
            onComplete: () => {
                // Fade out with epic text
                this.scene.tweens.add({
                    targets: bonusText,
                    alpha: 0,
                    y: bonusText.y - 20,
                    duration: 500,
                    delay: 600,
                    onComplete: () => bonusText.destroy()
                });
            }
        });

        // Camera shake for impact!
        this.scene.cameras.main.shake(200, 0.003 * milestone.scale);

        console.log(`🎉 MILESTONE REACHED: ${milestone.text} (${this.currentStreak} kills, +${Math.floor(milestone.bonus * 100)}% gold)`);
    }

    /**
     * Update streak counter UI
     */
    updateStreakUI() {
        if (this.currentStreak > 0) {
            // Show container if hidden
            if (this.comboContainer.alpha === 0) {
                this.scene.tweens.add({
                    targets: this.comboContainer,
                    alpha: 1,
                    duration: 200
                });
            }

            // Update text
            this.streakText.setText(`${this.currentStreak}x`);

            // Color based on streak level
            if (this.currentStreak >= 20) {
                this.streakText.setColor('#FF00FF'); // Magenta for godlike
            } else if (this.currentStreak >= 15) {
                this.streakText.setColor('#FF4500'); // Orange-red for dominating
            } else if (this.currentStreak >= 10) {
                this.streakText.setColor('#FF8C00'); // Orange for rampage
            } else if (this.currentStreak >= 5) {
                this.streakText.setColor('#FFD700'); // Gold for streak
            } else {
                this.streakText.setColor('#FFFFFF'); // White for building
            }

            // Pulse effect on each kill
            this.scene.tweens.add({
                targets: this.streakText,
                scale: 1.3,
                duration: 100,
                yoyo: true,
                ease: 'Quad.easeOut'
            });
        }
    }

    /**
     * Reset streak counter
     */
    resetStreak() {
        if (this.currentStreak > 0) {
            console.log(`💔 Combo broken! Final streak: ${this.currentStreak}`);
        }

        this.currentStreak = 0;
        this.lastKillTime = 0;

        // Fade out UI
        if (this.comboContainer && this.comboContainer.alpha > 0) {
            this.scene.tweens.add({
                targets: this.comboContainer,
                alpha: 0,
                duration: 500
            });
        }
    }

    /**
     * Update loop - check for streak timeout
     */
    update(time) {
        // Check if streak should expire
        if (this.currentStreak > 0) {
            const timeSinceKill = time - this.lastKillTime;
            if (timeSinceKill > this.STREAK_TIMEOUT) {
                this.resetStreak();
            }
        }
    }

    /**
     * Get current streak count
     */
    getCurrentStreak() {
        return this.currentStreak;
    }

    /**
     * Get current gold multiplier
     */
    getCurrentMultiplier() {
        return this.getStreakMultiplier();
    }
}
