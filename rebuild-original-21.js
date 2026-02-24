#!/usr/bin/env node
const fs = require('fs');

// Original 21 wallets: top 17 from alpha discovery + 4 from millionaire scan
const wallets = [
  // Top 17 from alpha discovery
  "JESUSL2s5BsffGNNn6wQtHART2iXVGjtGhKAwGw44bL",
  "7zujqoQsFic14ncDYhBSVGvDnqc94rE49c1ZJCHvAtiW",
  "G7WD84zx6tPHtJtEtRB8hb9EWryKeZmQHLZ6vrLK2NtT",
  "5zQf1wrbrv7TRPNzxWUyQrtX5HwuiagDwj9fxMKaMCYL",
  "EUDj8idRk3hwHvUV8M7LmPfvrCNADoMGDd7ZX4s38ntA",
  "9pGgHTq2N8J6bgWwCiXrUfuk2wDrmYGKwPQapF3y7PL3",
  "GncUW8pi4vzjgRGjvH29p4QArSkvxMvJP1rgFUPBHeSv",
  "6YPYyVfWiYHzV6d6xAK3gwEmz7RNGf5FTY3Ws2q5P7Nr",
  "DbFS3c9wpKtJiqFYu83QmpqHDBJtjKY8hqTL9AGZfRir",
  "8YkU4UGm1LAZj3DEyXjFFTwuxbo7U2LxXGM5oeT5jZ2H",
  "HydraXoSz7oE3774DoWQQaofKb31Kbn2cbcqG4ShKy85",
  "9xy2zUdmiAjk6yUkED61T78ca8F6XTyFCZxXXfXM9vMv",
  "8FrR7guxGdGhGQaBGNuaW88e2Y4aVg8iscE8U4676inM",
  "3rSmYcQqCsUsvu7HzTZvsKSz5kKm9RLcCNpnkhCP1djH",
  "RustUSBDaDcRRbT8JRmJ8GpomiXiMdgt3iYwbA59xvB",
  "2mw9Th6unQLVhVEaseSen5cxQxdzoQBp6QDstVgfP7w7",
  "3N9WjGffEtrGstVQc5VoyRy1YGNENrkW6SzGyTeLfp5t",
  // 4 from millionaire scan
  "AZ2hpSLkQu974wKD7Bxv7w9YZg399ZhBcboSLtRabq9v",
  "5YQh4Dtau16p5yYiKzxeLTdEaNk32sdStyAY1g66iW8",
  "Fn9b63R2MzPHURpGhL2xmfnhNJ4EE1XQBLdicuNyX7Ti",
  "AtTjs8xD8MmbYMUtwRV8KhYUgCVuD3btGaWZb6zEDNQE"
];

const walletsData = wallets.map((address, index) => {
  const leoId = index + 1;
  const leoName = `LEO-${String(leoId).padStart(3, '0')}`;
  const source = index < 17 ? 'alpha_discovery' : 'millionaire_scan';
  
  return {
    address,
    leoName,
    tier: 'alpha',
    tierName: 'Alpha',
    tierEmoji: '⚡',
    score: 50,
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
    source,
    note: source === 'alpha_discovery' ? 'Early wallet discovery' : 'Millionaire token trader'
  };
});

fs.writeFileSync('./public/wallets.json', JSON.stringify(walletsData, null, 2));
console.log(`✅ Restored ${walletsData.length} original wallets`);
console.log('   17 from alpha discovery + 4 from millionaire scan');
console.log('\n📋 Wallets:');
walletsData.forEach(w => {
  console.log(`   ${w.leoName}: ${w.address.slice(0, 8)}... (${w.source})`);
});
