<template>
  <div class="setting-row">
    <p class="setting-text">Mode:</p>
    <NRadioGroup v-model:value="ballLabelMode">
      <NRadio value="range">Number range</NRadio>
      <NRadio value="entries">Entries</NRadio>
    </NRadioGroup>
  </div>

  <slot v-if="ballLabelMode === 'range'">
    <label>
      Range to:
      <NInput v-model:value="rangeTo" :input-props="{ type: 'number' }" placeholder="From 1 to..." />
    </label>

    <label class="setting-textarea-container">
      Omit numbers:
      <NInput v-model:value="numbersToOmit" type="textarea" placeholder="Numbers to omit" :resizable="false" />
      <span class="setting-textarea-note">Total balls: {{ totalBalls }}</span>
    </label>
  </slot>

  <slot v-else-if="ballLabelMode === 'entries'">
    <label class="setting-textarea-container">
      Entries:
      <NInput v-model:value="ballLabels" type="textarea" placeholder="Ball labels" :resizable="false" />
      <span class="setting-textarea-note">Total balls: {{ totalBalls }}</span>
    </label>
  </slot>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

// noinspection ES6UnusedImports
import { NInput, NRadioGroup, NRadio } from 'naive-ui';

import { useSettingTab } from '@components/settings/use-setting-tab';
import { useDebouncedCompute } from '@compositions/use-debounced-compute';
import { SettingsModel } from '@interfaces/settings-model';
import { distinctArray } from '@utils/array-utils';
import { splitTextareaString } from '@utils/string-utils';

const props = defineProps<{ settings: SettingsModel }>();

const ballLabelMode = ref('range');
const rangeTo = ref('75');
const numbersToOmit = ref('');
const ballLabels = ref('');

useSettingTab(props, loadSettings, saveSettings);

const totalBalls = useDebouncedCompute({ debounced: [numbersToOmit, ballLabels], immediately: [ballLabelMode] }, () => {
  if (ballLabelMode.value === 'range') {
    return +rangeTo.value - parseNumbersToOmit().length;
  }
  if (ballLabelMode.value === 'entries') {
    return splitTextareaString(ballLabels.value).length;
  }
  return 0;
});

function loadSettings(settings: SettingsModel): void {
  ballLabelMode.value = settings.ballLabelMode || ballLabelMode.value;
  rangeTo.value = `${settings.rangeTo ?? rangeTo.value}`;
  numbersToOmit.value = settings.numbersToOmit?.join('\n') ?? numbersToOmit.value;
  ballLabels.value = settings.ballLabels?.join('\n') ?? ballLabels.value;
}

function saveSettings(): Partial<SettingsModel> {
  return {
    ballLabelMode: ballLabelMode.value,
    rangeTo: +rangeTo.value,
    numbersToOmit: parseNumbersToOmit(),
    ballLabels: splitTextareaString(ballLabels.value),
  };
}

function parseNumbersToOmit(): number[] {
  return distinctArray(
    splitTextareaString(numbersToOmit.value)
      .map((n) => +n)
      .filter((n) => !Number.isNaN(n)),
  );
}
</script>

<style lang="scss" scoped>
@import './SettingsModal';
</style>
