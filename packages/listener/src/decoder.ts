import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type { DecodedTransaction } from "@sentinel-ai/shared";
import { getProgramName, PROGRAM_IDS, LAMPORTS_PER_SOL } from "@sentinel-ai/shared";

export function decodeTransaction(
  signature: string,
  tx: ParsedTransactionWithMeta,
  watchedWallet: string
): DecodedTransaction[] {
  const results: DecodedTransaction[] = [];
  const blockTime = tx.blockTime
    ? new Date(tx.blockTime * 1000).toISOString()
    : null;
  const slot = tx.slot;

  const instructions = tx.transaction.message.instructions;

  for (const ix of instructions) {
    // Parsed instructions have a "program" and "parsed" field
    if ("parsed" in ix && ix.parsed) {
      const decoded = decodeParsedInstruction(
        signature,
        slot,
        blockTime,
        ix.programId.toBase58(),
        ix.parsed,
        watchedWallet
      );
      if (decoded) results.push(decoded);
    } else if ("programId" in ix) {
      // Unparsed instruction — log it generically
      const programId = ix.programId.toBase58();
      const programName = getProgramName(programId);
      results.push({
        signature,
        slot,
        block_time: blockTime,
        program_id: programId,
        instruction_type: programName ? `${programName}_unknown` : "unknown",
        decoded_data: {},
        accounts: "accounts" in ix ? ix.accounts.map((a) => a.toBase58()) : [],
        sol_amount: null,
        token_amount: null,
        token_mint: null,
      });
    }
  }

  return results;
}

function decodeParsedInstruction(
  signature: string,
  slot: number,
  blockTime: string | null,
  programId: string,
  parsed: { type: string; info: Record<string, unknown> },
  watchedWallet: string
): DecodedTransaction | null {
  const { type, info } = parsed;

  // System program: SOL transfers
  if (programId === PROGRAM_IDS.SYSTEM) {
    if (type === "transfer" || type === "transferWithSeed") {
      const lamports = (info.lamports as number) ?? 0;
      return {
        signature,
        slot,
        block_time: blockTime,
        program_id: programId,
        instruction_type: "sol_transfer",
        decoded_data: {
          source: info.source,
          destination: info.destination,
          direction:
            info.source === watchedWallet ? "outbound" : "inbound",
        },
        accounts: [info.source as string, info.destination as string],
        sol_amount: lamports / LAMPORTS_PER_SOL,
        token_amount: null,
        token_mint: null,
      };
    }
  }

  // SPL Token / Token-2022: token transfers
  if (
    programId === PROGRAM_IDS.SPL_TOKEN ||
    programId === PROGRAM_IDS.TOKEN_2022
  ) {
    if (type === "transfer" || type === "transferChecked") {
      const tokenAmount = info.tokenAmount as Record<string, unknown> | undefined;
      const amount = Number(info.amount ?? tokenAmount?.amount ?? 0);
      const decimals = (tokenAmount?.decimals as number) ?? (info.decimals as number) ?? 0;
      const mint = (info.mint as string) ?? null;
      return {
        signature,
        slot,
        block_time: blockTime,
        program_id: programId,
        instruction_type: "token_transfer",
        decoded_data: {
          source: info.source ?? info.authority,
          destination: info.destination,
          authority: info.authority,
          mint,
          decimals,
          direction:
            (info.authority ?? info.source) === watchedWallet
              ? "outbound"
              : "inbound",
        },
        accounts: [
          info.source as string,
          info.destination as string,
          info.authority as string,
        ].filter(Boolean),
        sol_amount: null,
        token_amount: decimals > 0 ? amount / Math.pow(10, decimals) : amount,
        token_mint: mint,
      };
    }
  }

  // Generic fallback for known programs
  return {
    signature,
    slot,
    block_time: blockTime,
    program_id: programId,
    instruction_type: type,
    decoded_data: info,
    accounts: Object.values(info).filter(
      (v): v is string => typeof v === "string" && v.length >= 32 && v.length <= 44
    ),
    sol_amount: null,
    token_amount: null,
    token_mint: null,
  };
}
