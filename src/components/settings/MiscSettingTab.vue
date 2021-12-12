<template>
  <NCheckbox v-model:checked="autoPause">Pause on idle</NCheckbox>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

// noinspection ES6UnusedImports
import { NCheckbox } from 'naive-ui';

import { useSettingTab } from '@components/settings/use-setting-tab';
import { SettingsModel } from '@interfaces/settings-model';

const props = defineProps<{ settings: SettingsModel }>();

const autoPause = ref(false);

useSettingTab(props, loadSettings, saveSettings);

function loadSettings(settings: SettingsModel): void {
  autoPause.value = settings.autoPause ?? autoPause.value;
}

function saveSettings(): Partial<SettingsModel> {
  return {
    autoPause: autoPause.value,
  };
}
</script>

<style lang="scss" scoped>
@import './SettingsModal';
</style>
