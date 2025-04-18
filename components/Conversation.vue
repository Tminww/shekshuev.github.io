<script setup lang="ts">
interface Phrase {
  name: string;
  text: string;
  position: "left" | "right";
  photo?: string;
}

interface ConversationProps {
  phrases: Phrase[];
}

const { phrases = [] } = defineProps<ConversationProps>();
</script>

<template>
  <div class="conversation__container">
    <div
      v-for="(phrase, i) in phrases"
      :key="i"
      :class="`conversation__row conversation__row_${phrase.position}`"
    >
      <div
        :class="`conversation__photo-wrapper conversation__photo-wrapper_${phrase.position}`"
      >
        <div class="conversation__photo">
          <template v-if="phrase.photo && phrase.photo.length > 0">
            <img :src="phrase.photo" />
          </template>
          <template v-else>
            {{ phrase.name?.toUpperCase()?.[0] || "?" }}
          </template>
        </div>
        <span>{{ phrase.name }}</span>
      </div>
      <div
        :class="`conversation__phrase conversation__phrase_${phrase.position}`"
      >
        {{ phrase.text }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation__container {
  display: grid;
  gap: 18px;
  margin: 24px 0;
}

.conversation__row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.conversation__row_left {
  align-items: flex-start;
}

.conversation__row_right {
  align-items: flex-end;
}

.conversation__phrase {
  width: 60%;
  padding: 12px 24px;
  border-radius: 24px;
  background: var(--vp-c-tip-soft);
  text-wrap: wrap;
}

.conversation__phrase_left {
  border-top-left-radius: 0;
}

.conversation__phrase_right {
  border-top-right-radius: 0;
}

.conversation__photo-wrapper {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.conversation__photo-wrapper_left {
  flex-direction: row;
}

.conversation__photo-wrapper_right {
  flex-direction: row-reverse;
}

.conversation__photo {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--vp-c-tip-soft);
}

.conversation__photo img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}
</style>
