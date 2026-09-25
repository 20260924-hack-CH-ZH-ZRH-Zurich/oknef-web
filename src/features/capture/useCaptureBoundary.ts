import { useEffect, useRef } from "react";
import { registerMediaStop } from "@/lib/mediaLifecycle";

export function useCaptureBoundary() {
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
    };
    const dispose = registerMediaStop(stop);
    window.addEventListener("pagehide", stop);
    return () => {
      state.current.mounted = false;
      window.removeEventListener("pagehide", stop);
      dispose();
    };
  }, []);
  return state;
}
