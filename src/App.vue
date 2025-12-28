<template>
  <div class="min-h-screen px-4 py-8 md:px-10">
    <header class="mx-auto w-full md:w-2/3 max-w-none">
      <div class="flex flex-col gap-4 rounded-3xl border border-base-200 bg-white/80 p-6 shadow-lg backdrop-blur">
        <p class="text-sm uppercase tracking-[0.3em] text-emerald-500">FEC 实验室</p>
        <h1 class="text-3xl font-bold text-slate-900 md:text-4xl">
          前向纠错交互演示
        </h1>
        <p class="max-w-3xl text-slate-600">
          通过翻转比特交互式理解编码与解码过程，每个标签页都可以逐步调整与观察。
        </p>
      </div>
    </header>

    <main class="mx-auto mt-8 w-full md:w-2/3 max-w-none">
      <div class="tabs tabs-lifted">
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'repetition' }"
          @click="activeTab = 'repetition'"
        >
          重复码
        </button>
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'parity' }"
          @click="activeTab = 'parity'"
        >
          奇偶校验
        </button>
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'hamming' }"
          @click="activeTab = 'hamming'"
        >
          汉明码 (7,4)
        </button>
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'secded' }"
          @click="activeTab = 'secded'"
        >
          SEC-DED (8,4)
        </button>
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'conv' }"
          @click="activeTab = 'conv'"
        >
          卷积码
        </button>
      </div>

      <RepetitionCode v-if="activeTab === 'repetition'" />
      <ParityCode v-if="activeTab === 'parity'" />
      <HammingCode v-if="activeTab === 'hamming'" />
      <SecdedCode v-if="activeTab === 'secded'" />
      <ConvolutionalCode v-if="activeTab === 'conv'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import RepetitionCode from "./components/RepetitionCode.vue";
import ParityCode from "./components/ParityCode.vue";
import HammingCode from "./components/HammingCode.vue";
import SecdedCode from "./components/SecdedCode.vue";
import ConvolutionalCode from "./components/ConvolutionalCode.vue";

const activeTab = ref("repetition");
</script>
