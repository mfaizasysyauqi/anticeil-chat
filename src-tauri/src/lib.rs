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

  function mountControls() {
    injectStyles();
    if (document.querySelector('.anticeil-desktop-window-controls')) return;

    const header = document.querySelector('header[role="banner"]');
    if (!header || document.getElementById('anticeil-titlebar-controls')) return;

    header.setAttribute('data-tauri-drag-region', '');

    const container = document.createElement('div');
    container.id = 'anticeil-titlebar-controls';
    container.className = 'no-drag';
    container.style.cssText = 'display:inline-flex;align-items:center;height:100%;margin-left:6px;border-left:1px solid rgba(255,255,255,0.12);padding-left:2px;-webkit-app-region:no-drag;pointer-events:auto;z-index:9999;';

    container.addEventListener('mousedown', (e) => e.stopPropagation());
    container.addEventListener('pointerdown', (e) => e.stopPropagation());

    function createBtn(title, svgHtml, action, isClose) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = isClose ? 'anticeil-win-btn anticeil-win-close' : 'anticeil-win-btn';
      btn.title = title;
      btn.setAttribute('aria-label', title);
      btn.innerHTML = svgHtml;

      const handler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        invokeAction(action);
      };

      btn.addEventListener('click', handler);
      btn.addEventListener('mousedown', (e) => e.stopPropagation());
      btn.addEventListener('pointerdown', (e) => e.stopPropagation());
      return btn;
    }

    const minBtn = createBtn('Minimize', '<svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>', 'minimize', false);
    const maxBtn = createBtn('Maximize', '<svg width="10" height="10" viewBox="0 0 10 10"><rect width="8" height="8" x="1" y="1" fill="none" stroke="currentColor" stroke-width="1"/></svg>', 'toggle_maximize', false);
    const closeBtn = createBtn('Close', '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" stroke-width="1.2"/></svg>', 'close', true);

    container.appendChild(minBtn);
    container.appendChild(maxBtn);
    container.appendChild(closeBtn);

    const rightActions = header.lastElementChild;
    if (rightActions) {
      rightActions.appendChild(container);
    } else {
      header.appendChild(container);
    }

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, a, input, select, .no-drag, #anticeil-titlebar-controls, .anticeil-desktop-window-controls')) return;
      if (e.detail === 2) {
        invokeAction('toggle_maximize');
      } else if (e.button === 0) {
        invokeAction('start_dragging');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountControls);
  } else {
    mountControls();
  }
  setInterval(mountControls, 250);
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
        .initialization_script(INIT_SCRIPT)
        .build()?;
      let _ = window.set_decorations(false);
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
