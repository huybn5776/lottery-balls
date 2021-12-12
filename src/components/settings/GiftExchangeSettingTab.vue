<template>
  <label class="setting-textarea-container">
    Names:
    <NInput v-model:value="names" type="textarea" placeholder="Names" :resizable="false" />
    <span class="setting-textarea-note">Total names: {{ totalNames }}</span>
  </label>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

// noinspection ES6UnusedImports
import { NInput } from 'naive-ui';

import { useSettingTab } from '@components/settings/use-setting-tab';
import { useDebouncedCompute } from '@compositions/use-debounced-compute';
import { SettingsModel } from '@interfaces/settings-model';
import { distinctArray } from '@utils/array-utils';
import { splitTextareaString } from '@utils/string-utils';

const props = defineProps<{ settings: SettingsModel }>();

const names = ref('');

useSettingTab(props, loadSettings, saveSettings);

const totalNames = useDebouncedCompute([names], () => parseNames().length);

function loadSettings(settings: SettingsModel): void {
  names.value = settings.names?.join('\n') ?? names.value;
}

function saveSettings(): Partial<SettingsModel> {
  return {
    names: parseNames(),
  };
}
function parseNames(): string[] {
  return distinctArray(splitTextareaString(names.value));
}
</script>

<style lang="scss" scoped>
@import './SettingsModal';
</style>
