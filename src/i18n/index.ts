import { ref } from "vue";
import { messages, Locale } from "./messages";

const STORAGE_KEY = "fec-lab-locale";
const defaultLocale: Locale = "zh";
const savedLocale = (typeof window !== "undefined"
  ? (window.localStorage.getItem(STORAGE_KEY) as Locale | null)
  : null);

export const locale = ref<Locale>(savedLocale || defaultLocale);

const getMessage = (key: string): string | undefined => {
  const table = messages[locale.value];
  return table[key];
};

const format = (text: string, params?: Record<string, string | number>): string => {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (_, token) =>
    params[token] === undefined ? "" : String(params[token])
  );
};

export const t = (key: string, params?: Record<string, string | number>): string => {
  const message = getMessage(key) ?? key;
  return format(message, params);
};

export const setLocale = (nextLocale: Locale) => {
  locale.value = nextLocale;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
  }
};

export const useI18n = () => ({
  locale,
  setLocale,
  t,
});
