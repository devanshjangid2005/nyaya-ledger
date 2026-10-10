/** Minimal headless Chrome driver over the DevTools protocol (Node built-in WebSocket, no deps). */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function findBrowser(): string {
  const p = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find((x): x is string => !!x && existsSync(x));
  if (!p) throw new Error("No Chrome/Edge found; set CHROME_PATH");
  return p;
}

export async function launch() {
  const port = 9300 + Math.floor(Math.random() * 500);
  const proc = spawn(findBrowser(), ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "nl-e2e-"))}`, "about:blank"], {
    stdio: "ignore",
  });
  let wsUrl = "";
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try {
      const list = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
      wsUrl = list.find((t) => t.type === "page")?.webSocketDebuggerUrl ?? "";
    } catch {}
    if (!wsUrl) await sleep(200);
  }
  if (!wsUrl) throw new Error("Chrome did not start");

  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let seq = 0;
  const waiting = new Map<number, (v: any) => void>();
  ws.addEventListener("message", (m) => {
    const msg = JSON.parse(String(m.data));
    if (msg.id && waiting.has(msg.id)) {
      waiting.get(msg.id)!(msg);
      waiting.delete(msg.id);
    }
  });

  const cdp = (method: string, params: object = {}) =>
    new Promise<any>((resolve) => {
      const id = ++seq;
      waiting.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expr: string): Promise<any> => {
    const r = await cdp("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? "eval error");
    return r.result?.result?.value;
  };
  const waitFor = async (expr: string, label: string, ms = 60_000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (await evaluate(expr).catch(() => false)) return;
      await sleep(250);
    }
    throw new Error(`Timed out waiting for: ${label}`);
  };
  const screenshot = async () => Buffer.from((await cdp("Page.captureScreenshot", { format: "png", captureBeyondViewport: true })).result.data, "base64");
  const pdf = async () => Buffer.from((await cdp("Page.printToPDF", { printBackground: true })).result.data, "base64");
  const clickText = (text: string) =>
    evaluate(`(()=>{const b=[...document.querySelectorAll('button,a')].find(e=>e.textContent.trim()===${JSON.stringify(text)}); if(!b) throw new Error('no button: ${text}'); b.click(); return true})()`);
  /** Set a React-controlled input/select via the native setter so React sees the change. */
  const setValue = (selector: string, value: string) =>
    evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)}); if(!el) throw new Error('no element: ${selector}');
      const proto=el instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});
      el.dispatchEvent(new Event(el instanceof HTMLSelectElement?'change':'input',{bubbles:true})); return true})()`);
  const close = () => {
    ws.close();
    proc.kill();
  };
  return { cdp, evaluate, waitFor, screenshot, pdf, clickText, setValue, close };
}
