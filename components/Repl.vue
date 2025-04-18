<script setup lang="ts">
import { PGlite } from "@electric-sql/pglite";
import "@electric-sql/pglite-repl/webcomponent";
import { vector } from "@electric-sql/pglite/vector";
import { onMounted, ref } from "vue";
import Button from "./Button.vue";

interface ReplProps {
  initialQueries: string[];
}

const { initialQueries = [] } = defineProps<ReplProps>();

const repl = ref(null);
const opened = ref(false);

const pg = new PGlite({
  extensions: {
    vector,
  },
});

onMounted(() => {
  for (const query of initialQueries) {
    pg.exec(query).then(res => console.log(res));
  }
});
</script>

<template>
  <div class="repl__wrapper">
    <pglite-repl
      ref="repl"
      class="repl"
      :pg="pg"
      theme="dark"
      :class="{ ['repl_opened']: opened, ['repl_closed']: !opened }" />
    <Button @click="opened = !opened">REPL {{ opened ? "↑" : "↓" }}</Button>
  </div>
</template>

<style scoped>
.repl__wrapper {
  position: sticky;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  top: 48px;
  left: 0;
  width: 100%;
  max-height: 400px;
  overflow-y: scroll;
  overflow-x: hidden;
  z-index: 100;
  border-radius: 12px;
}

.repl_opened {
  max-height: 400px;
  height: 400px;
}

.repl_closed {
  max-height: 0;
  height: 0;
}

.repl {
  width: 100%;
}

.repl {
  display: flex;
  align-items: stretch;
  border-radius: 12px;
  overflow: hidden;
  font-size: 1rem;
}
</style>
