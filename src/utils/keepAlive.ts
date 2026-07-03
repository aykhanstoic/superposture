const LOCK_ID = "postureguard-tray-keepalive";

let releaseLock: (() => void) | null = null;

function onVisibilityChange(): void {
  if (!("locks" in navigator)) return;

  if (document.hidden) {
    let release: () => void;
    const hold = new Promise<void>((resolve) => {
      release = resolve;
    });
    releaseLock = () => release!();

    navigator.locks
      .request(LOCK_ID, async () => {
        await hold;
      })
      .catch((err) =>
        console.warn("Tray keep-alive lock failed:", err),
      );
  } else if (releaseLock) {
    releaseLock();
    releaseLock = null;
  }
}

export function initTrayKeepAlive(): void {
  if (!("locks" in navigator)) {
    console.warn("Web Locks API unavailable — tray monitoring may throttle on Windows.");
    return;
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  if (document.hidden) {
    onVisibilityChange();
  }
}
