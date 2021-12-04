<template>
  <NButton @click="showModal = true">Settings</NButton>
  <NModal v-model:show="showModal">
    <NCard class="settings-card" title="Settings" :bordered="false" size="huge">
      <div class="settings-layout">
        <div class="settings-content">
          <div class="settings-column">
            <h3 class="setting-column-title">Numbers</h3>

            <label>
              Range to:
              <NInput v-model:value="rangeTo" :input-props="{ type: 'number' }" placeholder="From 1 to..." />
            </label>

            <label>
              Omit numbers:
              <NInput
                v-model:value="numbersToOmit"
                type="textarea"
                placeholder="Numbers to omit"
                :autosize="textareaAutosize"
              />
            </label>
          </div>
          <div class="settings-column">
            <h3 class="setting-column-title">Names</h3>
            <NInput v-model:value="names" type="textarea" placeholder="Names" :autosize="textareaAutosize" />
          </div>
        </div>

        <div class="settings-footer">
          <NButton class="setting-save-button" @click="saveSettings">Save</NButton>
        </div>
      </div>
    </NCard>
  </NModal>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

// noinspection ES6UnusedImports
import { NButton, NCard, NInput, NModal } from 'naive-ui';

import { loadSettingsFromLocalstorage, saveSettingsToLocalstorage } from '@services/settings-service';

const textareaAutosize = { minRows: 3, maxRows: 20 };

const showModal = ref(false);
const rangeTo = ref('75');
const numbersToOmit = ref('');
const names = ref('');

watch(
  () => showModal.value,
  (show) => show && loadSettings(),
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
