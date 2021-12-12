<template>
  <NButton @click="showModal = true">Settings</NButton>
  <NModal v-model:show="showModal">
    <div class="settings-layout">
      <div class="setting-header">
        <h1 class="setting-title">Settings</h1>
      </div>

      <NTabs class="settings-content" type="line" @updateValue="updateSettings">
        <NTabPane class="settings-tab" name="ballLabel" tab="Ball Label">
          <BallLabelSettingTab :settings="settingsRef" />
        </NTabPane>

        <NTabPane name="giftExchange" tab="Gift exchange">
          <GiftExchangeSettingTab :settings="settingsRef" />
        </NTabPane>
      </NTabs>

      <div class="settings-footer">
        <NButton @click="showModal = false">Cancel</NButton>
        <NButton type="primary" @click="saveSettings">Save</NButton>
      </div>
    </div>
  </NModal>
</template>

<script lang="ts" setup>
import { ref, watch, onUnmounted, provide } from 'vue';

// noinspection ES6UnusedImports
import { NButton, NTabs, NTabPane, NModal } from 'naive-ui';
import { Subscription, fromEvent, filter } from 'rxjs';

import BallLabelSettingTab from '@components/settings/BallLabelSettingTab.vue';
import GiftExchangeSettingTab from '@components/settings/GiftExchangeSettingTab.vue';
import { provideAttachSettingTabKey, SettingTab } from '@components/settings/settings-context';
import { SettingsModel } from '@interfaces/settings-model';
import { loadSettingsFromLocalstorage, saveSettingsToLocalstorage } from '@services/settings-service';

let settingTabs: SettingTab[] = [];
provide(provideAttachSettingTabKey, {
  attach: (tab: SettingTab) => (settingTabs = [...settingTabs, tab]),
  detach: (tab: SettingTab) => (settingTabs = settingTabs.filter((t) => t !== tab)),
});

const props = defineProps<{ modalVisible?: boolean }>();
const emits = defineEmits<{ (modalVisible: 'update:modalVisible', value: boolean): void }>();

const settingsRef = ref<SettingsModel>({});
const showModal = ref(false);
const hotkeySubscription = ref<Subscription>();

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
  settingsRef.value = loadSettingsFromLocalstorage();
}

function registerHotkey(): void {
  hotkeySubscription.value = fromEvent<KeyboardEvent>(document.body, 'keydown')
    .pipe(filter((event) => (event.metaKey || event.ctrlKey) && event.key === 'Enter'))
    .subscribe(saveSettings);
}

function unregisterHotkey(): void {
  hotkeySubscription.value?.unsubscribe();
}

function updateSettings(): void {
  settingsRef.value = { ...settingsRef.value, ...getSettingFromTab() };
}

function getSettingFromTab(): Partial<SettingsModel> {
  return settingTabs.reduce(
    (settings, settingGetter) => ({ ...settings, ...settingGetter() }),
    {} as Partial<SettingsModel>,
  );
}

function saveSettings(): void {
  saveSettingsToLocalstorage({ ...settingsRef.value, ...getSettingFromTab() });
  showModal.value = false;
}
</script>

<style lang="scss" scoped>
@import 'SettingsModal';
</style>
