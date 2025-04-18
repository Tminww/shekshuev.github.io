<script setup lang="ts">
import { useAttrs } from "vue";

interface ButtonProps {
  variant?: "brand" | "alt";
}

const props = defineProps<ButtonProps>();

const attrs = useAttrs();

const variant = props.variant ?? "brand";
</script>

<template>
  <button
    class="button"
    :class="{ ['button_brand']: variant === 'brand', ['button_alt']: variant === 'alt' }"
    v-bind="attrs">
    <slot />
  </button>
</template>

<style scoped>
.button {
  display: inline-block;
  border: 1px solid transparent;
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
  transition: color 0.25s, border-color 0.25s, background-color 0.25s;
  border-radius: 20px;
  padding: 0 20px;
  line-height: 38px;
  font-size: 14px;
}

.button_brand {
  border-color: var(--vp-button-brand-border);
  color: var(--vp-button-brand-text);
  background-color: var(--vp-button-brand-bg);
}

.button_alt {
  border-color: var(--vp-button-alt-border);
  color: var(--vp-button-alt-text);
  background-color: var(--vp-button-alt-bg);
}
</style>
