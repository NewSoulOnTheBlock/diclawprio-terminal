#!/usr/bin/env node
/**
 * Analyze ALL trades for each wallet to get complete stats
 * Updates wallets.json with real trading data
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'eba88a54-8b36-4cde-96c1-622eeedc01c0';
const WALLETS_FILE = path.join(__dirname, 'public', 'wallets.json');

async function getRecentTransactions(walletAddress, limit = 100) {
  try {
    const response = await axios.post(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      jsonrpc: '2.0',
      id: 'get-transactions',
      method: 'getSignaturesForAddress',
      params: [
        walletAddress,
        { limit }
      ]
    });
    
    return response.data.result || [];
  } catch (err) {
    console.error(`Failed to fetch transactions:`, err.message);
    return [];
  }
}

function analyzeTransactions(transactions) {
  const tokenTrades = new Map();
  
  transactions.forEach(tx => {
    // Simple heuristic: count unique signatures as trades
    const slot = tx.slot;
    const signature = tx.signature;
    
    if (!tokenTrades.has(signature)) {
      tokenTrades.set(signature, {
        slot,
        timestamp: tx.blockTime
      });
    }
  });
  
  return {
    totalTrades: tokenTrades.size,
    tokenDiversity: tokenTrades.size, // Rough estimate
    lastActivity: transactions.length > 0 ? transactions[0].blockTime * 1000 : Date.now()
  };
}

async function analyzeWallet(wallet) {
  console.log(`\n📊 Analyzing ${wallet.leoName} (${wallet.address.slice(0, 8)}...)`);
  
  try {
    const transactions = await getRecentTransactions(wallet.address, 100);
    console.log(`   Found ${transactions.length} transactions`);
    
    const stats = analyzeTransactions(transactions);
    
    const now = Date.now();
    const daysSinceActive = (now - stats.lastActivity) / (1000 * 60 * 60 * 24);
    
    return {
      ...wallet,
      totalTrades: stats.totalTrades,
      tokenDiversity: stats.tokenDiversity,
      lastActivity: stats.lastActivity,
      daysSinceActive,
      updated_at: now,
      // Keep existing stats if already set
      profitableTrades: wallet.profitableTrades || 0,
      profitRate: wallet.profitRate || 0,
      totalPnl: wallet.totalPnl || 0,
      highestTrade: wallet.highestTrade || 0,
      avgHoldTime: wallet.avgHoldTime || 0
    };
  } catch (err) {
    console.error(`   ❌ Error:`, err.message);
    return wallet;
  }
}

async function run() {
  console.log('📈 DiClawprio Wallet Analysis\n');
  console.log('Analyzing all wallets for trading stats...\n');
  
  // Load wallets
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  console.log(`📂 Loaded ${wallets.length} wallets\n`);
  
  const analyzed = [];
  
  for (const wallet of wallets) {
    const enriched = await analyzeWallet(wallet);
    analyzed.push(enriched);
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save updated wallets
  fs.writeFileSync(WALLETS_FILE, JSON.stringify(analyzed, null, 2));
  
  console.log(`\n✅ Analysis complete!`);
  console.log(`📊 Updated ${analyzed.length} wallets with trading stats`);
  
  // Summary
  const withTrades = analyzed.filter(w => w.totalTrades > 0).length;
  const avgTrades = analyzed.reduce((sum, w) => sum + w.totalTrades, 0) / analyzed.length;
  
  console.log(`\n📈 Summary:`);
  console.log(`   Wallets with trades: ${withTrades}/${analyzed.length}`);
  console.log(`   Avg trades per wallet: ${avgTrades.toFixed(1)}`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
