<template>
  <section class="card rounded-t-none bg-white/90 shadow-xl">
    <div class="card-body gap-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end">
        <div class="w-full md:w-2/3">
          <BitInput
            v-model="secdedInput"
            :label="t('secded.label', { size: normalizedBlockSize })"
          />
        </div>
        <div class="flex w-full flex-col gap-3 md:w-1/3">
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <p class="text-sm font-semibold text-slate-600">{{ t("secded.layoutTitle") }}</p>
            <p class="text-xs text-slate-500">
              {{ t("secded.layoutDesc", { positions: parityPositionsText }) }}
            </p>
            <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>{{ t("secded.dataPerBlock") }}</span>
              <input
                v-model.number="dataBitsPerBlock"
                type="number"
                min="1"
                max="32"
                class="input input-bordered input-xs w-16"
              />
              <span>{{ t("secded.codeLength", { length: secdedLayout.totalLength + 1 }) }}</span>
            </div>
          </div>
          <div
            v-if="secdedEncodedBlocks.length > 1"
            class="rounded-2xl border border-base-200 bg-base-100 p-4"
          >
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <span class="font-semibold">{{ t("secded.blockSelect") }}</span>
              <div class="join">
                <button
                  v-for="(_, index) in secdedEncodedBlocks"
                  :key="`block-${index}`"
                  class="btn btn-xs join-item"
                  :class="selectedBlock === index ? 'btn-primary' : 'btn-ghost'"
                  @click="selectedBlock = index"
                >
                  {{ index + 1 }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-6">

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4 text-sm text-slate-600 leading-6">
            <p class="font-semibold text-slate-700">{{ t("common.parityCalc") }}</p>
            <div class="mt-3 flex flex-col gap-3 text-sm text-slate-600">
              <div
                v-for="row in parityCalcRows"
                :key="`parity-${row.position}`"
                class="flex flex-col gap-2 rounded border border-base-200 bg-white/70 px-3 py-2"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <BitDisplay
                    :bits="row.output"
                    hide-title
                    show-index
                    :index-values="[row.position]"
                    title=""
                    read-only
                  />
                  <span class="text-slate-500">=</span>
                  <template v-for="(input, idx) in row.inputs" :key="`parity-${row.position}-input-${idx}`">
                    <BitDisplay
                      :bits="[input]"
                      hide-title
                      show-index
                      :index-values="[row.inputPositions[idx]]"
                      title=""
                      read-only
                    />
                    <span v-if="idx < row.inputs.length - 1" class="text-slate-500">⊕</span>
                  </template>
                </div>
              </div>
              <div class="flex flex-col gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <BitDisplay
                    :bits="overallParityRow.output"
                    hide-title
                    show-index
                    :index-values="[0]"
                    read-only
                  />
                  <span class="text-slate-500">=</span>
                  <template v-for="(input, idx) in overallParityRow.inputs" :key="`overall-input-${idx}`">
                    <BitDisplay
                      :bits="[input]"
                      hide-title
                      show-index
                      :index-values="[overallParityRow.inputPositions[idx]]"
                      read-only
                    />
                    <span v-if="idx < overallParityRow.inputs.length - 1" class="text-slate-500">⊕</span>
                  </template>
                </div>
              </div>
            </div>
            <p class="mt-2 text-xs text-slate-500">{{ t("common.evenParityNote") }}</p>
          </div>

          <HammingGrid
            :title="t('common.encoded')"
            :description="t('secded.encodedDesc', { length: secdedLayout.totalLength + 1 })"
            :positions="gridPositions"
            :labels="positionLabels"
            :parity-positions="secdedLayout.parityPositions"
            :overall-position="0"
            :bits="currentEncodedBlock"
          />
        </div>

        <div class="grid grid-cols-1 gap-6">
          <HammingGrid
            :title="t('common.received')"
            :description="t('hamming.gridDesc')"
            :positions="gridPositions"
            :labels="positionLabels"
            :parity-positions="secdedLayout.parityPositions"
            :overall-position="0"
            :bits="currentReceivedBlock"
            :compare-bits="currentEncodedBlock"
            :on-flip="(position) => toggleSecdedPosition(selectedBlock, position)"
          />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4 text-sm text-slate-600">
            <p class="text-sm font-semibold text-slate-600">{{ t("common.syndromeCalc") }}</p>
            <div class="mt-3 flex flex-col gap-3">
              <div
                v-for="row in syndromeRows"
                :key="`syndrome-${row.position}`"
                class="flex flex-wrap items-center gap-2 rounded border border-base-200 bg-white/70 px-3 py-2"
              >
                <BitDisplay :bits="row.output" hide-title show-index :index-values="[row.position]" title="" read-only />
                <span class="text-slate-500">=</span>
                <template v-for="(input, idx) in row.inputs" :key="`syndrome-${row.position}-input-${idx}`">
                  <BitDisplay
                    :bits="[input]"
                    hide-title
                    show-index
                    :index-values="[row.inputPositions[idx]]"
                    title=""
                    read-only
                  />
                  <span v-if="idx < row.inputs.length - 1" class="text-slate-500">⊕</span>
                </template>
              </div>
              <div class="flex flex-wrap items-center gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <BitDisplay :bits="overallSyndromeRow.output" hide-title show-index :index-values="[0]" title="" read-only />
                <span class="text-slate-500">=</span>
                <template v-for="(input, idx) in overallSyndromeRow.inputs" :key="`overall-s-${idx}`">
                  <BitDisplay
                    :bits="[input]"
                    hide-title
                    show-index
                    :index-values="[overallSyndromeRow.inputPositions[idx]]"
                    title=""
                    read-only
                  />
                  <span v-if="idx < overallSyndromeRow.inputs.length - 1" class="text-slate-500">⊕</span>
                </template>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-200 bg-base-100 p-4 flex flex-col gap-4">
            <p class="text-sm font-semibold text-slate-600">{{ t("common.syndromeDecode") }}</p>
            <div class="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div class="rounded border border-base-200 bg-white/70 p-2 text-center">
                {{ t("secded.parityOverall") }}
                <div
                  class="text-base font-semibold"
                  :class="secdedAnalysis.parityError ? 'text-rose-600' : 'text-emerald-600'"
                >
                  {{ secdedAnalysis.parityError ? t("common.fail") : t("common.pass") }}
                </div>
              </div>
              <div class="rounded border border-base-200 bg-white/70 p-2 text-center">
                {{ t("secded.syndrome") }}
                <div class="text-base font-semibold text-slate-700">
                  {{ secdedAnalysis.syndrome }}
                </div>
              </div>
            </div>
            <div class="mt-3 grid gap-3 text-center text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
              <div
                v-for="row in syndromeSummary"
                :key="`summary-${row.position}`"
                class="rounded border border-base-200 bg-white/70 p-3"
              >
                <div>S{{ row.position }} ({{ row.coverPositions.join(",") }})</div>
                <div class="text-lg font-semibold text-slate-700">{{ row.value }}</div>
              </div>
            </div>
            <div class="text-sm text-slate-600">
              {{ t("secded.syndromeLocation", { label: syndromeLabel }) }}
              <span class="font-mono text-slate-800">{{ syndromeBinary }}</span>
              {{ t("hamming.decimal", { value: secdedAnalysis.syndrome }) }}
            </div>
            <div
              class="rounded border px-3 py-2 text-sm"
              :class="
                secdedAnalysis.syndrome === 0 && !secdedAnalysis.parityError
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : secdedAnalysis.syndrome !== 0 && secdedAnalysis.parityError
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : secdedAnalysis.syndrome === 0 && secdedAnalysis.parityError
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              "
            >
              <span v-if="secdedAnalysis.syndrome === 0 && !secdedAnalysis.parityError">
                {{ t("secded.syndromeOk") }}
              </span>
              <span v-else-if="secdedAnalysis.syndrome !== 0 && secdedAnalysis.parityError">
                {{ t("secded.syndromeSingle", { position: secdedAnalysis.syndrome }) }}
              </span>
              <span v-else-if="secdedAnalysis.syndrome === 0 && secdedAnalysis.parityError">
                {{ t("secded.syndromeOverall") }}
              </span>
              <span v-else>
                {{ t("secded.syndromeDouble") }}
              </span>
            </div>
            <div class="text-xs text-slate-500">
              {{ t("common.status") }}
              <span class="font-semibold" :class="secdedAnalysis.statusClass">
                {{ t(secdedAnalysis.statusKey, secdedAnalysis.statusParams) }}
              </span>
            </div>
            <BitDisplay :title="t('common.decodeResult')" :bits="secdedDecodedInfo" read-only />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import BitInput from "./BitInput.vue";
import BitDisplay, { BitItem } from "./BitDisplay.vue";
import HammingGrid from "./HammingGrid.vue";
import { padBits, toBits } from "../utils/bits";
import { buildHammingLayout, secdedDecode, secdedEncode } from "../utils/hamming";
import { useI18n } from "../i18n";

const secdedInput = ref("1011");
const dataBitsPerBlock = ref(4);
const { t } = useI18n();

const normalizedBlockSize = computed(() => {
  const value = Number.isFinite(dataBitsPerBlock.value) ? dataBitsPerBlock.value : 4;
  return Math.min(32, Math.max(1, Math.floor(value)));
});

const secdedLayout = computed(() => buildHammingLayout(normalizedBlockSize.value));

const secdedBlocks = computed(() => {
  const bits = toBits(secdedInput.value);
  const padded = padBits(bits, normalizedBlockSize.value);
  const blocks: number[][] = [];
  for (let i = 0; i < padded.bits.length; i += normalizedBlockSize.value) {
    blocks.push(padded.bits.slice(i, i + normalizedBlockSize.value));
  }
  return blocks;
});

const secdedEncodedBlocks = computed(() =>
  secdedBlocks.value.map((block) => secdedEncode(block))
);

const secdedReceived = ref<number[]>([]);
const selectedBlock = ref<number>(0);
watch(
  secdedEncodedBlocks,
  (value) => {
    secdedReceived.value = value.flat().map((bit) => bit);
    if (selectedBlock.value >= value.length) {
      selectedBlock.value = 0;
    }
  },
  { immediate: true }
);

const toggleSecdedBit = (blockIndex: number, bitIndex: number) => {
  const flatIndex = blockIndex * (secdedLayout.value.totalLength + 1) + bitIndex;
  if (flatIndex < 0 || flatIndex >= secdedReceived.value.length) return;
  secdedReceived.value[flatIndex] = secdedReceived.value[flatIndex] ? 0 : 1;
};

const toggleSecdedPosition = (blockIndex: number, position: number) => {
  if (position < 0) return;
  const bitIndex = position === 0 ? secdedLayout.value.totalLength : position - 1;
  toggleSecdedBit(blockIndex, bitIndex);
};

const secdedReceivedBlocks = computed(() => {
  const blocks: number[][] = [];
  const blockLength = secdedLayout.value.totalLength + 1;
  for (let i = 0; i < secdedReceived.value.length; i += blockLength) {
    blocks.push(secdedReceived.value.slice(i, i + blockLength));
  }
  return blocks;
});

const secdedDecoded = computed(() =>
  secdedReceivedBlocks.value.map((block) => secdedDecode(block))
);

const currentEncodedBlock = computed(() => secdedEncodedBlocks.value[selectedBlock.value] || []);
const currentReceivedBlock = computed(() => secdedReceivedBlocks.value[selectedBlock.value] || []);
const currentDataBlock = computed(
  () => secdedBlocks.value[selectedBlock.value] || Array(normalizedBlockSize.value).fill(0)
);

const positionLabels = computed(() => {
  const labels: Record<number, string> = {};
  secdedLayout.value.parityPositions.forEach((position) => {
    labels[position] = `P${position}`;
  });
  secdedLayout.value.dataPositions.forEach((position, index) => {
    labels[position] = `D${index + 1}`;
  });
  labels[0] = "P0";
  return labels;
});

const gridPositions = computed(() => [
  0,
  ...Array.from({ length: secdedLayout.value.totalLength }, (_, index) => index + 1),
]);

const dataIndexByPosition = computed(() => {
  const map = new Map<number, number>();
  secdedLayout.value.dataPositions.forEach((position, index) => {
    map.set(position, index);
  });
  return map;
});

const secdedAnalysis = computed(() => {
  const decoded = secdedDecode(currentReceivedBlock.value);
  return {
    syndrome: decoded.syndrome,
    parityError: decoded.parityError,
    statusKey: decoded.statusKey,
    statusParams: decoded.statusParams,
    statusClass: decoded.statusClass,
  };
});

const secdedDecodedInfo = computed<BitItem[]>(() =>
  (secdedDecoded.value[selectedBlock.value]?.dataBits || []).map((bit, index) => ({
    value: bit,
    role: "data",
    label: `D${index + 1}`,
  }))
);

const parityCalcRows = computed(() =>
  secdedLayout.value.parityPositions.map((parityPos) => {
    const inputPositions = secdedLayout.value.dataPositions.filter(
      (position) => position & parityPos
    );
    const inputs = inputPositions.map((position) => {
      const dataIndex = dataIndexByPosition.value.get(position) ?? 0;
      return {
        value: currentDataBlock.value[dataIndex] ?? 0,
        role: "data" as const,
        label: `D${dataIndex + 1}`,
      };
    });
    const outputValue = currentEncodedBlock.value[parityPos - 1] ?? 0;
    return {
      position: parityPos,
      output: [{ value: outputValue, role: "parity" as const, label: `P${parityPos}` }],
      inputs,
      inputPositions,
    };
  })
);

const overallParityRow = computed(() => {
  const inputPositions = Array.from(
    { length: secdedLayout.value.totalLength },
    (_, index) => index + 1
  );
  const inputs = inputPositions.map((position) => ({
    value: currentEncodedBlock.value[position - 1] ?? 0,
    role: positionLabels.value[position]?.startsWith("P") ? "parity" : "data",
    label: positionLabels.value[position] || `B${position}`,
  }));
  const overallValue = currentEncodedBlock.value[currentEncodedBlock.value.length - 1] ?? 0;
  return {
    output: [{ value: overallValue, role: "parity" as const, label: "P0" }],
    inputs,
    inputPositions,
  };
});

const getReceivedAt = (position: number) => currentReceivedBlock.value[position - 1] ?? 0;

const syndromeRows = computed(() =>
  secdedLayout.value.parityPositions.map((parityPos) => {
    const coverPositions = Array.from(
      { length: secdedLayout.value.totalLength },
      (_, index) => index + 1
    ).filter((position) => position & parityPos);
    const inputs = coverPositions.map((position) => ({
      value: getReceivedAt(position),
      role: positionLabels.value[position]?.startsWith("P") ? "parity" : "data",
      label: positionLabels.value[position] || `B${position}`,
    }));
    const syndromeValue = coverPositions.reduce(
      (acc, position) => acc ^ getReceivedAt(position),
      0
    );
    return {
      position: parityPos,
      output: [{ value: syndromeValue, role: "parity" as const, label: `S${parityPos}` }],
      inputs,
      inputPositions: coverPositions,
      coverPositions,
      value: syndromeValue,
    };
  })
);

const overallSyndromeRow = computed(() => {
  const inputPositions = [0, ...Array.from({ length: secdedLayout.value.totalLength }, (_, index) => index + 1)];
  const inputs = inputPositions.map((position) => ({
    value:
      position === 0
        ? currentReceivedBlock.value[currentReceivedBlock.value.length - 1] ?? 0
        : getReceivedAt(position),
    role: position === 0 ? "parity" : positionLabels.value[position]?.startsWith("P") ? "parity" : "data",
    label: position === 0 ? "P0" : positionLabels.value[position] || `B${position}`,
  }));
  const overallValue = inputs.reduce((acc, bit) => acc ^ bit.value, 0);
  return {
    output: [{ value: overallValue, role: "parity" as const, label: "S0" }],
    inputs,
    inputPositions,
  };
});

const syndromeSummary = computed(() =>
  syndromeRows.value.map((row) => ({
    position: row.position,
    value: row.value,
    coverPositions: row.coverPositions,
  }))
);

const syndromeOrder = computed(() =>
  [...secdedLayout.value.parityPositions].sort((a, b) => b - a)
);

const syndromeBinary = computed(() =>
  syndromeOrder.value
    .map(
      (position) =>
        syndromeRows.value.find((row) => row.position === position)?.value ?? 0
    )
    .join("")
);

const syndromeLabel = computed(() =>
  syndromeOrder.value.map((position) => `S${position}`).join(" ")
);

const parityPositionsText = computed(() =>
  secdedLayout.value.parityPositions.join(", ")
);
</script>
