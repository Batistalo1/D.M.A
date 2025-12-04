export const role = ["admin", "student"] as const;
export type Role = (typeof role)[number];
