<template>
  <div class="w-full bg-base-100 rounded-lg border border-base-200 p-4 shadow-sm overflow-x-auto relative">
    <h3 class="text-slate-600 text-sm font-bold mb-2 uppercase tracking-wider sticky left-0">
      Viterbi Trellis Decoder
    </h3>
    <svg :width="width" :height="height">
      <g v-for="(layer, stepIndex) in layers.slice(0, layers.length - 1)" :key="`step-${stepIndex}`">
        <g v-for="node in layer" :key="`edge-${stepIndex}-${node.stateIndex}`">
          <line
            v-for="edge in transitions[node.stateIndex]"
            :key="`edge-${stepIndex}-${edge.fromState}-${edge.toState}`"
            :x1="getCoord(stepIndex, edge.fromState).x"
            :y1="getCoord(stepIndex, edge.fromState).y"
            :x2="getCoord(stepIndex + 1, edge.toState).x"
            :y2="getCoord(stepIndex + 1, edge.toState).y"
            :stroke="edgeStroke(stepIndex, edge)"
            :stroke-width="edgeStrokeWidth(stepIndex, edge)"
            :stroke-dasharray="edge.inputBit === 1 ? '4 4' : 'none'"
            opacity="0.6"
          />
        </g>
      </g>

      <g v-for="(layer, stepIndex) in layers" :key="`nodes-${stepIndex}`">
        <text :x="getCoord(stepIndex, 0).x" y="20" fill="#94a3b8" text-anchor="middle" font-size="10">
          t={{ stepIndex }}
        </text>
        <g v-for="node in layer" :key="`node-${stepIndex}-${node.stateIndex}`">
          <circle
            :cx="getCoord(stepIndex, node.stateIndex).x"
            :cy="getCoord(stepIndex, node.stateIndex).y"
            :r="stepIndex === currentStep ? 8 : 5"
            :fill="nodeFill(stepIndex, node)"
            :stroke="stepIndex === currentStep ? '#cbd5e1' : 'none'"
            stroke-width="2"
          />
          <text
            v-if="node.metric !== Infinity && stepIndex <= currentStep"
            :x="getCoord(stepIndex, node.stateIndex).x"
            :y="getCoord(stepIndex, node.stateIndex).y - 10"
            text-anchor="middle"
            :fill="nodeMetricColor(stepIndex, node)"
            font-size="10"
          >
            {{ node.metric }}
          </text>
          <text
            v-if="stepIndex === 0"
            :x="getCoord(stepIndex, node.stateIndex).x - 20"
            :y="getCoord(stepIndex, node.stateIndex).y + 3"
            text-anchor="end"
            fill="#94a3b8"
            font-size="10"
          >
            S{{ node.stateIndex }} ({{ node.stateIndex.toString(2).padStart(config.v, "0") }})
          </text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EncoderConfig, TrellisEdge, TrellisNode, ViterbiResult } from "../../utils/convcode";
import { generateTrellisStructure } from "../../utils/convcode";

const props = defineProps<{
  config: EncoderConfig;
  viterbiData: ViterbiResult | null;
  currentStep: number;
}>();

const transitions = computed<TrellisEdge[][]>(() => generateTrellisStructure(props.config));

const layers = computed<TrellisNode[][]>(() => props.viterbiData?.layers || []);
const survivorPath = computed<number[]>(() => props.viterbiData?.survivorPath || []);

const xSpacing = 80;
const ySpacing = 60;
const margin = 50;
const width = computed(() => Math.max(800, layers.value.length * xSpacing + margin * 2));
const height = computed(() => Math.max(200, (1 << props.config.v) * ySpacing + margin * 2));

const getCoord = (step, state) => ({
  x: margin + step * xSpacing,
  y: margin + state * ySpacing,
});

const edgeStroke = (stepIndex: number, edge: TrellisEdge) => {
  const isPast = stepIndex < props.currentStep;
  const isOnSurvivor =
    survivorPath.value[stepIndex] === edge.fromState &&
    survivorPath.value[stepIndex + 1] === edge.toState;
  if (isOnSurvivor && isPast) return "#10b981";
  if (stepIndex === props.currentStep) return "#94a3b8";
  return "#cbd5f5";
};

const edgeStrokeWidth = (stepIndex: number, edge: TrellisEdge) => {
  const isPast = stepIndex < props.currentStep;
  const isOnSurvivor =
    survivorPath.value[stepIndex] === edge.fromState &&
    survivorPath.value[stepIndex + 1] === edge.toState;
  return isOnSurvivor && isPast ? 3 : 1;
};

const nodeFill = (stepIndex: number, node: TrellisNode) => {
  const isSurvivor =
    survivorPath.value[stepIndex] === node.stateIndex && stepIndex <= props.currentStep;
  if (isSurvivor) return "#10b981";
  return node.metric === Infinity ? "#f1f5f9" : "#cbd5f5";
};

const nodeMetricColor = (stepIndex: number, node: TrellisNode) => {
  const isSurvivor =
    survivorPath.value[stepIndex] === node.stateIndex && stepIndex <= props.currentStep;
  return isSurvivor ? "#059669" : "#64748b";
};
</script>
