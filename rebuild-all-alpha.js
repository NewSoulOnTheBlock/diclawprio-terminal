#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Read alpha wallets
const alphaPath = path.join(__dirname, '../../diclawprio/data/alpha-wallets.json');
const alphaData = JSON.parse(fs.readFileSync(alphaPath, 'utf8'));

// Read millionaire wallets
const millionairePath = path.join(__dirname, '../../diclawprio/data/millionaire-token-traders.json');
const millionaireData = JSON.parse(fs.readFileSync(millionairePath, 'utf8'));

// Extract all 50 alpha wallets
const alphaWallets = alphaData.alphaWallets.map(w => ({
  address: w.wallet,
  source: 'alpha_discovery',
  score: w.alphaScore,
  note: `Alpha score: ${w.alphaScore.toFixed(1)}, ${w.tokenHits} token hits`
}));

// Extract 4 millionaire wallets
const millionaireWallets = millionaireData.qualified_wallets.map(w => ({
  address: w.wallet,
  source: 'millionaire_scan',
  score: 50,
  note: `${w.tokenDiversity} token diversity, ${w.totalTrades} trades`
}));

// Combine all wallets
const allWallets = [...alphaWallets, ...millionaireWallets];

// Create wallets.json format
const walletsData = allWallets.map((wallet, index) => {
  const leoId = index + 1;
  const leoName = `LEO-${String(leoId).padStart(3, '0')}`;
  
  return {
    address: wallet.address,
    leoName,
    tier: 'alpha',
    tierName: 'Alpha',
    tierEmoji: '⚡',
    score: wallet.score || 50,
    totalTrades: 0,
    profitableTrades: 0,
    profitRate: 0,
    totalPnl: 0,
    avgHoldTime: 0,
    tokenDiversity: 0,
    lastActivity: Date.now(),
    daysSinceActive: 0,
    first_seen: Date.now(),
    updated_at: Date.now(),
    highestTrade: 0,
    source: wallet.source,
    note: wallet.note
  };
});

fs.writeFileSync('./public/wallets.json', JSON.stringify(walletsData, null, 2));

console.log(`✅ Built ${walletsData.length} total wallets:`);
console.log(`   • ${alphaWallets.length} from alpha discovery`);
console.log(`   • ${millionaireWallets.length} from millionaire scan`);
console.log('\n📊 Source breakdown:');
const sources = walletsData.reduce((acc, w) => {
  acc[w.source] = (acc[w.source] || 0) + 1;
  return acc;
}, {});
Object.entries(sources).forEach(([source, count]) => {
  console.log(`   ${source}: ${count} wallets`);
});
