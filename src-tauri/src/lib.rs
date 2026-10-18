/// Startet Kosmonster als Desktopanwendung. Das Spiel selbst läuft komplett im Webview.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("Kosmonster konnte nicht gestartet werden");
}
