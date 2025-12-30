<template>
  <div class="min-h-screen px-4 py-8 md:px-10">
    <header class="mx-auto w-full md:w-3/4 max-w-none">
      <div class="flex flex-col gap-4 rounded-3xl border border-base-200 bg-white/80 p-6 shadow-lg backdrop-blur">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm uppercase tracking-[0.3em] text-emerald-500">{{ t("app.badge") }}</p>
          <div class="join">
            <button
              class="btn btn-xs join-item"
              :class="locale === 'zh' ? 'btn-primary' : 'btn-ghost'"
              @click="setLocale('zh')"
            >
              {{ t("app.lang.zh") }}
            </button>
            <button
              class="btn btn-xs join-item"
              :class="locale === 'en' ? 'btn-primary' : 'btn-ghost'"
              @click="setLocale('en')"
            >
              {{ t("app.lang.en") }}
            </button>
          </div>
        </div>
        <h1 class="text-3xl font-bold text-slate-900 md:text-4xl">
          {{ t("app.title") }}
        </h1>
        <p class="max-w-3xl text-slate-600">
          {{ t("app.description") }}
        </p>
      </div>
    </header>

    <main class="mx-auto mt-8 w-full md:w-3/4 max-w-none">
      <div class="tabs tabs-lifted">
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'repetition' }"
          @click="activeTab = 'repetition'"
        >
          {{ t("app.tabs.repetition") }}
        </button>
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'parity' }"
          @click="activeTab = 'parity'"
        >
          {{ t("app.tabs.parity") }}
        </button>
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'hamming' }"
          @click="activeTab = 'hamming'"
        >
          {{ t("app.tabs.hamming") }}
        </button>
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'secded' }"
          @click="activeTab = 'secded'"
        >
          {{ t("app.tabs.secded") }}
        </button>
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'conv' }"
          @click="activeTab = 'conv'"
        >
          {{ t("app.tabs.conv") }}
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
import { useI18n } from "./i18n";

const activeTab = ref("repetition");
const { locale, setLocale, t } = useI18n();
</script>
