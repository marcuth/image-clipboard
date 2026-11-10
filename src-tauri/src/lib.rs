mod http;
mod uploaders;

use base64::Engine;
use tauri::async_runtime::spawn_blocking;

use uploaders::bigjpg::{self, EnlargeOptions};

async fn blocking<T, F>(f: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce() -> Result<T, String> + Send + 'static,
{
    spawn_blocking(f)
        .await
        .map_err(|e| format!("Task failed: {}", e))?
}

#[tauri::command]
async fn upload_to_catbox(base64_data: String, filename: String) -> Result<String, String> {
    blocking(move || uploaders::catbox::upload(&base64_data, &filename)).await
}

#[tauri::command]
async fn upload_to_imgbb(
    base64_data: String,
    filename: String,
    api_key: String,
) -> Result<String, String> {
    blocking(move || uploaders::imgbb::upload(&base64_data, &filename, &api_key)).await
}

#[tauri::command]
async fn bigjpg_enlarge(
    base64_data: String,
    filename: String,
    scale: u8,
    style: String,
    noise: i8,
) -> Result<String, String> {
    blocking(move || {
        let bytes = bigjpg::enlarge(
            &base64_data,
            &filename,
            &EnlargeOptions {
                scale,
                style,
                noise,
            },
        )?;
        Ok(to_data_url(&bytes))
    })
    .await
}

fn to_data_url(bytes: &[u8]) -> String {
    let mime = if bytes.starts_with(&[0xff, 0xd8]) {
        "image/jpeg"
    } else {
        "image/png"
    };
    format!(
        "data:{};base64,{}",
        mime,
        base64::engine::general_purpose::STANDARD.encode(bytes)
    )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            upload_to_catbox,
            upload_to_imgbb,
            bigjpg_enlarge
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_data_urls() {
        assert!(to_data_url(&[0xff, 0xd8, 1]).starts_with("data:image/jpeg;base64,"));
        assert!(to_data_url(&[0x89, 0x50]).starts_with("data:image/png;base64,"));
    }
}
