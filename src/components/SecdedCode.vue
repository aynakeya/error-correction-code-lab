<template>
  <section class="card rounded-t-none bg-white/90 shadow-xl">
    <div class="card-body gap-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end">
        <div class="w-full md:w-2/3">
          <BitInput v-model="secdedInput" label="输入比特（每 4 位一组）" />
        </div>
        <div class="flex w-full flex-col gap-3 md:w-1/3">
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
            <p class="text-sm font-semibold text-slate-600">布局说明</p>
            <p class="text-xs text-slate-500">汉明(7,4) + 总体校验位。</p>
          </div>
          <div
            v-if="secdedEncodedBlocks.length > 1"
            class="rounded-2xl border border-base-200 bg-base-100 p-4"
          >
            <div class="flex items-center gap-3 text-sm text-slate-600">
              <span class="font-semibold">分组选择</span>
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
            <p class="font-semibold text-slate-700">校验位计算</p>
            <div class="mt-3 flex flex-col gap-3 text-sm text-slate-600">
              <div class="flex flex-col gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <BitDisplay :bits="parityP1Output" hide-title show-index :index-values="[1]" read-only />
                  <span class="text-slate-500">=</span>
                  <BitDisplay :bits="dBits.d1" hide-title show-index :index-values="[3]" read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d2" hide-title show-index :index-values="[5]" read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d4" hide-title show-index :index-values="[7]" read-only />
                </div>
              </div>
              <div class="flex flex-col gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <BitDisplay :bits="parityP2Output" hide-title show-index :index-values="[2]" read-only />
                  <span class="text-slate-500">=</span>
                  <BitDisplay :bits="dBits.d1" hide-title show-index :index-values="[3]" read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d3" hide-title show-index :index-values="[6]" read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d4" hide-title show-index :index-values="[7]" read-only />
                </div>
              </div>
              <div class="flex flex-col gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <BitDisplay :bits="parityP4Output" hide-title show-index :index-values="[4]" read-only />
                  <span class="text-slate-500">=</span>
                  <BitDisplay :bits="dBits.d2" hide-title show-index :index-values="[5]" read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d3" hide-title show-index :index-values="[6]" read-only />
                  <span class="text-slate-500">⊕</span>
                  <BitDisplay :bits="dBits.d4" hide-title show-index :index-values="[7]" read-only />
                </div>
              </div>
              <div class="flex flex-col gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <div class="flex flex-wrap items-center gap-2">
                  <BitDisplay :bits="parityP8Output" hide-title show-index :index-values="[8]" read-only />
                  <span class="text-slate-500">=</span>
                  <BitDisplay :bits="overallInputs" hide-title show-index :index-values="[1,2,3,4,5,6,7]" read-only />
                </div>
              </div>
            </div>
            <p class="mt-2 text-xs text-slate-500">偶校验：每组 XOR 的结果就是对应校验位。</p>
          </div>

          <HammingGrid
            title="发送端编码"
            description="8 位 SEC-DED"
            mode="secded"
            :bits="currentEncodedBlock"
          />
        </div>

        <div class="grid grid-cols-1 gap-6">
          <HammingGrid
            title="接收端"
            description="点击比特翻转，悬停查看覆盖关系。"
            mode="secded"
            :bits="currentReceivedBlock"
            :on-flip="(position) => toggleSecdedPosition(selectedBlock, position)"
          />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div class="rounded-2xl border border-base-200 bg-base-100 p-4 text-sm text-slate-600">
            <p class="text-sm font-semibold text-slate-600">伴随式计算</p>
            <div class="mt-3 flex flex-col gap-3">
              <div class="flex flex-wrap items-center gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <BitDisplay :bits="s1Output" hide-title show-index :index-values="[1]" read-only />
                <span class="text-slate-500">=</span>
                <BitDisplay :bits="s1Inputs" hide-title show-index :index-values="[1, 3, 5, 7]" read-only />
              </div>
              <div class="flex flex-wrap items-center gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <BitDisplay :bits="s2Output" hide-title show-index :index-values="[2]" read-only />
                <span class="text-slate-500">=</span>
                <BitDisplay :bits="s2Inputs" hide-title show-index :index-values="[2, 3, 6, 7]" read-only />
              </div>
              <div class="flex flex-wrap items-center gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <BitDisplay :bits="s3Output" hide-title show-index :index-values="[4]" read-only />
                <span class="text-slate-500">=</span>
                <BitDisplay :bits="s3Inputs" hide-title show-index :index-values="[4, 5, 6, 7]" read-only />
              </div>
              <div class="flex flex-wrap items-center gap-2 rounded border border-base-200 bg-white/70 px-3 py-2">
                <BitDisplay :bits="overallOutput" hide-title show-index :index-values="[8]" read-only />
                <span class="text-slate-500">=</span>
                <BitDisplay :bits="overallReceivedInputs" hide-title show-index :index-values="[1,2,3,4,5,6,7,8]" read-only />
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-200 bg-base-100 p-4 flex flex-col gap-4">
            <p class="text-sm font-semibold text-slate-600">解码与伴随式</p>
            <div class="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div class="rounded border border-base-200 bg-white/70 p-2 text-center">
                总体校验
                <div
                  class="text-base font-semibold"
                  :class="secdedAnalysis.parityError ? 'text-rose-600' : 'text-emerald-600'"
                >
                  {{ secdedAnalysis.parityError ? "失败" : "通过" }}
                </div>
              </div>
              <div class="rounded border border-base-200 bg-white/70 p-2 text-center">
                伴随式
                <div class="text-base font-semibold text-slate-700">
                  {{ secdedAnalysis.syndrome }}
                </div>
              </div>
            </div>
            <div class="text-sm text-slate-600">
              错误位置 (S4 S2 S1)₂:
              <span class="font-mono text-slate-800">
                {{ secdedAnalysis.s4 }}{{ secdedAnalysis.s2 }}{{ secdedAnalysis.s1 }}
              </span>
              十进制 = <span class="font-semibold text-slate-800">{{ secdedAnalysis.syndrome }}</span>
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
                ✅ 伴随式为 0，数据无误。
              </span>
              <span v-else-if="secdedAnalysis.syndrome !== 0 && secdedAnalysis.parityError">
                ✅ 检测到单比特错误，已定位到第 {{ secdedAnalysis.syndrome }} 位。
              </span>
              <span v-else-if="secdedAnalysis.syndrome === 0 && secdedAnalysis.parityError">
                ⚠️ 总体校验错误，疑似 P8 位出错。
              </span>
              <span v-else>
                ❌ 检测到双比特错误，无法纠正。
              </span>
            </div>
            <div class="text-xs text-slate-500">
              状态：
              <span class="font-semibold" :class="secdedAnalysis.statusClass">
                {{ secdedAnalysis.status }}
              </span>
            </div>
            <BitDisplay title="解码结果" :bits="secdedDecodedInfo" read-only />
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
import { secdedDecode, secdedEncode } from "../utils/hamming";

const secdedInput = ref("1011");

const secdedBlocks = computed(() => {
  const bits = toBits(secdedInput.value);
  const padded = padBits(bits, 4);
  const blocks: number[][] = [];
  for (let i = 0; i < padded.bits.length; i += 4) {
    blocks.push(padded.bits.slice(i, i + 4));
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
  const flatIndex = blockIndex * 8 + bitIndex;
  if (flatIndex < 0 || flatIndex >= secdedReceived.value.length) return;
  secdedReceived.value[flatIndex] = secdedReceived.value[flatIndex] ? 0 : 1;
};

const toggleSecdedPosition = (blockIndex: number, position: number) => {
  if (position <= 0) return;
  const bitIndex = position === 8 ? 7 : position - 1;
  toggleSecdedBit(blockIndex, bitIndex);
};

const secdedReceivedBlocks = computed(() => {
  const blocks: number[][] = [];
  for (let i = 0; i < secdedReceived.value.length; i += 8) {
    blocks.push(secdedReceived.value.slice(i, i + 8));
  }
  return blocks;
});

const secdedDecoded = computed(() =>
  secdedReceivedBlocks.value.map((block) => secdedDecode(block))
);

const secdedLabels: string[] = ["P1", "P2", "D1", "P4", "D2", "D3", "D4", "P8"];

const currentEncodedBlock = computed(() => secdedEncodedBlocks.value[selectedBlock.value] || []);
const currentReceivedBlock = computed(() => secdedReceivedBlocks.value[selectedBlock.value] || []);
const currentDataBlock = computed(() => secdedBlocks.value[selectedBlock.value] || [0, 0, 0, 0]);

const secdedAnalysis = computed(() => {
  const code = [...currentReceivedBlock.value];
  while (code.length < 8) code.push(0);
  const core = code.slice(0, 7);
  const parityBit = code[7];
  const s1 = core[0] ^ core[2] ^ core[4] ^ core[6];
  const s2 = core[1] ^ core[2] ^ core[5] ^ core[6];
  const s4 = core[3] ^ core[4] ^ core[5] ^ core[6];
  const syndrome = s1 + s2 * 2 + s4 * 4;
  const overall = (core.reduce((sum, bit) => sum + bit, 0) + parityBit) % 2;
  const parityError = overall !== 0;

  let status = "未检测到错误";
  let statusClass = "text-emerald-600";
  if (syndrome === 0 && parityError) {
    status = "总体校验位出错";
    statusClass = "text-amber-600";
  } else if (syndrome !== 0 && parityError) {
    status = `单比特纠正，位置 ${syndrome}`;
    statusClass = "text-emerald-600";
  } else if (syndrome !== 0 && !parityError) {
    status = "检测到双比特错误（不可纠正）";
    statusClass = "text-rose-600";
  }
  return { syndrome, parityError, status, statusClass, s1, s2, s4 };
});

const secdedDecodedInfo = computed<BitItem[]>(() =>
  (secdedDecoded.value[selectedBlock.value]?.dataBits || []).map((bit, index) => ({
    value: bit,
    role: "data",
    label: `D${index + 1}`,
  }))
);

const parityFormulas = computed(() => {
  const [d1, d2, d3, d4] = [...currentDataBlock.value, 0, 0, 0, 0].slice(0, 4);
  const p1 = d1 ^ d2 ^ d4;
  const p2 = d1 ^ d3 ^ d4;
  const p4 = d2 ^ d3 ^ d4;
  const p8 = (p1 ^ p2 ^ p4 ^ d1 ^ d2 ^ d3 ^ d4) & 1;
  return { p1, p2, p4, p8 };
});

const parityP1Output = computed<BitItem[]>(() => [{ value: parityFormulas.value.p1, role: "parity", label: "P1" }]);
const parityP2Output = computed<BitItem[]>(() => [{ value: parityFormulas.value.p2, role: "parity", label: "P2" }]);
const parityP4Output = computed<BitItem[]>(() => [{ value: parityFormulas.value.p4, role: "parity", label: "P4" }]);
const parityP8Output = computed<BitItem[]>(() => [{ value: parityFormulas.value.p8, role: "parity", label: "P8" }]);

const dBits = computed(() => {
  const [d1, d2, d3, d4] = [...currentDataBlock.value, 0, 0, 0, 0].slice(0, 4);
  return {
    d1: [{ value: d1, role: "data", label: "D1" }],
    d2: [{ value: d2, role: "data", label: "D2" }],
    d3: [{ value: d3, role: "data", label: "D3" }],
    d4: [{ value: d4, role: "data", label: "D4" }],
  };
});

const overallInputs = computed<BitItem[]>(() => {
  const block = currentEncodedBlock.value.slice(0, 7);
  return block.map((bit, index) => ({
    value: bit,
    role: secdedLabels[index].startsWith("P") ? "parity" : "data",
    label: secdedLabels[index],
  }));
});

const overallOutput = computed<BitItem[]>(() => {
  const sum = currentReceivedBlock.value.reduce((acc, bit) => acc + bit, 0);
  const overallParity = sum % 2;
  return [{ value: overallParity, role: "parity", label: "P8" }];
});
const overallReceivedInputs = computed<BitItem[]>(() =>
  currentReceivedBlock.value.map((bit, index) => ({
    value: bit,
    role: secdedLabels[index].startsWith("P") ? "parity" : "data",
    label: secdedLabels[index],
  }))
);

const getReceivedAt = (position: number) => currentReceivedBlock.value[position - 1] ?? 0;
const s1 = computed(() => getReceivedAt(1) ^ getReceivedAt(3) ^ getReceivedAt(5) ^ getReceivedAt(7));
const s2 = computed(() => getReceivedAt(2) ^ getReceivedAt(3) ^ getReceivedAt(6) ^ getReceivedAt(7));
const s3 = computed(() => getReceivedAt(4) ^ getReceivedAt(5) ^ getReceivedAt(6) ^ getReceivedAt(7));
const s1Output = computed<BitItem[]>(() => [{ value: s1.value, role: "parity", label: "S1" }]);
const s2Output = computed<BitItem[]>(() => [{ value: s2.value, role: "parity", label: "S2" }]);
const s3Output = computed<BitItem[]>(() => [{ value: s3.value, role: "parity", label: "S3" }]);

const labelForPosition = (position: number) => secdedLabels[position - 1] || `P${position}`;
const roleForPosition = (position: number) =>
  labelForPosition(position).startsWith("P") ? "parity" : "data";

const s1Inputs = computed<BitItem[]>(() => [
  { value: getReceivedAt(1), role: roleForPosition(1), label: labelForPosition(1) },
  { value: getReceivedAt(3), role: roleForPosition(3), label: labelForPosition(3) },
  { value: getReceivedAt(5), role: roleForPosition(5), label: labelForPosition(5) },
  { value: getReceivedAt(7), role: roleForPosition(7), label: labelForPosition(7) },
]);
const s2Inputs = computed<BitItem[]>(() => [
  { value: getReceivedAt(2), role: roleForPosition(2), label: labelForPosition(2) },
  { value: getReceivedAt(3), role: roleForPosition(3), label: labelForPosition(3) },
  { value: getReceivedAt(6), role: roleForPosition(6), label: labelForPosition(6) },
  { value: getReceivedAt(7), role: roleForPosition(7), label: labelForPosition(7) },
]);
const s3Inputs = computed<BitItem[]>(() => [
  { value: getReceivedAt(4), role: roleForPosition(4), label: labelForPosition(4) },
  { value: getReceivedAt(5), role: roleForPosition(5), label: labelForPosition(5) },
  { value: getReceivedAt(6), role: roleForPosition(6), label: labelForPosition(6) },
  { value: getReceivedAt(7), role: roleForPosition(7), label: labelForPosition(7) },
]);
</script>
