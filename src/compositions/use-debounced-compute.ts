import { Ref, readonly, DeepReadonly, watch, ref, UnwrapRef } from 'vue';

export function useDebouncedCompute<T>(
  watches: Ref[] | { debounced: Ref[]; immediately: Ref[] },
  callback: () => T,
  debounceTime = 300,
): DeepReadonly<Ref<UnwrapRef<T>>> {
  const computed = ref<T>(callback());
  const timeout = ref<ReturnType<typeof setTimeout>>();

  const clear = (): void => {
    if (timeout.value) {
      clearTimeout(timeout.value);
    }
  };
  const update = (): void => {
    computed.value = callback() as UnwrapRef<T>;
  };

  let watchSources: Ref[];
  if (Array.isArray(watches)) {
    watchSources = watches;
  } else {
    watchSources = watches.debounced;
    watch(watches.immediately, () => {
      clear();
      update();
    });
  }

  watch(watchSources, () => {
    clear();
    timeout.value = setTimeout(update, debounceTime);
  });

  return readonly(computed);
}
