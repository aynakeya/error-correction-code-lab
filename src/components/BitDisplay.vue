<template>
  <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
    <div v-if="!hideTitle" class="flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-slate-600">{{ title }}</p>
      <span v-if="description" class="text-xs text-slate-400">{{ description }}</span>
    </div>
    <div class="mt-3 flex flex-wrap gap-3">
      <div v-for="(bit, index) in bits" :key="`bit-${index}`" class="flex flex-col items-center gap-2">
        <button
          v-if="showIndex"
          type="button"
          class="leading-none"
          :title="indexFormatState === 'binary' ? '二进制索引' : '十进制索引'"
          @click.stop="toggleIndexFormat"
        >
          <span
            class="px-1.5 py-0 rounded-full text-[10px] font-semibold tracking-tight"
            :class="
              indexFormatState === 'binary'
                ? 'bg-sky-100 text-sky-700'
                : 'bg-amber-100 text-amber-700'
            "
          >
            {{ formatIndex(index) }}
          </span>
        </button>
        <button
          v-if="isClickable"
          type="button"
          class="bit-chip"
          :class="chipClass(bit, index)"
          @click.stop="emit('bit-click', index)"
        >
          <span class="leading-none">{{ bit.value }}</span>
          <span v-if="bit.label" class="text-[10px] uppercase tracking-wide text-slate-500">
            {{ bit.label }}
          </span>
        </button>
        <span v-else class="bit-chip" :class="chipClass(bit, index)">
          <span class="leading-none">{{ bit.value }}</span>
          <span v-if="bit.label" class="text-[10px] uppercase tracking-wide text-slate-500">
            {{ bit.label }}
          </span>
        </span>
      </div>
      <span v-if="bits.length === 0" class="text-xs text-slate-400">暂无比特。</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

type BitRole = "data" | "parity" | "overall" | "repeat";

export interface BitItem {
  value: number;
  label?: string;
  role?: BitRole;
}

const props = withDefaults(
  defineProps<{
    title: string;
    bits: BitItem[];
    description?: string;
    readOnly?: boolean;
    highlightIndices?: number[];
    showIndex?: boolean;
    indexOffset?: number;
    indexBinaryWidth?: number;
    indexFormat?: "binary" | "decimal";
    indexValues?: number[];
    hideTitle?: boolean;
  }>(),
  {
    description: "",
    readOnly: false,
    highlightIndices: () => [],
    showIndex: false,
    indexOffset: 1,
    indexBinaryWidth: undefined,
    indexFormat: "binary",
    indexValues: undefined,
    hideTitle: false,
  }
);

const emit = defineEmits<{ (event: "bit-click", index: number): void }>();

const isClickable = computed(() => !props.readOnly);

const highlightSet = computed(() => new Set(props.highlightIndices || []));
const indexWidth = computed(() => {
  if (typeof props.indexBinaryWidth === "number") return props.indexBinaryWidth;
  const values = props.indexValues?.filter((val) => typeof val === "number") || [];
  const maxValue = values.length ? Math.max(...values) : props.bits.length;
  const count = Math.max(1, maxValue);
  return Math.max(1, Math.ceil(Math.log2(count + 1)));
});

const chipClass = (bit: BitItem, index: number) => {
  const classes = [];
  if (highlightSet.value.has(index)) classes.push("bit-chip-error");
  if (bit.role === "parity") classes.push("border-amber-300");
  if (bit.role === "overall") classes.push("border-rose-300");
  return classes.join(" ");
};

const indexFormatState = ref<"binary" | "decimal">(props.indexFormat);

watch(
  () => props.indexFormat,
  (value) => {
    indexFormatState.value = value;
  }
);

const toggleIndexFormat = () => {
  indexFormatState.value =
    indexFormatState.value === "binary" ? "decimal" : "binary";
};

const formatIndex = (index: number) => {
  const explicit = props.indexValues?.[index];
  const dec = typeof explicit === "number" ? explicit : index + (props.indexOffset || 0);
  const bin = dec.toString(2).padStart(indexWidth.value, "0");
  return indexFormatState.value === "binary" ? bin : `${dec}`;
};

</script>
