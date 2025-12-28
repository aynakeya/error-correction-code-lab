export const sanitizeBits = (value: string): string => (value || "").replace(/[^01]/g, "");

export const toBits = (value: string): number[] =>
  sanitizeBits(value)
    .split("")
    .map((bit) => Number(bit));

export const bitsToString = (bits: number[] = []): string => bits.join("");

export const padBits = (
  bits: number[],
  multiple: number
): { bits: number[]; pad: number } => {
  if (multiple <= 0) return { bits: [...bits], pad: 0 };
  const pad = (multiple - (bits.length % multiple)) % multiple;
  return { bits: [...bits, ...Array(pad).fill(0)], pad };
};
