import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { FlashLoan } from "../target/types/flash_loan";
import { expect } from "chai";
import {
  getAssociatedTokenAddressSync,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  wrapSol,
  getWsolBalance,
  WSOL_MINT,
  TOKEN_PROGRAM_ID,
} from "./utils/wsol";

describe("flash-loan", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.FlashLoan as Program<FlashLoan>;
  const authority = provider.wallet;

  let flashLoanPool: anchor.web3.PublicKey;
  let poolAuthority: anchor.web3.PublicKey;
  let poolTokenAccount: anchor.web3.PublicKey;
  let authorityWsolAccount: anchor.web3.PublicKey;

  before(async () => {
    // Derive flash loan pool PDA
    [flashLoanPool] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("flash_pool")],
      program.programId
    );

    // Derive pool authority PDA
    [poolAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("flash_pool"), Buffer.from("authority")],
      program.programId
    );

    // Get pool's WSOL token account (ATA of pool authority)
    poolTokenAccount = getAssociatedTokenAddressSync(
      WSOL_MINT,
      poolAuthority,
      true // allowOwnerOffCurve
    );

    console.log("Flash Loan Pool:", flashLoanPool.toString());
    console.log("Pool Authority:", poolAuthority.toString());
    console.log("Pool Token Account:", poolTokenAccount.toString());
  });

  it("Initializes flash loan pool with WSOL", async () => {
    const feeBps = 9; // 0.09%

    // Check if pool already exists (from other test suites)
    try {
      const existingPool = await program.account.flashLoanPool.fetch(flashLoanPool);
      console.log("✓ Flash loan pool already initialized (from execution-engine tests)");
      console.log(`  Fee: ${existingPool.feeBps} bps, Total deposited: ${existingPool.totalDeposited.toNumber() / anchor.web3.LAMPORTS_PER_SOL} WSOL`);
      return; // Skip initialization
    } catch (e) {
      // Pool doesn't exist, initialize it
    }

    await program.methods
      .initializePool(feeBps)
      .accounts({
        pool: flashLoanPool,
        poolAuthority: poolAuthority,
        wsolMint: WSOL_MINT,
        poolTokenAccount: poolTokenAccount,
        authority: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const pool = await program.account.flashLoanPool.fetch(flashLoanPool);
    expect(pool.feeBps).to.equal(feeBps);
    expect(pool.authority.toString()).to.equal(poolAuthority.toString());
    expect(pool.poolTokenAccount.toString()).to.equal(poolTokenAccount.toString());
    expect(pool.totalDeposited.toNumber()).to.equal(0);
    expect(pool.totalLoans.toNumber()).to.equal(0);
    expect(pool.flashLoanActive).to.equal(false);

    console.log("✓ Flash loan pool initialized successfully");
  });

  it("Deposits WSOL liquidity to pool", async () => {
    const depositAmount = 100 * anchor.web3.LAMPORTS_PER_SOL; // 100 SOL worth of WSOL

    // Get pool state before deposit
    const poolBefore = await program.account.flashLoanPool.fetch(flashLoanPool);
    const poolWsolBalanceBefore = await getWsolBalance(provider, poolTokenAccount);

    // Wrap SOL to WSOL for authority
    authorityWsolAccount = await wrapSol(
      provider,
      authority.publicKey,
      depositAmount
    );

    console.log("Authority WSOL account:", authorityWsolAccount.toString());

    // Check WSOL balance
    const wsolBalanceBefore = await getWsolBalance(provider, authorityWsolAccount);
    console.log(`Authority WSOL balance: ${wsolBalanceBefore / anchor.web3.LAMPORTS_PER_SOL} WSOL`);

    // Deposit to pool
    await program.methods
      .depositLiquidity(new anchor.BN(depositAmount))
      .accounts({
        pool: flashLoanPool,
        poolTokenAccount: poolTokenAccount,
        depositorTokenAccount: authorityWsolAccount,
        depositor: authority.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const poolAfter = await program.account.flashLoanPool.fetch(flashLoanPool);
    const expectedTotalDeposited = poolBefore.totalDeposited.toNumber() + depositAmount;
    expect(poolAfter.totalDeposited.toNumber()).to.equal(expectedTotalDeposited);

    const poolWsolBalanceAfter = await getWsolBalance(provider, poolTokenAccount);
    console.log(`Pool WSOL balance: ${poolWsolBalanceAfter / anchor.web3.LAMPORTS_PER_SOL} WSOL`);
    expect(poolWsolBalanceAfter).to.equal(poolWsolBalanceBefore + depositAmount);

    console.log("✓ Deposited liquidity successfully");
  });

  it("Executes flash loan borrow and repay with WSOL", async () => {
    const borrowAmount = 10 * anchor.web3.LAMPORTS_PER_SOL; // 10 WSOL

    // Create borrower keypair
    const borrower = anchor.web3.Keypair.generate();

    // Fund borrower with SOL for rent + fees
    const airdropSig = await provider.connection.requestAirdrop(
      borrower.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    // Wrap some SOL to WSOL for repayment fee
    const repaymentFee = Math.ceil(borrowAmount * 9 / 10000); // 0.09% + buffer
    const borrowerWsolAccount = await wrapSol(
      provider,
      borrower.publicKey,
      repaymentFee + 1000, // Fee + buffer for rent
      borrower
    );

    console.log("Borrower WSOL account:", borrowerWsolAccount.toString());

    // Get pool state before borrow
    const poolBefore = await program.account.flashLoanPool.fetch(flashLoanPool);
    const poolBalanceBefore = await getWsolBalance(provider, poolTokenAccount);
    const borrowerBalanceBefore = await getWsolBalance(provider, borrowerWsolAccount);

    console.log(`Pool before: flash_loan_active=${poolBefore.flashLoanActive}`);
    console.log(`Pool WSOL balance before: ${poolBalanceBefore / anchor.web3.LAMPORTS_PER_SOL} WSOL`);
    console.log(`Borrower WSOL balance before: ${borrowerBalanceBefore / anchor.web3.LAMPORTS_PER_SOL} WSOL`);

    // Flash borrow
    await program.methods
      .flashBorrow(new anchor.BN(borrowAmount))
      .accounts({
        pool: flashLoanPool,
        poolAuthority: poolAuthority,
        poolTokenAccount: poolTokenAccount,
        borrowerProgram: program.programId,
        borrowerTokenAccount: borrowerWsolAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    // Check pool state after borrow
    const poolAfterBorrow = await program.account.flashLoanPool.fetch(flashLoanPool);
    expect(poolAfterBorrow.flashLoanActive).to.equal(true);
    expect(poolAfterBorrow.activeBorrowAmount.toNumber()).to.equal(borrowAmount);

    const borrowerBalanceAfterBorrow = await getWsolBalance(provider, borrowerWsolAccount);
    console.log(`Borrower WSOL balance after borrow: ${borrowerBalanceAfterBorrow / anchor.web3.LAMPORTS_PER_SOL} WSOL`);
    expect(borrowerBalanceAfterBorrow).to.equal(borrowerBalanceBefore + borrowAmount);

    // Flash repay
    const requiredRepayment = borrowAmount + repaymentFee;
    await program.methods
      .flashRepay(new anchor.BN(borrowAmount))
      .accounts({
        pool: flashLoanPool,
        poolAuthority: poolAuthority,
        poolTokenAccount: poolTokenAccount,
        borrowerTokenAccount: borrowerWsolAccount,
        borrower: borrower.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([borrower])
      .rpc();

    // Check pool state after repay
    const poolAfterRepay = await program.account.flashLoanPool.fetch(flashLoanPool);
    expect(poolAfterRepay.flashLoanActive).to.equal(false);
    expect(poolAfterRepay.activeBorrowAmount.toNumber()).to.equal(0);
    expect(poolAfterRepay.totalLoans.toNumber()).to.equal(1);

    // Verify fee was collected
    const actualFee = poolAfterRepay.totalFeesCollected.toNumber();
    expect(actualFee).to.equal(repaymentFee);

    const poolBalanceAfter = await getWsolBalance(provider, poolTokenAccount);
    console.log(`Pool WSOL balance after: ${poolBalanceAfter / anchor.web3.LAMPORTS_PER_SOL} WSOL`);
    console.log(`Flash loan completed! Fee collected: ${actualFee / anchor.web3.LAMPORTS_PER_SOL} WSOL`);

    console.log("✓ Flash loan borrow and repay successful");
  });
});
