export const MICRO_CREDITS_PER_USD = 1_000_000n;

export const CREDIT_PACKS = [
  { dollars: 5, amountCents: 500, microcredits: 5_000_000n, label: '$5' },
  { dollars: 10, amountCents: 1000, microcredits: 10_000_000n, label: '$10' },
  { dollars: 20, amountCents: 2000, microcredits: 20_000_000n, label: '$20' },
  { dollars: 50, amountCents: 5000, microcredits: 50_000_000n, label: '$50' },
] as const;

export function getCreditPack(dollars: number) {
  return CREDIT_PACKS.find((pack) => pack.dollars === dollars);
}
