#!/usr/bin/env node
const axios = require('axios');

const TOKEN_MINT = 'NV2RYH954cTJ3ckFUpvfqaQXU4ARqqDH3562nFSpump';
const HELIUS_API_KEY = 'eba88a54-8b36-4cde-96c1-622eeedc01c0';

async function getTokenInfo() {
  console.log('🎯 Checking $PUNCH token...\n');
  
  try {
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${TOKEN_MINT}`);
    const pair = response.data.pairs[0];
    
    console.log('📊 Token Info:');
    console.log(`   Symbol: ${pair.baseToken.symbol}`);
    console.log(`   Price: $${pair.priceUsd}`);
    console.log(`   MCap: $${pair.fdv.toLocaleString()}`);
    console.log(`   Volume 24h: $${pair.volume.h24.toLocaleString()}`);
    console.log(`   Pair: ${pair.pairAddress}\n`);
    
    return pair;
  } catch (err) {
    console.error('Failed to fetch token info:', err.message);
    return null;
  }
}

async function getTopHolders() {
  console.log('👥 Fetching top holders...\n');
  
  try {
    const response = await axios.post(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      jsonrpc: '2.0',
      id: 'get-holders',
      method: 'getTokenLargestAccounts',
      params: [TOKEN_MINT]
    });
    
    const accounts = response.data.result?.value || [];
    console.log(`   Found ${accounts.length} holder accounts\n`);
    
    // Get owner addresses for each token account
    const holders = [];
    for (const account of accounts.slice(0, 30)) {
      try {
        const ownerResponse = await axios.post(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
          jsonrpc: '2.0',
          id: 'get-account-info',
          method: 'getAccountInfo',
          params: [account.address, { encoding: 'jsonParsed' }]
        });
        
        const parsed = ownerResponse.data.result?.value?.data?.parsed;
        if (parsed?.info?.owner) {
          holders.push({
            owner: parsed.info.owner,
            balance: account.uiAmount
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        console.error(`Failed to get owner for ${account.address}`);
      }
    }
    
    return holders;
  } catch (err) {
    console.error('Failed to fetch holders:', err.message);
    return [];
  }
}

async function getRecentTraders() {
  console.log('📈 Fetching recent traders...\n');
  
  try {
    // Get recent transactions for the token
    const response = await axios.post(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      jsonrpc: '2.0',
      id: 'get-sigs',
      method: 'getSignaturesForAddress',
      params: [TOKEN_MINT, { limit: 1000 }]
    });
    
    const signatures = response.data.result || [];
    console.log(`   Found ${signatures.length} recent transactions\n`);
    
    // Count traders by frequency
    const traderActivity = new Map();
    
    for (const sig of signatures.slice(0, 500)) {
      try {
        const txResponse = await axios.post(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
          jsonrpc: '2.0',
          id: 'get-tx',
          method: 'getTransaction',
          params: [sig.signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]
        });
        
        const tx = txResponse.data.result;
        if (tx?.transaction?.message?.accountKeys) {
          const signer = tx.transaction.message.accountKeys[0]?.pubkey || tx.transaction.message.accountKeys[0];
          if (signer) {
            traderActivity.set(signer, (traderActivity.get(signer) || 0) + 1);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
      } catch (err) {
        // Skip failed transactions
      }
    }
    
    // Sort by activity
    const traders = Array.from(traderActivity.entries())
      .map(([address, trades]) => ({ address, trades }))
      .sort((a, b) => b.trades - a.trades)
      .slice(0, 20);
    
    return traders;
  } catch (err) {
    console.error('Failed to fetch traders:', err.message);
    return [];
  }
}

async function checkAgainstAlphaWallets(addresses) {
  const fs = require('fs');
  const path = require('path');
  const walletsPath = path.join(__dirname, 'public', 'wallets.json');
  const wallets = JSON.parse(fs.readFileSync(walletsPath, 'utf8'));
  const alphaAddresses = new Set(wallets.map(w => w.address));
  
  const matches = addresses.filter(addr => alphaAddresses.has(addr));
  return matches;
}

async function run() {
  console.log('🔍 $PUNCH Alpha Wallet Analysis\n');
  console.log('═'.repeat(60) + '\n');
  
  // Get token info
  const tokenInfo = await getTokenInfo();
  if (!tokenInfo) return;
  
  // Get holders
  const holders = await getTopHolders();
  console.log(`✅ Retrieved ${holders.length} top holders\n`);
  
  // Get traders
  const traders = await getRecentTraders();
  console.log(`✅ Retrieved ${traders.length} top traders\n`);
  
  console.log('═'.repeat(60) + '\n');
  
  // Check against our alpha wallets
  const holderAddresses = holders.map(h => h.owner);
  const traderAddresses = traders.map(t => t.address);
  const allAddresses = [...new Set([...holderAddresses, ...traderAddresses])];
  
  console.log('🎯 Checking against our alpha wallet list...\n');
  const matches = await checkAgainstAlphaWallets(allAddresses);
  
  if (matches.length > 0) {
    console.log(`✅ FOUND ${matches.length} ALPHA WALLETS IN $PUNCH:\n`);
    matches.forEach(addr => {
      const isHolder = holderAddresses.includes(addr);
      const isTrader = traderAddresses.includes(addr);
      const type = isHolder && isTrader ? 'HOLDER + TRADER' : isHolder ? 'HOLDER' : 'TRADER';
      console.log(`   ${addr.slice(0, 8)}... - ${type}`);
    });
  } else {
    console.log('❌ No alpha wallets found in $PUNCH holders or traders\n');
  }
  
  // Show top traders
  console.log('\n📊 TOP 10 TRADERS BY ACTIVITY:\n');
  traders.slice(0, 10).forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.address.slice(0, 8)}... - ${t.trades} trades`);
  });
  
  // Show top holders
  console.log('\n👥 TOP 10 HOLDERS BY BALANCE:\n');
  holders.slice(0, 10).forEach((h, i) => {
    console.log(`   ${i + 1}. ${h.owner.slice(0, 8)}... - ${h.balance.toLocaleString()} $PUNCH`);
  });
  
  // Export new traders to add
  const newTraders = traders.filter(t => !matches.includes(t.address)).slice(0, 5);
  console.log('\n💾 Exporting top 5 new traders for import:\n');
  newTraders.forEach(t => {
    console.log(`   ${t.address} - ${t.trades} trades`);
  });
  
  const exportPath = require('path').join(__dirname, 'punch-new-wallets.json');
  require('fs').writeFileSync(exportPath, JSON.stringify(newTraders, null, 2));
  console.log(`\n✅ Saved to: ${exportPath}`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
