use crate::http::{agent, decode_base64, mime_from_filename, multipart};

const ENDPOINT: &str = "https://catbox.moe/user/api.php";

pub fn upload(base64_data: &str, filename: &str) -> Result<String, String> {
    let bytes = decode_base64(base64_data)?;
    let name = if filename.trim().is_empty() {
        "screenshot.png"
    } else {
        filename.trim()
    };
    let (content_type, body) = multipart(
        &[("reqtype", "fileupload")],
        "fileToUpload",
        name,
        mime_from_filename(name),
        &bytes,
    );

    let mut response = agent()
        .post(ENDPOINT)
        .header("Content-Type", &content_type)
        .send(&body[..])
        .map_err(|e| format!("Upload error: {}", e))?;

    let status = response.status().as_u16();
    let text = response
        .body_mut()
        .read_to_string()
        .map_err(|e| format!("Failed to read response: {}", e))?;

    parse_response(status, &text)
}

pub fn parse_response(status: u16, text: &str) -> Result<String, String> {
    let trimmed = text.trim();
    if (200..300).contains(&status) && trimmed.starts_with("http") {
        Ok(trimmed.to_string())
    } else if trimmed.is_empty() {
        Err(format!("Catbox responded with status {}", status))
    } else {
        Err(format!(
            "Catbox responded with status {}: {}",
            status,
            trimmed.chars().take(200).collect::<String>()
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_success_and_errors() {
        assert_eq!(
            parse_response(200, " https://files.catbox.moe/a.png\n").unwrap(),
            "https://files.catbox.moe/a.png"
        );
        assert!(parse_response(412, "").unwrap_err().contains("412"));
        assert!(parse_response(200, "No fileToUpload")
            .unwrap_err()
            .contains("No fileToUpload"));
    }

    #[test]
    fn rejects_invalid_base64() {
        assert!(upload("###", "a.png").is_err());
    }
}
