/**
 * DamageNumberSystem
 * Manages floating damage numbers with anime-style animations
 * Numbers rise up quickly then fall to the side with fade out effect
 */
export default class DamageNumberSystem {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Spawn a floating damage number at position
     * @param {number} x - X position to spawn
     * @param {number} y - Y position to spawn
     * @param {number} damage - Damage amount to display
     * @param {boolean} isCritical - Whether this is a critical hit (optional)
     * @param {boolean} isPlayerDamage - Whether this is damage to the player (optional)
     */
    spawnDamageNumber(x, y, damage, isCritical = false, isPlayerDamage = false) {
        // Random horizontal offset for variety
        const randomOffsetX = (Math.random() - 0.5) * 30;

        // Gradientes según el tipo de daño
        let gradientColors, fontSize;

        if (isPlayerDamage) {
            // PLAYER DAMAGE - Gradiente rojo oscuro a naranja (más visible y alarmante)
            gradientColors = ['#ff0000', '#ff4500'];
            fontSize = '24px'; // Más grande para que sea más notable
        } else if (isCritical) {
            // CRITICAL HIT - Gradiente cyan a rosa
            gradientColors = ['#00ffff', '#ff6ec7'];
            fontSize = '28px';
        } else if (damage >= 20) {
            // High damage - Gradiente rosa a coral
            gradientColors = ['#ff6b9d', '#ffb347'];
            fontSize = '20px';
        } else if (damage >= 15) {
            // Medium-high damage - Gradiente melocotón
            gradientColors = ['#ffb347', '#ffd700'];
            fontSize = '18px';
        } else {
            // Normal damage - Gradiente dorado
            gradientColors = ['#ffd700', '#ffb347'];
            fontSize = '16px';
        }

        // Create text object con estilo básico - FINO
        const text = this.scene.add.text(x + randomOffsetX, y - 40, damage.toString(), {
            fontSize: fontSize,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontStyle: 'normal', // Sin bold
            color: '#ffffff' // Color base blanco (se sobrescribirá con el gradiente)
        });

        // Center the text
        text.setOrigin(0.5, 0.5);

        // Aplicar gradiente
        const gradient = text.context.createLinearGradient(0, 0, 0, text.height);
        gradient.addColorStop(0, gradientColors[0]);
        gradient.addColorStop(1, gradientColors[1]);
        text.setFill(gradient);

        // GLOW EFFECT - sombra suave negra
        text.setShadow(2, 2, '#000000', 4, true, true);

        // Start with bigger scale for IMPACT
        text.setScale(0);

        // Random side direction (left or right)
        const sideDirection = Math.random() > 0.5 ? 1 : -1;
        const horizontalDistance = 50 + Math.random() * 30;

        // DOPAMINE ANIMATION - ¡EXPLOSIÓN DE SATISFACCIÓN!
        // Phase 1: POP IN - aparecer con IMPACTO (100ms)
        this.scene.tweens.add({
            targets: text,
            scaleX: 1.5, // GRANDE
            scaleY: 1.5,
            duration: 100,
            ease: 'Back.easeOut', // Bounce satisfactorio
            onComplete: () => {
                // Phase 2: Rise and shrink (150ms)
                this.scene.tweens.add({
                    targets: text,
                    y: y - 80,
                    scaleX: 1.0,
                    scaleY: 1.0,
                    duration: 150,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        // Phase 3: Fall to side and fade (250ms)
                        this.scene.tweens.add({
                            targets: text,
                            x: x + randomOffsetX + (horizontalDistance * sideDirection),
                            y: y - 40,
                            scaleX: 0.5,
                            scaleY: 0.5,
                            alpha: 0,
                            duration: 250,
                            ease: 'Quad.easeIn',
                            onComplete: () => {
                                text.destroy();
                            }
                        });
                    }
                });
            }
        });

        // If critical, MEGA EFFECTS
        if (isCritical) {
            // EXPLOSIÓN DE PARTÍCULAS
            this.createMegaCriticalParticles(x, y);

            // PULSO de luz
            this.createLightPulse(x, y);
        } else if (damage >= 20) {
            // High damage gets some particles too
            this.createCriticalParticles(x, y);
        }
    }

    /**
     * Create particle burst effect for critical hits
     */
    createCriticalParticles(x, y) {
        // Create 8-10 particles que explotan
        const particleCount = 8 + Math.floor(Math.random() * 3);

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const distance = 40 + Math.random() * 30;

            // Create a medium circle graphic
            const particle = this.scene.add.graphics();
            particle.fillStyle(0xffb347, 1); // Melocotón suave
            particle.fillCircle(0, 0, 4);
            particle.x = x;
            particle.y = y - 30;

            // Burst outward then fade
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y - 30 + Math.sin(angle) * distance,
                alpha: 0,
                duration: 350,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    /**
     * Create MEGA particle explosion for CRITICAL hits
     */
    createMegaCriticalParticles(x, y) {
        // EXPLOSIÓN MASIVA - 16-20 partículas
        const particleCount = 16 + Math.floor(Math.random() * 5);

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + (Math.random() - 0.5) * 0.3;
            const distance = 60 + Math.random() * 40;

            // Colores aesthetic pastel bonitos
            const colors = [0x00ffff, 0xff6ec7, 0xffd700, 0xff85a2, 0x89cff0];
            const color = colors[i % colors.length];

            // Create a BIG circle graphic
            const particle = this.scene.add.graphics();
            particle.fillStyle(color, 1);
            particle.fillCircle(0, 0, 6); // Más grandes
            particle.x = x;
            particle.y = y - 40;

            // MEGA Burst con rotación
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y - 40 + Math.sin(angle) * distance,
                rotation: Math.random() * Math.PI * 2,
                scale: 0,
                alpha: 0,
                duration: 500,
                ease: 'Power3',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }

        // ANILLO DE EXPANSIÓN
        const ring = this.scene.add.graphics();
        ring.lineStyle(4, 0x00ffff, 1);
        ring.strokeCircle(x, y - 40, 10);

        this.scene.tweens.add({
            targets: ring,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onUpdate: (tween) => {
                const progress = tween.progress;
                ring.clear();
                ring.lineStyle(4 * (1 - progress), 0x00ffff, 1 - progress);
                ring.strokeCircle(x, y - 40, 10 + progress * 60);
            },
            onComplete: () => {
                ring.destroy();
            }
        });
    }

    /**
     * Create light pulse effect for CRITICAL hits
     */
    createLightPulse(x, y) {
        // Círculo de luz que pulsa
        const pulse = this.scene.add.graphics();
        pulse.fillStyle(0xffffff, 0.6);
        pulse.fillCircle(x, y - 40, 30);

        this.scene.tweens.add({
            targets: pulse,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onUpdate: (tween) => {
                const progress = tween.progress;
                pulse.clear();
                pulse.fillStyle(0xffffff, 0.6 * (1 - progress));
                pulse.fillCircle(x, y - 40, 30 + progress * 40);
            },
            onComplete: () => {
                pulse.destroy();
            }
        });
    }

    /**
     * Spawn multiple damage numbers (for multi-hit effects)
     */
    spawnMultipleDamageNumbers(x, y, damages) {
        damages.forEach((damage, index) => {
            // Stagger the spawns slightly for visual variety
            this.scene.time.delayedCall(index * 50, () => {
                this.spawnDamageNumber(x, y, damage);
            });
        });
    }

    /**
     * Spawn a floating heal number at position
     * @param {number} x - X position to spawn
     * @param {number} y - Y position to spawn
     * @param {number} heal - Heal amount to display
     */
    spawnHealNumber(x, y, heal) {
        // Random horizontal offset for variety
        const randomOffsetX = (Math.random() - 0.5) * 30;

        // Green gradient for healing
        const gradientColors = ['#00ff00', '#7FFF00'];
        const fontSize = '24px';

        // Create text object
        const text = this.scene.add.text(x + randomOffsetX, y - 40, `+${heal}`, {
            fontSize: fontSize,
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontStyle: 'bold',
            color: '#ffffff'
        });

        // Center the text
        text.setOrigin(0.5, 0.5);

        // Apply gradient
        const gradient = text.context.createLinearGradient(0, 0, 0, text.height);
        gradient.addColorStop(0, gradientColors[0]);
        gradient.addColorStop(1, gradientColors[1]);
        text.setFill(gradient);

        // Glow effect
        text.setShadow(2, 2, '#000000', 4, true, true);

        // Start with bigger scale
        text.setScale(0);

        // Random side direction
        const sideDirection = Math.random() > 0.5 ? 1 : -1;
        const horizontalDistance = 50 + Math.random() * 30;

        // Animation - pop in, rise, fade
        this.scene.tweens.add({
            targets: text,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 100,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.scene.tweens.add({
                    targets: text,
                    y: y - 80,
                    scaleX: 1.0,
                    scaleY: 1.0,
                    duration: 150,
                    ease: 'Quad.easeOut',
                    onComplete: () => {
                        this.scene.tweens.add({
                            targets: text,
                            x: x + randomOffsetX + (horizontalDistance * sideDirection),
                            y: y - 40,
                            scaleX: 0.5,
                            scaleY: 0.5,
                            alpha: 0,
                            duration: 250,
                            ease: 'Quad.easeIn',
                            onComplete: () => {
                                text.destroy();
                            }
                        });
                    }
                });
            }
        });

        // Green healing particles
        this.createHealParticles(x, y);
    }

    /**
     * Create green particle burst for healing
     */
    createHealParticles(x, y) {
        const particleCount = 10;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i;
            const distance = 40 + Math.random() * 20;

            const particle = this.scene.add.graphics();
            particle.fillStyle(0x00ff00, 1);
            particle.fillCircle(0, 0, 4);
            particle.x = x;
            particle.y = y - 30;

            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * distance,
                y: y - 30 + Math.sin(angle) * distance,
                alpha: 0,
                duration: 350,
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
}
