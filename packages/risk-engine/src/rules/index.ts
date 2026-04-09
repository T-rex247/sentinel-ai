import type { RiskRule } from "@sentinel-ai/shared";
import { transferAmountRule } from "./transfer-amount.js";
import { unknownRecipientRule } from "./unknown-recipient.js";
import { rapidDrainRule } from "./rapid-drain.js";
import { balanceThresholdRule } from "./balance-threshold.js";

export const allRules: RiskRule[] = [
  transferAmountRule,
  unknownRecipientRule,
  rapidDrainRule,
  balanceThresholdRule,
];
