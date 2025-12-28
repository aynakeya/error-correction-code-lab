<template>
  <div v-if="stepIndex === 0" class="text-slate-500 italic">
    Start the simulation to see step-by-step metric calculations.
  </div>
  <div v-else class="w-full overflow-x-auto">
    <table class="w-full text-sm text-left text-slate-600 border-collapse">
      <thead class="text-xs text-slate-500 uppercase bg-slate-50 border-b border-base-200">
        <tr>
          <th class="px-4 py-3 border-r border-base-200">Target State (t={{ stepIndex }})</th>
          <th class="px-4 py-3">Candidate Paths Analysis</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="group in calculations"
          :key="group.targetState"
          class="border-b border-base-200 bg-white/60 hover:bg-slate-50 transition"
        >
          <td class="px-4 py-4 border-r border-base-200 font-medium align-top w-48">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-blue-600 font-bold">State {{ group.targetState }}</span>
              <span class="text-xs text-slate-400 font-mono">
                ({{ group.targetState.toString(2).padStart(config.v, "0") }})
              </span>
            </div>
            <div class="text-xs text-slate-500">
              Winning Metric:
              <span class="text-emerald-600 font-bold">{{ metricByState[group.targetState] }}</span>
            </div>
          </td>
          <td class="px-4 py-2">
            <div class="flex flex-col gap-2">
              <div
                v-for="(cand, idx) in group.candidates"
                :key="idx"
                class="flex items-center justify-between p-2 rounded border"
                :class="cand.isSurvivor ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-base-200 opacity-70'"
              >
                <div class="flex items-center gap-3">
                  <div class="flex flex-col text-xs">
                    <span class="text-slate-400">From State</span>
                    <span class="font-mono">{{ cand.fromState }}</span>
                  </div>
                  <span class="text-slate-400">→</span>
                  <div class="flex flex-col text-xs">
                    <span class="text-slate-400">Exp. Out</span>
                    <span class="font-mono text-amber-600">{{ fmt(cand.expectedOutput) }}</span>
                  </div>
                  <span class="text-slate-400 text-xs">vs</span>
                  <div class="flex flex-col text-xs">
                    <span class="text-slate-400">Received</span>
                    <span class="font-mono text-slate-700">{{ fmt(receivedBits) }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 font-mono text-xs">
                  <div class="text-center">
                    <div class="text-slate-400 text-[10px]">Prev</div>
                    <div>{{ cand.prevMetric }}</div>
                  </div>
                  <span class="text-slate-400">+</span>
                  <div class="text-center">
                    <div class="text-slate-400 text-[10px]">Branch</div>
                    <div class="text-amber-600">{{ cand.branchMetric }}</div>
                  </div>
                  <span class="text-slate-400">=</span>
                  <div class="text-center">
                    <div class="text-slate-400 text-[10px]">Total</div>
                    <div :class="cand.isSurvivor ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                      {{ cand.totalMetric }}
                    </div>
                  </div>
                </div>

                <div class="w-24 text-right">
                  <span
                    v-if="cand.isSurvivor"
                    class="flex items-center justify-end gap-1 text-emerald-600 text-xs font-bold"
                  >
                    ✓ Selected
                  </span>
                  <span v-else class="flex items-center justify-end gap-1 text-slate-400 text-xs">
                    ✕ Pruned
                  </span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { EncoderConfig, TrellisEdge, TrellisNode } from "../../utils/convcode";
import { generateTrellisStructure, hammingDistance } from "../../utils/convcode";

const props = defineProps<{
  config: EncoderConfig;
  stepIndex: number;
  prevLayer: TrellisNode[];
  currentLayer: TrellisNode[];
  receivedBits: number[];
}>();

const transitions = computed<TrellisEdge[][]>(() => generateTrellisStructure(props.config));

const fmt = (arr) => arr.join("");

const metricByState = computed<Record<number, number>>(() => {
  const map: Record<number, number> = {};
  props.currentLayer.forEach((node) => {
    map[node.stateIndex] = node.metric;
  });
  return map;
});

const calculations = computed(() => {
  return props.currentLayer
    .map((targetNode) => {
      const targetState = targetNode.stateIndex;
      const candidates: Array<{
        fromState: number;
        prevMetric: number;
        expectedOutput: number[];
        branchMetric: number;
        totalMetric: number;
        isSurvivor: boolean;
        inputBit: number;
      }> = [];

      props.prevLayer.forEach((prevNode) => {
        if (prevNode.metric === Infinity) return;
        const edges = transitions.value[prevNode.stateIndex];
        const connectingEdge = edges.find((e) => e.toState === targetState);
        if (connectingEdge) {
          const branchMetric = hammingDistance(connectingEdge.outputBits, props.receivedBits);
          const totalMetric = prevNode.metric + branchMetric;
          const isSurvivor =
            totalMetric === targetNode.metric &&
            targetNode.survivorPrevState === prevNode.stateIndex;

          candidates.push({
            fromState: prevNode.stateIndex,
            prevMetric: prevNode.metric,
            expectedOutput: connectingEdge.outputBits,
            branchMetric,
            totalMetric,
            isSurvivor,
            inputBit: connectingEdge.inputBit,
          });
        }
      });

      return { targetState, candidates };
    })
    .filter((group) => group.candidates.length > 0);
});
</script>
