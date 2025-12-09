// Quick test to verify sourceRegistry is working
const { getSourceConfig } = require('./lib/constants/sourceRegistry.ts');

console.log('Testing getSourceConfig...');
console.log('HK01:', getSourceConfig('hk01'));
console.log('MingPao:', getSourceConfig('mingpao'));
