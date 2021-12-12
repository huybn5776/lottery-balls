import { SettingsModel } from '@interfaces/settings-model';

export function loadSettingsFromLocalstorage(): SettingsModel {
  return {
    ballLabelMode: localStorage.getItem('ballLabelMode') || undefined,
    rangeTo: getNumberItem('rangeTo'),
    numbersToOmit: localStorage
      .getItem('numbersToOmit')
      ?.split(',')
      .filter((n) => !!n)
      .map((n) => +n)
      .filter(Number.isInteger),
    ballLabels: getArrayItem('ballLabels'),
    names: getArrayItem('names'),
  };
}

export function saveSettingsToLocalstorage(settings: SettingsModel): void {
  setItem('ballLabelMode', settings.ballLabelMode);
  setItem('rangeTo', settings.rangeTo);
  setItem('numbersToOmit', settings.numbersToOmit?.join(','));
  setItem('ballLabels', settings.ballLabels?.join(','));
  setItem('names', settings.names?.join(','));
}

function setItem(key: string, value: unknown): void {
  if (value === undefined || value === '') {
    return;
  }
  localStorage.setItem(key, `${value}`);
}

function getNumberItem(key: string): number | undefined {
  const value = localStorage.getItem(key);
  const numberValue = value ? +value : undefined;
  return Number.isInteger(numberValue) ? numberValue : undefined;
}

function getArrayItem(key: string): string[] | undefined {
  return localStorage
    .getItem(key)
    ?.split(',')
    .map((v) => v.trim())
    .filter((v) => !!v);
}
