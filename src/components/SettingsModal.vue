<template>
  <NButton @click="showModal = true">Settings</NButton>
  <NModal v-model:show="showModal">
    <div class="settings-layout">
      <div class="setting-header">
        <h1 class="setting-title">Settings</h1>
      </div>

      <div class="settings-content">
        <div class="settings-column">
          <h3 class="setting-column-title">Numbers mode</h3>

          <label>
            Range to:
            <NInput v-model:value="rangeTo" :input-props="{ type: 'number' }" placeholder="From 1 to..." />
          </label>

          <label class="setting-textarea-container">
            Omit numbers:
            <NInput v-model:value="numbersToOmit" type="textarea" placeholder="Numbers to omit" :resizable="false" />
          </label>
        </div>
        <div class="settings-column">
          <h3 class="setting-column-title">Gift exchange</h3>
          <label class="setting-textarea-container">
            Names:
            <NInput v-model:value="names" type="textarea" placeholder="Names" :resizable="false" />
          </label>
        </div>
      </div>

      <div class="settings-footer">
        <NButton class="setting-save-button" @click="saveSettings">Save</NButton>
      </div>
    </div>
  </NModal>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

// noinspection ES6UnusedImports
import { NButton, NCard, NInput, NModal, NRadioGroup, NRadio } from 'naive-ui';

import { loadSettingsFromLocalstorage, saveSettingsToLocalstorage } from '@services/settings-service';

const numbersModes = [
  { value: 'range', label: 'Range' },
  { value: 'entries', label: 'Entries' },
];

const props = defineProps<{ modalVisible?: boolean }>();
const emits = defineEmits<{ (modalVisible: 'update:modalVisible', value: boolean): void }>();

const showModal = ref(false);
const rangeTo = ref('75');
const numbersToOmit = ref('');
const names = ref('');
const numbersMode = ref(numbersModes[0].value);

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
    }
    emits('update:modalVisible', show);
  },
);

function loadSettings(): void {
  const settings = loadSettingsFromLocalstorage();
  rangeTo.value = `${settings.rangeTo ?? rangeTo.value}`;
  numbersToOmit.value = settings.numbersToOmit?.join('\n') ?? numbersToOmit.value;
  names.value = settings.names?.join('\n') ?? numbersToOmit.value;
}

function saveSettings(): void {
  const settings = {
    rangeTo: +rangeTo.value,
    numbersToOmit: numbersToOmit.value
      .split('\n')
      .filter((n) => n)
      .map((n) => +n)
      .filter((n) => !Number.isNaN(n)),
    names: names.value.split('\n').map((n) => n.trim()),
  };
  saveSettingsToLocalstorage(settings);
  showModal.value = false;
}
</script>

<style lang="scss" scoped>
@import 'SettingsModal';
</style>
