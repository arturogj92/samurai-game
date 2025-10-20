/**
 * PlayerStatsUI
 * Displays player stats on the right side of the screen for debugging/monitoring
 */
export default class PlayerStatsUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.statsTexts = {};

        this.create();
    }

    create() {
        // Create container for all stat elements
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(10000); // High depth so it appears above game elements

        // Position on left side of screen
        const x = 20; // 20px from left edge
        const y = 100; // Start 100px from top

        // Background panel
        const panelWidth = 180;
        const panelHeight = 300;
        const bg = this.scene.add.rectangle(x, y, panelWidth, panelHeight, 0x000000, 0.7);
        bg.setOrigin(0, 0);
        this.container.add(bg);

        // Title
        const title = this.scene.add.text(x + panelWidth / 2, y + 10, 'PLAYER STATS', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#FFD700',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        title.setOrigin(0.5, 0);
        this.container.add(title);

        // Create stat labels and value texts
        let currentY = y + 40;
        const lineHeight = 25;
        const labelX = x + 10;
        const valueX = x + panelWidth - 10;

        const stats = [
            { key: 'health', label: 'Health:' },
            { key: 'maxHealth', label: 'Max HP:' },
            { key: 'speed', label: 'Speed:' },
            { key: 'damage', label: 'Damage:' },
            { key: 'fireRate', label: 'Fire Rate:' },
            { key: 'attackSpeed', label: 'Atk/Sec:' },
            { key: 'range', label: 'Range:' },
            { key: 'ricochet', label: 'Ricochet:' }
        ];

        stats.forEach(stat => {
            // Label
            const label = this.scene.add.text(labelX, currentY, stat.label, {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#AAAAAA',
                stroke: '#000000',
                strokeThickness: 2
            });
            label.setOrigin(0, 0);
            this.container.add(label);

            // Value
            const value = this.scene.add.text(valueX, currentY, '0', {
                fontSize: '14px',
                fontFamily: 'Arial',
                color: '#FFFFFF',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            });
            value.setOrigin(1, 0); // Right-aligned
            this.container.add(value);

            this.statsTexts[stat.key] = value;

            currentY += lineHeight;
        });

        console.log('📊 PlayerStatsUI created');
    }

    update() {
        if (!this.scene.player || !this.scene.autoFireSystem) return;

        const player = this.scene.player;
        const autoFire = this.scene.autoFireSystem;

        // Base values (without upgrades)
        const BASE_MAX_HEALTH = 100;
        const BASE_SPEED = 200;
        const BASE_DAMAGE = 1.0;
        const BASE_FIRE_RATE = 500;

        // Health (current, not base comparison)
        this.statsTexts.health.setText(Math.floor(player.health));

        // Max Health with base comparison
        if (!this.previewActive || this.previewStat !== 'maxHealth') {
            const current = Math.floor(player.maxHealth);
            const bonus = current - BASE_MAX_HEALTH;
            if (bonus > 0) {
                this.statsTexts.maxHealth.setText(`${current} (+${bonus})`);
                this.statsTexts.maxHealth.setColor('#00FF88'); // Green-cyan for improved
            } else {
                this.statsTexts.maxHealth.setText(current.toString());
                this.statsTexts.maxHealth.setColor('#FFFFFF');
            }
        }

        // Speed with base comparison
        if (!this.previewActive || this.previewStat !== 'speed') {
            const current = Math.floor(player.speed);
            const bonus = current - BASE_SPEED;
            if (bonus > 0) {
                this.statsTexts.speed.setText(`${current} (+${bonus})`);
                this.statsTexts.speed.setColor('#00FF88');
            } else {
                this.statsTexts.speed.setText(current.toString());
                this.statsTexts.speed.setColor('#FFFFFF');
            }
        }

        // Damage Multiplier with base comparison
        if (!this.previewActive || this.previewStat !== 'damage') {
            const current = player.damageMultiplier;
            const bonus = current - BASE_DAMAGE;
            if (bonus > 0.01) { // Account for floating point
                this.statsTexts.damage.setText(`${current.toFixed(2)}x (+${bonus.toFixed(2)})`);
                this.statsTexts.damage.setColor('#00FF88');
            } else {
                this.statsTexts.damage.setText(`${current.toFixed(2)}x`);
                this.statsTexts.damage.setColor('#FFFFFF');
            }
        }

        // Fire Rate (raw cooldown in ms)
        let effectiveFireRate = autoFire.fireRate;
        const baseFireRate = BASE_FIRE_RATE;

        // Apply player power scaling
        if (this.scene.difficultySystem) {
            const playerPower = this.scene.difficultySystem.getPlayerPowerScaling();
            effectiveFireRate = effectiveFireRate * (1 - playerPower.fireRateBonus);
        }

        // Apply rapid fire if active
        const rapidFireActive = this.scene.abilitySystem && this.scene.abilitySystem.rapidFireActive;
        if (rapidFireActive) {
            effectiveFireRate = effectiveFireRate / 5;
        }

        if (!this.previewActive || this.previewStat !== 'fireRate') {
            const current = Math.floor(effectiveFireRate);
            // For fire rate, lower is better, so we show reduction
            const improvement = baseFireRate - autoFire.fireRate; // Positive means faster
            if (improvement > 0 && !rapidFireActive) {
                this.statsTexts.fireRate.setText(`${current}ms (-${Math.floor(improvement)})`);
                this.statsTexts.fireRate.setColor('#00FF88');
            } else {
                this.statsTexts.fireRate.setText(`${current}ms`);
                this.statsTexts.fireRate.setColor(rapidFireActive ? '#00FF00' : '#FFFFFF');
            }
        }

        // Attack Speed (attacks per second)
        const attacksPerSecond = (1000 / effectiveFireRate).toFixed(2);
        if (!this.previewActive || this.previewStat !== 'attackSpeed') {
            const baseAttacksPerSec = (1000 / baseFireRate).toFixed(2);
            const current = parseFloat(attacksPerSecond);
            const base = parseFloat(baseAttacksPerSec);
            const bonus = current - base;

            if (bonus > 0.01 && !rapidFireActive) {
                this.statsTexts.attackSpeed.setText(`${attacksPerSecond} (+${bonus.toFixed(2)})`);
                this.statsTexts.attackSpeed.setColor('#00FF88');
            } else {
                this.statsTexts.attackSpeed.setText(attacksPerSecond);
                this.statsTexts.attackSpeed.setColor(rapidFireActive ? '#00FF00' : '#FFFFFF');
            }
        }

        // Range
        if (!this.previewActive || this.previewStat !== 'range') {
            this.statsTexts.range.setText(Math.floor(autoFire.range));
            this.statsTexts.range.setColor('#FFFFFF');
        }

        // Ricochet
        this.statsTexts.ricochet.setText(player.ricochetEnabled ? 'YES' : 'NO');

        // Color code health based on percentage
        const healthPercent = player.health / player.maxHealth;
        if (healthPercent > 0.6) {
            this.statsTexts.health.setColor('#00FF00'); // Green
        } else if (healthPercent > 0.3) {
            this.statsTexts.health.setColor('#FFFF00'); // Yellow
        } else {
            this.statsTexts.health.setColor('#FF0000'); // Red
        }
    }

    /**
     * Show a preview of how a stat will change
     * @param {string} statKey - The stat to preview (health, maxHealth, speed, damage, fireRate, attackSpeed, range)
     * @param {string} previewText - The text to show (e.g., "100 → 120" or "+20")
     */
    showStatPreview(statKey, previewText) {
        if (!this.statsTexts[statKey]) {
            console.warn(`⚠️ Unknown stat key: ${statKey}`);
            return;
        }

        this.previewActive = true;
        this.previewStat = statKey;

        // Update the stat text with preview
        this.statsTexts[statKey].setText(previewText);
        this.statsTexts[statKey].setColor('#00FF00'); // Green for preview
        this.statsTexts[statKey].setFontStyle('bold');
    }

    /**
     * Hide stat preview and return to normal display
     */
    hideStatPreview() {
        this.previewActive = false;
        this.previewStat = null;

        // Reset all stat text styles
        Object.keys(this.statsTexts).forEach(key => {
            this.statsTexts[key].setFontStyle('bold'); // Already bold by default
        });
    }

    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
}
