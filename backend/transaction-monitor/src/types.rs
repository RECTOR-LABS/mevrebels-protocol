/*!
 * Shared data types
 */

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeliusWebhook {
    pub r#type: String,
    pub transactions: Vec<HeliusTransaction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeliusTransaction {
    pub signature: String,
    pub slot: u64,
    #[serde(rename = "blockTime")]
    pub block_time: Option<i64>,
    pub meta: Option<HeliusMeta>,
    pub transaction: Option<HeliusTransactionData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeliusMeta {
    pub err: Option<serde_json::Value>,
    #[serde(rename = "logMessages")]
    pub log_messages: Option<Vec<String>>,
    pub fee: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeliusTransactionData {
    pub message: Option<HeliusMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeliusMessage {
    #[serde(rename = "accountKeys")]
    pub account_keys: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionAlert {
    pub signature: String,
    pub strategy_address: String,
    pub executor: String,
    pub success: bool,
    pub profit_lamports: Option<i64>,
    pub error: Option<String>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecutionRecord {
    pub signature: String,
    pub strategy_id: Option<String>,
    pub executor: String,
    pub profit_lamports: i64,
    pub gas_used: i32,
    pub success: bool,
}
