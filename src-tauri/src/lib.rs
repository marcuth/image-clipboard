use base64::Engine;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn upload_to_catbox(base64_data: String, filename: String) -> Result<String, String> {
    let clean_base64 = if let Some(idx) = base64_data.find(',') {
        &base64_data[idx + 1..]
    } else {
        &base64_data
    };

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(clean_base64)
        .map_err(|e| format!("Invalid base64 data: {}", e))?;

    let boundary = "---------------------------catboxboundary987654321";
    let mut body = Vec::new();

    // Field: reqtype = fileupload
    body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
    body.extend_from_slice(
        b"Content-Disposition: form-data; name=\"reqtype\"\r\n\r\nfileupload\r\n",
    );

    // Field: fileToUpload
    let safe_filename = if filename.trim().is_empty() {
        "screenshot.png"
    } else {
        filename.trim()
    };

    body.extend_from_slice(format!("--{}\r\n", boundary).as_bytes());
    body.extend_from_slice(
        format!(
            "Content-Disposition: form-data; name=\"fileToUpload\"; filename=\"{}\"\r\nContent-Type: image/png\r\n\r\n",
            safe_filename
        )
        .as_bytes(),
    );
    body.extend_from_slice(&bytes);
    body.extend_from_slice(b"\r\n");

    // Close boundary
    body.extend_from_slice(format!("--{}--\r\n", boundary).as_bytes());

    let content_type = format!("multipart/form-data; boundary={}", boundary);

    let mut response = ureq::post("https://catbox.moe/user/api.php")
        .header("Content-Type", &content_type)
        .send(&body)
        .map_err(|e| format!("Upload error: {}", e))?;

    let response_text = response
        .body_mut()
        .read_to_string()
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let trimmed = response_text.trim();
    if trimmed.starts_with("http") {
        Ok(trimmed.to_string())
    } else {
        Err(trimmed.to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, upload_to_catbox])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
