<template>
  <section class="card rounded-t-none bg-white/90 shadow-xl">
    <div class="card-body gap-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end">
        <div class="w-full md:w-2/3">
          <BitInput v-model="repInput" :label="t('repetition.label')" />
        </div>
        <label class="form-control w-full md:w-1/3">
          <div class="label">
            <span class="label-text">{{ t("repetition.repeatTimes") }}</span>
          </div>
          <input v-model.number="repFactor" type="number" min="1" step="2" class="input input-bordered" />
        </label>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div class="relative">
          <BitDisplay
            :title="t('common.encoded')"
            :bits="repEncodedInfo"
            :description="t('repetition.encodedDesc')"
            show-index
            :index-offset="1"
            read-only
          />
          <div class="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 text-slate-300">
            →
          </div>
        </div>

        <div class="relative">
          <BitDisplay
            :title="t('common.received')"
            :bits="repReceivedInfo"
            :description="t('repetition.receivedDesc')"
            :highlight-indices="repErrorIndices"
            show-index
            :index-offset="1"
            @bit-click="toggleRepReceived"
          />
          <div class="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 text-slate-300">
            →
          </div>
        </div>

        <div class="rounded-2xl border border-base-200 bg-base-100 p-4 flex flex-col gap-4">
          <p class="text-sm font-semibold text-slate-600">{{ t("repetition.majority") }}</p>
          <BitDisplay :title="t('common.decodeResult')" :bits="repDecodedInfo" read-only />
          <div class="text-xs text-slate-500">
            {{ t("repetition.flipCount", { count: repErrorIndices.length }) }}
          </div>
          <div class="text-xs text-slate-500">
            {{ t("common.status") }}
            <span :class="repIsCorrect ? 'text-emerald-600' : 'text-rose-600'" class="font-semibold">
              {{ repIsCorrect ? t("repetition.decodeOk") : t("repetition.decodeFail") }}
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
import { toBits } from "../utils/bits";
import { useI18n } from "../i18n";

const repInput = ref("101101");
const repFactor = ref<number>(3);
const { t } = useI18n();

const repInputBits = computed(() => toBits(repInput.value));

const repEncoded = computed(() => {
  const bits = repInputBits.value;
  const factor = Math.max(1, Number(repFactor.value) || 1);
  const output: number[] = [];
  bits.forEach((bit) => {
    for (let i = 0; i < factor; i += 1) output.push(bit);
  });
  return output;
});

const repReceived = ref<number[]>([]);
watch(
  repEncoded,
  (value) => {
    repReceived.value = [...value];
  },
  { immediate: true }
);

const repGroups = computed(() => {
  const factor = Math.max(1, Number(repFactor.value) || 1);
  const groups = [];
  for (let i = 0; i < repReceived.value.length; i += factor) {
    groups.push(repReceived.value.slice(i, i + factor));
  }
  return groups;
});

const repDecoded = computed(() => {
  const factor = Math.max(1, Number(repFactor.value) || 1);
  return repGroups.value.map((group) => {
    const ones = group.reduce((sum, bit) => sum + bit, 0);
    return ones >= Math.ceil(factor / 2) ? 1 : 0;
  });
});

const repEncodedInfo = computed<BitItem[]>(() => {
  const factor = Math.max(1, Number(repFactor.value) || 1);
  const items: BitItem[] = [];
  repInputBits.value.forEach((bit, bitIndex) => {
    for (let j = 0; j < factor; j += 1) {
      items.push({
        value: bit,
        role: j === 0 ? "data" : "repeat",
        label: j === 0 ? `D${bitIndex + 1}` : `R${j}`,
      });
    }
  });
  return items;
});

const repReceivedInfo = computed<BitItem[]>(() => {
  return repEncodedInfo.value.map((info, index) => ({
    ...info,
    value: repReceived.value[index] ?? info.value,
  }));
});

const repDecodedInfo = computed<BitItem[]>(() =>
  repDecoded.value.map((bit, index) => ({
    value: bit,
    role: "data",
    label: `D${index + 1}`,
  }))
);

const repErrorIndices = computed(() =>
  repReceived.value
    .map((bit, index) => (bit !== repEncoded.value[index] ? index : -1))
    .filter((index) => index !== -1)
);

const repIsCorrect = computed(
  () => repDecoded.value.join("") === repInputBits.value.join("")
);

const toggleRepReceived = (index: number) => {
  if (index < 0 || index >= repReceived.value.length) return;
  const next = [...repReceived.value];
  next[index] = next[index] ? 0 : 1;
  repReceived.value = next;
};
</script>
