const isPowerOfTwo = (value: number) => value > 0 && (value & (value - 1)) === 0;

export const getParityCount = (dataLength: number): number => {
  let r = 0;
  while (2 ** r < dataLength + r + 1) r += 1;
  return r;
};

export const getParityPositions = (totalLength: number): number[] =>
  Array.from({ length: totalLength }, (_, index) => index + 1).filter(isPowerOfTwo);

export const getDataPositions = (totalLength: number): number[] => {
  const parityPositions = new Set(getParityPositions(totalLength));
  return Array.from({ length: totalLength }, (_, index) => index + 1).filter(
    (position) => !parityPositions.has(position)
  );
};

export const buildHammingLayout = (dataLength: number) => {
  const parityCount = getParityCount(dataLength);
  const totalLength = dataLength + parityCount;
  const parityPositions = getParityPositions(totalLength);
  const dataPositions = getDataPositions(totalLength);
  return { dataLength, parityCount, totalLength, parityPositions, dataPositions };
};

export const hammingEncode = (dataBits: number[]): number[] => {
  const layout = buildHammingLayout(dataBits.length);
  const code = Array(layout.totalLength).fill(0);
  layout.dataPositions.forEach((position, index) => {
    code[position - 1] = dataBits[index] ?? 0;
  });
  layout.parityPositions.forEach((parityPos) => {
    let parity = 0;
    for (let position = 1; position <= layout.totalLength; position += 1) {
      if (position & parityPos && position !== parityPos) {
        parity ^= code[position - 1] ?? 0;
      }
    }
    code[parityPos - 1] = parity;
  });
  return code;
};

export const hammingDecode = (
  block: number[]
): { dataBits: number[]; syndrome: number; correctedIndex: number | null } => {
  const code = [...block];
  const totalLength = code.length;
  const parityPositions = getParityPositions(totalLength);
  let syndrome = 0;
  parityPositions.forEach((parityPos) => {
    let parity = 0;
    for (let position = 1; position <= totalLength; position += 1) {
      if (position & parityPos) {
        parity ^= code[position - 1] ?? 0;
      }
    }
    if (parity !== 0) syndrome += parityPos;
  });
  let correctedIndex: number | null = null;
  if (syndrome > 0 && syndrome <= totalLength) {
    const idx = syndrome - 1;
    code[idx] = code[idx] ? 0 : 1;
    correctedIndex = syndrome;
  }
  const dataBits = getDataPositions(totalLength).map((position) => code[position - 1] ?? 0);
  return { dataBits, syndrome, correctedIndex };
};

export const secdedEncode = (dataBits: number[]): number[] => {
  const core = hammingEncode(dataBits);
  const overallParity = core.reduce((sum, bit) => sum + bit, 0) % 2;
  return [...core, overallParity];
};

export const secdedDecode = (
  block: number[]
): { dataBits: number[]; status: string; statusClass: string; syndrome: number; parityError: boolean } => {
  const code = [...block];
  const core = code.slice(0, -1);
  const overallParityBit = code[code.length - 1] ?? 0;
  const totalLength = core.length;
  const parityPositions = getParityPositions(totalLength);
  let syndrome = 0;
  parityPositions.forEach((parityPos) => {
    let parity = 0;
    for (let position = 1; position <= totalLength; position += 1) {
      if (position & parityPos) {
        parity ^= core[position - 1] ?? 0;
      }
    }
    if (parity !== 0) syndrome += parityPos;
  });
  const overall =
    (core.reduce((sum, bit) => sum + bit, 0) + overallParityBit) % 2;
  const parityError = overall !== 0;
  let status = "未检测到错误";
  let statusClass = "text-emerald-600";
  if (syndrome === 0 && parityError) {
    status = "总体校验位出错";
    statusClass = "text-amber-600";
  } else if (syndrome !== 0 && parityError) {
    const idx = syndrome - 1;
    core[idx] = core[idx] ? 0 : 1;
    status = `单比特纠正，位置 ${syndrome}`;
    statusClass = "text-emerald-600";
  } else if (syndrome !== 0 && !parityError) {
    status = "检测到双比特错误（不可纠正）";
    statusClass = "text-rose-600";
  }
  const dataBits = getDataPositions(totalLength).map((position) => core[position - 1] ?? 0);
  return { dataBits, status, statusClass, syndrome, parityError };
};
