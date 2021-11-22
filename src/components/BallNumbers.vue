<template>
  <div class="ball-numbers">
    <p v-for="number of numbers" :key="number" class="ball-number">{{ number }}</p>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{ ballNumbers: number[] }>();
const numbers = computed(() => props.ballNumbers.slice(0, 16));
</script>

<style lang="scss" scoped>
@import 'BallNumbers';
</style>
