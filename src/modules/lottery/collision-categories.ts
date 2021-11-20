/* eslint-disable no-bitwise */
export const defaultCategory = 2 ** 0;
export const mouseCategory = 2 ** 1;
export const boxCategory = 2 ** 2;
export const octagonCategory = 2 ** 3;
export const ballsCategory = 2 ** 4;
export const sensorCategory = 2 ** 5;
export const handCategory = 2 ** 6;

export function combineCategory(category: number[], mask?: number[]): { category: number; mask?: number } {
  let collisionFilter: { category: number; mask?: number } = { category: category.reduce((acc, val) => acc | val) };
  if (mask?.length) {
    collisionFilter = { ...collisionFilter, mask: mask?.reduce((acc, val) => acc | val) };
  }
  return collisionFilter;
}
