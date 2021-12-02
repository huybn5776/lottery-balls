/* eslint-disable no-bitwise, no-param-reassign */
import { Body } from 'matter-js';

export const defaultCategory = 2 ** 0;
export const mouseCategory = 2 ** 1;
export const boxCategory = 2 ** 2;
export const octagonCategory = 2 ** 3;
export const ballsCategory = 2 ** 4;
export const ropeCategory = 2 ** 7;
export const clawCategory = 2 ** 8;
export const pickedBallCategory = 2 ** 9;
export const slotArrayCategory = 2 ** 10;
export const transferSensorCategory = 2 ** 11;
export const transferredBallCategory = 2 ** 12;

export function combineCategory(category: number[], mask?: number[]): { category: number; mask?: number } {
  let collisionFilter: { category: number; mask?: number } = { category: mergeCategory(category) };
  if (mask?.length) {
    collisionFilter = { ...collisionFilter, mask: mask?.reduce((acc, val) => acc | val) };
  }
  return collisionFilter;
}

export function addCategory(body: Body, categories: number[]): void {
  body.collisionFilter = {
    ...body.collisionFilter,
    category: (body.collisionFilter.category || 0) | mergeCategory(categories),
  };
}

export function addMaskCategory(body: Body, categories: number[]): void {
  body.collisionFilter = {
    ...body.collisionFilter,
    mask: (body.collisionFilter.mask || 0) | mergeCategory(categories),
  };
}

export function removeCategory(body: Body, categories: number[]): void {
  body.collisionFilter = {
    ...body.collisionFilter,
    category: (body.collisionFilter.category || 0) & ~mergeCategory(categories),
  };
}

export function removeMaskCategory(body: Body, categories: number[]): void {
  body.collisionFilter = {
    ...body.collisionFilter,
    mask: (body.collisionFilter.mask || 0) & ~mergeCategory(categories),
  };
}

function mergeCategory(categories: number[]): number {
  return categories.reduce((acc, val) => acc | val);
}
