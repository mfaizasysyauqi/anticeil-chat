#[tauri::command]
fn minimize_window(window: tauri::WebviewWindow) {
  let _ = window.minimize();
}

#[tauri::command]
fn toggle_maximize_window(window: tauri::WebviewWindow) {
  if window.is_maximized().unwrap_or(false) {
    let _ = window.unmaximize();
  } else {
    let _ = window.maximize();
  }
}

#[tauri::command]
fn close_window(window: tauri::WebviewWindow) {
  let _ = window.close();
}

#[tauri::command]
fn start_drag_window(window: tauri::WebviewWindow) {
  let _ = window.start_dragging();
}

const INIT_SCRIPT: &str = r#"
(function() {
  function injectStyles() {
    if (document.getElementById('anticeil-titlebar-styles')) return;
    const style = document.createElement('style');
    style.id = 'anticeil-titlebar-styles';
    style.textContent = `
      header[role="banner"] {
        -webkit-app-region: drag !important;
        user-select: none !important;
      }
      header[role="banner"] button,
      header[role="banner"] a,
      header[role="banner"] input,
      .no-drag,
      #anticeil-titlebar-controls,
      #anticeil-titlebar-controls *,
      .anticeil-desktop-window-controls,
      .anticeil-desktop-window-controls * {
        -webkit-app-region: no-drag !important;
        pointer-events: auto !important;
      }
      .anticeil-win-btn {
        width: 32px;
        height: 28px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        color: #949ba4;
        cursor: pointer;
        transition: background-color 0.15s, color 0.15s;
        padding: 0;
        outline: none;
        -webkit-app-region: no-drag !important;
        pointer-events: auto !important;
      }
      .anticeil-win-btn svg {
        pointer-events: none !important;
      }
      .anticeil-win-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
      .anticeil-win-close:hover {
        background-color: #e81123 !important;
        color: #ffffff !important;
      }
    `;
    if (document.head) {
      document.head.appendChild(style);
    }
  }

  async function invokeAction(action) {
    // 1. Try @tauri-apps/api/window if available
    try {
      if (window.__TAURI__ && window.__TAURI__.window && window.__TAURI__.window.getCurrentWindow) {
        const win = window.__TAURI__.window.getCurrentWindow();
        if (action === 'minimize') return await win.minimize();
        if (action === 'toggle_maximize') return await win.toggleMaximize();
        if (action === 'close') return await win.close();
        if (action === 'start_dragging') return await win.startDragging();
      }
    } catch (_) {}

    // 2. Try direct plugin:window IPC
    try {
      const invoke = (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) ||
                     (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke);
      if (invoke) {
        if (action === 'minimize') return await invoke('plugin:window|minimize', { label: 'main' });
        if (action === 'toggle_maximize') return await invoke('plugin:window|toggle_maximize', { label: 'main' });
        if (action === 'close') return await invoke('plugin:window|close', { label: 'main' });
        if (action === 'start_dragging') return await invoke('plugin:window|start_dragging', { label: 'main' });
      }
    } catch (_) {}

    // 3. Fallback to custom rust commands
    try {
      const invoke = (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) ||
                     (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke);
      if (invoke) {
        if (action === 'minimize') return await invoke('minimize_window');
        if (action === 'toggle_maximize') return await invoke('toggle_maximize_window');
        if (action === 'close') return await invoke('close_window');
        if (action === 'start_dragging') return await invoke('start_drag_window');
      }
    } catch (_) {}
  }

  window.__anticeil_window_action = invokeAction;

  function initHeaderDrag() {
    injectStyles();
    const header = document.querySelector('header[role="banner"]');
    if (!header || header.hasAttribute('data-anticeil-drag-init')) return;
    header.setAttribute('data-anticeil-drag-init', 'true');
    header.setAttribute('data-tauri-drag-region', '');

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, a, input, select, .no-drag, .anticeil-desktop-window-controls')) return;
      if (e.detail === 2) {
        invokeAction('toggle_maximize');
      } else if (e.button === 0) {
        invokeAction('start_dragging');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeaderDrag);
  } else {
    initHeaderDrag();
  }
  setInterval(initHeaderDrag, 500);
})();
"#;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      minimize_window,
      toggle_maximize_window,
      close_window,
      start_drag_window
    ])
    .setup(|app| {
      let window_config = app.config().app.windows[0].clone();
      let window = tauri::WebviewWindowBuilder::from_config(app.handle(), &window_config)?
        .decorations(false)
        .shadow(true)
        .min_inner_size(860.0, 560.0)
        .initialization_script(INIT_SCRIPT)
        .build()?;
      let _ = window.set_decorations(false);
      let _ = window.set_min_size(Some(tauri::LogicalSize::new(860.0, 560.0)));
      let _ = window.navigate("https://app.anticeil.com".parse().unwrap());

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
