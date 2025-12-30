<template>
  <section class="card rounded-t-none bg-white/90 shadow-xl">
    <div class="card-body gap-6">
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="lg:col-span-1">
          <BitInput v-model="inputDataStr" :label="t('conv.inputBits')" />
        </div>
        <div class="lg:col-span-1 rounded-2xl border border-base-200 bg-base-100 p-4">
          <p class="text-sm font-semibold text-slate-600">{{ t("conv.settings") }}</p>
          <div class="mt-3 flex flex-col gap-4">
            <div class="grid grid-cols-3 gap-3">
              <label class="form-control">
                <div class="label">
                  <span class="label-text">{{ t("conv.n") }}</span>
                </div>
                <input v-model.number="convN" type="number" min="1" class="input input-bordered" />
              </label>
              <label class="form-control">
                <div class="label">
                  <span class="label-text">{{ t("conv.k") }}</span>
                </div>
                <input v-model.number="convK" type="number" min="1" class="input input-bordered" />
              </label>
              <label class="form-control">
                <div class="label">
                  <span class="label-text">{{ t("conv.v") }}</span>
                </div>
                <input v-model.number="convV" type="number" min="1" class="input input-bordered" />
              </label>
            </div>
            <p v-if="convK !== 1" class="text-xs text-amber-600">
              {{ t("conv.kNotice") }}
            </p>
            <div>
              <p class="text-xs text-slate-500">
                {{ t("conv.polyNotice") }}
              </p>
              <div class="mt-2 overflow-x-auto">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>{{ t("conv.outputCol") }}</th>
                      <th>{{ t("conv.tapsCol") }}</th>
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
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="flex flex-col gap-6">
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-slate-600">{{ t("conv.encodeControl") }}</p>
              <span class="text-xs text-slate-500 font-mono">
                {{ t("conv.steps", { current: encodeStep, total: totalSteps }) }}
              </span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button class="btn btn-sm" @click="resetEncode">{{ t("conv.reset") }}</button>
              <button class="btn btn-sm btn-primary" @click="nextEncode" :disabled="encodeStep >= totalSteps">
                {{ t("conv.next") }}
              </button>
              <button class="btn btn-sm btn-secondary" @click="toggleEncodeAuto" :disabled="encodeStep >= totalSteps">
                {{ isEncodeAuto ? t("conv.pause") : t("conv.auto") }}
              </button>
            </div>
          </div>
          <EncoderState :config="config" :current-step-data="currentSimulationData" :is-active="isEncodeAuto" />
        </div>
        <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
          <div class="flex justify-between text-xs text-slate-500 uppercase">
            <span>{{ t("conv.inputSeq") }}</span>
            <span>{{ t("conv.encodedSeq") }}</span>
          </div>
          <div class="mt-2 flex gap-4 items-center">
            <div class="flex-1 bg-slate-50 h-8 rounded flex items-center px-2 overflow-hidden font-mono text-sm border border-base-200">
              <span
                v-for="(bit, i) in displayInputBits"
                :key="`in-${i}`"
                class="mr-1"
                :class="i === encodeStep ? 'text-white font-bold bg-blue-600 px-1 rounded' : 'text-slate-500'"
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
                :class="i < encodeStep ? 'text-emerald-600' : 'text-slate-600'"
              >
                {{ step.encodedBits.join("") }}
              </span>
            </div>
          </div>
          <div class="mt-4 rounded-2xl border border-base-200 bg-white/70 p-3">
            <p class="text-xs font-semibold text-slate-600">
              {{ t("conv.formulaTitle", { step: Math.max(1, encodeStep) }) }}
            </p>
            <div class="mt-2 flex flex-col gap-2">
              <div v-for="row in formulaRows" :key="`formula-${row.index}`" class="flex flex-wrap items-center gap-2">
                <BitDisplay :bits="row.output" title="" hide-title read-only />
                <span class="text-slate-500">=</span>
                <template v-for="(input, idx) in row.inputs" :key="`formula-input-${row.index}-${idx}`">
                  <BitDisplay :bits="[input]" title="" hide-title read-only />
                  <span v-if="idx < row.inputs.length - 1" class="text-slate-500">⊕</span>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
        <p class="text-sm font-semibold text-slate-600">{{ t("conv.outputTitle") }}</p>
        <BitDisplay
          class="mt-3"
          :title="''"
          hide-title
          :bits="convReceivedInfo"
          :highlight-indices="convErrorIndices"
          show-index
          :index-offset="1"
          @bit-click="toggleConvBit"
        />
        <p class="mt-3 text-xs text-slate-500">
          {{ t("conv.receivedSeq", { seq: receivedBits.join("") }) }}
        </p>
      </div>

      <div class="rounded-2xl border border-base-200 bg-base-100 p-4 flex flex-col min-h-[520px]">
        <div class="flex items-center justify-between gap-3">
          <div class="text-sm font-semibold text-emerald-600">{{ t("conv.viterbiTitle") }}</div>
          <div class="text-xs text-slate-500">
            {{ t("conv.receivedLabel") }}
            <span class="font-mono text-slate-700">{{ receivedBits.join("") }}</span>
          </div>
        </div>
        <div class="mt-4 rounded-2xl border border-base-200 bg-white/70 p-3 flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-600">{{ t("conv.viterbiControl") }}</p>
          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-500 font-mono">
              {{ t("conv.steps", { current: viterbiStep, total: totalSteps }) }}
            </span>
            <button class="btn btn-xs" @click="resetViterbi">{{ t("conv.reset") }}</button>
            <button class="btn btn-xs btn-primary" @click="nextViterbi" :disabled="viterbiStep >= totalSteps">
              {{ t("conv.next") }}
            </button>
            <button class="btn btn-xs btn-secondary" @click="toggleViterbiAuto" :disabled="viterbiStep >= totalSteps">
              {{ isViterbiAuto ? t("conv.pause") : t("conv.auto") }}
            </button>
          </div>
        </div>
        <div class="mt-4">
          <TrellisViz :config="config" :viterbi-data="viterbiResult" :current-step="viterbiStep" />
        </div>
        <div class="border-t border-base-200 pt-6 mt-4">
          <div class="text-sm font-semibold text-amber-600 mb-3">
            {{ t("conv.stepMetric", { step: viterbiStep }) }}
          </div>
          <div v-if="viterbiStep === 0" class="text-slate-500 italic">
            {{ t("conv.stepHint") }}
          </div>
          <ViterbiStepDetails
            v-else
            :config="config"
            :step-index="viterbiStep"
            :prev-layer="prevLayer"
            :current-layer="currentLayer"
            :received-bits="receivedChunk"
          />
        </div>
        <div class="mt-6 pt-4 border-t border-base-200">
          <h4 class="text-sm font-bold text-slate-500 mb-2">{{ t("conv.decodedPath") }}</h4>
          <div class="font-mono text-lg tracking-widest text-slate-800">
            <span
              v-for="(bit, i) in viterbiResult.decodedBits"
              :key="`dec-${i}`"
              :class="i < viterbiStep ? 'text-emerald-600' : 'text-slate-400'"
            >
              {{ bit }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import BitInput from "./BitInput.vue";
import BitDisplay, { BitItem } from "./BitDisplay.vue";
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
import { useI18n } from "../i18n";

const inputDataStr = ref("11011");
const convN = ref<number>(2);
const convK = ref<number>(1);
const convV = ref<number>(2);
const generatorStrings = ref<string[]>(["111", "101"]);
const { t } = useI18n();

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

const toggleConvBit = (bitIndex: number) => {
  if (bitIndex < 0 || bitIndex >= receivedBits.value.length) return;
  receivedBits.value[bitIndex] = receivedBits.value[bitIndex] ? 0 : 1;
};

const encodeStep = ref<number>(0);
const isEncodeAuto = ref<boolean>(false);
let encodeTimer: number | null = null;

const resetEncode = () => {
  encodeStep.value = 0;
  isEncodeAuto.value = false;
};

const nextEncode = () => {
  encodeStep.value = Math.min(encodeStep.value + 1, totalSteps.value);
};

const toggleEncodeAuto = () => {
  isEncodeAuto.value = !isEncodeAuto.value;
};

const viterbiStep = ref<number>(0);
const isViterbiAuto = ref<boolean>(false);
let viterbiTimer: number | null = null;

const resetViterbi = () => {
  viterbiStep.value = 0;
  isViterbiAuto.value = false;
};

const nextViterbi = () => {
  viterbiStep.value = Math.min(viterbiStep.value + 1, totalSteps.value);
};

const toggleViterbiAuto = () => {
  isViterbiAuto.value = !isViterbiAuto.value;
};

watch(
  [simulationSteps, convN, convV, inputDataStr],
  () => {
    resetEncode();
    resetViterbi();
  },
  { immediate: true }
);

watch(
  isEncodeAuto,
  (playing) => {
    if (playing) {
      encodeTimer = window.setInterval(() => {
        if (encodeStep.value < totalSteps.value) {
          encodeStep.value += 1;
        } else {
          isEncodeAuto.value = false;
        }
      }, 1500);
    } else if (encodeTimer) {
      clearInterval(encodeTimer);
      encodeTimer = null;
    }
  }
);

watch(
  isViterbiAuto,
  (playing) => {
    if (playing) {
      viterbiTimer = window.setInterval(() => {
        if (viterbiStep.value < totalSteps.value) {
          viterbiStep.value += 1;
        } else {
          isViterbiAuto.value = false;
        }
      }, 1500);
    } else if (viterbiTimer) {
      clearInterval(viterbiTimer);
      viterbiTimer = null;
    }
  }
);

onBeforeUnmount(() => {
  if (encodeTimer) clearInterval(encodeTimer);
  if (viterbiTimer) clearInterval(viterbiTimer);
});

const currentSimulationData = computed(() => {
  if (simulationSteps.value.length === 0) return null;
  const index = Math.min(encodeStep.value, simulationSteps.value.length - 1);
  return simulationSteps.value[index] || null;
});

const viterbiResult = computed<ViterbiResult>(() =>
  runViterbi(receivedBits.value, config.value)
);

const prevLayer = computed(() => viterbiResult.value.layers[viterbiStep.value - 1] || []);
const currentLayer = computed(() => viterbiResult.value.layers[viterbiStep.value] || []);
const receivedChunk = computed(() => {
  const n = Math.max(1, Number(convN.value) || 1);
  if (viterbiStep.value === 0) return [];
  return receivedBits.value.slice((viterbiStep.value - 1) * n, viterbiStep.value * n);
});

const displayInputBits = computed(() => {
  const flushBits = new Array(Math.max(0, config.value.v)).fill(0);
  return [...inputBits.value, ...flushBits];
});

const convReceivedInfo = computed<BitItem[]>(() =>
  receivedBits.value.map((bit) => ({
    value: bit,
    role: "data",
  }))
);

const convErrorIndices = computed(() =>
  receivedBits.value
    .map((bit, index) => (bit !== (encodedBits.value[index] ?? 0) ? index : -1))
    .filter((index) => index !== -1)
);

const formulaRows = computed(() => {
  const stepData = currentSimulationData.value;
  const registers = stepData?.registerStateBefore ?? new Array(config.value.v).fill(0);
  const inputBit = stepData?.inputBit ?? 0;
  const sourceBits = [inputBit, ...registers];
  const labels = [t("conv.encoderInput"), ...registers.map((_, idx) => t("conv.encoderMemory", { idx: idx + 1 }))];
  return config.value.generators.map((gen, index) => {
    const inputs: BitItem[] = gen.taps.map((tap) => ({
      value: sourceBits[tap] ?? 0,
      role: "data",
      label: labels[tap] || `M${tap}`,
    }));
    const result =
      stepData?.encodedBits?.[index] ??
      inputs.reduce((acc, bit) => acc ^ bit.value, 0);
    const output: BitItem[] = [{ value: result, role: "data", label: `v${index}` }];
    return { index, inputs, output };
  });
});
</script>
