import { useEffect, useRef, useState } from "react";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export default function AppInstall() {
  const [standalone, setStandalone] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("daylight.install.dismissed") === "yes";
    } catch {
      return false;
    }
  });
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [instructions, setInstructions] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const installed = () => setStandalone(true);
    const mode = window.matchMedia("(display-mode: standalone)");
    const change = () =>
      setStandalone(
        mode.matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone ===
            true,
      );
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    mode.addEventListener("change", change);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
      mode.removeEventListener("change", change);
    };
  }, []);
  useEffect(() => {
    if (instructions) dialog.current?.showModal();
  }, [instructions]);
  if (standalone || dismissed) return null;
  return (
    <>
      <aside className="app-install" aria-label="安装 Daylight">
        <img
          src="/pink-sun-192.png"
          alt="粉红色像素太阳"
          width="40"
          height="40"
        />
        <span>
          <b>把小太阳放到手机桌面</b>
          <small>从主屏幕打开，享受完整 App 体验</small>
        </span>
        <button
          className="text-button"
          onClick={async () => {
            if (prompt) {
              await prompt.prompt();
              const result = await prompt.userChoice;
              setPrompt(null);
              if (result.outcome === "accepted") setStandalone(true);
            } else setInstructions(true);
          }}
        >
          添加
        </button>
        <button
          className="icon-button"
          aria-label="暂时关闭安装提示"
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem("daylight.install.dismissed", "yes");
            } catch {
              /* The hint can still be dismissed when storage is unavailable. */
            }
          }}
        >
          ×
        </button>
      </aside>
      {instructions && (
        <dialog
          ref={dialog}
          className="install-dialog"
          aria-labelledby="install-title"
          onCancel={() => setInstructions(false)}
        >
          <img src="/pink-sun-192.png" alt="" width="64" height="64" />
          <h2 id="install-title">让 Daylight 住进手机</h2>
          <p>
            iPhone：用 Safari
            打开，点「分享」→「添加到主屏幕」；如果看到「作为网页 App
            打开」，请保持开启。
          </p>
          <p>Android：在浏览器菜单里选择「安装应用」或「添加到主屏幕」。</p>
          <p>之后点击桌面的粉红色小太阳启动，浏览器地址栏就不会占用屏幕了。</p>
          <button className="primary" onClick={() => setInstructions(false)}>
            知道啦
          </button>
        </dialog>
      )}
    </>
  );
}
