export const hammingEncode = (dataBits: number[]): number[] => {
  const d = [...dataBits, 0, 0, 0, 0].slice(0, 4);
  const code = Array(7).fill(0);
  code[2] = d[0];
  code[4] = d[1];
  code[5] = d[2];
  code[6] = d[3];
  const p1 = code[2] ^ code[4] ^ code[6];
  const p2 = code[2] ^ code[5] ^ code[6];
  const p4 = code[4] ^ code[5] ^ code[6];
  code[0] = p1;
  code[1] = p2;
  code[3] = p4;
  return code;
};

export const hammingDecode = (
  block: number[]
): { dataBits: number[]; syndrome: number; correctedIndex: number | null } => {
  const code = [...block];
  while (code.length < 7) code.push(0);
  const s1 = code[0] ^ code[2] ^ code[4] ^ code[6];
  const s2 = code[1] ^ code[2] ^ code[5] ^ code[6];
  const s4 = code[3] ^ code[4] ^ code[5] ^ code[6];
  const syndrome = s1 + s2 * 2 + s4 * 4;
  let correctedIndex = null;
  if (syndrome > 0 && syndrome <= 7) {
    const idx = syndrome - 1;
    code[idx] = code[idx] ? 0 : 1;
    correctedIndex = syndrome;
  }
  const dataBits = [code[2], code[4], code[5], code[6]];
  return { dataBits, syndrome, correctedIndex };
};

export const secdedEncode = (dataBits: number[]): number[] => {
  const code7 = hammingEncode(dataBits);
  const overallParity = code7.reduce((sum, bit) => sum + bit, 0) % 2;
  return [...code7, overallParity];
};

export const secdedDecode = (
  block: number[]
): { dataBits: number[]; status: string; statusClass: string } => {
  const code = [...block];
  while (code.length < 8) code.push(0);
  const core = code.slice(0, 7);
  const parityBit = code[7];
  const s1 = core[0] ^ core[2] ^ core[4] ^ core[6];
  const s2 = core[1] ^ core[2] ^ core[5] ^ core[6];
  const s4 = core[3] ^ core[4] ^ core[5] ^ core[6];
  const syndrome = s1 + s2 * 2 + s4 * 4;
  const overall = (core.reduce((sum, bit) => sum + bit, 0) + parityBit) % 2;
  let status = "No error detected";
  let statusClass = "text-emerald-600";
  if (syndrome === 0 && overall === 1) {
    status = "Error in overall parity bit";
    statusClass = "text-amber-600";
  } else if (syndrome !== 0 && overall === 1) {
    const idx = syndrome - 1;
    core[idx] = core[idx] ? 0 : 1;
    status = `Single-bit corrected at position ${syndrome}`;
    statusClass = "text-emerald-600";
  } else if (syndrome !== 0 && overall === 0) {
    status = "Double error detected (uncorrectable)";
    statusClass = "text-rose-600";
  }
  const dataBits = [core[2], core[4], core[5], core[6]];
  return { dataBits, status, statusClass };
};
