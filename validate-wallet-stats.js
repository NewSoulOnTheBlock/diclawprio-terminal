#!/usr/bin/env node
/**
 * Validate that all wallet stats are present and accurate
 * Runs as part of deployment checks
 */
const fs = require('fs');
const path = require('path');

const WALLETS_FILE = path.join(__dirname, 'public', 'wallets.json');

function validate() {
  console.log('🔍 Validating Wallet Stats\n');
  
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  
  const requiredFields = [
    'leoName',
    'address',
    'score',
    'totalTrades',
    'profitableTrades',
    'profitRate',
    'totalPnl',
    'highestTrade',
    'avgHoldTime',
    'tokenDiversity',
    'lastActivity',
    'daysSinceActive'
  ];
  
  let errors = 0;
  let warnings = 0;
  
  wallets.forEach((wallet, idx) => {
    // Check required fields exist
    const missing = requiredFields.filter(field => !(field in wallet));
    if (missing.length > 0) {
      console.log(`❌ ${wallet.leoName || `Wallet ${idx}`}: Missing fields: ${missing.join(', ')}`);
      errors++;
    }
    
    // Check for suspicious values
    if (wallet.totalTrades === 0 && wallet.lastActivity) {
      console.log(`⚠️  ${wallet.leoName}: Has lastActivity but 0 trades`);
      warnings++;
    }
    
    if (wallet.profitableTrades > wallet.totalTrades) {
      console.log(`❌ ${wallet.leoName}: Profitable trades (${wallet.profitableTrades}) > Total trades (${wallet.totalTrades})`);
      errors++;
    }
    
    if (wallet.profitRate < 0 || wallet.profitRate > 100) {
      console.log(`❌ ${wallet.leoName}: Invalid win rate: ${wallet.profitRate}%`);
      errors++;
    }
  });
  
  // Summary stats
  const avgTrades = wallets.reduce((sum, w) => sum + w.totalTrades, 0) / wallets.length;
  const avgWinRate = wallets.reduce((sum, w) => sum + w.profitRate, 0) / wallets.length;
  const totalPnl = wallets.reduce((sum, w) => sum + w.totalPnl, 0);
  const walletsWithTrades = wallets.filter(w => w.totalTrades > 0).length;
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Validation Summary:\n');
  console.log(`   Total Wallets: ${wallets.length}`);
  console.log(`   Wallets with Trades: ${walletsWithTrades}/${wallets.length}`);
  console.log(`   Avg Trades: ${avgTrades.toFixed(1)}`);
  console.log(`   Avg Win Rate: ${avgWinRate.toFixed(1)}%`);
  console.log(`   Total PnL: $${totalPnl.toLocaleString()}`);
  console.log(`\n   Errors: ${errors}`);
  console.log(`   Warnings: ${warnings}\n`);
  
  if (errors > 0) {
    console.log('❌ Validation FAILED - Fix errors before deploying\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('⚠️  Validation passed with warnings\n');
  } else {
    console.log('✅ Validation PASSED - All stats look good\n');
  }
}

validate();
