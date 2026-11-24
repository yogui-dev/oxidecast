use tauri::Manager;

pub mod engine;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if let Some(win) = app.get_webview_window("main") {
                eprintln!("[OxideCast] Ventana 'main' encontrada. Mostrando y enfocando...");
                let _ = win.show();
                let _ = win.set_focus();
            } else {
                eprintln!("[OxideCast] Ventana 'main' NO encontrada en config. Creando dinámicamente...");
                let win = tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::default())
                    .title("OxideCast")
                    .inner_size(1280.0, 720.0)
                    .resizable(true)
                    .center()
                    .visible(true)
                    .build();
                match win {
                    Ok(w) => {
                        let _ = w.show();
                        let _ = w.set_focus();
                        eprintln!("[OxideCast] Ventana 'main' creada exitosamente.");
                    }
                    Err(e) => {
                        eprintln!("[OxideCast] Error al crear ventana 'main': {:?}", e);
                    }
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
