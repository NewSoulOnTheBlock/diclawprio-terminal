const fs = require('fs');
const path = require('path');

const SIGNALS_FILE = path.join(__dirname, 'public', 'signals.json');
const STATE_FILE = path.join(__dirname, 'posted-signals-state.json');
const TELEGRAM_CHAT_ID = '-1003620974523'; // DiClawprio group
const CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

// Load state of already posted signals
function loadPostedState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading state:', err);
  }
  return { postedIds: [] };
}

// Save state of posted signals
function savePostedState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Error saving state:', err);
  }
}

// Format signal for Telegram message
function formatSignal(signal) {
  const tokenSymbol = signal.tokenSymbol || signal.tokenMint?.slice(0, 6) || 'UNKNOWN';
  
  let entryMcapDisplay = 'N/A';
  if (signal.entryMarketCap && signal.entryMarketCap > 0) {
    entryMcapDisplay = signal.entryMarketCap > 1000 
      ? `$${(signal.entryMarketCap / 1000).toFixed(1)}k`
      : `$${Math.round(signal.entryMarketCap)}`;
  }
  
  let pnlDisplay = 'N/A';
  if (signal.currentMarketCap && signal.entryMarketCap && signal.entryMarketCap > 0) {
    const pnlPercent = ((signal.currentMarketCap - signal.entryMarketCap) / signal.entryMarketCap * 100);
    pnlDisplay = `${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(1)}%`;
  } else if (signal.priceChange24h !== undefined && signal.priceChange24h !== null) {
    pnlDisplay = `${signal.priceChange24h >= 0 ? '+' : ''}${signal.priceChange24h.toFixed(1)}%`;
  }
  
  const walletName = signal.walletName || 'LEO-???';
  const axiomLink = signal.axiomLink || `https://axiom.trade/meme/${signal.pairAddress || signal.tokenMint}`;
  
  const signalAge = Date.now() - signal.timestamp;
  const ageHours = (signalAge / 1000 / 60 / 60).toFixed(1);
  
  return `🚨 ALPHA SIGNAL

Wallet: ${walletName}
Token: ${tokenSymbol}
Entry Mcap: ${entryMcapDisplay}
PNL: ${pnlDisplay}
Time: ${ageHours}h ago

Trade: ${axiomLink}`;
}

// Check for new signals
async function checkSignals() {
  try {
    if (!fs.existsSync(SIGNALS_FILE)) {
      console.log('No signals file yet');
      return;
    }
    
    const signals = JSON.parse(fs.readFileSync(SIGNALS_FILE, 'utf8'));
    const state = loadPostedState();
    
    // Find new signals (not yet posted)
    const newSignals = signals.filter(s => !state.postedIds.includes(s.id));
    
    if (newSignals.length === 0) {
      console.log(`[${new Date().toISOString()}] No new signals`);
      return;
    }
    
    console.log(`[${new Date().toISOString()}] Found ${newSignals.length} new signal(s)`);
    
    // Post each new signal to Telegram
    for (const signal of newSignals) {
      const message = formatSignal(signal);
      console.log(`Posting signal ${signal.id}:`, message);
      
      // Print the message that would be sent
      // In production, this would use the OpenClaw message API
      console.log('\n--- MESSAGE TO SEND ---');
      console.log(message);
      console.log('--- END MESSAGE ---\n');
      
      // Mark as posted
      state.postedIds.push(signal.id);
    }
    
    // Save updated state
    savePostedState(state);
    
  } catch (err) {
    console.error('Error checking signals:', err);
  }
}

// Start monitoring
console.log(`Starting signal monitor for chat ${TELEGRAM_CHAT_ID}`);
console.log(`Checking ${SIGNALS_FILE} every ${CHECK_INTERVAL_MS/1000}s`);

// Initial check
checkSignals();

// Periodic checks
setInterval(checkSignals, CHECK_INTERVAL_MS);
