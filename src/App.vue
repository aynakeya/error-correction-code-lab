<template>
  <div class="min-h-screen px-4 py-8 md:px-10">
    <header class="mx-auto w-full md:w-2/3 max-w-none">
      <div class="flex flex-col gap-4 rounded-3xl border border-base-200 bg-white/80 p-6 shadow-lg backdrop-blur">
        <p class="text-sm uppercase tracking-[0.3em] text-emerald-500">FEC Studio</p>
        <h1 class="text-3xl font-bold text-slate-900 md:text-4xl">
          Forward Error Correction Playground
        </h1>
        <p class="max-w-3xl text-slate-600">
          Explore encoding and decoding with interactive bit flips. Each tab offers a focused
          demonstration you can tweak step by step.
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
          Repetition
        </button>
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'parity' }"
          @click="activeTab = 'parity'"
        >
          Parity
        </button>
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'hamming' }"
          @click="activeTab = 'hamming'"
        >
          Hamming (7,4)
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
          Convolutional
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
