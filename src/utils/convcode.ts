export interface GeneratorPoly {
  id: string;
  taps: number[];
  binaryString: string;
}

export interface EncoderConfig {
  k: number;
  n: number;
  v: number;
  generators: GeneratorPoly[];
}

export interface SimulationStep {
  stepIndex: number;
  inputBit: number;
  registerStateBefore: number[];
  registerStateAfter: number[];
  encodedBits: number[];
}

export interface TrellisNode {
  step: number;
  stateIndex: number;
  metric: number;
  survivorPrevState: number | null;
}

export interface TrellisEdge {
  fromState: number;
  toState: number;
  outputBits: number[];
  inputBit: number;
}

export interface ViterbiResult {
  layers: TrellisNode[][];
  survivorPath: number[];
  decodedBits: number[];
}

export const numToBits = (num: number, length: number): number[] => {
  const bits = [];
  for (let i = 0; i < length; i += 1) {
    bits.unshift((num >> i) & 1);
  }
  return bits;
};

export const calculateOutput = (
  inputBit: number,
  registers: number[],
  taps: number[]
): number => {
  const delayLine = [inputBit, ...registers];
  let sum = 0;
  taps.forEach((tapIndex) => {
    if (tapIndex < delayLine.length) {
      sum ^= delayLine[tapIndex];
    }
  });
  return sum;
};

export const simulateEncoding = (
  inputData: number[],
  config: EncoderConfig
): SimulationStep[] => {
  const steps: SimulationStep[] = [];
  let registers = new Array(config.v).fill(0);
  const totalBits = [...inputData, ...new Array(config.v).fill(0)];

  for (let i = 0; i < totalBits.length; i += 1) {
    const inputBit = totalBits[i];
    const stateBefore = [...registers];
    const outputBits = config.generators.map((g) =>
      calculateOutput(inputBit, registers, g.taps)
    );
    const stateAfter = [inputBit, ...registers.slice(0, Math.max(0, config.v - 1))];

    steps.push({
      stepIndex: i,
      inputBit,
      registerStateBefore: stateBefore,
      registerStateAfter: stateAfter,
      encodedBits: outputBits,
    });

    registers = stateAfter;
  }

  return steps;
};

export const generateTrellisStructure = (config: EncoderConfig): TrellisEdge[][] => {
  const numStates = 1 << config.v;
  const structure: TrellisEdge[][] = [];

  for (let state = 0; state < numStates; state += 1) {
    const edges = [];
    const registers = numToBits(state, config.v);
    for (const inputBit of [0, 1]) {
      const outputBits = config.generators.map((g) =>
        calculateOutput(inputBit, registers, g.taps)
      );
      const nextStateVal = (state >> 1) | (inputBit << (config.v - 1));
      edges.push({
        fromState: state,
        toState: nextStateVal,
        outputBits,
        inputBit,
      });
    }
    structure[state] = edges;
  }
  return structure;
};

export const hammingDistance = (a: number[], b: number[]): number => {
  let dist = 0;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    if ((a[i] || 0) !== (b[i] || 0)) dist += 1;
  }
  return dist;
};

export const runViterbi = (receivedBits: number[], config: EncoderConfig): ViterbiResult => {
  const n = config.n;
  const numSteps = receivedBits.length / n;
  const numStates = 1 << config.v;
  const transitions = generateTrellisStructure(config);

  const layers: TrellisNode[][] = [];
  const initialLayer: TrellisNode[] = [];
  for (let s = 0; s < numStates; s += 1) {
    initialLayer.push({
      step: 0,
      stateIndex: s,
      metric: s === 0 ? 0 : Infinity,
      survivorPrevState: null,
    });
  }
  layers.push(initialLayer);

  for (let t = 1; t <= numSteps; t += 1) {
    const currentReceivedSymbol = receivedBits.slice((t - 1) * n, t * n);
    const currentLayer: TrellisNode[] = [];

    for (let currState = 0; currState < numStates; currState += 1) {
      let minMetric = Infinity;
      let bestPrevState = null;

      for (let prevState = 0; prevState < numStates; prevState += 1) {
        const prevNode = layers[t - 1][prevState];
        if (prevNode.metric === Infinity) continue;

        const edge = transitions[prevState].find((e) => e.toState === currState);
        if (edge) {
          const branchMetric = hammingDistance(edge.outputBits, currentReceivedSymbol);
          const totalMetric = prevNode.metric + branchMetric;
          if (totalMetric < minMetric) {
            minMetric = totalMetric;
            bestPrevState = prevState;
          }
        }
      }

      currentLayer.push({
        step: t,
        stateIndex: currState,
        metric: minMetric,
        survivorPrevState: bestPrevState,
      });
    }
    layers.push(currentLayer);
  }

  const lastLayer = layers[layers.length - 1];
  let minFinalMetric = Infinity;
  let endState = 0;
  for (let s = 0; s < numStates; s += 1) {
    if (lastLayer[s].metric < minFinalMetric) {
      minFinalMetric = lastLayer[s].metric;
      endState = s;
    }
  }
  if (lastLayer[0].metric === minFinalMetric) {
    endState = 0;
  }

  const survivorPath: number[] = [endState];
  const decodedBits: number[] = [];
  let currentState = endState;
  for (let t = numSteps; t > 0; t -= 1) {
    const node = layers[t][currentState];
    if (node.survivorPrevState !== null) {
      const prevState = node.survivorPrevState;
      const edge = transitions[prevState].find((e) => e.toState === currentState);
      if (edge) {
        decodedBits.unshift(edge.inputBit);
      }
      survivorPath.unshift(prevState);
      currentState = prevState;
    }
  }

  const cleanDecoded = decodedBits.slice(0, Math.max(0, decodedBits.length - config.v));

  return { layers, survivorPath, decodedBits: cleanDecoded };
};
