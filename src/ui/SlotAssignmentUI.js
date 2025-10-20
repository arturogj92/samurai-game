/**
 * SlotAssignmentUI
 * Shows available slots and lets player assign an ability to one
 */
import { getAbility } from '../config/AbilityPool.js';

export default class SlotAssignmentUI {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.isOpen = false;
        this.onSlotSelected = null;
        this.interactiveZones = [];
    }

    /**
     * Open slot assignment UI
     * @param {string} abilityId - The ability to assign
     * @param {Function} callback - Called when slot is selected with slot key
     */
    open(abilityId, callback) {
        if (this.isOpen) return;
        this.isOpen = true;
        this.onSlotSelected = callback;

        // ENSURE GAME IS PAUSED while slot assignment is open
        this.scene.physics.pause();
        this.scene.gameState.playing = false;
        console.log('⏸️ Game paused - Slot assignment UI opened');

        // Hide health bar while this menu is open (now in MainScene)
        if (this.scene.hideHealthBar) {
            this.scene.hideHealthBar();
        }

        const abilityData = getAbility(abilityId);
        if (!abilityData) {
            console.error(`Ability ${abilityId} not found in pool`);
            return;
        }

        // Main container
        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(15000);

        const panelWidth = 700;
        const panelHeight = 400;
        const panelX = this.scene.cameras.main.width / 2;
        const panelY = this.scene.cameras.main.height / 2;

        // Background overlay
        const bgOverlay = this.scene.add.graphics();
        bgOverlay.fillStyle(0x000000, 0.9);
        bgOverlay.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
        bgOverlay.setScrollFactor(0);
        this.container.add(bgOverlay);

        // Panel background
        const panelBg = this.scene.add.graphics();
        panelBg.fillStyle(0xffd700, 0.3);
        panelBg.fillRoundedRect(panelX - panelWidth/2 - 4, panelY - panelHeight/2 - 4, panelWidth + 8, panelHeight + 8, 20);
        panelBg.fillStyle(0x1a1a2e, 1);
        panelBg.fillRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 16);
        panelBg.lineStyle(4, 0xffd700, 1);
        panelBg.strokeRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 16);
        this.container.add(panelBg);

        // Title
        const titleText = this.scene.add.text(panelX, panelY - panelHeight/2 + 40, '📍 ASSIGN TO SLOT', {
            fontSize: '28px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        titleText.setOrigin(0.5);
        this.container.add(titleText);

        // Ability info
        const abilityInfoText = this.scene.add.text(panelX, panelY - panelHeight/2 + 85, `${abilityData.name}`, {
            fontSize: '22px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFFFFF',
            stroke: '#000000',
            strokeThickness: 3
        });
        abilityInfoText.setOrigin(0.5);
        this.container.add(abilityInfoText);

        // Instruction
        const instructionText = this.scene.add.text(panelX, panelY - panelHeight/2 + 120, 'Choose which key to assign this ability:', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#CCCCCC',
            stroke: '#000000',
            strokeThickness: 2
        });
        instructionText.setOrigin(0.5);
        this.container.add(instructionText);

        // Create slot buttons
        const slots = ['Q', 'E', 'R', 'T', 'F'];
        const slotWidth = 100;
        const slotHeight = 120;
        const spacing = 20;
        const totalWidth = (slotWidth * 5) + (spacing * 4);
        const startX = panelX - totalWidth/2 + slotWidth/2;
        const slotY = panelY + 20;

        slots.forEach((slotKey, index) => {
            const slotX = startX + (index * (slotWidth + spacing));
            this.createSlotButton(slotX, slotY, slotWidth, slotHeight, slotKey, abilityData);
        });

        console.log('📍 Slot assignment UI opened for:', abilityData.name);
    }

    /**
     * Create a slot button
     */
    createSlotButton(x, y, width, height, slotKey, abilityData) {
        const slotContainer = this.scene.add.container(x, y);
        this.container.add(slotContainer);

        // Check if slot already has an ability
        const currentAbilityId = this.scene.gameState.abilitySlots[slotKey];
        const currentAbility = currentAbilityId ? getAbility(currentAbilityId) : null;
        const isEmpty = !currentAbilityId;

        // Slot background
        const slotBg = this.scene.add.rectangle(0, 0, width, height, isEmpty ? 0x2a2a4a : 0x4a4a2a, 1);
        slotBg.setStrokeStyle(3, isEmpty ? 0x666666 : 0x888833);
        slotContainer.add(slotBg);

        // Key label (large)
        const keyText = this.scene.add.text(0, -30, slotKey, {
            fontSize: '36px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        });
        keyText.setOrigin(0.5);
        slotContainer.add(keyText);

        // Status text
        let statusText;
        if (isEmpty) {
            statusText = this.scene.add.text(0, 10, 'EMPTY', {
                fontSize: '16px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#00FF00',
                stroke: '#000000',
                strokeThickness: 2
            });
        } else {
            statusText = this.scene.add.text(0, 10, currentAbility.name, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#FFAA00',
                stroke: '#000000',
                strokeThickness: 2,
                wordWrap: { width: width - 10 },
                align: 'center'
            });
        }
        statusText.setOrigin(0.5);
        slotContainer.add(statusText);

        // Replace text
        const replaceText = this.scene.add.text(0, 35, isEmpty ? '' : '(Replace)', {
            fontSize: '10px',
            fontFamily: 'Arial',
            color: '#FF6666',
            stroke: '#000000',
            strokeThickness: 2
        });
        replaceText.setOrigin(0.5);
        slotContainer.add(replaceText);

        // Interactive zone (outside container)
        const slotZone = this.scene.add.zone(x, y, width, height);
        slotZone.setInteractive({ useHandCursor: true });
        slotZone.setScrollFactor(0);
        slotZone.setDepth(15001);

        this.interactiveZones.push(slotZone);

        // Hover effects
        slotZone.on('pointerover', () => {
            slotBg.setStrokeStyle(3, 0xffd700);
            slotBg.setFillStyle(isEmpty ? 0x3a3a5a : 0x5a5a3a);
            keyText.setScale(1.1);
        });

        slotZone.on('pointerout', () => {
            slotBg.setStrokeStyle(3, isEmpty ? 0x666666 : 0x888833);
            slotBg.setFillStyle(isEmpty ? 0x2a2a4a : 0x4a4a2a);
            keyText.setScale(1);
        });

        slotZone.on('pointerdown', () => {
            this.selectSlot(slotKey);
        });
    }

    /**
     * Handle slot selection
     */
    selectSlot(slotKey) {
        console.log(`✅ Selected slot: ${slotKey}`);

        if (this.onSlotSelected) {
            this.onSlotSelected(slotKey);
        }

        this.close();
    }

    /**
     * Close the UI
     */
    close() {
        // Show health bar again (now in MainScene)
        if (this.scene.showHealthBar) {
            this.scene.showHealthBar();
        }

        // Destroy zones
        this.interactiveZones.forEach(zone => zone.destroy());
        this.interactiveZones = [];

        // Destroy container
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }

        // RESUME GAME when slot assignment closes (final modal)
        if (!this.scene.gameState.playing) {
            this.scene.physics.resume();
            this.scene.gameState.playing = true;
            console.log('▶️ Game resumed - Slot assignment complete');
        }

        this.isOpen = false;
        console.log('📍 Slot assignment UI closed');
    }
}
