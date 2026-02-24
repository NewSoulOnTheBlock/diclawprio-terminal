#!/usr/bin/env node
/**
 * Auto-sync wallets from discovery sources
 * Runs before position scanner to ensure latest wallets are tracked
 */
const fs = require('fs');
const path = require('path');

const ALPHA_PATH = path.join(__dirname, '../../diclawprio/data/alpha-wallets.json');
const MILLIONAIRE_PATH = path.join(__dirname, '../../diclawprio/data/millionaire-token-traders.json');
const WALLETS_FILE = path.join(__dirname, 'public', 'wallets.json');

function loadSource(filepath, fallback = null) {
  try {
    if (fs.existsSync(filepath)) {
      return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    }
    return fallback;
  } catch (err) {
    console.error(`⚠️  Failed to load ${path.basename(filepath)}:`, err.message);
    return fallback;
  }
}

function run() {
  // Load current wallets
  const currentWallets = loadSource(WALLETS_FILE, []);
  const currentAddresses = new Set(currentWallets.map(w => w.address));
  
  // Load alpha discovery wallets
  const alphaData = loadSource(ALPHA_PATH, { alphaWallets: [] });
  const alphaWallets = alphaData.alphaWallets || [];
  
  // Load millionaire scan wallets
  const millionaireData = loadSource(MILLIONAIRE_PATH, { qualified_wallets: [] });
  const millionaireWallets = millionaireData.qualified_wallets || [];
  
  // Build wallet list
  const allWallets = [];
  let newCount = 0;
  
  // Add alpha wallets
  alphaWallets.forEach(w => {
    const isNew = !currentAddresses.has(w.wallet);
    if (isNew) newCount++;
    
    allWallets.push({
      address: w.wallet,
      source: 'alpha_discovery',
      score: w.alphaScore || 50,
      note: `Alpha score: ${(w.alphaScore || 50).toFixed(1)}, ${w.tokenHits || 0} token hits`,
      isNew
    });
  });
  
  // Add millionaire wallets
  millionaireWallets.forEach(w => {
    const isNew = !currentAddresses.has(w.wallet);
    if (isNew) newCount++;
    
    allWallets.push({
      address: w.wallet,
      source: 'millionaire_scan',
      score: 50,
      note: `${w.tokenDiversity || 0} token diversity, ${w.totalTrades || 0} trades`,
      isNew
    });
  });
  
  // Assign LEO names
  const walletsData = allWallets.map((wallet, index) => {
    const leoId = index + 1;
    const leoName = `LEO-${String(leoId).padStart(3, '0')}`;
    
    // Preserve existing stats if wallet already tracked
    const existing = currentWallets.find(w => w.address === wallet.address);
    
    return {
      address: wallet.address,
      leoName,
      tier: 'alpha',
      tierName: 'Alpha',
      tierEmoji: '⚡',
      score: wallet.score,
      totalTrades: existing?.totalTrades || 0,
      profitableTrades: existing?.profitableTrades || 0,
      profitRate: existing?.profitRate || 0,
      totalPnl: existing?.totalPnl || 0,
      avgHoldTime: existing?.avgHoldTime || 0,
      tokenDiversity: existing?.tokenDiversity || 0,
      lastActivity: existing?.lastActivity || Date.now(),
      daysSinceActive: existing?.daysSinceActive || 0,
      first_seen: existing?.first_seen || Date.now(),
      updated_at: Date.now(),
      highestTrade: existing?.highestTrade || 0,
      source: wallet.source,
      note: wallet.note
    };
  });
  
  // Write updated wallets
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(walletsData, null, 2));
  
  // Report
  const total = walletsData.length;
  const alpha = walletsData.filter(w => w.source === 'alpha_discovery').length;
  const millionaire = walletsData.filter(w => w.source === 'millionaire_scan').length;
  
  if (newCount > 0) {
    console.log(`✅ Auto-sync: ${total} wallets (${newCount} new)`);
    console.log(`   ${alpha} alpha discovery + ${millionaire} millionaire scan`);
  } else {
    console.log(`✓ Auto-sync: ${total} wallets (no changes)`);
  }
  
  return { total, new: newCount, alpha, millionaire };
}

// Run if called directly
if (require.main === module) {
  run();
}

module.exports = { run };
