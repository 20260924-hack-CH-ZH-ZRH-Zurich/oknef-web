import { useEffect, useRef } from "react";
import { observeCaptureLifecycle } from "@/features/capture/lifecycle";

export function useCaptureBoundary(onStop?: () => void) {
  const stopped = useRef(onStop);
  stopped.current = onStop;
  const state = useRef({
    epoch: 0,
    mounted: true,
    controller: new AbortController(),
  });
  useEffect(() => {
    state.current.mounted = true;
    const stop = () => {
      state.current.epoch++;
      state.current.controller.abort();
      state.current.controller = new AbortController();
      stopped.current?.();
    };
    const dispose = observeCaptureLifecycle(stop);
    return () => {
      state.current.mounted = false;
      dispose();
    };
  }, []);
  return state;
}
