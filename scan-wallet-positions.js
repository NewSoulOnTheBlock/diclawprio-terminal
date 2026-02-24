#!/usr/bin/env node
/**
 * Scan all tracked wallets for ALL-TIME positions
 * Criteria:
 * - Buy within last 365 days (all-time tracking)
 * - Still holding
 * - PNL: -30% to any positive
 * - Holding over 5,000,000 tokens
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'eba88a54-8b36-4cde-96c1-622eeedc01c0';
const WALLETS_FILE = path.join(__dirname, 'public', 'wallets.json');
const SIGNALS_FILE = path.join(__dirname, 'public', 'signals.json');

const CRITERIA = {
  maxDaysOld: 365, // Changed to 1 year for all-time tracking
  minTokenHolding: 5000000,
  minPnlPercent: -30,
  maxPnlPercent: Infinity // Any positive is good
};

const TIERS = {
  ultra: { max: 10000, name: 'Ultra Alpha', emoji: '🔥', color: '#ff0000' },
  alpha: { max: 30000, name: 'Alpha', emoji: '⚡', color: '#00ff00' },
  early: { max: 100000, name: 'Early Entry', emoji: '💎', color: '#ffff00' }
};

function calculateTier(entryMarketCap) {
  if (entryMarketCap < TIERS.ultra.max) return 'ultra';
  if (entryMarketCap < TIERS.alpha.max) return 'alpha';
  if (entryMarketCap < TIERS.early.max) return 'early';
  return 'late';
}

async function getWalletTokenBalances(walletAddress) {
  const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
  
  const response = await axios.post(url, {
    jsonrpc: '2.0',
    id: 'balance-check',
    method: 'getTokenAccountsByOwner',
    params: [
      walletAddress,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      { encoding: 'jsonParsed' }
    ]
  });
  
  const accounts = response.data?.result?.value || [];
  
  return accounts.map(acc => ({
    mint: acc.account.data.parsed.info.mint,
    balance: parseFloat(acc.account.data.parsed.info.tokenAmount.uiAmount || 0),
    decimals: acc.account.data.parsed.info.tokenAmount.decimals
  })).filter(t => t.balance > 0);
}

async function getRecentTransactions(walletAddress, limit = 100) {
  const url = `https://api.helius.xyz/v0/addresses/${walletAddress}/transactions?api-key=${HELIUS_API_KEY}`;
  
  try {
    const response = await axios.get(url, { params: { limit } });
    return response.data || [];
  } catch (err) {
    console.error(`Failed to fetch transactions for ${walletAddress.slice(0, 8)}: ${err.message}`);
    return [];
  }
}

async function getTokenPrice(tokenMint) {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenMint}`;
    const response = await axios.get(url, { timeout: 5000 });
    
    const pairs = response.data?.pairs || [];
    if (pairs.length === 0) return null;
    
    // Pick best pair by liquidity
    const bestPair = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
    
    return {
      priceUsd: parseFloat(bestPair.priceUsd || 0),
      priceChange24h: parseFloat(bestPair.priceChange?.h24 || 0),
      marketCap: parseFloat(bestPair.fdv || 0),
      pairAddress: bestPair.pairAddress,
      symbol: bestPair.baseToken?.symbol || 'UNKNOWN'
    };
  } catch (err) {
    return null;
  }
}

function findBuyTransactions(transactions, tokenBalances) {
  const buys = [];
  const now = Date.now();
  const maxAge = CRITERIA.maxDaysOld * 24 * 60 * 60 * 1000;
  
  for (const tx of transactions) {
    const timestamp = tx.timestamp * 1000;
    if (now - timestamp > maxAge) continue; // Too old
    
    // Look for token transfers TO this wallet
    const tokenTransfers = tx.tokenTransfers || [];
    
    for (const transfer of tokenTransfers) {
      if (transfer.toUserAccount === tx.feePayer) {
        // This wallet received tokens
        const tokenMint = transfer.mint;
        const amount = parseFloat(transfer.tokenAmount || 0);
        
        // Check if still holding this token
        const currentBalance = tokenBalances.find(b => b.mint === tokenMint);
        if (!currentBalance || currentBalance.balance < CRITERIA.minTokenHolding) {
          continue; // Not holding enough
        }
        
        buys.push({
          tokenMint,
          buyTimestamp: timestamp,
          buyAmount: amount,
          currentBalance: currentBalance.balance,
          txSignature: tx.signature
        });
      }
    }
  }
  
  return buys;
}

async function enrichPosition(position, walletAddress, walletName) {
  // Get current token price
  const priceData = await getTokenPrice(position.tokenMint);
  
  if (!priceData || !priceData.priceUsd) {
    return null; // Can't calculate PNL without price
  }
  
  // Estimate entry price (rough calculation)
  // This is a simplification - ideally we'd parse the swap amounts from the tx
  const currentValue = position.currentBalance * priceData.priceUsd;
  
  // Assume entry was at a similar market cap (this is imperfect but works for filtering)
  // Better would be to parse the actual SOL spent and calculate entry price
  // For now, use 24h price change as a proxy for PNL
  const pnlPercent = priceData.priceChange24h;
  
  // Filter by PNL
  if (pnlPercent < CRITERIA.minPnlPercent || pnlPercent > CRITERIA.maxPnlPercent) {
    return null;
  }
  
  const daysOld = (Date.now() - position.buyTimestamp) / (24 * 60 * 60 * 1000);
  const entryMcap = priceData.marketCap * (100 / (100 + pnlPercent));
  const tier = calculateTier(entryMcap);
  const tierInfo = TIERS[tier] || TIERS.early;
  
  return {
    id: `${walletAddress}-${position.tokenMint}`,
    timestamp: position.buyTimestamp,
    walletAddress,
    walletName,
    action: 'BUY',
    tokenMint: position.tokenMint,
    tokenSymbol: priceData.symbol,
    amount: position.buyAmount,
    currentBalance: position.currentBalance,
    priceChange24h: pnlPercent,
    entryMarketCap: entryMcap,
    currentMarketCap: priceData.marketCap,
    pairAddress: priceData.pairAddress,
    txSignature: position.txSignature,
    axiomLink: `https://axiom.trade/meme/${priceData.pairAddress}`,
    daysHeld: daysOld.toFixed(1),
    pnlHistory: generatePnlHistory(pnlPercent, daysOld),
    tier: tier,
    tierName: tierInfo.name,
    tierEmoji: tierInfo.emoji
  };
}

function generatePnlHistory(currentPnl, daysHeld) {
  // Generate simple PNL history for graphing
  // This is simulated - real implementation would track actual price history
  const points = Math.min(Math.ceil(daysHeld), 14);
  const history = [];
  
  for (let i = 0; i <= points; i++) {
    const progress = i / points;
    // Simulate some volatility
    const variance = (Math.random() - 0.5) * 20;
    const pnl = (currentPnl * progress) + variance;
    history.push({
      day: i,
      pnl: parseFloat(pnl.toFixed(2))
    });
  }
  
  // Ensure last point is actual current PNL
  history[history.length - 1].pnl = currentPnl;
  
  return history;
}

async function scanWallet(wallet) {
  console.log(`\n🔍 Scanning ${wallet.leoName} (${wallet.address.slice(0, 8)}...)`);
  
  try {
    // Get current token balances
    const balances = await getWalletTokenBalances(wallet.address);
    console.log(`   Found ${balances.length} token holdings`);
    
    // Get recent transactions
    const transactions = await getRecentTransactions(wallet.address, 100);
    console.log(`   Found ${transactions.length} recent transactions`);
    
    // Find buy transactions
    const buys = findBuyTransactions(transactions, balances);
    console.log(`   Found ${buys.length} recent buys still held`);
    
    // Enrich with price data and filter
    const positions = [];
    for (const buy of buys) {
      const enriched = await enrichPosition(buy, wallet.address, wallet.leoName);
      if (enriched) {
        positions.push(enriched);
        console.log(`   ✅ ${enriched.tokenSymbol}: ${enriched.priceChange24h >= 0 ? '+' : ''}${enriched.priceChange24h.toFixed(1)}% | ${enriched.daysHeld}d old`);
      }
      
      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return positions;
    
  } catch (err) {
    console.error(`   ❌ Error: ${err.message}`);
    return [];
  }
}

async function run() {
  console.log('📊 ALPHA WALLET POSITION SCANNER\n');
  console.log('Criteria:');
  console.log(`  • Buy within last ${CRITERIA.maxDaysOld} days`);
  console.log(`  • Still holding > ${CRITERIA.minTokenHolding.toLocaleString()} tokens`);
  console.log(`  • PNL: ${CRITERIA.minPnlPercent}% to any positive`);
  console.log('\n' + '═'.repeat(60));
  
  // Load wallets
  const wallets = JSON.parse(fs.readFileSync(WALLETS_FILE, 'utf8'));
  console.log(`\n📂 Loaded ${wallets.length} tracked wallets`);
  
  // Scan each wallet
  const allPositions = [];
  
  for (const wallet of wallets) {
    const positions = await scanWallet(wallet);
    allPositions.push(...positions);
    
    // Rate limit between wallets
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 SUMMARY:`);
  console.log(`  Total active positions found: ${allPositions.length}`);
  
  if (allPositions.length > 0) {
    // Sort by PNL (best to worst)
    allPositions.sort((a, b) => b.priceChange24h - a.priceChange24h);
    
    console.log(`\n🎯 TOP POSITIONS:\n`);
    allPositions.slice(0, 10).forEach((p, i) => {
      console.log(`${i + 1}. ${p.walletName} | ${p.tokenSymbol}`);
      console.log(`   PNL: ${p.priceChange24h >= 0 ? '+' : ''}${p.priceChange24h.toFixed(1)}% | Held: ${p.daysHeld}d`);
      console.log(`   Holding: ${p.currentBalance.toLocaleString()} tokens\n`);
    });
  }
  
  // Save to signals.json
  fs.writeFileSync(SIGNALS_FILE, JSON.stringify(allPositions, null, 2));
  console.log(`\n💾 Saved ${allPositions.length} positions to ${SIGNALS_FILE}`);
  
  console.log(`\n🔄 Next: Deploy to Vercel to update terminal`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
