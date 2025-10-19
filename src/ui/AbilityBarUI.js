/**
 * AbilityBarUI
 * Displays ability icons with cooldown indicators
 */
export default class AbilityBarUI {
    constructor(scene, abilitySystem) {
        this.scene = scene;
        this.abilitySystem = abilitySystem;

        // Ability configuration (icon, key, ability name in system)
        this.abilities = [
            { icon: 'skill-dash', key: 'Q', name: 'dash' },
            { icon: 'skill-burst', key: 'E', name: 'burst' },
            { icon: 'skill-shield', key: 'R', name: 'shield' },
            { icon: 'skill-lightning', key: 'X', name: 'chainLightning' },
            { icon: 'skill-berserker', key: 'Z', name: 'berserker' },
            { icon: 'skill-summon-army', key: 'F', name: 'summon' }
        ];

        // UI configuration - larger icons for better visibility
        this.iconSize = 60;
        this.iconSpacing = 75;

        // Center the ability bar at bottom of screen (very bottom)
        const totalWidth = (this.abilities.length * this.iconSpacing) - (this.iconSpacing - this.iconSize);
        this.startX = (this.scene.cameras.main.width - totalWidth) / 2;
        this.startY = this.scene.cameras.main.height - 50;

        // Store UI elements for each ability
        this.abilityIcons = [];

        this.createAbilityBar();
    }

    /**
     * Create the ability bar UI
     */
    createAbilityBar() {
        this.abilities.forEach((ability, index) => {
            const x = this.startX + (index * this.iconSpacing);
            const y = this.startY;

            // Create container for this ability icon
            const container = this.scene.add.container(x, y);
            container.setScrollFactor(0); // Fixed to camera
            container.setDepth(10000); // Always on top of everything (UI layer)

            // Ability icon (no background)
            const icon = this.scene.add.image(0, 0, ability.icon);
            icon.setDisplaySize(this.iconSize, this.iconSize);
            container.add(icon);

            // Cooldown overlay (progressive unlock effect left-to-right)
            const cooldownOverlay = this.scene.add.rectangle(
                0,
                0,
                this.iconSize,
                this.iconSize,
                0x000000,
                0.85
            );
            cooldownOverlay.setVisible(false);
            container.add(cooldownOverlay);

            // Cooldown timer at bottom
            const cooldownTimerText = this.scene.add.text(0, this.iconSize/2 - 10, '', {
                fontSize: '11px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 2
            });
            cooldownTimerText.setOrigin(0.5, 0.5);
            cooldownTimerText.setVisible(false);
            container.add(cooldownTimerText);

            // Key label - sized to match icon
            const keyText = this.scene.add.text(-this.iconSize/2 + 6, -this.iconSize/2 + 6, ability.key, {
                fontSize: '18px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            });
            container.add(keyText);

            // Store references
            this.abilityIcons.push({
                container,
                icon,
                cooldownOverlay,
                cooldownTimerText,
                keyText,
                abilityName: ability.name
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
            const ability = this.abilitySystem.abilities[abilityUI.abilityName];

            // Use getCooldownPercent() which accounts for berserker mode (4x faster cooldowns)
            const cooldownPercent = this.abilitySystem.getCooldownPercent(abilityUI.abilityName);
            const isOnCooldown = cooldownPercent < 1;

            // Calculate actual time remaining for display
            const timeSinceUse = currentTime - ability.lastUsed;
            const cooldownRemaining = ability.cooldown - timeSinceUse;

            if (isOnCooldown) {
                // cooldownPercent already calculated above with berserker acceleration

                // Calculate overlay width (shrinks as cooldown progresses)
                const overlayWidth = this.iconSize * (1 - cooldownPercent);

                // Calculate X position (overlay moves from left to right)
                // Keep left edge fixed at left of icon
                const overlayX = -this.iconSize/2 + overlayWidth/2;

                // Update overlay size and position (left-to-right)
                abilityUI.cooldownOverlay.setSize(overlayWidth, this.iconSize);
                abilityUI.cooldownOverlay.x = overlayX;
                abilityUI.cooldownOverlay.setVisible(true);

                // Calculate effective time remaining (accounts for berserker 4x speed)
                // cooldownPercent is already accelerated, so we calculate effective time
                const effectiveTimeRemaining = (1 - cooldownPercent) * ability.cooldown;
                const secondsRemaining = (effectiveTimeRemaining / 1000).toFixed(1);
                abilityUI.cooldownTimerText.setText(secondsRemaining + 's');
                abilityUI.cooldownTimerText.setVisible(true);

                // Desaturate icon when on cooldown
                abilityUI.icon.setTint(0x666666);
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
