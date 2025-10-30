import * as anchor from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  createCloseAccountInstruction,
} from "@solana/spl-token";

/**
 * WSOL Test Utilities
 *
 * Wrapped SOL (WSOL) is native SOL represented as an SPL token.
 * These utilities help manage WSOL token accounts in tests.
 */

/**
 * Get or create WSOL associated token account for a wallet
 */
export async function getOrCreateWSolAccount(
  provider: anchor.AnchorProvider,
  owner: anchor.web3.PublicKey
): Promise<anchor.web3.PublicKey> {
  const ata = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    owner,
    true // allowOwnerOffCurve
  );

  const accountInfo = await provider.connection.getAccountInfo(ata);

  if (!accountInfo) {
    // Create associated token account
    const ix = createAssociatedTokenAccountInstruction(
      provider.wallet.publicKey,
      ata,
      owner,
      NATIVE_MINT
    );

    const tx = new anchor.web3.Transaction().add(ix);
    await provider.sendAndConfirm(tx);

    console.log(`Created WSOL account for ${owner.toString()}: ${ata.toString()}`);
  }

  return ata;
}

/**
 * Wrap SOL to WSOL by transferring SOL to token account and syncing
 */
export async function wrapSol(
  provider: anchor.AnchorProvider,
  owner: anchor.web3.PublicKey,
  amount: number,
  signer?: anchor.web3.Keypair
): Promise<anchor.web3.PublicKey> {
  const ata = await getOrCreateWSolAccount(provider, owner);

  // Transfer SOL to the token account
  const transferIx = anchor.web3.SystemProgram.transfer({
    fromPubkey: owner,
    toPubkey: ata,
    lamports: amount,
  });

  // Sync native (converts SOL to WSOL tokens)
  const syncIx = createSyncNativeInstruction(ata);

  const tx = new anchor.web3.Transaction().add(transferIx, syncIx);

  if (signer) {
    await provider.sendAndConfirm(tx, [signer]);
  } else {
    await provider.sendAndConfirm(tx);
  }

  console.log(`Wrapped ${amount / anchor.web3.LAMPORTS_PER_SOL} SOL to WSOL at ${ata.toString()}`);

  return ata;
}

/**
 * Unwrap WSOL to SOL by closing the token account
 */
export async function unwrapSol(
  provider: anchor.AnchorProvider,
  owner: anchor.web3.PublicKey,
  signer?: anchor.web3.Keypair
): Promise<void> {
  const ata = getAssociatedTokenAddressSync(NATIVE_MINT, owner, true);

  const accountInfo = await provider.connection.getAccountInfo(ata);
  if (!accountInfo) {
    console.log("No WSOL account to unwrap");
    return;
  }

  // Close account (automatically unwraps WSOL → SOL)
  const closeIx = createCloseAccountInstruction(
    ata,
    owner, // destination for remaining SOL
    owner, // owner/authority
    []
  );

  const tx = new anchor.web3.Transaction().add(closeIx);

  if (signer) {
    await provider.sendAndConfirm(tx, [signer]);
  } else {
    await provider.sendAndConfirm(tx);
  }

  console.log(`Unwrapped WSOL to SOL for ${owner.toString()}`);
}

/**
 * Get WSOL balance of a token account
 */
export async function getWsolBalance(
  provider: anchor.AnchorProvider,
  tokenAccount: anchor.web3.PublicKey
): Promise<number> {
  try {
    const balance = await provider.connection.getTokenAccountBalance(tokenAccount);
    return parseInt(balance.value.amount);
  } catch (e) {
    return 0;
  }
}

/**
 * Fund an account with SOL and wrap it to WSOL
 */
export async function fundAndWrapSol(
  provider: anchor.AnchorProvider,
  recipient: anchor.web3.PublicKey,
  solAmount: number,
  wsolAmount: number,
  signer?: anchor.web3.Keypair
): Promise<anchor.web3.PublicKey> {
  // Airdrop SOL for rent + fees
  if (solAmount > 0) {
    const airdropSig = await provider.connection.requestAirdrop(
      recipient,
      solAmount
    );
    await provider.connection.confirmTransaction(airdropSig);
    console.log(`Airdropped ${solAmount / anchor.web3.LAMPORTS_PER_SOL} SOL to ${recipient.toString()}`);
  }

  // Wrap SOL to WSOL
  if (wsolAmount > 0) {
    return await wrapSol(provider, recipient, wsolAmount, signer);
  }

  return getAssociatedTokenAddressSync(NATIVE_MINT, recipient, true);
}

/**
 * Constants
 */
export { NATIVE_MINT as WSOL_MINT, TOKEN_PROGRAM_ID };
