<template>
  <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-slate-600">{{ label }}</p>
      <span class="text-xs text-slate-400">Click bits to toggle</span>
    </div>
    <div class="mt-3 flex flex-wrap gap-2">
      <button
        v-for="(bit, index) in bits"
        :key="`input-${index}`"
        class="bit-chip"
        :class="bit ? 'bit-chip-active' : ''"
        @click="toggle(index)"
      >
        {{ bit }}
      </button>
      <button
        class="bit-chip border-dashed text-slate-500 hover:border-slate-400"
        @click="addBit(0)"
        title="Add bit"
      >
        +
      </button>
      <button
        class="bit-chip border-dashed text-slate-500 hover:border-rose-400"
        @click="removeBit"
        :disabled="bits.length === 0"
        title="Remove bit"
      >
        -
      </button>
      <span v-if="bits.length === 0" class="text-xs text-slate-400">Add bits to begin.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { bitsToString, toBits } from "../utils/bits";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
  }>(),
  { label: "Input bits" }
);

const emit = defineEmits<{ (event: "update:modelValue", value: string): void }>();

const bits = computed(() => toBits(props.modelValue));

const update = (nextBits: number[]) => {
  emit("update:modelValue", bitsToString(nextBits));
};

const toggle = (index: number) => {
  const next = [...bits.value];
  if (index < 0 || index >= next.length) return;
  next[index] = next[index] ? 0 : 1;
  update(next);
};

const addBit = (bit: number) => {
  update([...bits.value, bit]);
};

const removeBit = () => {
  if (bits.value.length === 0) return;
  update(bits.value.slice(0, -1));
};

</script>
