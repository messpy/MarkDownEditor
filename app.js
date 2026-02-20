(() => {
  "use strict";

  const el = (id) => document.getElementById(id);

  const editor = el("editor");
  const preview = el("preview");
  const fileInput = el("fileInput");

  const btnOpen = el("btnOpen");
  const btnSave = el("btnSave");
  const btnSaveAs = el("btnSaveAs");

  const chkAutosave = el("chkAutosave");
  const statusEl = el("status");
  const fileLabel = el("fileLabel");
  const dirtyMark = el("dirtyMark");

  const STORAGE_KEY = "md_editor_state_v1";

  let currentFilename = "untitled.md";
  let isDirty = false;
  let lastSavedText = "";
  let renderTimer = null;
  let autosaveTimer = null;

  // ---- security: sanitize HTML output ----
  marked.setOptions({ gfm: true, breaks: true });

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  function setDirty(dirty) {
    isDirty = dirty;
    dirtyMark.classList.toggle("on", dirty);
  }

  function setFilename(name) {
    currentFilename = name || "untitled.md";
    fileLabel.textContent = currentFilename;
  }

  function renderNow() {
    // marked -> DOMPurify (XSS対策)
    const html = marked.parse(editor.value);
    preview.innerHTML = DOMPurify.sanitize(html);
  }

  function scheduleRender() {
    // デバウンス（大きいMD対策）
    if (renderTimer) clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      renderNow();
      renderTimer = null;
    }, 120);
  }

  function saveToLocalStorage() {
    const data = {
      filename: currentFilename,
      text: editor.value,
      ts: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function scheduleAutosave() {
    if (!chkAutosave.checked) return;
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      saveToLocalStorage();
      setStatus("Autosaved");
      autosaveTimer = null;
    }, 600);
  }

  function downloadAsFile(filename, text) {
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function normalizeMdName(name) {
    let n = (name || "").trim();
    if (!n) n = "untitled.md";
    if (!n.toLowerCase().endsWith(".md") && !n.toLowerCase().endsWith(".markdown")) n += ".md";
    return n;
  }

  async function openFileFlow() {
    fileInput.value = "";
    fileInput.click();
  }

  function loadFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      editor.value = String(e.target.result || "");
      setFilename(file.name);
      lastSavedText = editor.value;
      setDirty(false);
      renderNow();
      saveToLocalStorage();
      setStatus(`Loaded: ${file.name}`);
    };
    reader.readAsText(file);
  }

  function saveFlow(askName) {
    let name = currentFilename;
    if (askName || !name || name === "untitled.md") {
      name = normalizeMdName(prompt("保存するファイル名", currentFilename));
      setFilename(name);
    }

    downloadAsFile(name, editor.value);

    lastSavedText = editor.value;
    setDirty(false);
    saveToLocalStorage();
    setStatus(`Saved: ${name}`);
  }

  function restoreFromLocalStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data.text !== "string") return false;

      setFilename(data.filename || "untitled.md");
      editor.value = data.text;
      lastSavedText = editor.value;
      setDirty(false);
      renderNow();
      setStatus("Restored from localStorage");
      return true;
    } catch {
      return false;
    }
  }

  // ---- events ----
  editor.addEventListener("input", () => {
    scheduleRender();
    scheduleAutosave();

    const dirty = editor.value !== lastSavedText;
    setDirty(dirty);
    if (dirty) setStatus("Editing...");
  });

  btnOpen.addEventListener("click", openFileFlow);
  fileInput.addEventListener("change", (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (file) loadFromFile(file);
  });

  btnSave.addEventListener("click", () => saveFlow(false));
  btnSaveAs.addEventListener("click", () => saveFlow(true));

  document.addEventListener("keydown", (ev) => {
    if (ev.ctrlKey && (ev.key === "s" || ev.key === "S")) {
      ev.preventDefault();
      saveFlow(false);
    }
    if (ev.ctrlKey && (ev.key === "o" || ev.key === "O")) {
      ev.preventDefault();
      openFileFlow();
    }
  });

  // before unload warn
  window.addEventListener("beforeunload", (ev) => {
    if (!isDirty) return;
    ev.preventDefault();
    ev.returnValue = "";
  });

  // ---- init ----
  const restored = restoreFromLocalStorage();
  if (!restored) {
    setFilename("untitled.md");
    editor.value = "# Markdown Editor\n\n- Ctrl+S: Save\n- Ctrl+O: Open\n";
    lastSavedText = editor.value;
    setDirty(false);
    renderNow();
  } else {
    setDirty(false);
  }
})();