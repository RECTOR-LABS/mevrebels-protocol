/*!
 * Transaction log parser
 */

use crate::types::{ExecutionAlert, HeliusTransaction};
use tracing::debug;

pub fn parse_execution_transaction(tx: &HeliusTransaction) -> Option<ExecutionAlert> {
    let signature = &tx.signature;
    let timestamp = tx.block_time.unwrap_or(0);

    // Check if transaction failed
    let success = tx.meta.as_ref().and_then(|m| m.err.as_ref()).is_none();

    // Parse log messages for execution details
    let logs = tx
        .meta
        .as_ref()
        .and_then(|m| m.log_messages.as_ref())?;

    // Look for execution-related logs
    let mut strategy_address = None;
    let mut executor = None;
    let mut profit_lamports = None;
    let mut error_msg = None;

    for log in logs {
        // Parse strategy address from logs
        if log.contains("Strategy:") {
            if let Some(addr) = extract_address_from_log(log, "Strategy:") {
                strategy_address = Some(addr);
            }
        }

        // Parse executor
        if log.contains("Executor:") {
            if let Some(addr) = extract_address_from_log(log, "Executor:") {
                executor = Some(addr);
            }
        }

        // Parse profit
        if log.contains("Profit:") {
            if let Some(profit_str) = log.split("Profit:").nth(1) {
                if let Ok(profit) = profit_str.trim().parse::<i64>() {
                    profit_lamports = Some(profit);
                }
            }
        }

        // Parse errors
        if log.contains("Error:") || log.contains("failed") {
            error_msg = Some(log.clone());
        }
    }

    // Extract executor from account keys if not found in logs
    if executor.is_none() {
        if let Some(tx_data) = &tx.transaction {
            if let Some(msg) = &tx_data.message {
                if let Some(keys) = &msg.account_keys {
                    if !keys.is_empty() {
                        executor = Some(keys[0].clone());
                    }
                }
            }
        }
    }

    // Only create alert if we have minimum required data
    if strategy_address.is_some() || executor.is_some() {
        Some(ExecutionAlert {
            signature: signature.clone(),
            strategy_address: strategy_address.unwrap_or_else(|| "unknown".to_string()),
            executor: executor.unwrap_or_else(|| "unknown".to_string()),
            success,
            profit_lamports,
            error: error_msg,
            timestamp,
        })
    } else {
        debug!("Could not parse execution details from transaction {}", signature);
        None
    }
}

fn extract_address_from_log(log: &str, prefix: &str) -> Option<String> {
    log.split(prefix)
        .nth(1)?
        .trim()
        .split_whitespace()
        .next()
        .map(|s| s.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_address_from_log() {
        let log = "Program log: Strategy: 58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2";
        let addr = extract_address_from_log(log, "Strategy:");
        assert_eq!(
            addr,
            Some("58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2".to_string())
        );
    }
}
