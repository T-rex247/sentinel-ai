export const PROGRAM_IDS = {
  SYSTEM: "11111111111111111111111111111111",
  SPL_TOKEN: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  TOKEN_2022: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  ASSOCIATED_TOKEN: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  JUPITER_V6: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
  RAYDIUM_AMM: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
  RAYDIUM_CLMM: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK",
  DRIFT: "dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH",
  MARINADE: "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",
  ORCA_WHIRLPOOL: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
  METEORA_DLMM: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
  TENSOR: "TSWAPaqyCSx2KABk68Shruf4rp7CxcNi8hAsbdwmHbN",
  PHOENIX: "PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY",
  MARGINFI: "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA",
  SQUADS_V4: "SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf",
} as const;

export type ProgramName = keyof typeof PROGRAM_IDS;

const addressToName = new Map<string, ProgramName>(
  Object.entries(PROGRAM_IDS).map(([name, addr]) => [addr, name as ProgramName])
);

export function getProgramName(address: string): ProgramName | null {
  return addressToName.get(address) ?? null;
}
