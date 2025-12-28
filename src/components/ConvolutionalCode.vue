<template>
  <section class="card rounded-t-none bg-white/90 shadow-xl">
    <div class="card-body gap-6">
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-1 flex flex-col gap-6">
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <p class="text-sm font-semibold text-slate-600">编码器设置</p>
            <div class="mt-3 flex flex-col gap-4">
              <label class="form-control">
                <div class="label">
                    <span class="label-text">输入比特</span>
                </div>
                <input v-model="inputDataStr" class="input input-bordered" placeholder="11011" />
              </label>
              <div class="grid grid-cols-3 gap-3">
                <label class="form-control">
                  <div class="label">
                    <span class="label-text">n（输出数）</span>
                  </div>
                  <input v-model.number="convN" type="number" min="1" class="input input-bordered" />
                </label>
                <label class="form-control">
                  <div class="label">
                    <span class="label-text">k（输入数）</span>
                  </div>
                  <input v-model.number="convK" type="number" min="1" class="input input-bordered" />
                </label>
                <label class="form-control">
                  <div class="label">
                    <span class="label-text">v（存储深度）</span>
                  </div>
                  <input v-model.number="convV" type="number" min="1" class="input input-bordered" />
                </label>
              </div>
              <p v-if="convK !== 1" class="text-xs text-amber-600">
                编码器状态与网格图当前只支持 k = 1，其他值会被忽略。
              </p>
              <div>
                <p class="text-xs text-slate-500">
                  生成多项式（长度 = v + 1），最左位表示输入抽头。
                </p>
                <div class="mt-2 overflow-x-auto">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                          <th>输出</th>
                          <th>抽头二进制</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(poly, index) in generatorStrings" :key="`gen-${index}`">
                        <td>g{{ index + 1 }}</td>
                        <td>
                          <input
                            v-model="generatorStrings[index]"
                            class="input input-bordered input-xs w-28"
                            placeholder="111"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-slate-600">仿真控制</p>
              <span class="text-xs text-slate-500 font-mono">步数 {{ currentStep }} / {{ totalSteps }}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button class="btn btn-sm" @click="resetSimulation">重置</button>
              <button class="btn btn-sm btn-primary" @click="nextStep" :disabled="currentStep >= totalSteps">
                下一步
              </button>
              <button class="btn btn-sm btn-secondary" @click="toggleAuto" :disabled="currentStep >= totalSteps">
                {{ isAutoPlaying ? "暂停" : "自动播放" }}
              </button>
            </div>
          </div>

          <EncoderState :config="config" :current-step-data="currentSimulationData" :is-active="isAutoPlaying" />

          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <div class="flex justify-between text-xs text-slate-500 uppercase">
              <span>输入序列</span>
              <span>编码序列（发送）</span>
            </div>
            <div class="mt-2 flex gap-4 items-center">
              <div class="flex-1 bg-slate-50 h-8 rounded flex items-center px-2 overflow-hidden font-mono text-sm border border-base-200">
                <span
                  v-for="(bit, i) in displayInputBits"
                  :key="`in-${i}`"
                  class="mr-1"
                  :class="i === currentStep ? 'text-white font-bold bg-blue-600 px-1 rounded' : 'text-slate-500'"
                >
                  {{ bit }}
                </span>
              </div>
              <span class="text-slate-400">→</span>
              <div class="flex-1 bg-slate-50 h-8 rounded flex items-center px-2 overflow-hidden font-mono text-sm border border-base-200">
                <span
                  v-for="(step, i) in simulationSteps"
                  :key="`out-${i}`"
                  class="mr-1"
                  :class="i < currentStep ? 'text-emerald-600' : 'text-slate-600'"
                >
                  {{ step.encodedBits.join("") }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2 flex flex-col gap-6">
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <p class="text-sm font-semibold text-slate-600">编码输出（点击翻转）</p>
            <div class="mt-3 flex flex-col gap-3">
              <div v-for="(stepBits, step) in encodedSteps" :key="`conv-step-${step}`">
                <p class="text-xs text-slate-500">步 {{ step + 1 }}</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="(bit, index) in stepBits"
                    :key="`conv-bit-${step}-${index}`"
                    class="bit-chip"
                    :class="bit ? 'bit-chip-active' : ''"
                    @click="toggleConvBit(step, index)"
                  >
                    {{ bit }}
                  </button>
                </div>
              </div>
            </div>
            <p class="mt-3 text-xs text-slate-500">接收序列：{{ receivedBits.join("") }}</p>
          </div>

          <div class="rounded-2xl border border-base-200 bg-base-100 p-4 flex flex-col min-h-[500px]">
            <div class="flex justify-between items-center mb-4">
              <div class="text-sm font-semibold text-emerald-600">维特比译码（网格）</div>
              <div class="text-xs text-slate-500">
                接收：<span class="font-mono text-slate-700">{{ receivedBits.join("") }}</span>
              </div>
            </div>
            <TrellisViz :config="config" :viterbi-data="viterbiResult" :current-step="currentStep" />
            <div class="border-t border-base-200 pt-6 mt-4">
              <div class="text-sm font-semibold text-amber-600 mb-3">
                步 {{ currentStep }} 路径度量与选择
              </div>
              <div v-if="currentStep === 0" class="text-slate-500 italic">
                进入第 1 步后显示维特比路径计算。
              </div>
              <ViterbiStepDetails
                v-else
                :config="config"
                :step-index="currentStep"
                :prev-layer="prevLayer"
                :current-layer="currentLayer"
                :received-bits="receivedChunk"
              />
            </div>
            <div class="mt-6 pt-4 border-t border-base-200">
              <h4 class="text-sm font-bold text-slate-500 mb-2">解码输出（幸存路径）</h4>
              <div class="font-mono text-lg tracking-widest text-slate-800">
                <span
                  v-for="(bit, i) in viterbiResult.decodedBits"
                  :key="`dec-${i}`"
                  :class="i < currentStep ? 'text-emerald-600' : 'text-slate-400'"
                >
                  {{ bit }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { sanitizeBits, toBits } from "../utils/bits";
import {
  EncoderConfig,
  SimulationStep,
  ViterbiResult,
  runViterbi,
  simulateEncoding,
} from "../utils/convcode";
import EncoderState from "./convcode/EncoderState.vue";
import TrellisViz from "./convcode/TrellisViz.vue";
import ViterbiStepDetails from "./convcode/ViterbiStepDetails.vue";

const inputDataStr = ref("11011");
const convN = ref<number>(2);
const convK = ref<number>(1);
const convV = ref<number>(2);
const generatorStrings = ref<string[]>(["111", "101"]);

const normalizeGenerators = () => {
  const n = Math.max(1, Number(convN.value) || 1);
  const v = Math.max(1, Number(convV.value) || 1);
  const length = v + 1;
  const next: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const existing = generatorStrings.value[i] || "";
    const sanitized = sanitizeBits(existing).slice(0, length).padEnd(length, "0");
    next.push(sanitized || "1".padEnd(length, "0"));
  }
  generatorStrings.value = next;
};

watch([convN, convV], normalizeGenerators, { immediate: true });

const config = computed<EncoderConfig>(() => {
  const n = Math.max(1, Number(convN.value) || 1);
  const v = Math.max(1, Number(convV.value) || 1);
  const generators = generatorStrings.value.map((binary, index) => {
    const sanitized = sanitizeBits(binary).slice(0, v + 1).padEnd(v + 1, "0");
    const taps = [];
    sanitized.split("").forEach((bit, idx) => {
      if (bit === "1") taps.push(idx);
    });
    return { id: `g${index + 1}`, taps, binaryString: sanitized };
  });
  return { k: 1, n, v, generators };
});

const inputBits = computed(() => toBits(inputDataStr.value));
const simulationSteps = computed<SimulationStep[]>(() =>
  simulateEncoding(inputBits.value, config.value)
);
const totalSteps = computed(() => simulationSteps.value.length);

const encodedSteps = computed(() => simulationSteps.value.map((step) => step.encodedBits));
const encodedBits = computed(() => encodedSteps.value.flat());

const receivedBits = ref<number[]>([]);
watch(
  encodedBits,
  (value) => {
    receivedBits.value = [...value];
  },
  { immediate: true }
);

const toggleConvBit = (stepIndex, bitIndex) => {
  const n = Math.max(1, Number(convN.value) || 1);
  const flatIndex = stepIndex * n + bitIndex;
  if (flatIndex < 0 || flatIndex >= receivedBits.value.length) return;
  receivedBits.value[flatIndex] = receivedBits.value[flatIndex] ? 0 : 1;
};

const currentStep = ref<number>(0);
const isAutoPlaying = ref<boolean>(false);
let timer: number | null = null;

const resetSimulation = () => {
  currentStep.value = 0;
  isAutoPlaying.value = false;
};

const nextStep = () => {
  currentStep.value = Math.min(currentStep.value + 1, totalSteps.value);
};

const toggleAuto = () => {
  isAutoPlaying.value = !isAutoPlaying.value;
};

watch(
  [simulationSteps, convN, convV, inputDataStr],
  () => {
    resetSimulation();
  },
  { immediate: true }
);

watch(
  isAutoPlaying,
  (playing) => {
    if (playing) {
      timer = window.setInterval(() => {
        if (currentStep.value < totalSteps.value) {
          currentStep.value += 1;
        } else {
          isAutoPlaying.value = false;
        }
      }, 1500);
    } else if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
);

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

const currentSimulationData = computed(() => simulationSteps.value[currentStep.value] || null);

const viterbiResult = computed<ViterbiResult>(() =>
  runViterbi(receivedBits.value, config.value)
);

const prevLayer = computed(() => viterbiResult.value.layers[currentStep.value - 1] || []);
const currentLayer = computed(() => viterbiResult.value.layers[currentStep.value] || []);
const receivedChunk = computed(() => {
  const n = Math.max(1, Number(convN.value) || 1);
  if (currentStep.value === 0) return [];
  return receivedBits.value.slice((currentStep.value - 1) * n, currentStep.value * n);
});

const displayInputBits = computed(() => {
  const flushBits = new Array(Math.max(0, config.value.v)).fill(0);
  return [...inputBits.value, ...flushBits];
});
</script>
