import type { DeepReadonly, Ref } from "vue";

import { inject, onUnmounted, readonly, ref } from "vue";

import type { KeypressEvent } from "@/platform/keybindings/renderer/keypress-event-bus";

import { InstantiationServiceKey } from "@/ui/injection-keys";
import { IKeypressEventBus } from "@/platform/keybindings/renderer/keypress-event-bus";

export interface UseKeypressReturn {
  history: DeepReadonly<Ref<KeypressEvent[]>>;
  last: DeepReadonly<Ref<KeypressEvent | null>>;
  clear: () => void;
}

export function useKeypress(options?: { maxLength?: number }): UseKeypressReturn {
  const instantiationService = inject(InstantiationServiceKey);
  if (!instantiationService) {
    throw new Error("InstantiationService not provided");
  }

  const maxLength = options?.maxLength ?? 50;

  const bus = instantiationService.invokeFunction(accessor =>
    accessor.get(IKeypressEventBus),
  );

  const history = ref<KeypressEvent[]>([]);
  const last = ref<KeypressEvent | null>(null);

  const disposable = bus.onKeypress((event) => {
    last.value = event;
    history.value = [event, ...history.value].slice(0, maxLength);
  });

  onUnmounted(() => {
    disposable.dispose();
  });

  function clear(): void {
    history.value = [];
    last.value = null;
  }

  return {
    history: readonly(history),
    last: readonly(last),
    clear,
  };
}
