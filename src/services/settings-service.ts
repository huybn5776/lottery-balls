import { SettingsModel } from '@interfaces/settings-model';

export function loadSettingsFromLocalstorage(): SettingsModel {
  return {
    rangeTo: getNumberItem('rangeTo'),
    numbersToOmit: localStorage
      .getItem('numbersToOmit')
      ?.split(',')
      .filter((n) => !!n)
      .map((n) => +n)
      .filter(Number.isInteger),
    names: localStorage
      .getItem('names')
      ?.split(',')
      .map((n) => n.trim())
      .filter((n) => !!n),
  };
}

export function saveSettingsToLocalstorage(settings: SettingsModel): void {
  localStorage.setItem('rangeTo', `${settings.rangeTo}`);
  localStorage.setItem('numbersToOmit', `${settings.numbersToOmit?.join(',')}`);
  localStorage.setItem('names', `${settings.names?.join(',')}`);
}

function getNumberItem(key: string): number | undefined {
  const value = localStorage.getItem(key);
  const numberValue = value ? +value : undefined;
  return Number.isInteger(numberValue) ? numberValue : undefined;
}
