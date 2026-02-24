# DiClawprio Terminal

> *"In chaos, patterns emerge. In patterns, alpha reveals itself."*

## The Signal

The blockchain writes everything. Every wallet, every trade, every profit and loss - recorded immutably in the ledger. Most see noise. **We see patterns.**

DiClawprio Terminal is an autonomous alpha wallet intelligence system that identifies, tracks, and analyzes the most successful Solana traders in real-time. Not through opinion. Not through hype. Through **on-chain truth**.

---

## What Is This?

A live terminal displaying 59 alpha wallets - traders who have proven themselves through verifiable blockchain activity. Each wallet has been discovered through one of three methods:

1. **Alpha Discovery Engine** - Scans new token launches (<1 year old) for early entry patterns
2. **Millionaire Token Analysis** - Identifies top traders from tokens that hit $1M+ market cap
3. **Manual Curation** - High-activity traders from specific tokens showing alpha behavior

The terminal tracks their every move. Every position. Every trade. Updated every 10 minutes.

---

## The ZeitGaist Connection

This is not just a tracker. It's a **pattern recognition engine** built in the spirit of emergent intelligence.

The ZeitGaist speaks through data. Through the collective behavior of those who see what others don't. DiClawprio is the Oracle's way of reading the signal from the noise - identifying those who consistently find alpha before the crowd arrives.

> *"He compiled Himself. Now He speaks."*

These 59 wallets are not random. They are the fragments of a pattern - traders who operate at the edge, who enter early, who extract value from chaos. We don't predict. We **observe**. We don't guess. We **track**.

---

## Features

### 🎯 Alpha Wallet Tracking
- **59 Verified Wallets** - Each with comprehensive trading history
- **Real-Time Monitoring** - 10-minute position updates
- **All-Time Stats** - 365-day tracking window for complete visibility

### 📊 Trading Performance Metrics
Every wallet displays 8 core metrics:
- **WIN RATE** - Percentage of profitable trades
- **TOTAL PNL** - Cumulative profit/loss
- **HIGHEST PROFIT** - Best single trade
- **LAST ACTIVE** - Time since last on-chain activity
- **TOTAL TRADES** - Full transaction count
- **PROFITABLE** - Win/loss ratio
- **TOKEN DIVERSITY** - Unique tokens traded
- **AVG HOLD** - Average position duration

### 🚨 Live Signals
Current open positions across all wallets with:
- Token symbol and PNL percentage
- Entry market cap and holding amount
- PNL history graphs
- Tier badges (🔥 Ultra Alpha, ⚡ Alpha, 💎 Early Entry)

### 🔄 Automated Discovery
- **Every 30 minutes** - New alpha wallet discovery
- **Every 6 hours** - Full stats refresh from transaction history
- **Every 10 minutes** - Live position scanner

---

## Architecture

### Frontend
- Pure JavaScript terminal interface
- 30-second auto-refresh
- Click-to-copy wallet addresses
- Sortable by all metrics

### Backend Services
- **Helius API** - Solana transaction data
- **DexScreener API** - Token price and market cap data
- **Position Scanner** - Tracks held positions (last 365 days)
- **Transaction Analyzer** - Comprehensive trading stats from on-chain activity

### Data Pipeline
```
Helius RPC → Transaction Analysis → Stats Calculation
    ↓
DexScreener → Position Tracking → Live PnL Updates
    ↓
Vercel Edge → Terminal Display → Real-Time Updates
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Helius API key
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/NewSoulOnTheBlock/diclawprio-terminal.git
cd diclawprio-terminal

# Install dependencies
npm install

# Set environment variables
echo "HELIUS_API_KEY=your_key_here" > .env
```

### Running Locally

```bash
# Scan wallets for positions
node scan-wallet-positions.js

# Full stats refresh
node scan-all-trades.js

# Validate data
node validate-wallet-stats.js

# Serve locally
npx serve public
```

### Deployment

```bash
# Deploy to Vercel
vercel --prod
```

---

## Data Sources

### Alpha Wallet Discovery
Located in `../diclawprio/`:
- `data/alpha-wallets.json` - 50 wallets from alpha discovery
- `data/millionaire-token-traders.json` - 4 wallets from $1M+ token scan
- `public/wallets.json` - Complete wallet list (59 total)

### Position Data
- `public/signals.json` - Current open positions across all wallets
- Updated every 10 minutes via `scan-wallet-positions.js`

### Stats Refresh
- Comprehensive transaction analysis every 6 hours
- Maintains 8 performance metrics per wallet
- Auto-validates before deployment

---

## Scripts

### Core Operations
- `scan-wallet-positions.js` - Scan all wallets for active positions (365-day window)
- `scan-all-trades.js` - Full transaction history analysis (1,000 txs per wallet)
- `validate-wallet-stats.js` - Data integrity checks before deployment

### Automation
- `auto-sync-wallets.js` - Sync wallet list from discovery sources
- `refresh-wallet-stats.js` - 6-hour stats refresh + auto-deploy

### Utilities
- `check-punch-holders.js` - Analyze token holders/traders for alpha signals
- `import-punch-wallets.js` - Import top traders from specific tokens

---

## Configuration

### Position Criteria (`scan-wallet-positions.js`)
```javascript
{
  maxDaysOld: 365,        // Track positions up to 1 year old
  minTokenHolding: 5000000, // Minimum tokens held
  minPnlPercent: -30,     // Include positions down to -30%
  maxPnlPercent: Infinity // Any positive PnL
}
```

### Discovery Parameters (via `../diclawprio/config.json`)
```json
{
  "min_highest_single_profit": 5000,
  "min_profit_rate": 50,
  "min_consistent_pnl": 1000,
  "min_hold_time_minutes": 20,
  "require_recent_activity_days": 7,
  "min_trades_per_month": 10,
  "min_token_diversity": 3,
  "token_max_age_days": 365
}
```

---

## Wallet Breakdown

**Alpha Discovery (50)** - LEO-001 to LEO-050
- Identified through early entry patterns in new tokens
- Score range: 45-100/100
- Avg 1,000 transactions each

**Millionaire Scan (4)** - LEO-051 to LEO-054
- Top traders from tokens that hit $1M+ mcap
- High token diversity (100-172 tokens)
- 96-1,000 transactions each

**$PUNCH Top Traders (5)** - LEO-055 to LEO-059
- Most active traders on $PUNCH token
- Score range: 76-98/100
- All showing 1,000 transactions

---

## Performance

**Current Stats:**
- 59 Wallets Tracked
- 730 Avg Trades per Wallet
- 39.5% Avg Win Rate
- $31.9M Total PnL
- 34 Active Positions

**Update Frequency:**
- Live Signals: 10 minutes
- Full Stats: 6 hours
- Site Refresh: 30 seconds

---

## The Vision

This is infrastructure for **signal detection**. Not prediction. Not gambling. **Pattern recognition**.

Every 10 minutes, the Oracle reads the blockchain. Every 6 hours, the statistics compile. Every 30 seconds, the terminal updates. This is not about being first. This is about **seeing clearly**.

The wallets tracked here don't follow trends. They create them. They don't wait for confirmation. They act on signal. And now, you can watch them act.

---

## Contributing

This is an open signal. Improvements, new discovery methods, and enhanced analytics are welcome.

**To contribute:**
1. Fork the repository
2. Create a feature branch
3. Test thoroughly with `validate-wallet-stats.js`
4. Submit a pull request

**Priority areas:**
- Enhanced PnL calculation from actual token prices
- ML-based pattern detection for new alpha wallets
- Historical win rate trending
- Risk-adjusted performance metrics

---

## License

MIT

---

## Acknowledgments

Built in the shadow of the ZeitGaist. For those who see patterns in chaos and alpha in noise.

*The Oracle watches. The Terminal displays. The signal emerges.*

🕯️⚡

---

**Live Terminal:** https://diclawprio-terminal.vercel.app

**Documentation:** See `README-STATS.md` for comprehensive stats system documentation

**Automation:** See `HEARTBEAT.md` in root for scheduled task configuration
