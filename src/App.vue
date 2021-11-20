<template>
  <NConfigProvider class="page-layout" :theme="darkTheme">
    <Lottery />
  </NConfigProvider>
</template>

<script setup lang="ts">
// noinspection ES6UnusedImports
import { darkTheme, NConfigProvider } from 'naive-ui';

import Lottery from '@components/Lottery.vue';
</script>

<style lang="scss">
@import 'App';
</style>
