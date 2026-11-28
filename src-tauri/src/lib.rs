use tauri::Manager;

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
        padding-right: 0 !important;
      }
      header[role="banner"] button,
      header[role="banner"] a,
      header[role="banner"] input,
      .no-drag,
      #anticeil-titlebar-controls {
        -webkit-app-region: no-drag !important;
      }
      .anticeil-win-btn {
        width: 28px;
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

  function invokeCmd(name) {
    if (window.__TAURI_INTERNALS__ && window.__TAURI_INTERNALS__.invoke) {
      window.__TAURI_INTERNALS__.invoke(name);
    } else if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
      window.__TAURI__.core.invoke(name);
    }
  }

  function mountControls() {
    injectStyles();
    const header = document.querySelector('header[role="banner"]');
    if (!header || document.getElementById('anticeil-titlebar-controls')) return;

    header.setAttribute('data-tauri-drag-region', '');

    const container = document.createElement('div');
    container.id = 'anticeil-titlebar-controls';
    container.className = 'no-drag';
    container.style.cssText = 'display:inline-flex;align-items:center;height:100%;margin-left:4px;-webkit-app-region:no-drag;';

    const minBtn = document.createElement('button');
    minBtn.className = 'anticeil-win-btn';
    minBtn.title = 'Minimize';
    minBtn.innerHTML = '<svg width="10" height="1" viewBox="0 0 10 1"><rect width="10" height="1" fill="currentColor"/></svg>';
    minBtn.onclick = (e) => { e.stopPropagation(); invokeCmd('minimize_window'); };

    const maxBtn = document.createElement('button');
    maxBtn.className = 'anticeil-win-btn';
    maxBtn.title = 'Maximize';
    maxBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10"><rect width="8" height="8" x="1" y="1" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
    maxBtn.onclick = (e) => { e.stopPropagation(); invokeCmd('toggle_maximize_window'); };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'anticeil-win-btn anticeil-win-close';
    closeBtn.title = 'Close';
    closeBtn.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" stroke-width="1.2"/></svg>';
    closeBtn.onclick = (e) => { e.stopPropagation(); invokeCmd('close_window'); };

    container.appendChild(minBtn);
    container.appendChild(maxBtn);
    container.appendChild(closeBtn);
    header.appendChild(container);

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, a, input, select, .no-drag, #anticeil-titlebar-controls')) return;
      if (e.detail === 2) {
        invokeCmd('toggle_maximize_window');
      } else if (e.button === 0) {
        invokeCmd('start_drag_window');
      }
    });
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
        .initialization_script(INIT_SCRIPT)
        .build()?;
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
