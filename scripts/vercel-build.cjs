/**
 * Build de producción para Vercel (una sola experiencia: login → posición global).
 */
const { execSync } = require('child_process');

execSync('ng build --configuration=production', { stdio: 'inherit', env: process.env });
