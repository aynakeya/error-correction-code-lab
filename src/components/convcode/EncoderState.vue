<template>
  <div class="w-full bg-base-100 rounded-lg border border-base-200 p-4 shadow-sm overflow-x-auto">
    <h3 class="text-slate-600 text-sm font-bold mb-2 uppercase tracking-wider">
      Encoder Circuit (n={{ config.n }}, k=1, K={{ config.v + 1 }})
    </h3>
    <svg
      width="100%"
      height="100%"
      :viewBox="`0 0 ${width} ${height}`"
      class="mx-auto"
      style="min-width: 600px"
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
        </marker>
      </defs>

      <text :x="startX" :y="registerY - 40" fill="#64748b" text-anchor="middle" font-size="12">
        Input
      </text>

      <g v-for="(bit, idx) in displayBits" :key="`reg-${idx}`">
        <line
          v-if="idx < displayBits.length - 1"
          :x1="startX + idx * registerSpacing + 20"
          :y1="registerY"
          :x2="startX + (idx + 1) * registerSpacing - 20"
          :y2="registerY"
          stroke="#94a3b8"
          stroke-width="2"
          marker-end="url(#arrowhead)"
        />

        <rect
          :x="startX + idx * registerSpacing - 20"
          :y="registerY - 20"
          width="40"
          height="40"
          rx="4"
          :fill="idx === 0 && isActive ? '#38bdf8' : idx === 0 ? '#e2e8f0' : '#f8fafc'"
          :stroke="idx === 0 ? '#0ea5e9' : '#94a3b8'"
          stroke-width="2"
        />
        <text
          :x="startX + idx * registerSpacing"
          :y="registerY + 5"
          text-anchor="middle"
          fill="#0f172a"
          font-weight="bold"
        >
          {{ bit }}
        </text>
        <text
          :x="startX + idx * registerSpacing"
          :y="registerY + 35"
          text-anchor="middle"
          fill="#94a3b8"
          font-size="10"
        >
          {{ idx === 0 ? "In" : `M${idx}` }}
        </text>
      </g>

      <g v-for="(gen, gIdx) in config.generators" :key="`gen-${gIdx}`">
        <circle
          :cx="genX"
          :cy="adderY - (config.n * adderSpacing) / 2 + gIdx * adderSpacing"
          r="15"
          fill="#f1f5f9"
          stroke="#94a3b8"
          stroke-width="2"
        />
        <line
          :x1="genX"
          :y1="adderY - (config.n * adderSpacing) / 2 + gIdx * adderSpacing - 8"
          :x2="genX"
          :y2="adderY - (config.n * adderSpacing) / 2 + gIdx * adderSpacing + 8"
          stroke="#94a3b8"
          stroke-width="2"
        />
        <line
          :x1="genX - 8"
          :y1="adderY - (config.n * adderSpacing) / 2 + gIdx * adderSpacing"
          :x2="genX + 8"
          :y2="adderY - (config.n * adderSpacing) / 2 + gIdx * adderSpacing"
          stroke="#94a3b8"
          stroke-width="2"
        />

        <path
          v-for="(tapIdx, tKey) in gen.taps"
          :key="`tap-${gIdx}-${tKey}`"
          :d="tapPath(tapIdx, gIdx)"
          fill="none"
          :stroke="isActive && displayBits[tapIdx] === 1 ? '#0ea5e9' : '#94a3b8'"
          stroke-width="1.5"
          :stroke-dasharray="isActive && displayBits[tapIdx] === 1 ? '4 2' : 'none'"
        />

        <line
          :x1="genX + 15"
          :y1="adderY - (config.n * adderSpacing) / 2 + gIdx * adderSpacing"
          :x2="genX + 60"
          :y2="adderY - (config.n * adderSpacing) / 2 + gIdx * adderSpacing"
          stroke="#10b981"
          stroke-width="2"
          marker-end="url(#arrowhead)"
        />
        <text
          :x="genX + 75"
          :y="adderY - (config.n * adderSpacing) / 2 + gIdx * adderSpacing + 5"
          fill="#10b981"
          font-weight="bold"
        >
          {{ currentStepData?.encodedBits?.[gIdx] ?? 0 }}
        </text>
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EncoderConfig, SimulationStep } from "../../utils/convcode";

const props = defineProps<{
  config: EncoderConfig;
  currentStepData: SimulationStep | null;
  isActive: boolean;
}>();

const width = 800;
const height = 300;
const startX = 50;
const registerY = 100;
const registerSpacing = 80;
const adderY = 200;
const adderSpacing = 60;
const genX = computed(() => startX + (props.config.v + 1) * registerSpacing + 50);

const displayBits = computed<number[]>(() => {
  const registers = props.currentStepData
    ? props.currentStepData.registerStateBefore
    : new Array(props.config.v).fill(0);
  const inputBit = props.currentStepData ? props.currentStepData.inputBit : 0;
  return [inputBit, ...registers];
});

const tapPath = (tapIdx, gIdx) => {
  const sourceX = startX + tapIdx * registerSpacing;
  const genY = adderY - (props.config.n * adderSpacing) / 2 + gIdx * adderSpacing;
  return `M ${sourceX} ${registerY + 20} L ${sourceX} ${genY} L ${genX.value - 15} ${genY}`;
};
</script>
