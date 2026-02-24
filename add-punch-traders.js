#!/usr/bin/env node
/**
 * Add top $PUNCH traders to our alpha wallet list
 */
const fs = require('fs');
const path = require('path');

const WALLETS_FILE = path.join(__dirname, 'public', 'wallets.json');

// Top $PUNCH traders (not already in our list)
const newTraders = [
  { address: 'C5vKKgf3YhmDdEhWmUVYt2tFdcZCfcQaVaUvyMvPNSr9', trades: 46, score: 75 },
  { address: 'roUteHjDPMrq9sTbfVVdm8CThq6mT9ybzJ2NpGG9DhN', trades: 35, score: 70 },
  { address: 'Cr6v6hzm5GybgXLdGQPy8BKL3RMmYBWYcRqMc8WtYJV', trades: 33, score: 68 },
  { address: '4r33xEKAWJSHi2qwzZYV9GdP1j3qPvXTqN7jVrUYpump', trades: 32, score: 67 },
  { address: 'A7FMMgue8yUfK9xWKXdqFKhPvT5ZqnmN3GVZaQvqpump', trades: 27, score: 65 }
];

async function run() {
  console.log('📥 Adding $PUNCH Alpha Traders\n');
  
  // Load current wallets
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  console.log(`📂 Current wallets: ${wallets.length}\n`);
  
  const existingAddresses = new Set(wallets.map(w => w.address));
  const toAdd = newTraders.filter(t => !existingAddresses.has(t.address));
  
  if (toAdd.length === 0) {
    console.log('✓ All $PUNCH traders already in list\n');
    return;
  }
  
  console.log(`🎯 Adding ${toAdd.length} new traders:\n`);
  
  // Create new wallet entries
  const newWallets = toAdd.map((trader, idx) => {
    const leoId = wallets.length + idx + 1;
    const leoName = `LEO-${String(leoId).padStart(3, '0')}`;
    
    console.log(`   ${leoName}: ${trader.address.slice(0, 8)}... (${trader.trades} $PUNCH trades, score: ${trader.score})`);
    
    return {
      address: trader.address,
      leoName,
      tier: 'alpha',
      tierName: 'Alpha',
      tierEmoji: '⚡',
      score: trader.score,
      totalTrades: 0, // Will be filled by next scan
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
      source: 'punch_analysis',
      note: `Top $PUNCH trader (${trader.trades} trades), score: ${trader.score}`
    };
  });
  
  // Add to wallets
  const updated = [...wallets, ...newWallets];
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(updated, null, 2));
  
  console.log(`\n✅ Added ${newWallets.length} wallets`);
  console.log(`📊 Total wallets: ${updated.length}`);
  console.log('\n🔄 Next: Run scan-all-trades.js to get full stats for new wallets');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
