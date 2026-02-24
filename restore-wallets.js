#!/usr/bin/env node
const fs = require('fs');

// Read imported wallets with tier info
const importedPath = '../../diclawprio/data/imported-wallets.json';
const tieredPath = '../../diclawprio/data/tiered-wallets.json';

const imported = JSON.parse(fs.readFileSync(importedPath, 'utf8'));
const tiered = JSON.parse(fs.readFileSync(tieredPath, 'utf8'));

// Create tier lookup
const tierLookup = {};
tiered.wallets_found.forEach(w => {
  tierLookup[w.wallet] = {
    tier: w.tier,
    tierName: w.tierName,
    tierEmoji: w.tierEmoji
  };
});

// Generate wallets.json with placeholder trading stats
const wallets = imported.wallets.map((wallet, index) => {
  const leoId = index + 1;
  const leoName = `LEO-${String(leoId).padStart(3, '0')}`;
  
  const tierInfo = tierLookup[wallet.address] || {
    tier: 'unknown',
    tierName: 'Unknown',
    tierEmoji: '❓'
  };
  
  return {
    address: wallet.address,
    leoName,
    tier: tierInfo.tier,
    tierName: tierInfo.tierName,
    tierEmoji: tierInfo.tierEmoji,
    // Placeholder stats - will be updated by actual analysis
    score: 50,
    totalTrades: 0,
    profitableTrades: 0,
    profitRate: 0,
    totalPnl: 0,
    avgHoldTime: 0,
    tokenDiversity: 0,
    lastActivity: Date.now(),
    daysSinceActive: 0,
    first_seen: new Date(wallet.imported_at).getTime(),
    updated_at: Date.now(),
    highestTrade: 0,
    source: wallet.source,
    note: wallet.note
  };
});

fs.writeFileSync('./public/wallets.json', JSON.stringify(wallets, null, 2));
console.log(`✅ Restored ${wallets.length} wallets with placeholder stats`);
console.log(`📊 Tier breakdown:`);
const tierCounts = wallets.reduce((acc, w) => {
  acc[w.tier] = (acc[w.tier] || 0) + 1;
  return acc;
}, {});
Object.entries(tierCounts).forEach(([tier, count]) => {
  const emoji = wallets.find(w => w.tier === tier)?.tierEmoji || '❓';
  console.log(`   ${emoji} ${tier}: ${count}`);
});
