<template>
  <section class="card rounded-t-none bg-white/90 shadow-xl">
    <div class="card-body gap-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end">
        <div class="w-full md:w-2/3">
          <BitInput v-model="parityInput" label="Input bits" />
        </div>
        <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
          <p class="text-sm font-semibold text-slate-600">Parity rule</p>
          <p class="text-xs text-slate-500">Even parity bit appended to the end.</p>
        </div>
      </div>

      <BitDisplay
        title="Parity calculation"
        :bits="parityCalcInfo"
        description="Data bits + calculated parity bit"
        read-only
      />

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div class="relative">
          <BitDisplay
            title="Encoded"
            :bits="parityEncodedInfo"
            description="Data + parity bit"
            show-index
            :index-offset="1"
            read-only
          />
        </div>

        <div class="relative">
          <BitDisplay
            title="Received"
            :bits="parityReceivedInfo"
            description="Click any bit to flip."
            :highlight-indices="parityErrorIndices"
            show-index
            :index-offset="1"
            @bit-click="toggleParityReceived"
          />
        </div>

        <div class="rounded-2xl border border-base-200 bg-base-100 p-4 flex flex-col gap-4">
          <p class="text-sm font-semibold text-slate-600">Parity check</p>
          <div class="text-sm text-slate-600">
            Ones count: <span class="font-semibold">{{ parityReceivedOnes }}</span>
          </div>
          <div class="text-sm">
            Status:
            <span class="font-semibold" :class="parityOk ? 'text-emerald-600' : 'text-rose-600'">
              {{ parityOk ? "Parity OK (no error detected)" : "Parity FAIL (error detected)" }}
            </span>
          </div>
          <div v-if="parityErrorIndices.length && parityOk" class="text-xs text-amber-600">
            Even number of errors slipped through parity check.
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
import { toBits } from "../utils/bits";

const parityInput = ref("1101001");

const parityInputBits = computed(() => toBits(parityInput.value));

const parityEncoded = computed(() => {
  const bits = parityInputBits.value;
  const ones = bits.reduce((sum, bit) => sum + bit, 0);
  const parityBit = ones % 2;
  return [...bits, parityBit];
});

const parityReceived = ref<number[]>([]);
watch(
  parityEncoded,
  (value) => {
    parityReceived.value = [...value];
  },
  { immediate: true }
);

const parityReceivedOnes = computed(() =>
  parityReceived.value.reduce((sum, bit) => sum + bit, 0)
);
const parityOk = computed(() => parityReceivedOnes.value % 2 === 0);

const parityCalcInfo = computed<BitItem[]>(() => {
  const items: BitItem[] = [];
  parityInputBits.value.forEach((bit, index) => {
    items.push({ value: bit, role: "data", label: `D${index + 1}` });
  });
  const parityBit = parityEncoded.value[parityEncoded.value.length - 1] ?? 0;
  items.push({ value: parityBit, role: "parity", label: "P" });
  return items;
});

const parityEncodedInfo = computed<BitItem[]>(() => {
  const items: BitItem[] = [];
  parityInputBits.value.forEach((bit, index) => {
    items.push({ value: bit, role: "data", label: `D${index + 1}` });
  });
  const parityBit = parityEncoded.value[parityEncoded.value.length - 1] ?? 0;
  items.push({ value: parityBit, role: "parity", label: "P" });
  return items;
});

const parityReceivedInfo = computed<BitItem[]>(() =>
  parityEncodedInfo.value.map((info, index) => ({
    ...info,
    value: parityReceived.value[index] ?? info.value,
  }))
);

const parityErrorIndices = computed(() =>
  parityReceived.value
    .map((bit, index) => (bit !== parityEncoded.value[index] ? index : -1))
    .filter((index) => index !== -1)
);

const toggleParityReceived = (index: number) => {
  if (index < 0 || index >= parityReceived.value.length) return;
  const next = [...parityReceived.value];
  next[index] = next[index] ? 0 : 1;
  parityReceived.value = next;
};
</script>
