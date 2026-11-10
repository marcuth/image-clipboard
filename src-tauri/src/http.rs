use std::time::Duration;

use base64::Engine;

pub const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

pub fn agent() -> ureq::Agent {
    ureq::Agent::config_builder()
        .http_status_as_error(false)
        .timeout_global(Some(Duration::from_secs(120)))
        .user_agent(USER_AGENT)
        .build()
        .into()
}

pub fn decode_base64(data: &str) -> Result<Vec<u8>, String> {
    let clean = match data.find(',') {
        Some(idx) => &data[idx + 1..],
        None => data,
    };
    base64::engine::general_purpose::STANDARD
        .decode(clean.trim())
        .map_err(|e| format!("Invalid base64 data: {}", e))
}

pub fn url_encode(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for byte in value.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                out.push(byte as char)
            }
            _ => out.push_str(&format!("%{:02X}", byte)),
        }
    }
    out
}

pub fn multipart(
    fields: &[(&str, &str)],
    file_field: &str,
    filename: &str,
    mime: &str,
    bytes: &[u8],
) -> (String, Vec<u8>) {
    let boundary = "----ImageClipboardBoundary7MA4YWxkTrZu0gW";
    let mut body = Vec::with_capacity(bytes.len() + 512);

    for (name, value) in fields {
        body.extend_from_slice(
            format!(
                "--{}\r\nContent-Disposition: form-data; name=\"{}\"\r\n\r\n{}\r\n",
                boundary, name, value
            )
            .as_bytes(),
        );
    }

    let safe_filename = filename.replace(['"', '\r', '\n'], "_");
    body.extend_from_slice(
        format!(
            "--{}\r\nContent-Disposition: form-data; name=\"{}\"; filename=\"{}\"\r\nContent-Type: {}\r\n\r\n",
            boundary, file_field, safe_filename, mime
        )
        .as_bytes(),
    );
    body.extend_from_slice(bytes);
    body.extend_from_slice(format!("\r\n--{}--\r\n", boundary).as_bytes());

    (format!("multipart/form-data; boundary={}", boundary), body)
}

pub fn mime_from_filename(filename: &str) -> &'static str {
    match filename.rsplit('.').next().map(|e| e.to_lowercase()).as_deref() {
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        _ => "image/png",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decodes_plain_and_data_url_base64() {
        assert_eq!(decode_base64("aGk=").unwrap(), b"hi");
        assert_eq!(decode_base64("data:image/png;base64,aGk=").unwrap(), b"hi");
        assert!(decode_base64("!!!").is_err());
    }

    #[test]
    fn url_encodes_reserved_characters() {
        assert_eq!(url_encode("a+b/c=d e"), "a%2Bb%2Fc%3Dd%20e");
        assert_eq!(url_encode("Az09-_.~"), "Az09-_.~");
    }

    #[test]
    fn builds_multipart_body() {
        let (ct, body) = multipart(&[("reqtype", "fileupload")], "fileToUpload", "a\"b.png", "image/png", b"DATA");
        assert!(ct.starts_with("multipart/form-data; boundary="));
        let text = String::from_utf8(body).unwrap();
        assert!(text.contains("name=\"reqtype\"\r\n\r\nfileupload"));
        assert!(text.contains("filename=\"a_b.png\""));
        assert!(text.contains("DATA"));
        assert!(text.ends_with("--\r\n"));
    }

    #[test]
    fn guesses_mime() {
        assert_eq!(mime_from_filename("a.JPG"), "image/jpeg");
        assert_eq!(mime_from_filename("a.webp"), "image/webp");
        assert_eq!(mime_from_filename("a.gif"), "image/gif");
        assert_eq!(mime_from_filename("a.png"), "image/png");
        assert_eq!(mime_from_filename("a"), "image/png");
    }

    #[test]
    fn agent_builds() {
        let _ = agent();
    }
}
