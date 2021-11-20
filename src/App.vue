<template>
  <NConfigProvider class="page-layout" :theme="darkTheme">
  </NConfigProvider>
</template>

<script setup lang="ts">
// noinspection ES6UnusedImports
import { darkTheme, NConfigProvider } from 'naive-ui';
</script>

<style lang="scss">
@import 'App';
</style>
