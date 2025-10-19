import Phaser from 'phaser';
import { GameConfig } from './config/PhaserConfig';

console.log('🎮 Starting Vampire Survivors Clone - Phaser Version');
console.log('📦 Phaser version:', Phaser.VERSION);

// Global error handler to prevent [object Object] errors in webpack overlay
window.addEventListener('error', (event) => {
    console.error('🔴 Global error caught:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });

    // If there's a stack trace, log it
    if (event.error && event.error.stack) {
        console.error('Stack trace:', event.error.stack);
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('🔴 Unhandled promise rejection:');
    console.error('Reason type:', typeof event.reason);
    console.error('Reason:', event.reason);

    // Try to serialize the reason
    try {
        console.error('Reason (JSON):', JSON.stringify(event.reason, null, 2));
    } catch (e) {
        console.error('Could not stringify reason:', e);
    }

    // If the reason is an error with a stack, log it
    if (event.reason && event.reason.stack) {
        console.error('Stack trace:', event.reason.stack);
    }

    // Prevent webpack overlay from showing [object Object]
    event.preventDefault();
});

// Create the Phaser game instance
const game = new Phaser.Game(GameConfig);

// Export for debugging
window.game = game;

console.log('✅ Game instance created');
