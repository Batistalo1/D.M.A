import { FormatRegistry } from "@sinclair/typebox";
import { currencies } from "../types/currency";

export function initFormats() {
  FormatRegistry.Set("e.164", (value: string) => {
    return /^\+[1-9]\d{1,14}$/.test(value);
  });

  FormatRegistry.Set("latinName", (value: string) => {
    // All letters (including those with accents) and `space`, ., ', -
    return /^[A-Za-zÀ-ÖØ-öø-ÿ \.'-]+$/.test(value);
  });

  FormatRegistry.Set("username", (value: string) => {
    // Letters, numbers and ., -
    return /^[A-Za-z0-9\.-]+$/.test(value);
  });

  FormatRegistry.Set("hostname", (value: string) => {
    return /^(?:[a-z0-9_][a-z0-9_-]{1,61}[a-z0-9_]\.)+[a-z]{2,63}$/.test(value);
  });

  FormatRegistry.Set("currency", (value: string) => {
    return currencies.includes(value as any);
  });

  FormatRegistry.Set("positiveNumber", (value: string) => {
    // Max. 2 digits after decimal point
    return /^\d+(?:\.\d{1,2})?$/.test(value);
  });
}
