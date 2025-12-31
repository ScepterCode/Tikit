// Create a simple PNG icon for PWA
import fs from 'fs';

// Simple 1x1 transparent PNG in base64
const transparentPng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// Create a simple colored PNG (green square)
const greenSquarePng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// Write the icon
fs.writeFileSync('pwa-192x192.png', Buffer.from(greenSquarePng, 'base64'));
fs.writeFileSync('pwa-512x512.png', Buffer.from(greenSquarePng, 'base64'));

console.log('✅ PNG icons created successfully!');