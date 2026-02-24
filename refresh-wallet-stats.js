#!/usr/bin/env node
/**
 * Full wallet stats refresh + deployment
 * Runs every 6 hours to keep Trading Performance Metrics current
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const WALLETS_FILE = path.join(__dirname, 'public', 'wallets.json');
const STATE_FILE = path.join(__dirname, '.last-stats-refresh.json');

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load state:', err.message);
  }
  return { lastRun: 0, lastChecksum: '' };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function getChecksum(filepath) {
  const data = fs.readFileSync(filepath, 'utf8');
  return require('crypto').createHash('md5').update(data).digest('hex');
}

function exec(cmd, cwd) {
  try {
    return execSync(cmd, { 
      cwd, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    throw err;
  }
}

async function run() {
  console.log('🔄 DiClawprio Stats Refresh\n');
  
  const state = loadState();
  const now = Date.now();
  const timeSinceLastRun = now - state.lastRun;
  const hoursSince = (timeSinceLastRun / (1000 * 60 * 60)).toFixed(1);
  
  console.log(`⏰ Last refresh: ${hoursSince}h ago\n`);
  
  // Get current checksum
  const oldChecksum = getChecksum(WALLETS_FILE);
  
  // Run comprehensive stats scan
  console.log('📊 Running comprehensive trade analysis...\n');
  exec('node scan-all-trades.js', __dirname);
  
  // Check if data changed
  const newChecksum = getChecksum(WALLETS_FILE);
  const dataChanged = oldChecksum !== newChecksum;
  
  if (dataChanged) {
    console.log('\n✅ Wallet stats updated');
    console.log('🚀 Deploying to Vercel...\n');
    exec('vercel --prod', __dirname);
    
    saveState({
      lastRun: now,
      lastChecksum: newChecksum
    });
    
    console.log('\n✅ Stats refresh complete and deployed');
  } else {
    console.log('\n✓ No changes detected, skipping deployment');
    
    saveState({
      lastRun: now,
      lastChecksum: oldChecksum
    });
  }
  
  // Summary
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  const avgTrades = wallets.reduce((sum, w) => sum + w.totalTrades, 0) / wallets.length;
  const avgWinRate = wallets.reduce((sum, w) => sum + w.profitRate, 0) / wallets.length;
  const totalPnl = wallets.reduce((sum, w) => sum + w.totalPnl, 0);
  
  console.log('\n📈 Current Stats:');
  console.log(`   Wallets: ${wallets.length}`);
  console.log(`   Avg Trades: ${avgTrades.toFixed(1)}`);
  console.log(`   Avg Win Rate: ${avgWinRate.toFixed(1)}%`);
  console.log(`   Total PnL: $${totalPnl.toLocaleString()}`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
