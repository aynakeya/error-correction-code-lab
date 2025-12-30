<template>
  <section class="card rounded-t-none bg-white/90 shadow-xl">
    <div class="card-body gap-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end">
        <div class="w-full md:w-2/3">
          <BitInput
            v-model="hammingInput"
            :label="t('hamming.label', { size: normalizedBlockSize })"
          />
        </div>
        <div class="flex w-full flex-col gap-3 md:w-1/3">
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <p class="text-sm font-semibold text-slate-600">{{ t("hamming.layoutTitle") }}</p>
            <p class="text-xs text-slate-500">
              {{ t("hamming.layoutDesc", { positions: parityPositionsText }) }}
            </p>
            <div class="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <span>{{ t("hamming.dataPerBlock") }}</span>
              <input
                v-model.number="dataBitsPerBlock"
                type="number"
                min="1"
                max="32"
                class="input input-bordered input-xs w-16"
              />
              <span>{{ t("hamming.codeLength", { length: hammingLayout.totalLength }) }}</span>
            </div>
          </div>
          <div
            v-if="hammingEncodedBlocks.length > 1"
            class="rounded-2xl border border-base-200 bg-base-100 p-4"
          >
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <span class="font-semibold">{{ t("hamming.blockSelect") }}</span>
              <div class="join">
                <button
                  v-for="(_, index) in hammingEncodedBlocks"
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
                    show-index
                    :index-values="[row.position]"
                    hide-title
                    title=""
                    read-only
                  />
                  <span class="text-slate-500">=</span>
                  <template v-for="(input, idx) in row.inputs" :key="`parity-${row.position}-input-${idx}`">
                    <BitDisplay
                      :bits="[input]"
                      show-index
                      :index-values="[row.inputPositions[idx]]"
                      hide-title
                      title=""
                      read-only
                    />
                    <span v-if="idx < row.inputs.length - 1" class="text-slate-500">⊕</span>
                  </template>
                </div>
              </div>
            </div>
            <p class="mt-2 text-xs text-slate-500">{{ t("common.evenParityNote") }}</p>
          </div>

          <HammingGrid
            :title="t('common.encoded')"
            :description="t('hamming.encodedDesc', { length: hammingLayout.totalLength })"
            :positions="gridPositions"
            :labels="positionLabels"
            :parity-positions="hammingLayout.parityPositions"
            :bits="currentEncodedBlock"
          />
        </div>


        <div class="grid grid-cols-1 gap-6">
          <HammingGrid
            :title="t('common.received')"
            :description="t('hamming.gridDesc')"
            :positions="gridPositions"
            :labels="positionLabels"
            :parity-positions="hammingLayout.parityPositions"
            :bits="currentReceivedBlock"
            :compare-bits="currentEncodedBlock"
            :on-flip="(position) => toggleHammingPosition(selectedBlock, position)"
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
            </div>
          </div>

          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <p class="text-sm font-semibold text-slate-600">{{ t("common.syndromeDecode") }}</p>
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
            <div class="mt-4 text-sm text-slate-600">
              {{ t("hamming.syndromeLocation", { label: syndromeLabel }) }}
              <span class="font-mono text-slate-800">{{ syndromeBinary }}</span>
              {{ t("hamming.decimal", { value: hammingAnalysis.syndrome }) }}
            </div>
            <div
              class="mt-3 rounded border px-3 py-2 text-sm"
              :class="
                hammingAnalysis.syndrome === 0
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              "
            >
              <span v-if="hammingAnalysis.syndrome === 0">{{ t("hamming.syndromeOk") }}</span>
              <span v-else>
                {{ t("hamming.syndromeWarn", { position: hammingAnalysis.syndrome }) }}
              </span>
            </div>

            <div class="mt-4">
              <p class="text-sm font-semibold text-slate-600">{{ t("common.decodeResult") }}</p>
              <BitDisplay :title="t('common.output')" :bits="decodedStreamInfo" read-only />
              <div class="mt-3 text-sm">
                <span v-if="hammingErrorCount === 0" class="text-emerald-600 font-semibold">
                  {{ t("hamming.decodeCorrect") }}
                </span>
                <span v-else-if="hammingErrorCount === 1" class="text-amber-600 font-semibold">
                  {{ t("hamming.decodeFixed") }}
                </span>
                <span v-else class="text-rose-600 font-semibold">
                  {{ t("hamming.decodeMulti") }}
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
import { computed, ref, watch } from "vue";
import BitInput from "./BitInput.vue";
import BitDisplay, { BitItem } from "./BitDisplay.vue";
import HammingGrid from "./HammingGrid.vue";
import { padBits, toBits } from "../utils/bits";
import { buildHammingLayout, hammingDecode, hammingEncode } from "../utils/hamming";
import { useI18n } from "../i18n";

const hammingInput = ref("1011");
const dataBitsPerBlock = ref(4);
const { t } = useI18n();

const normalizedBlockSize = computed(() => {
  const value = Number.isFinite(dataBitsPerBlock.value) ? dataBitsPerBlock.value : 4;
  return Math.min(32, Math.max(1, Math.floor(value)));
});

const hammingLayout = computed(() => buildHammingLayout(normalizedBlockSize.value));

const hammingBlocks = computed(() => {
  const bits = toBits(hammingInput.value);
  const padded = padBits(bits, normalizedBlockSize.value);
  const blocks: number[][] = [];
  for (let i = 0; i < padded.bits.length; i += normalizedBlockSize.value) {
    blocks.push(padded.bits.slice(i, i + normalizedBlockSize.value));
  }
  return blocks;
});

const hammingEncodedBlocks = computed(() => hammingBlocks.value.map((block) => hammingEncode(block)));

const hammingReceived = ref<number[]>([]);
const selectedBlock = ref<number>(0);
watch(
  hammingEncodedBlocks,
  (value) => {
    hammingReceived.value = value.flat().map((bit) => bit);
    if (selectedBlock.value >= value.length) {
      selectedBlock.value = 0;
    }
  },
  { immediate: true }
);

const toggleHammingBit = (blockIndex: number, bitIndex: number) => {
  const flatIndex = blockIndex * hammingLayout.value.totalLength + bitIndex;
  if (flatIndex < 0 || flatIndex >= hammingReceived.value.length) return;
  hammingReceived.value[flatIndex] = hammingReceived.value[flatIndex] ? 0 : 1;
};

const toggleHammingPosition = (blockIndex: number, position: number) => {
  if (position <= 0) return;
  toggleHammingBit(blockIndex, position - 1);
};

const hammingReceivedBlocks = computed(() => {
  const blocks: number[][] = [];
  for (let i = 0; i < hammingReceived.value.length; i += hammingLayout.value.totalLength) {
    blocks.push(hammingReceived.value.slice(i, i + hammingLayout.value.totalLength));
  }
  return blocks;
});

const hammingDecoded = computed(() =>
  hammingReceivedBlocks.value.map((block) => hammingDecode(block))
);

const hammingDecodedStream = computed(() => hammingDecoded.value.flatMap((result) => result.dataBits));

const currentEncodedBlock = computed(() => hammingEncodedBlocks.value[selectedBlock.value] || []);
const currentReceivedBlock = computed(() => hammingReceivedBlocks.value[selectedBlock.value] || []);
const currentDataBlock = computed(
  () => hammingBlocks.value[selectedBlock.value] || Array(normalizedBlockSize.value).fill(0)
);

const positionLabels = computed(() => {
  const labels: Record<number, string> = {};
  hammingLayout.value.parityPositions.forEach((position) => {
    labels[position] = `P${position}`;
  });
  hammingLayout.value.dataPositions.forEach((position, index) => {
    labels[position] = `D${index + 1}`;
  });
  return labels;
});

const gridPositions = computed(() => [
  0,
  ...Array.from({ length: hammingLayout.value.totalLength }, (_, index) => index + 1),
]);

const dataIndexByPosition = computed(() => {
  const map = new Map<number, number>();
  hammingLayout.value.dataPositions.forEach((position, index) => {
    map.set(position, index);
  });
  return map;
});

const parityCalcRows = computed(() =>
  hammingLayout.value.parityPositions.map((parityPos) => {
    const inputPositions = hammingLayout.value.dataPositions.filter(
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


const hammingErrorCount = computed(
  () =>
    currentReceivedBlock.value.filter(
      (bit, index) => bit !== currentEncodedBlock.value[index]
    ).length
);

const getReceivedAt = (position: number) => currentReceivedBlock.value[position - 1] ?? 0;

const syndromeRows = computed(() =>
  hammingLayout.value.parityPositions.map((parityPos) => {
    const coverPositions = Array.from(
      { length: hammingLayout.value.totalLength },
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

const syndromeSummary = computed(() =>
  syndromeRows.value.map((row) => ({
    position: row.position,
    value: row.value,
    coverPositions: row.coverPositions,
  }))
);

const hammingAnalysis = computed(() => {
  const code = [...currentReceivedBlock.value];
  while (code.length < hammingLayout.value.totalLength) code.push(0);
  const syndromeBits = syndromeRows.value.map((row) => ({
    position: row.position,
    value: row.value,
  }));
  const syndrome = syndromeBits.reduce(
    (acc, bit) => acc + bit.value * bit.position,
    0
  );
  const corrected = [...code];
  let correctedIndex: number | null = null;
  if (syndrome > 0 && syndrome <= hammingLayout.value.totalLength) {
    corrected[syndrome - 1] = corrected[syndrome - 1] ? 0 : 1;
    correctedIndex = syndrome;
  }
  const dataBits = hammingLayout.value.dataPositions.map(
    (position) => corrected[position - 1] ?? 0
  );
  return { syndrome, correctedIndex, dataBits };
});

const decodedStreamInfo = computed<BitItem[]>(() =>
  hammingDecodedStream.value.map((bit, index) => ({
    value: bit,
    role: "data",
    label: `D${index + 1}`,
  }))
);

const syndromeOrder = computed(() =>
  [...hammingLayout.value.parityPositions].sort((a, b) => b - a)
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
  hammingLayout.value.parityPositions.join(", ")
);
</script>
