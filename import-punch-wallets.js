#!/usr/bin/env node
/**
 * Import $PUNCH traders to our alpha wallet list
 */
const fs = require('fs');
const path = require('path');

const WALLETS_FILE = path.join(__dirname, 'public', 'wallets.json');
const PUNCH_FILE = path.join(__dirname, 'punch-new-wallets.json');

async function run() {
  console.log('📥 Importing $PUNCH Alpha Traders\n');
  
  // Load current wallets
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  console.log(`📂 Current wallets: ${wallets.length}`);
  
  // Load new $PUNCH traders
  const punchTraders = JSON.parse(fs.readFileSync(PUNCH_FILE, 'utf8'));
  console.log(`🎯 New $PUNCH traders: ${punchTraders.length}\n`);
  
  const existingAddresses = new Set(wallets.map(w => w.address));
  const toAdd = punchTraders.filter(t => !existingAddresses.has(t.address));
  
  if (toAdd.length === 0) {
    console.log('✓ All $PUNCH traders already in list\n');
    return;
  }
  
  console.log(`➕ Adding ${toAdd.length} new wallets:\n`);
  
  // Create new wallet entries
  const newWallets = toAdd.map((trader, idx) => {
    const leoId = wallets.length + idx + 1;
    const leoName = `LEO-${String(leoId).padStart(3, '0')}`;
    
    // Score based on trading activity
    const score = Math.min(100, 60 + (trader.trades / 2));
    
    console.log(`   ${leoName}: ${trader.address.slice(0, 8)}... (${trader.trades} $PUNCH trades, score: ${score.toFixed(1)})`);
    
    return {
      address: trader.address,
      leoName,
      tier: 'alpha',
      tierName: 'Alpha',
      tierEmoji: '⚡',
      score: Math.round(score),
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
      source: 'punch_top_trader',
      note: `Top $PUNCH trader (${trader.trades} trades in $PUNCH)`
    };
  });
  
  // Add to wallets
  const updated = [...wallets, ...newWallets];
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(updated, null, 2));
  
  console.log(`\n✅ Successfully added ${newWallets.length} wallets`);
  console.log(`📊 Total wallets: ${updated.length}`);
  console.log('\n🔄 Deploying to terminal...');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
