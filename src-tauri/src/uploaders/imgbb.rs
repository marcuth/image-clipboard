use crate::http::{agent, url_encode};

const ENDPOINT: &str = "https://api.imgbb.com/1/upload";

pub fn upload(base64_data: &str, filename: &str, api_key: &str) -> Result<String, String> {
    let key = api_key.trim();
    if key.is_empty() {
        return Err("ImgBB API key is required".to_string());
    }

    let image = match base64_data.find(',') {
        Some(idx) => &base64_data[idx + 1..],
        None => base64_data,
    };
    let name = filename
        .trim()
        .trim_end_matches(".png")
        .trim_end_matches(".jpg");
    let body = format!(
        "image={}&name={}",
        url_encode(image.trim()),
        url_encode(name)
    );

    let mut response = agent()
        .post(&format!("{}?key={}", ENDPOINT, url_encode(key)))
        .header("Content-Type", "application/x-www-form-urlencoded")
        .send(body.as_bytes())
        .map_err(|e| format!("Upload error: {}", e))?;

    let text = response
        .body_mut()
        .read_to_string()
        .map_err(|e| format!("Failed to read response: {}", e))?;

    parse_response(&text)
}

pub fn parse_response(text: &str) -> Result<String, String> {
    let json: serde_json::Value = serde_json::from_str(text).map_err(|_| {
        format!(
            "Unexpected response: {}",
            text.chars().take(200).collect::<String>()
        )
    })?;

    if let Some(url) = json["data"]["url"].as_str() {
        return Ok(url.to_string());
    }

    let message = json["error"]["message"].as_str().unwrap_or("Upload failed");
    Err(message.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_response() {
        assert_eq!(
            parse_response(r#"{"data":{"url":"https://i.ibb.co/x.png"},"success":true}"#).unwrap(),
            "https://i.ibb.co/x.png"
        );
        assert_eq!(
            parse_response(r#"{"error":{"message":"Invalid API v1 key."}}"#).unwrap_err(),
            "Invalid API v1 key."
        );
        assert_eq!(parse_response("{}").unwrap_err(), "Upload failed");
        assert!(parse_response("<html>")
            .unwrap_err()
            .starts_with("Unexpected response"));
    }

    #[test]
    fn requires_key() {
        assert!(upload("aGk=", "a.png", "  ").is_err());
    }
}
