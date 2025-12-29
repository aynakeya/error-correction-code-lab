<template>
  <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-slate-600">{{ title }}</p>
      <span v-if="description" class="text-xs text-slate-400">{{ description }}</span>
    </div>
    <div class="mt-4 grid grid-cols-4 gap-3">
      <div
        v-for="(pos, gridIndex) in gridPositions"
        :key="`cell-${gridIndex}`"
        class="flex flex-col items-center gap-2"
        @mouseenter="setHover(pos)"
        @mouseleave="setHover(-1)"
      >
        <button
          v-if="pos > 0"
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
            {{ formatIndex(pos) }}
          </span>
        </button>
        <div
          v-else
          class="h-4"
          aria-hidden="true"
        ></div>
        <button
          v-if="pos > 0"
          type="button"
          class="relative flex h-14 w-14 flex-col items-center justify-center rounded-xl border text-lg font-semibold transition"
          :class="cellClass(pos)"
          @click="emitFlip(pos)"
        >
          <span class="leading-none">{{ bitValue(pos) }}</span>
          <span class="mt-1 text-[10px] text-slate-500">{{ labelForPosition(pos) }}</span>
        </button>
        <div
          v-else
          class="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-base-300 text-xs text-slate-400"
        >
          空位
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

type Mode = "hamming" | "secded";

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    mode: Mode;
    bits: number[];
    compareBits?: number[];
    onFlip?: (position: number) => void;
  }>(),
  { description: "" }
);

const indexFormatState = ref<"binary" | "decimal">("binary");
const hoveredPosition = ref<number>(-1);

const labelMap: Record<number, string> = {
  1: "P1",
  2: "P2",
  3: "D1",
  4: "P4",
  5: "D2",
  6: "D3",
  7: "D4",
  8: "P8",
};

const gridPositions = computed(() => {
  if (props.mode === "secded") {
    return [8, 1, 2, 3, 4, 5, 6, 7];
  }
  return [0, 1, 2, 3, 4, 5, 6, 7];
});

const formatIndex = (pos: number) => {
  if (pos <= 0) return "";
  if (props.mode === "secded" && pos === 8) {
    return indexFormatState.value === "binary" ? "000" : "0";
  }
  const bin = pos.toString(2).padStart(3, "0");
  return indexFormatState.value === "binary" ? bin : `${pos}`;
};

const toggleIndexFormat = () => {
  indexFormatState.value =
    indexFormatState.value === "binary" ? "decimal" : "binary";
};

const labelForPosition = (pos: number) => labelMap[pos] || "";

const bitValue = (pos: number) => {
  if (pos <= 0) return "";
  if (props.mode === "secded" && pos === 8) {
    return props.bits[7] ?? 0;
  }
  return props.bits[pos - 1] ?? 0;
};

const compareValue = (pos: number) => {
  if (!props.compareBits || pos <= 0) return null;
  if (props.mode === "secded" && pos === 8) {
    return props.compareBits[7] ?? 0;
  }
  return props.compareBits[pos - 1] ?? 0;
};

const parityPositions = computed(() => {
  const base = [1, 2, 4];
  return props.mode === "secded" ? [...base, 8] : base;
});

const errorPositions = computed(() => {
  if (!props.compareBits) return [];
  return gridPositions.value.filter((pos) => {
    if (pos <= 0) return false;
    const current = bitValue(pos);
    const compare = compareValue(pos);
    if (compare === null) return false;
    return current !== compare;
  });
});

const highlightPositions = computed(() => {
  const pos = hoveredPosition.value;
  if (pos <= 0) return [];
  const positions: number[] = [pos];
  if (props.mode === "secded" && pos === 8) {
    return [1, 2, 3, 4, 5, 6, 7, 8];
  }
  if (parityPositions.value.includes(pos)) {
    for (let i = 1; i <= 7; i += 1) {
      if (i & pos) positions.push(i);
    }
  } else {
    parityPositions.value.forEach((p) => {
      if (p !== 8 && (p & pos)) positions.push(p);
    });
    if (props.mode === "secded") positions.push(8);
  }
  return Array.from(new Set(positions));
});

const cellClass = (pos: number) => {
  const classes = ["border-base-300"];
  const isHighlighted = highlightPositions.value.includes(pos);
  const isParity = parityPositions.value.includes(pos);
  const isError = errorPositions.value.includes(pos);
  if (isError) {
    classes.push("bg-rose-200", "text-rose-950", "border-rose-300");
  } else {
    classes.push("bg-white");
  }
  if (isHighlighted) {
    classes.push("ring-2", "ring-sky-300");
  }
  if (isParity) {
    classes.push("border-amber-300", "border-2");
    if (!isHighlighted) {
      classes.push("ring-1", "ring-amber-300", "ring-inset");
    }
  }
  if (
    hoveredPosition.value > 0 &&
    pos > 0 &&
    !isHighlighted &&
    !isError
  ) {
    classes.push("opacity-40");
  }
  return classes.join(" ");
};

const emitFlip = (pos: number) => {
  if (!props.onFlip) return;
  props.onFlip(pos);
};

const setHover = (pos: number) => {
  hoveredPosition.value = pos;
};
</script>
