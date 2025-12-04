export const currencies = ["EUR", "USD"] as const;
export type Currency = (typeof currencies)[number];
