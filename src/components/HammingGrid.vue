<template>
  <div class="rounded-2xl border border-base-200 bg-base-100 p-4">
    <div class="flex items-center justify-between gap-3">
      <p class="text-sm font-semibold text-slate-600">{{ title }}</p>
      <span v-if="description" class="text-xs text-slate-400">{{ description }}</span>
    </div>
    <div
      class="mt-4 grid gap-3"
      :style="{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }"
    >
      <div
        v-for="(pos, gridIndex) in gridPositions"
        :key="`cell-${gridIndex}`"
        class="flex flex-col items-center gap-2"
        @mouseenter="setHover(pos)"
        @mouseleave="setHover(-1)"
      >
        <button
          v-if="showIndexBadge(pos)"
          type="button"
          class="leading-none"
          :title="indexFormatState === 'binary' ? t('bit.index.binary') : t('bit.index.decimal')"
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
          v-if="showBitCell(pos)"
          type="button"
          class="bit-chip"
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
          {{ t("bit.empty") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "../i18n";

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    positions: number[];
    labels: Record<number, string>;
    parityPositions: number[];
    overallPosition?: number;
    bits: number[];
    compareBits?: number[];
    onFlip?: (position: number) => void;
  }>(),
  { description: "" }
);

const indexFormatState = ref<"binary" | "decimal">("binary");
const hoveredPosition = ref<number>(-1);
const { t } = useI18n();

const isOverallPosition = (pos: number) =>
  typeof props.overallPosition === "number" && pos === props.overallPosition;

const isEmptyPosition = (pos: number) => pos <= 0 && !isOverallPosition(pos);

const gridPositions = computed(() => props.positions);

const columnCount = computed(() => {
  const length = gridPositions.value.length;
  if (length <= 8) return 4;
  const count = Math.ceil(Math.sqrt(length));
  return Math.max(3, count);
});

const indexWidth = computed(() => {
  const maxPosition = Math.max(
    ...gridPositions.value.filter((pos) => pos > 0),
    1
  );
  return Math.max(1, Math.ceil(Math.log2(maxPosition + 1)));
});

const formatIndex = (pos: number) => {
  if (isEmptyPosition(pos)) return "";
  const dec = isOverallPosition(pos) ? 0 : pos;
  const bin = dec.toString(2).padStart(indexWidth.value, "0");
  return indexFormatState.value === "binary" ? bin : `${dec}`;
};

const toggleIndexFormat = () => {
  indexFormatState.value =
    indexFormatState.value === "binary" ? "decimal" : "binary";
};

const labelForPosition = (pos: number) => props.labels[pos] || "";

const bitValue = (pos: number) => {
  if (isEmptyPosition(pos)) return "";
  if (isOverallPosition(pos)) {
    return props.bits[props.bits.length - 1] ?? 0;
  }
  return props.bits[pos - 1] ?? 0;
};

const compareValue = (pos: number) => {
  if (!props.compareBits) return null;
  if (isEmptyPosition(pos)) return null;
  if (isOverallPosition(pos)) {
    return props.compareBits[props.compareBits.length - 1] ?? 0;
  }
  return props.compareBits[pos - 1] ?? 0;
};

const parityPositions = computed(() => props.parityPositions);

const errorPositions = computed(() => {
  if (!props.compareBits) return [];
  return gridPositions.value.filter((pos) => {
    if (isEmptyPosition(pos)) return false;
    const current = bitValue(pos);
    const compare = compareValue(pos);
    if (compare === null) return false;
    return current !== compare;
  });
});

const highlightPositions = computed(() => {
  const pos = hoveredPosition.value;
  if (pos <= 0 && !isOverallPosition(pos)) return [];
  const positions: number[] = [pos];
  if (isOverallPosition(pos)) {
    return gridPositions.value.filter((position) => !isEmptyPosition(position));
  }
  if (parityPositions.value.includes(pos)) {
    const maxPosition = Math.max(
      ...gridPositions.value.filter((position) => position > 0),
      1
    );
    for (let i = 1; i <= maxPosition; i += 1) {
      if (i & pos) positions.push(i);
    }
  } else {
    parityPositions.value.forEach((p) => {
      if (p & pos) positions.push(p);
    });
    if (typeof props.overallPosition === "number") {
      positions.push(props.overallPosition);
    }
  }
  return Array.from(new Set(positions));
});

const showIndexBadge = (pos: number) => !isEmptyPosition(pos);
const showBitCell = (pos: number) => !isEmptyPosition(pos);

const cellClass = (pos: number) => {
  const classes = ["border-base-300"];
  const isHighlighted = highlightPositions.value.includes(pos);
  const isParity = parityPositions.value.includes(pos) || isOverallPosition(pos);
  const isError = errorPositions.value.includes(pos);
  if (isError) {
    classes.push("bg-rose-200", "text-rose-950", "border-rose-300");
  } else {
    const value = bitValue(pos);
    if (value === 1) classes.push("bit-chip-active");
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
    hoveredPosition.value !== -1 &&
    !isEmptyPosition(pos) &&
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
  hoveredPosition.value = isEmptyPosition(pos) ? -1 : pos;
};
</script>
