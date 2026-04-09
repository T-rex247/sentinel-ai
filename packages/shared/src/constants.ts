// Risk thresholds
export const RISK_THRESHOLD_ALERT = 60;
export const RISK_THRESHOLD_CLAUDE = 40;
export const CLAUDE_MODEL = "claude-sonnet-4-20250514";

// Default agent config
export const DEFAULT_BALANCE_THRESHOLD_SOL = 1.0;
export const DEFAULT_TRANSFER_PCT_THRESHOLD = 50;
export const DEFAULT_ALERT_COOLDOWN_SECONDS = 300;

// Rapid drain detection
export const RAPID_DRAIN_WINDOW_MS = 60_000; // 60 seconds
export const RAPID_DRAIN_MIN_TXS = 3;

// Solana
export const LAMPORTS_PER_SOL = 1_000_000_000;
export const SOLANA_MAINNET_RPC = "https://api.mainnet-beta.solana.com";
export const SOLANA_MAINNET_WS = "wss://api.mainnet-beta.solana.com";

// Solscan
export const SOLSCAN_TX_URL = "https://solscan.io/tx/";
export const SOLSCAN_ACCOUNT_URL = "https://solscan.io/account/";
