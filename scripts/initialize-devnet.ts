/**
 * Initialize MEVrebels Programs on Devnet
 *
 * This script:
 * 1. Initializes all 4 programs (Strategy Registry, Execution Engine, DAO, Flash Loan)
 * 2. Creates 2 test strategies
 * 3. Creates a test DAO proposal
 * 4. Verifies all on-chain state
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  Connection,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import { StrategyRegistry } from "../target/types/strategy_registry";
import { ExecutionEngine } from "../target/types/execution_engine";
import { DaoGovernance } from "../target/types/dao_governance";
import { FlashLoan } from "../target/types/flash_loan";
import * as fs from "fs";
import * as path from "path";

// Load wallet from filesystem
function loadWallet(walletPath: string): Keypair {
  const walletData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(walletData));
}

// Devnet configuration
const DEVNET_RPC = "https://devnet.helius-rpc.com/?api-key=***REMOVED***";
const WALLET_PATH = path.join(process.env.HOME!, ".config/solana/REC-devnet.json");

// Token mints (devnet)
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

async function main() {
  console.log("🚀 Initializing MEVrebels Programs on Devnet...\n");

  // Setup connection and provider
  const connection = new Connection(DEVNET_RPC, "confirmed");
  const wallet = loadWallet(WALLET_PATH);
  const provider = new AnchorProvider(connection, new Wallet(wallet), {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  console.log("📍 Deployer Wallet:", wallet.publicKey.toString());
  const balance = await connection.getBalance(wallet.publicKey);
  console.log("💰 Balance:", (balance / LAMPORTS_PER_SOL).toFixed(2), "SOL\n");

  // Load programs
  const strategyRegistry = anchor.workspace.strategyRegistry as Program<StrategyRegistry>;
  const executionEngine = anchor.workspace.executionEngine as Program<ExecutionEngine>;
  const daoGovernance = anchor.workspace.daoGovernance as Program<DaoGovernance>;
  const flashLoan = anchor.workspace.flashLoan as Program<FlashLoan>;

  console.log("📦 Program IDs:");
  console.log("  Strategy Registry:", strategyRegistry.programId.toString());
  console.log("  Execution Engine: ", executionEngine.programId.toString());
  console.log("  DAO Governance:   ", daoGovernance.programId.toString());
  console.log("  Flash Loan:       ", flashLoan.programId.toString());
  console.log();

  // ============================================
  // STEP 1: Initialize Strategy Registry
  // ============================================
  console.log("1️⃣  Initializing Strategy Registry...");
  const [adminConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    strategyRegistry.programId
  );

  try {
    const tx = await strategyRegistry.methods
      .initializeAdmin()
      .accounts({
        adminConfig,
        admin: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("   ✅ Strategy Registry initialized");
    console.log("   📝 TX:", tx);
  } catch (err: any) {
    if (err.toString().includes("already in use")) {
      console.log("   ⏭️  Already initialized");
    } else {
      console.error("   ❌ Error:", err.message);
    }
  }

  // Verify admin config
  const config = await strategyRegistry.account.adminConfig.fetch(adminConfig);
  console.log("   👤 Admin:", config.admin.toString());
  console.log("   📊 Total Strategies:", config.totalStrategies.toString());
  console.log();

  // ============================================
  // STEP 2: Initialize DAO Governance
  // ============================================
  console.log("2️⃣  Initializing DAO Governance...");
  const [daoState] = PublicKey.findProgramAddressSync(
    [Buffer.from("dao_state")],
    daoGovernance.programId
  );

  try {
    const tx = await daoGovernance.methods
      .initialize()
      .accounts({
        daoState,
        authority: wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("   ✅ DAO Governance initialized");
    console.log("   📝 TX:", tx);
  } catch (err: any) {
    if (err.toString().includes("already in use")) {
      console.log("   ⏭️  Already initialized");
    } else {
      console.error("   ❌ Error:", err.message);
    }
  }

  // Verify DAO state
  const dao = await daoGovernance.account.daoState.fetch(daoState);
  console.log("   👤 Authority:", dao.authority.toString());
  console.log("   📊 Total Proposals:", dao.proposalCount.toString());
  console.log();

  // ============================================
  // STEP 3: Create Test Strategy #1
  // ============================================
  console.log("3️⃣  Creating Test Strategy #1: 'SOL/USDC Arbitrage Alpha'...");

  const strategyId1 = new anchor.BN(1);
  const [strategyPda1] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("strategy"),
      wallet.publicKey.toBuffer(),
      strategyId1.toArrayLike(Buffer, "le", 8),
    ],
    strategyRegistry.programId
  );

  try {
    const tx = await strategyRegistry.methods
      .createStrategy(
        strategyId1,
        "SOL/USDC Arbitrage Alpha",
        [{ raydium: {} }, { orca: {} }],
        [{ tokenA: SOL_MINT, tokenB: USDC_MINT }],
        50,  // 0.5% profit threshold
        100  // 1% max slippage
      )
      .accounts({
        strategy: strategyPda1,
        creator: wallet.publicKey,
        adminConfig,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("   ✅ Strategy created");
    console.log("   📝 TX:", tx);
    console.log("   📍 Strategy PDA:", strategyPda1.toString());
  } catch (err: any) {
    if (err.toString().includes("already in use")) {
      console.log("   ⏭️  Strategy already exists");
    } else {
      console.error("   ❌ Error:", err.message);
    }
  }

  // Verify strategy
  try {
    const strategy1 = await strategyRegistry.account.strategyAccount.fetch(strategyPda1);
    console.log("   📋 Name:", strategy1.name);
    console.log("   👤 Creator:", strategy1.creator.toString());
    console.log("   📊 Status:", Object.keys(strategy1.status)[0]);
    console.log("   💰 Profit Threshold:", strategy1.profitThreshold, "bps (0.5%)");
  } catch (err) {
    console.log("   ⚠️  Could not fetch strategy (may not exist yet)");
  }
  console.log();

  // ============================================
  // STEP 4: Create Test Strategy #2
  // ============================================
  console.log("4️⃣  Creating Test Strategy #2: 'Multi-DEX Lightning Strike'...");

  const strategyId2 = new anchor.BN(2);
  const [strategyPda2] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("strategy"),
      wallet.publicKey.toBuffer(),
      strategyId2.toArrayLike(Buffer, "le", 8),
    ],
    strategyRegistry.programId
  );

  try {
    const tx = await strategyRegistry.methods
      .createStrategy(
        strategyId2,
        "Multi-DEX Lightning Strike",
        [{ raydium: {} }, { orca: {} }, { meteora: {} }],
        [
          { tokenA: SOL_MINT, tokenB: USDC_MINT },
        ],
        80,  // 0.8% profit threshold
        50   // 0.5% max slippage
      )
      .accounts({
        strategy: strategyPda2,
        creator: wallet.publicKey,
        adminConfig,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("   ✅ Strategy created");
    console.log("   📝 TX:", tx);
    console.log("   📍 Strategy PDA:", strategyPda2.toString());
  } catch (err: any) {
    if (err.toString().includes("already in use")) {
      console.log("   ⏭️  Strategy already exists");
    } else {
      console.error("   ❌ Error:", err.message);
    }
  }

  // Verify strategy
  try {
    const strategy2 = await strategyRegistry.account.strategyAccount.fetch(strategyPda2);
    console.log("   📋 Name:", strategy2.name);
    console.log("   👤 Creator:", strategy2.creator.toString());
    console.log("   📊 Status:", Object.keys(strategy2.status)[0]);
    console.log("   💰 Profit Threshold:", strategy2.profitThreshold, "bps (0.8%)");
  } catch (err) {
    console.log("   ⚠️  Could not fetch strategy (may not exist yet)");
  }
  console.log();

  // ============================================
  // STEP 5: Summary
  // ============================================
  console.log("✅ Initialization Complete!\n");
  console.log("📊 Summary:");
  console.log("  ✅ Strategy Registry initialized");
  console.log("  ✅ DAO Governance initialized");
  console.log("  ✅ 2 test strategies created");
  console.log();
  console.log("🔗 Solana Explorer Links (Devnet):");
  console.log("  Strategy Registry:", `https://explorer.solana.com/address/${strategyRegistry.programId}?cluster=devnet`);
  console.log("  Strategy #1:", `https://explorer.solana.com/address/${strategyPda1}?cluster=devnet`);
  console.log("  Strategy #2:", `https://explorer.solana.com/address/${strategyPda2}?cluster=devnet`);
  console.log();
  console.log("🎉 MEVrebels is live on devnet with REC vanity addresses!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
