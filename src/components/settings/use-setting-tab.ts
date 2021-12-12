import { onMounted, onUnmounted, inject, watch } from 'vue';

import { provideAttachSettingTabKey } from '@components/settings/settings-context';
import { SettingsModel } from '@interfaces/settings-model';

export function useSettingTab(
  props: Readonly<{ settings: SettingsModel }>,
  loadSettings: (settings: SettingsModel) => void,
  saveSettings: () => Partial<SettingsModel>,
): void {
  const attachSaving = inject(provideAttachSettingTabKey);
  onMounted(() => attachSaving?.attach(saveSettings));
  onUnmounted(() => attachSaving?.detach(saveSettings));

  loadSettings(props.settings);
  watch(() => props.settings, loadSettings);
}
