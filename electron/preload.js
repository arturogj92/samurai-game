// Preload script for Electron
// This runs before the web page loads and has access to both DOM and Node.js APIs

window.addEventListener('DOMContentLoaded', () => {
    console.log('Electron preload script loaded');

    // You can expose specific APIs to the renderer process here
    // For example, Steam API integration would go here
});
