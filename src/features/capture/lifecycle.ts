import { registerMediaStop } from "@/lib/mediaLifecycle";

export function observeCaptureLifecycle(
  stop: () => void,
  page: EventTarget = window,
  visibility: EventTarget & { hidden: boolean } = document,
) {
  const hidden = () => {
    if (visibility.hidden) stop();
  };
  const dispose = registerMediaStop(stop);
  page.addEventListener("pagehide", stop);
  visibility.addEventListener("visibilitychange", hidden);
  return () => {
    page.removeEventListener("pagehide", stop);
    visibility.removeEventListener("visibilitychange", hidden);
    dispose();
  };
}
