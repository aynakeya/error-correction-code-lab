<template>
  <section class="card rounded-t-none bg-white/90 shadow-xl">
    <div class="card-body gap-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end">
        <div class="w-full md:w-2/3">
          <BitInput v-model="parityInput" label="输入比特" />
        </div>
        <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
          <p class="text-sm font-semibold text-slate-600">奇偶校验规则</p>
          <p class="text-xs text-slate-500">偶校验位追加到末尾。</p>
        </div>
      </div>

      <BitDisplay
        title="奇偶校验计算"
        :bits="parityCalcInfo"
        description="数据位 + 计算出的校验位"
        read-only
      />

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div class="relative">
          <BitDisplay
            title="发送端编码"
            :bits="parityEncodedInfo"
            description="数据位 + 校验位"
            show-index
            :index-offset="1"
            read-only
          />
        </div>

        <div class="relative">
          <BitDisplay
            title="接收端"
            :bits="parityReceivedInfo"
            description="点击任意比特翻转。"
            :highlight-indices="parityErrorIndices"
            show-index
            :index-offset="1"
            @bit-click="toggleParityReceived"
          />
        </div>

        <div class="rounded-2xl border border-base-200 bg-base-100 p-4 flex flex-col gap-4">
          <p class="text-sm font-semibold text-slate-600">奇偶校验结果</p>
          <div class="text-sm text-slate-600">
            1 的数量：<span class="font-semibold">{{ parityReceivedOnes }}</span>
          </div>
          <div class="text-sm">
            状态：
            <span class="font-semibold" :class="parityOk ? 'text-emerald-600' : 'text-rose-600'">
              {{ parityOk ? "通过（未检测到错误）" : "失败（检测到错误）" }}
            </span>
          </div>
          <div v-if="parityErrorIndices.length && parityOk" class="text-xs text-amber-600">
            偶数个位翻转未被奇偶校验检测到。
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
