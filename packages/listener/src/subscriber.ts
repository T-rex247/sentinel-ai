import {
  Connection,
  type Logs,
  type Context,
  PublicKey,
} from "@solana/web3.js";
import { EventEmitter } from "events";
import type { DecodedTransaction } from "@sentinel-ai/shared";
import { decodeTransaction } from "./decoder.js";

export interface ListenerEvents {
  transaction: (agentId: string, tx: DecodedTransaction) => void;
  error: (error: Error) => void;
}

export class SolanaSubscriber extends EventEmitter {
  private connection: Connection;
  private subscriptions = new Map<string, number>(); // agentId -> subscriptionId
  private walletToAgent = new Map<string, string>(); // walletAddress -> agentId

  constructor(rpcUrl: string, wsUrl?: string) {
    super();
    this.connection = new Connection(rpcUrl, {
      wsEndpoint: wsUrl,
      commitment: "confirmed",
    });
    console.log(`[Listener] Connected to ${rpcUrl}`);
  }

  async subscribe(agentId: string, walletAddress: string): Promise<void> {
    if (this.subscriptions.has(agentId)) {
      console.log(`[Listener] Already subscribed to ${walletAddress}`);
      return;
    }

    this.walletToAgent.set(walletAddress, agentId);

    const pubkey = new PublicKey(walletAddress);
    const subId = this.connection.onLogs(
      pubkey,
      (logs: Logs, ctx: Context) => {
        this.handleLogs(agentId, walletAddress, logs, ctx).catch((err) => {
          this.emit("error", err);
        });
      },
      "confirmed"
    );

    this.subscriptions.set(agentId, subId);
    console.log(
      `[Listener] Subscribed to wallet ${walletAddress} (agent: ${agentId}, sub: ${subId})`
    );
  }

  async unsubscribe(agentId: string): Promise<void> {
    const subId = this.subscriptions.get(agentId);
    if (subId === undefined) return;

    await this.connection.removeOnLogsListener(subId);
    this.subscriptions.delete(agentId);

    // Clean up wallet mapping
    for (const [wallet, aid] of this.walletToAgent) {
      if (aid === agentId) {
        this.walletToAgent.delete(wallet);
        break;
      }
    }
    console.log(`[Listener] Unsubscribed agent ${agentId}`);
  }

  private async handleLogs(
    agentId: string,
    walletAddress: string,
    logs: Logs,
    ctx: Context
  ): Promise<void> {
    if (logs.err) return; // Skip failed transactions

    const signature = logs.signature;
    console.log(
      `[Listener] Transaction detected: ${signature} for ${walletAddress}`
    );

    try {
      const txDetail = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      });

      if (!txDetail) {
        console.warn(`[Listener] Could not fetch tx: ${signature}`);
        return;
      }

      const decoded = decodeTransaction(signature, txDetail, walletAddress);
      for (const tx of decoded) {
        this.emit("transaction", agentId, tx);
      }
    } catch (err) {
      console.error(`[Listener] Error processing tx ${signature}:`, err);
      this.emit("error", err as Error);
    }
  }

  getActiveSubscriptions(): number {
    return this.subscriptions.size;
  }

  async shutdown(): Promise<void> {
    for (const [agentId] of this.subscriptions) {
      await this.unsubscribe(agentId);
    }
    console.log("[Listener] All subscriptions removed");
  }
}
