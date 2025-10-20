/**
 * AbilityBarUI
 * Displays ability icons with cooldown indicators
 */
import { getAbility } from '../config/AbilityPool.js';

export default class AbilityBarUI {
    constructor(scene, abilitySystem) {
        this.scene = scene;
        this.abilitySystem = abilitySystem;

        // 5 ability slots (Q, E, R, T, F)
        this.slots = ['Q', 'E', 'R', 'T', 'F'];

        // UI configuration - larger icons for better visibility
        this.iconSize = 85;
        this.iconSpacing = 90;

        // Center the ability bar at bottom of screen (very bottom)
        const totalWidth = (this.slots.length * this.iconSpacing) - (this.iconSpacing - this.iconSize);
        this.startX = (this.scene.cameras.main.width - totalWidth) / 2;
        this.startY = this.scene.cameras.main.height - 50;

        // Store UI elements for each slot
        this.abilityIcons = [];

        this.createAbilityBar();
    }

    /**
     * Create the ability bar UI
     */
    createAbilityBar() {
        this.slots.forEach((slotKey, index) => {
            const x = this.startX + (index * this.iconSpacing);
            const y = this.startY;

            // Create container for this ability slot
            const container = this.scene.add.container(x, y);
            container.setScrollFactor(0); // Fixed to camera
            container.setDepth(10000); // Always on top of everything (UI layer)

            // Get ability assigned to this slot (or null if empty)
            const abilityId = this.scene.gameState.abilitySlots[slotKey];
            const abilityData = abilityId ? getAbility(abilityId) : null;

            // Ability icon (or empty slot icon)
            const iconTexture = abilityData ? abilityData.icon : 'skill-dash'; // Default empty icon
            const icon = this.scene.add.image(0, 0, iconTexture);
            icon.setDisplaySize(this.iconSize, this.iconSize);
            container.add(icon);

            // Cooldown overlay (circular to match rounded icons)
            const cooldownOverlay = this.scene.add.circle(0, 0, this.iconSize/2, 0x000000, 0.6);
            cooldownOverlay.setVisible(false);
            container.add(cooldownOverlay);

            // Cooldown timer (centered)
            const cooldownTimerText = this.scene.add.text(0, 0, '', {
                fontSize: '24px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            });
            cooldownTimerText.setOrigin(0.5, 0.5);
            cooldownTimerText.setVisible(false);
            container.add(cooldownTimerText);

            // Key label - sized to match icon
            const keyText = this.scene.add.text(-this.iconSize/2 + 6, -this.iconSize/2 + 6, slotKey, {
                fontSize: '18px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            });
            container.add(keyText);

            // Lock overlay for empty slots (dark overlay + lock icon)
            const lockOverlay = this.scene.add.rectangle(
                0,
                0,
                this.iconSize,
                this.iconSize,
                0x000000,
                0.7
            );
            container.add(lockOverlay);

            // Lock icon text (🔒 emoji)
            const lockIcon = this.scene.add.text(0, 0, '🔒', {
                fontSize: '32px'
            });
            lockIcon.setOrigin(0.5, 0.5);
            container.add(lockIcon);

            // Empty slot text
            const emptyText = this.scene.add.text(0, this.iconSize/2 - 15, 'EMPTY', {
                fontSize: '14px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#888888',
                stroke: '#000000',
                strokeThickness: 3
            });
            emptyText.setOrigin(0.5, 0.5);
            container.add(emptyText);

            // Store references
            this.abilityIcons.push({
                container,
                icon,
                cooldownOverlay,
                cooldownTimerText,
                keyText,
                lockOverlay,
                lockIcon,
                emptyText,
                slotKey: slotKey,
                abilityId: abilityId // Can be null if empty
            });
        });
    }

    /**
     * Update cooldown displays - called every frame
     * Progressive unlock effect: overlay shrinks from left to right
     */
    update() {
        const currentTime = this.scene.time.now;

        this.abilityIcons.forEach((abilityUI) => {
            // Get current ability ID from gameState slot
            const currentAbilityId = this.scene.gameState.abilitySlots[abilityUI.slotKey];

            // If slot is empty
            if (!currentAbilityId) {
                // Show lock overlay for empty slots
                abilityUI.lockOverlay.setVisible(true);
                abilityUI.lockIcon.setVisible(true);
                abilityUI.emptyText.setVisible(true);

                // Hide cooldown elements
                abilityUI.cooldownOverlay.setVisible(false);
                abilityUI.cooldownTimerText.setVisible(false);

                // Desaturate icon
                abilityUI.icon.setTint(0x444444);
                return;
            }

            // Update icon if ability changed
            if (currentAbilityId !== abilityUI.abilityId) {
                abilityUI.abilityId = currentAbilityId;
                const abilityData = getAbility(currentAbilityId);
                if (abilityData) {
                    abilityUI.icon.setTexture(abilityData.icon);
                }
            }

            // Hide lock overlay - slot has an ability
            abilityUI.lockOverlay.setVisible(false);
            abilityUI.lockIcon.setVisible(false);
            abilityUI.emptyText.setVisible(false);

            // Get ability from system
            const ability = this.abilitySystem.abilities[currentAbilityId];

            if (!ability) {
                // Ability not in system yet, show at full color
                abilityUI.icon.clearTint();
                abilityUI.cooldownOverlay.setVisible(false);
                abilityUI.cooldownTimerText.setVisible(false);
                return;
            }

            // Check cooldown
            const cooldownPercent = this.abilitySystem.getCooldownPercent(currentAbilityId);
            const isOnCooldown = cooldownPercent < 1;

            if (isOnCooldown) {
                // Show circular overlay with fade effect
                abilityUI.cooldownOverlay.setVisible(true);

                // Fade from 0.6 (semi-dark) to 0 (transparent) as cooldown progresses
                // This way you can always see the icon underneath
                const overlayAlpha = 0.6 * (1 - cooldownPercent);
                abilityUI.cooldownOverlay.setAlpha(overlayAlpha);

                // Calculate effective time remaining
                const effectiveTimeRemaining = (1 - cooldownPercent) * ability.cooldown;
                const secondsRemaining = (effectiveTimeRemaining / 1000).toFixed(1);
                abilityUI.cooldownTimerText.setText(secondsRemaining);
                abilityUI.cooldownTimerText.setVisible(true);

                // Desaturate icon when on cooldown (gradually gets brighter)
                // Goes from 0x88 (medium gray) to 0xFF (full brightness)
                const tintBrightness = 0x88 + Math.floor((0xFF - 0x88) * cooldownPercent);
                const tintColor = (tintBrightness << 16) | (tintBrightness << 8) | tintBrightness;
                abilityUI.icon.setTint(tintColor);
            } else {
                // Ready - hide overlay and timer
                abilityUI.cooldownOverlay.setVisible(false);
                abilityUI.cooldownTimerText.setVisible(false);

                // Remove tint - full color when ready
                abilityUI.icon.clearTint();
            }
        });
    }

    /**
     * Cleanup
     */
    destroy() {
        this.abilityIcons.forEach(abilityUI => {
            abilityUI.container.destroy();
        });
        this.abilityIcons = [];
    }
}
