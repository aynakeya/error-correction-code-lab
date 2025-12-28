<template>
  <section class="card rounded-t-none bg-white/90 shadow-xl">
    <div class="card-body gap-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end">
        <div class="w-full md:w-2/3">
          <BitInput v-model="hammingInput" label="Input bits (4-bit blocks)" />
        </div>
        <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
          <p class="text-sm font-semibold text-slate-600">Layout</p>
          <p class="text-xs text-slate-500">Positions 1,2,4 are parity bits. Even parity.</p>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4 text-sm text-slate-600 leading-6">
            <p class="font-semibold text-slate-700">Parity Bit 计算</p>
            <div class="mt-3 flex flex-col gap-3 text-sm text-slate-600">
              <div class="flex flex-col gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <BitDisplay
                    :bits="parityP1Output"
                    show-index
                    :index-values="[1]"
                    hide-title
                    read-only
                  />
                  <span class="text-slate-500">=</span>
                  <BitDisplay :bits="dBits.d1" show-index :index-values="[3]" hide-title read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d2" show-index :index-values="[5]" hide-title read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d4" show-index :index-values="[7]" hide-title read-only />
                </div>
              </div>
              <div class="flex flex-col gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <BitDisplay
                    :bits="parityP2Output"
                    show-index
                    :index-values="[2]"
                    hide-title
                    read-only
                  />
                  <span class="text-slate-500">=</span>
                  <BitDisplay :bits="dBits.d1" show-index :index-values="[3]" hide-title read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d3" show-index :index-values="[6]" hide-title read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d4" show-index :index-values="[7]" hide-title read-only />
                </div>
              </div>
              <div class="flex flex-col gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <BitDisplay
                    :bits="parityP4Output"
                    show-index
                    :index-values="[4]"
                    hide-title
                    read-only
                  />
                  <span class="text-slate-500">=</span>
                  <BitDisplay :bits="dBits.d2" show-index :index-values="[5]" hide-title read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d3" show-index :index-values="[6]" hide-title read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d4" show-index :index-values="[7]" hide-title read-only />
                </div>
              </div>
            </div>
            <p class="mt-2 text-xs text-slate-500">偶校验：每组 XOR 的结果就是对应校验位。</p>
          </div>

          <div class="relative">
            <BitDisplay
              title="Encoded"
              :bits="hammingEncodedInfo"
              description="7-bit codeword"
              show-index
              :index-offset="1"
              read-only
            />
          </div>
        </div>

        <div v-if="hammingEncodedBlocks.length > 1" class="rounded-2xl border border-base-200 bg-base-100 p-4">
          <div class="flex items-center gap-3 text-sm text-slate-600">
            <span class="font-semibold">Block selector</span>
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

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div class="relative">
            <BitDisplay
              title="Received"
              :bits="hammingReceivedInfo"
              description="Click any bit to flip."
              :highlight-indices="hammingErrorIndices"
              show-index
              :index-offset="1"
              @bit-click="(index) => toggleHammingBit(selectedBlock, index)"
            />
          </div>

          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <p class="text-sm font-semibold text-slate-600">解码与伴随式 (Syndrome)</p>
            <div class="mt-3 grid gap-3 sm:grid-cols-3 text-center text-xs text-slate-500">
              <div class="rounded border border-base-200 bg-white/70 p-3">
                <div>S1 (1,3,5,7)</div>
                <div class="text-lg font-semibold text-slate-700">{{ hammingAnalysis.s1 }}</div>
              </div>
              <div class="rounded border border-base-200 bg-white/70 p-3">
                <div>S2 (2,3,6,7)</div>
                <div class="text-lg font-semibold text-slate-700">{{ hammingAnalysis.s2 }}</div>
              </div>
              <div class="rounded border border-base-200 bg-white/70 p-3">
                <div>S4 (4,5,6,7)</div>
                <div class="text-lg font-semibold text-slate-700">{{ hammingAnalysis.s4 }}</div>
              </div>
            </div>
            <div class="mt-4 text-sm text-slate-600">
              错误位置 (S4 S2 S1)₂:
              <span class="font-mono text-slate-800">
                {{ hammingAnalysis.s4 }}{{ hammingAnalysis.s2 }}{{ hammingAnalysis.s1 }}
              </span>
              binary = <span class="font-semibold text-slate-800">{{ hammingAnalysis.syndrome }}</span>
              decimal
            </div>
            <div
              class="mt-3 rounded border px-3 py-2 text-sm"
              :class="
                hammingAnalysis.syndrome === 0
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              "
            >
              <span v-if="hammingAnalysis.syndrome === 0">✅ 伴随式为 0，数据无误。</span>
              <span v-else>⚠️ 伴随式非 0，定位到第 {{ hammingAnalysis.syndrome }} 位。</span>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
          <p class="text-sm font-semibold text-slate-600">Decoded</p>
          <BitDisplay title="Output" :bits="decodedStreamInfo" read-only />
          <div class="mt-3 text-sm">
            <span v-if="hammingErrorCount === 0" class="text-emerald-600 font-semibold">
              解码正确
            </span>
            <span v-else-if="hammingErrorCount === 1" class="text-amber-600 font-semibold">
              修复成功
            </span>
            <span v-else class="text-rose-600 font-semibold">
              警告：你翻转了多个比特！标准汉明码只能纠正 1 位错误。当前修正结果可能是错误的（因为它会指向错误的单比特位置）。
            </span>
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
import { padBits, toBits } from "../utils/bits";
import { hammingDecode, hammingEncode } from "../utils/hamming";

const hammingInput = ref("1011");

const hammingBlocks = computed(() => {
  const bits = toBits(hammingInput.value);
  const padded = padBits(bits, 4);
  const blocks: number[][] = [];
  for (let i = 0; i < padded.bits.length; i += 4) {
    blocks.push(padded.bits.slice(i, i + 4));
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
  const flatIndex = blockIndex * 7 + bitIndex;
  if (flatIndex < 0 || flatIndex >= hammingReceived.value.length) return;
  hammingReceived.value[flatIndex] = hammingReceived.value[flatIndex] ? 0 : 1;
};

const hammingReceivedBlocks = computed(() => {
  const blocks: number[][] = [];
  for (let i = 0; i < hammingReceived.value.length; i += 7) {
    blocks.push(hammingReceived.value.slice(i, i + 7));
  }
  return blocks;
});

const hammingDecoded = computed(() =>
  hammingReceivedBlocks.value.map((block) => hammingDecode(block))
);

const hammingDecodedStream = computed(() => hammingDecoded.value.flatMap((result) => result.dataBits));

const hammingLabels: string[] = ["P1", "P2", "D1", "P4", "D2", "D3", "D4"];

const currentEncodedBlock = computed(() => hammingEncodedBlocks.value[selectedBlock.value] || []);
const currentReceivedBlock = computed(() => hammingReceivedBlocks.value[selectedBlock.value] || []);
const currentDataBlock = computed(() => hammingBlocks.value[selectedBlock.value] || [0, 0, 0, 0]);

const parityFormulas = computed(() => {
  const [d1, d2, d3, d4] = [...currentDataBlock.value, 0, 0, 0, 0].slice(0, 4);
  const p1 = d1 ^ d2 ^ d4;
  const p2 = d1 ^ d3 ^ d4;
  const p4 = d2 ^ d3 ^ d4;
  return {
    p1,
    p2,
    p4,
    p1Expr: `${d1} ⊕ ${d2} ⊕ ${d4}`,
    p2Expr: `${d1} ⊕ ${d3} ⊕ ${d4}`,
    p4Expr: `${d2} ⊕ ${d3} ⊕ ${d4}`,
  };
});

const parityP1Output = computed<BitItem[]>(() => [
  { value: parityFormulas.value.p1, role: "parity", label: "P1" },
]);
const parityP2Output = computed<BitItem[]>(() => [
  { value: parityFormulas.value.p2, role: "parity", label: "P2" },
]);
const parityP4Output = computed<BitItem[]>(() => [
  { value: parityFormulas.value.p4, role: "parity", label: "P4" },
]);

const dBits = computed(() => {
  const [d1, d2, d3, d4] = [...currentDataBlock.value, 0, 0, 0, 0].slice(0, 4);
  return {
    d1: [{ value: d1, role: "data", label: "D1" }],
    d2: [{ value: d2, role: "data", label: "D2" }],
    d3: [{ value: d3, role: "data", label: "D3" }],
    d4: [{ value: d4, role: "data", label: "D4" }],
  };
});


const hammingEncodedInfo = computed<BitItem[]>(() =>
  currentEncodedBlock.value.map((bit, index) => ({
    value: bit,
    role: hammingLabels[index].startsWith("P") ? "parity" : "data",
    label: hammingLabels[index],
  }))
);

const hammingReceivedInfo = computed<BitItem[]>(() =>
  currentReceivedBlock.value.map((bit, index) => ({
    value: bit,
    role: hammingLabels[index].startsWith("P") ? "parity" : "data",
    label: hammingLabels[index],
  }))
);

const hammingErrorIndices = computed(() =>
  currentReceivedBlock.value
    .map((bit, index) => (bit !== currentEncodedBlock.value[index] ? index : -1))
    .filter((index) => index !== -1)
);
const hammingErrorCount = computed(() => hammingErrorIndices.value.length);

const hammingAnalysis = computed(() => {
  const code = [...currentReceivedBlock.value];
  while (code.length < 7) code.push(0);
  const s1 = code[0] ^ code[2] ^ code[4] ^ code[6];
  const s2 = code[1] ^ code[2] ^ code[5] ^ code[6];
  const s4 = code[3] ^ code[4] ^ code[5] ^ code[6];
  const syndrome = s1 + s2 * 2 + s4 * 4;
  const corrected = [...code];
  let correctedIndex: number | null = null;
  if (syndrome > 0 && syndrome <= 7) {
    corrected[syndrome - 1] = corrected[syndrome - 1] ? 0 : 1;
    correctedIndex = syndrome;
  }
  const dataBits = [corrected[2], corrected[4], corrected[5], corrected[6]];
  return { s1, s2, s4, syndrome, correctedIndex, dataBits };
});

const hammingDecodedInfo = computed<BitItem[]>(() =>
  hammingAnalysis.value.dataBits.map((bit, bitIndex) => ({
    value: bit,
    role: "data",
    label: `D${bitIndex + 1}`,
  }))
);

const decodedStreamInfo = computed<BitItem[]>(() =>
  hammingDecodedStream.value.map((bit, index) => ({
    value: bit,
    role: "data",
    label: `D${index + 1}`,
  }))
);
</script>
