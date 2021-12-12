import { InjectionKey } from 'vue';

import { SettingsModel } from '@interfaces/settings-model';

export const provideAttachSettingTabKey: InjectionKey<{
  attach: (tab: SettingTab) => void;
  detach: (tab: SettingTab) => void;
}> = Symbol('provideAttachSettingTabKey');
export type SettingTab = () => Partial<SettingsModel>;
