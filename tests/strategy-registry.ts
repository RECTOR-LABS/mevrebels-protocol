import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StrategyRegistry } from "../target/types/strategy_registry";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert, expect } from "chai";

describe("Strategy Registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.strategyRegistry as Program<StrategyRegistry>;

  // Test accounts
  const admin = provider.wallet as anchor.Wallet;
  let adminConfig: PublicKey;
  let creator: Keypair;
  let otherUser: Keypair;

  // Test data
  const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Devnet USDC
  const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

  before(async () => {
    // Generate test keypairs
    creator = Keypair.generate();
    otherUser = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(creator.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(otherUser.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // Derive admin config PDA
    [adminConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );
  });

  describe("Admin Initialization", () => {
    it("Initializes admin config", async () => {
      try {
        await program.methods
          .initializeAdmin()
          .accounts({
            adminConfig,
            admin: admin.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      } catch (err) {
        // Skip if already initialized by another test suite
        if (!err.toString().includes("already in use")) {
          throw err;
        }
      }

      const config = await program.account.adminConfig.fetch(adminConfig);
      assert.equal(config.admin.toString(), admin.publicKey.toString());
    });

    it("Fails to initialize admin config twice", async () => {
      try {
        await program.methods
          .initializeAdmin()
          .accounts({
            adminConfig,
            admin: admin.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        assert.fail("Should have failed");
      } catch (err) {
        expect(err.toString()).to.include("already in use");
      }
    });
  });

  describe("Strategy Creation", () => {
    it("Creates a valid strategy", async () => {
      const strategyId = new anchor.BN(1);
      const [strategyPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy"),
          creator.publicKey.toBuffer(),
          strategyId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const dexs = [{ raydium: {} }, { orca: {} }];
      const tokenPairs = [
        { tokenA: SOL_MINT, tokenB: USDC_MINT },
      ];
      const profitThreshold = 50; // 0.5%
      const maxSlippage = 100; // 1%

      await program.methods
        .createStrategy(
          strategyId,
          dexs,
          tokenPairs,
          profitThreshold,
          maxSlippage
        )
        .accounts({
          strategy: strategyPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      const strategy = await program.account.strategyAccount.fetch(strategyPda);

      assert.equal(strategy.creator.toString(), creator.publicKey.toString());
      assert.equal(strategy.strategyId.toNumber(), 1);
      assert.equal(strategy.profitThreshold, 50);
      assert.equal(strategy.maxSlippage, 100);
      assert.equal(strategy.dexs.length, 2);
      assert.equal(strategy.tokenPairs.length, 1);
      assert.deepEqual(strategy.status, { pending: {} });
      assert.equal(strategy.totalProfit.toNumber(), 0);
      assert.equal(strategy.executionCount.toNumber(), 0);
      assert.equal(strategy.successCount.toNumber(), 0);
    });

    it("Fails with profit threshold too low", async () => {
      const strategyId = new anchor.BN(2);
      const [strategyPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy"),
          creator.publicKey.toBuffer(),
          strategyId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createStrategy(
            strategyId,
            [{ raydium: {} }],
            [{ tokenA: SOL_MINT, tokenB: USDC_MINT }],
            5, // Too low (< 10 bps)
            100
          )
          .accounts({
            strategy: strategyPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();
        assert.fail("Should have failed");
      } catch (err) {
        expect(err.toString()).to.include("ProfitThresholdTooLow");
      }
    });

    it("Fails with slippage too high", async () => {
      const strategyId = new anchor.BN(3);
      const [strategyPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy"),
          creator.publicKey.toBuffer(),
          strategyId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createStrategy(
            strategyId,
            [{ raydium: {} }],
            [{ tokenA: SOL_MINT, tokenB: USDC_MINT }],
            50,
            600 // Too high (> 500 bps)
          )
          .accounts({
            strategy: strategyPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();
        assert.fail("Should have failed");
      } catch (err) {
        expect(err.toString()).to.include("SlippageTooHigh");
      }
    });

    it("Fails with no DEXs specified", async () => {
      const strategyId = new anchor.BN(4);
      const [strategyPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy"),
          creator.publicKey.toBuffer(),
          strategyId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createStrategy(
            strategyId,
            [], // Empty DEXs
            [{ tokenA: SOL_MINT, tokenB: USDC_MINT }],
            50,
            100
          )
          .accounts({
            strategy: strategyPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();
        assert.fail("Should have failed");
      } catch (err) {
        expect(err.toString()).to.include("NoDexSpecified");
      }
    });

    it("Fails with no token pairs specified", async () => {
      const strategyId = new anchor.BN(5);
      const [strategyPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy"),
          creator.publicKey.toBuffer(),
          strategyId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createStrategy(
            strategyId,
            [{ raydium: {} }],
            [], // Empty token pairs
            50,
            100
          )
          .accounts({
            strategy: strategyPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();
        assert.fail("Should have failed");
      } catch (err) {
        expect(err.toString()).to.include("NoTokenPairSpecified");
      }
    });

    it("Fails with identical tokens in pair", async () => {
      const strategyId = new anchor.BN(6);
      const [strategyPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy"),
          creator.publicKey.toBuffer(),
          strategyId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      try {
        await program.methods
          .createStrategy(
            strategyId,
            [{ raydium: {} }],
            [{ tokenA: SOL_MINT, tokenB: SOL_MINT }], // Same token
            50,
            100
          )
          .accounts({
            strategy: strategyPda,
            creator: creator.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([creator])
          .rpc();
        assert.fail("Should have failed");
      } catch (err) {
        expect(err.toString()).to.include("InvalidTokenPair");
      }
    });
  });

  describe("Strategy Approval", () => {
    let strategyPda: PublicKey;
    const strategyId = new anchor.BN(10);

    before(async () => {
      [strategyPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy"),
          creator.publicKey.toBuffer(),
          strategyId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .createStrategy(
          strategyId,
          [{ raydium: {} }],
          [{ tokenA: SOL_MINT, tokenB: USDC_MINT }],
          50,
          100
        )
        .accounts({
          strategy: strategyPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();
    });

    it("Admin approves a strategy", async () => {
      await program.methods
        .approveStrategy()
        .accounts({
          strategy: strategyPda,
          adminConfig,
          admin: admin.publicKey,
        })
        .rpc();

      const strategy = await program.account.strategyAccount.fetch(strategyPda);
      assert.deepEqual(strategy.status, { approved: {} });
    });

    it("Fails when non-admin tries to approve", async () => {
      const strategyId2 = new anchor.BN(11);
      const [strategy2Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy"),
          creator.publicKey.toBuffer(),
          strategyId2.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .createStrategy(
          strategyId2,
          [{ raydium: {} }],
          [{ tokenA: SOL_MINT, tokenB: USDC_MINT }],
          50,
          100
        )
        .accounts({
          strategy: strategy2Pda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      try {
        await program.methods
          .approveStrategy()
          .accounts({
            strategy: strategy2Pda,
            adminConfig,
            admin: otherUser.publicKey,
          })
          .signers([otherUser])
          .rpc();
        assert.fail("Should have failed");
      } catch (err) {
        expect(err.toString()).to.include("UnauthorizedApprover");
      }
    });

    it("Admin rejects a strategy", async () => {
      const strategyId3 = new anchor.BN(12);
      const [strategy3Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy"),
          creator.publicKey.toBuffer(),
          strategyId3.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .createStrategy(
          strategyId3,
          [{ raydium: {} }],
          [{ tokenA: SOL_MINT, tokenB: USDC_MINT }],
          50,
          100
        )
        .accounts({
          strategy: strategy3Pda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await program.methods
        .rejectStrategy()
        .accounts({
          strategy: strategy3Pda,
          adminConfig,
          admin: admin.publicKey,
        })
        .rpc();

      const strategy = await program.account.strategyAccount.fetch(strategy3Pda);
      assert.deepEqual(strategy.status, { rejected: {} });
    });
  });

  describe("Performance Tracking", () => {
    let strategyPda: PublicKey;
    const strategyId = new anchor.BN(20);

    before(async () => {
      [strategyPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy"),
          creator.publicKey.toBuffer(),
          strategyId.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .createStrategy(
          strategyId,
          [{ raydium: {} }],
          [{ tokenA: SOL_MINT, tokenB: USDC_MINT }],
          50,
          100
        )
        .accounts({
          strategy: strategyPda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      await program.methods
        .approveStrategy()
        .accounts({
          strategy: strategyPda,
          adminConfig,
          admin: admin.publicKey,
        })
        .rpc();
    });

    it("Updates metrics after successful execution", async () => {
      const profit = new anchor.BN(1_000_000); // 1 USDC worth of lamports

      await program.methods
        .updateMetrics(profit, true)
        .accounts({
          strategy: strategyPda,
          executor: otherUser.publicKey,
        })
        .signers([otherUser])
        .rpc();

      const strategy = await program.account.strategyAccount.fetch(strategyPda);
      assert.equal(strategy.executionCount.toNumber(), 1);
      assert.equal(strategy.successCount.toNumber(), 1);
      assert.equal(strategy.totalProfit.toNumber(), 1_000_000);
      assert.isAbove(strategy.lastExecution.toNumber(), 0);
    });

    it("Updates metrics after failed execution", async () => {
      await program.methods
        .updateMetrics(new anchor.BN(0), false)
        .accounts({
          strategy: strategyPda,
          executor: otherUser.publicKey,
        })
        .signers([otherUser])
        .rpc();

      const strategy = await program.account.strategyAccount.fetch(strategyPda);
      assert.equal(strategy.executionCount.toNumber(), 2);
      assert.equal(strategy.successCount.toNumber(), 1); // Still 1
      assert.equal(strategy.totalProfit.toNumber(), 1_000_000); // No change
    });

    it("Handles multiple successful executions", async () => {
      for (let i = 0; i < 5; i++) {
        await program.methods
          .updateMetrics(new anchor.BN(500_000), true)
          .accounts({
            strategy: strategyPda,
            executor: otherUser.publicKey,
          })
          .signers([otherUser])
          .rpc();
      }

      const strategy = await program.account.strategyAccount.fetch(strategyPda);
      assert.equal(strategy.executionCount.toNumber(), 7); // 2 + 5
      assert.equal(strategy.successCount.toNumber(), 6); // 1 + 5
      assert.equal(strategy.totalProfit.toNumber(), 3_500_000); // 1M + (5 * 500K)
    });

    it("Calculates success rate correctly", async () => {
      const strategy = await program.account.strategyAccount.fetch(strategyPda);
      const successRate = Math.floor((strategy.successCount.toNumber() * 100) / strategy.executionCount.toNumber());
      // 6 successes out of 7 executions = 85.7% ~= 85%
      assert.approximately(successRate, 85, 1);
    });

    it("Gets strategy stats", async () => {
      const stats = await program.methods
        .getStrategyStats()
        .accounts({
          strategy: strategyPda,
        })
        .view();

      assert.equal(stats.strategyId.toNumber(), 20);
      assert.equal(stats.creator.toString(), creator.publicKey.toString());
      assert.equal(stats.totalProfit.toNumber(), 3_500_000);
      assert.equal(stats.executionCount.toNumber(), 7);
      assert.equal(stats.successCount.toNumber(), 6);
      assert.deepEqual(stats.status, { approved: {} });
    });

    it("Fails to update metrics for unapproved strategy", async () => {
      const strategyId2 = new anchor.BN(21);
      const [strategy2Pda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("strategy"),
          creator.publicKey.toBuffer(),
          strategyId2.toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .createStrategy(
          strategyId2,
          [{ raydium: {} }],
          [{ tokenA: SOL_MINT, tokenB: USDC_MINT }],
          50,
          100
        )
        .accounts({
          strategy: strategy2Pda,
          creator: creator.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

      try {
        await program.methods
          .updateMetrics(new anchor.BN(1000), true)
          .accounts({
            strategy: strategy2Pda,
            executor: otherUser.publicKey,
          })
          .signers([otherUser])
          .rpc();
        assert.fail("Should have failed");
      } catch (err) {
        expect(err.toString()).to.include("StrategyNotApproved");
      }
    });
  });
});
