<template>
  <section class="card rounded-t-none bg-white/90 shadow-xl">
    <div class="card-body gap-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end">
        <div class="w-full md:w-2/3">
          <BitInput v-model="secdedInput" label="Input bits (4-bit blocks)" />
        </div>
        <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
          <p class="text-sm font-semibold text-slate-600">Layout</p>
          <p class="text-xs text-slate-500">Hamming(7,4) plus overall parity bit.</p>
        </div>
      </div>

      <div class="flex flex-col gap-6">
        <div v-if="secdedEncodedBlocks.length > 1" class="rounded-2xl border border-base-200 bg-base-100 p-4">
          <div class="flex items-center gap-3 text-sm text-slate-600">
            <span class="font-semibold">Block selector</span>
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

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div class="relative">
            <BitDisplay
              title="Encoded"
              :bits="secdedEncodedInfo"
              description="8-bit SEC-DED"
              show-index
              :index-offset="1"
              read-only
            />
            <div class="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 text-slate-300">
              →
            </div>
          </div>

          <div class="relative">
            <BitDisplay
              title="Received"
              :bits="secdedReceivedInfo"
              description="Click to flip bits"
              :highlight-indices="secdedErrorIndices"
              show-index
              :index-offset="1"
              @bit-click="(index) => toggleSecdedBit(selectedBlock, index)"
            />
            <div class="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 text-slate-300">
              →
            </div>
          </div>

          <div class="rounded-2xl border border-base-200 bg-base-100 p-4 flex flex-col gap-3">
            <p class="text-sm font-semibold text-slate-600">Decode summary</p>
            <div class="grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div class="rounded border border-base-200 bg-white/70 p-2 text-center">
                Overall Parity
                <div class="text-base font-semibold text-slate-700">
                  {{ secdedAnalysis.parityError ? "FAIL" : "PASS" }}
                </div>
              </div>
              <div class="rounded border border-base-200 bg-white/70 p-2 text-center">
                Syndrome
                <div class="text-base font-semibold text-slate-700">
                  {{ secdedAnalysis.syndrome }}
                </div>
              </div>
            </div>
            <div class="text-xs text-slate-500">
              Status:
              <span class="font-semibold" :class="secdedAnalysis.statusClass">
                {{ secdedAnalysis.status }}
              </span>
            </div>
            <BitDisplay title="Decoded" :bits="secdedDecodedInfo" read-only />
          </div>
        </div>
        <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
          <p class="text-sm font-semibold text-slate-600">Decoded stream</p>
          <BitDisplay title="Output" :bits="secdedStreamInfo" read-only />
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
import { secdedDecode, secdedEncode } from "../utils/hamming";

const secdedInput = ref("10110011");

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

const secdedDecodedStream = computed(() =>
  secdedDecoded.value.flatMap((result) => result.dataBits)
);

const secdedLabels: string[] = ["P1", "P2", "D1", "P4", "D2", "D3", "D4", "P8"];

const currentEncodedBlock = computed(() => secdedEncodedBlocks.value[selectedBlock.value] || []);
const currentReceivedBlock = computed(() => secdedReceivedBlocks.value[selectedBlock.value] || []);

const secdedEncodedInfo = computed<BitItem[]>(() =>
  currentEncodedBlock.value.map((bit, index) => ({
    value: bit,
    role: secdedLabels[index].startsWith("P") ? "parity" : "data",
    label: secdedLabels[index],
  }))
);

const secdedReceivedInfo = computed<BitItem[]>(() =>
  currentReceivedBlock.value.map((bit, index) => ({
    value: bit,
    role: secdedLabels[index].startsWith("P") ? "parity" : "data",
    label: secdedLabels[index],
  }))
);

const secdedErrorIndices = computed(() =>
  currentReceivedBlock.value
    .map((bit, index) => (bit !== currentEncodedBlock.value[index] ? index : -1))
    .filter((index) => index !== -1)
);

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

  let status = "No error detected";
  let statusClass = "text-emerald-600";
  if (syndrome === 0 && parityError) {
    status = "Error in overall parity bit";
    statusClass = "text-amber-600";
  } else if (syndrome !== 0 && parityError) {
    status = `Single-bit corrected at position ${syndrome}`;
    statusClass = "text-emerald-600";
  } else if (syndrome !== 0 && !parityError) {
    status = "Double error detected (uncorrectable)";
    statusClass = "text-rose-600";
  }
  return { syndrome, parityError, status, statusClass };
});

const secdedDecodedInfo = computed<BitItem[]>(() =>
  (secdedDecoded.value[selectedBlock.value]?.dataBits || []).map((bit, index) => ({
    value: bit,
    role: "data",
    label: `D${index + 1}`,
  }))
);

const secdedStreamInfo = computed<BitItem[]>(() =>
  secdedDecodedStream.value.map((bit, index) => ({
    value: bit,
    role: "data",
    label: `D${index + 1}`,
  }))
);
</script>
