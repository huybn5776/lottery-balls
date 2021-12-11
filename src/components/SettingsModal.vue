<template>
  <NButton @click="showModal = true">Settings</NButton>
  <NModal v-model:show="showModal">
    <div class="settings-layout">
      <div class="setting-header">
        <h1 class="setting-title">Settings</h1>
      </div>

      <div class="settings-content">
        <div class="settings-column">
          <h3 class="setting-column-title">Ball label</h3>

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
        </div>
        <div class="settings-column">
          <h3 class="setting-column-title">Gift exchange</h3>
          <label class="setting-textarea-container">
            Names:
            <NInput v-model:value="names" type="textarea" placeholder="Names" :resizable="false" />
            <span class="setting-textarea-note">Total names: {{ totalNames }}</span>
          </label>
        </div>
      </div>

      <div class="settings-footer">
        <NButton @click="showModal = false">Cancel</NButton>
        <NButton type="primary" @click="saveSettings">Save</NButton>
      </div>
    </div>
  </NModal>
</template>

<script lang="ts" setup>
import { ref, watch, onUnmounted } from 'vue';

// noinspection ES6UnusedImports
import { NButton, NInput, NModal, NRadioGroup, NRadio } from 'naive-ui';
import { Subscription, fromEvent, filter } from 'rxjs';

import { useDebouncedCompute } from '@compositions/use-debounced-compute';
import { loadSettingsFromLocalstorage, saveSettingsToLocalstorage } from '@services/settings-service';

const props = defineProps<{ modalVisible?: boolean }>();
const emits = defineEmits<{ (modalVisible: 'update:modalVisible', value: boolean): void }>();

const showModal = ref(false);
const rangeTo = ref('75');
const numbersToOmit = ref('');
const ballLabels = ref('');
const names = ref('');
const ballLabelMode = ref('range');
const hotkeySubscription = ref<Subscription>();

const totalBalls = useDebouncedCompute({ debounced: [numbersToOmit, ballLabels], immediately: [ballLabelMode] }, () => {
  if (ballLabelMode.value === 'range') {
    return +rangeTo.value - splitTextareaString(numbersToOmit.value).length;
  }
  if (ballLabelMode.value === 'entries') {
    return splitTextareaString(ballLabels.value).length;
  }
  return 0;
});
const totalNames = useDebouncedCompute([names], () => splitTextareaString(names.value).length);

watch(
  () => props.modalVisible,
  (visible) => {
    showModal.value = !!visible;
  },
);
watch(
  () => showModal.value,
  (show) => {
    if (show) {
      loadSettings();
      registerHotkey();
    } else {
      unregisterHotkey();
    }
    emits('update:modalVisible', show);
  },
);

onUnmounted(() => unregisterHotkey());

function loadSettings(): void {
  const settings = loadSettingsFromLocalstorage();
  ballLabelMode.value = settings.ballLabelMode || ballLabelMode.value;
  rangeTo.value = `${settings.rangeTo ?? rangeTo.value}`;
  numbersToOmit.value = settings.numbersToOmit?.join('\n') ?? numbersToOmit.value;
  ballLabels.value = settings.ballLabels?.join('\n') ?? ballLabels.value;
  names.value = settings.names?.join('\n') ?? numbersToOmit.value;
}

function registerHotkey(): void {
  hotkeySubscription.value = fromEvent<KeyboardEvent>(document.body, 'keydown')
    .pipe(filter((event) => (event.metaKey || event.ctrlKey) && event.key === 'Enter'))
    .subscribe(saveSettings);
}

function unregisterHotkey(): void {
  hotkeySubscription.value?.unsubscribe();
}

function saveSettings(): void {
  const settings = {
    ballLabelMode: ballLabelMode.value,
    rangeTo: +rangeTo.value,
    numbersToOmit: splitTextareaString(numbersToOmit.value)
      .map((n) => +n)
      .filter((n) => !Number.isNaN(n)),
    ballLabels: splitTextareaString(ballLabels.value),
    names: names.value.split('\n').map((n) => n.trim()),
  };
  saveSettingsToLocalstorage(settings);
  showModal.value = false;
}

function splitTextareaString(text: string): string[] {
  return text.split('\n').filter((n) => n);
}
</script>

<style lang="scss" scoped>
@import 'SettingsModal';
</style>
