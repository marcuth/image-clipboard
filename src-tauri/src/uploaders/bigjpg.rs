use std::{
    thread::sleep,
    time::{Duration, Instant},
};

use serde_json::{json, Value};

use crate::http::{agent, decode_base64, mime_from_filename, url_encode};

const BASE_URL: &str = "https://bigjpg.com";
const POLL_INTERVAL: Duration = Duration::from_secs(3);
const TIMEOUT: Duration = Duration::from_secs(10 * 60);

pub struct EnlargeOptions {
    pub scale: u8,
    pub style: String,
    pub noise: i8,
}

/// Reads `(width, height)` from PNG, JPEG, GIF and WebP headers.
pub fn image_size(data: &[u8]) -> Option<(u32, u32)> {
    png(data)
        .or_else(|| jpeg(data))
        .or_else(|| gif(data))
        .or_else(|| webp(data))
}

fn be32(d: &[u8], o: usize) -> u32 {
    u32::from_be_bytes([d[o], d[o + 1], d[o + 2], d[o + 3]])
}
fn be16(d: &[u8], o: usize) -> u32 {
    u16::from_be_bytes([d[o], d[o + 1]]) as u32
}
fn le16(d: &[u8], o: usize) -> u32 {
    u16::from_le_bytes([d[o], d[o + 1]]) as u32
}
fn le24(d: &[u8], o: usize) -> u32 {
    d[o] as u32 | (d[o + 1] as u32) << 8 | (d[o + 2] as u32) << 16
}

fn png(d: &[u8]) -> Option<(u32, u32)> {
    if d.len() < 24 || d[0] != 0x89 || d[1] != 0x50 {
        return None;
    }
    Some((be32(d, 16), be32(d, 20)))
}

fn gif(d: &[u8]) -> Option<(u32, u32)> {
    if d.len() < 10 || d[0] != 0x47 || d[1] != 0x49 {
        return None;
    }
    Some((le16(d, 6), le16(d, 8)))
}

fn jpeg(d: &[u8]) -> Option<(u32, u32)> {
    if d.len() < 4 || d[0] != 0xff || d[1] != 0xd8 {
        return None;
    }
    let mut offset = 2;
    while offset + 9 < d.len() {
        if d[offset] != 0xff {
            offset += 1;
            continue;
        }
        let marker = d[offset + 1];
        // SOF0-SOF15, excluding DHT (c4), JPG (c8) and DAC (cc)
        if (0xc0..=0xcf).contains(&marker) && ![0xc4, 0xc8, 0xcc].contains(&marker) {
            return Some((be16(d, offset + 7), be16(d, offset + 5)));
        }
        offset += 2 + be16(d, offset + 2) as usize;
    }
    None
}

fn webp(d: &[u8]) -> Option<(u32, u32)> {
    if d.len() < 30 || &d[8..12] != b"WEBP" {
        return None;
    }
    match &d[12..16] {
        b"VP8X" => Some((1 + le24(d, 24), 1 + le24(d, 27))),
        b"VP8L" => {
            let bits = u32::from_le_bytes([d[21], d[22], d[23], d[24]]);
            Some(((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1))
        }
        b"VP8 " => Some((le16(d, 26) & 0x3fff, le16(d, 28) & 0x3fff)),
        _ => None,
    }
}

type HttpResult = Result<ureq::http::Response<ureq::Body>, ureq::Error>;

fn site_get(path: &str) -> Result<Value, String> {
    let response = agent()
        .get(&format!("{}{}", BASE_URL, path))
        .header("Referer", "https://bigjpg.com/")
        .header("Accept", "application/json, text/plain, */*")
        .call();
    read_json(response)
}

fn site_post(path: &str, form: &str) -> Result<Value, String> {
    let response = agent()
        .post(&format!("{}{}", BASE_URL, path))
        .header("Referer", "https://bigjpg.com/")
        .header("Accept", "application/json, text/plain, */*")
        .header(
            "Content-Type",
            "application/x-www-form-urlencoded; charset=UTF-8",
        )
        .send(form.as_bytes());
    read_json(response)
}

fn read_json(response: HttpResult) -> Result<Value, String> {
    let mut response = response.map_err(|e| format!("Bigjpg request failed: {}", e))?;
    let status = response.status().as_u16();
    let text = response
        .body_mut()
        .read_to_string()
        .map_err(|e| format!("Failed to read Bigjpg response: {}", e))?;
    parse_json(status, &text)
}

pub fn parse_json(status: u16, text: &str) -> Result<Value, String> {
    let body: Value = serde_json::from_str(text).map_err(|_| {
        format!(
            "Unexpected response ({}): {}",
            status,
            text.chars().take(200).collect::<String>()
        )
    })?;
    if let Some(s) = body.get("status").and_then(Value::as_str) {
        if s != "ok" {
            return Err(format!("Bigjpg error: {}", s));
        }
    }
    Ok(body)
}

fn upload(data: &[u8], filename: &str, filetype: &str) -> Result<String, String> {
    let form = format!(
        "filename={}&filetype={}",
        url_encode(filename),
        url_encode(filetype)
    );
    let sign = site_post("/api/sign_upload", &form)?;
    let (Some(url), Some(file_url)) = (sign["url"].as_str(), sign["fileurl"].as_str()) else {
        return Err("sign_upload response missing url/fileurl".to_string());
    };

    let mut put = agent()
        .put(url)
        .header("Content-Type", filetype)
        .send(data)
        .map_err(|e| format!("Upload failed: {}", e))?;
    let status = put.status().as_u16();
    if !(200..300).contains(&status) {
        let detail = put.body_mut().read_to_string().unwrap_or_default();
        return Err(format!(
            "Upload failed with status {}: {}",
            status,
            detail.chars().take(200).collect::<String>()
        ));
    }
    Ok(file_url.to_string())
}

pub fn task_conf(
    opts: &EnlargeOptions,
    filename: &str,
    size: usize,
    w: u32,
    h: u32,
    input: &str,
) -> Value {
    json!({
        "x2": opts.scale.to_string(),
        "style": opts.style,
        "noise": opts.noise.to_string(),
        "file_name": filename,
        "files_size": size,
        "file_height": h,
        "file_width": w,
        "input": input,
        "storage": "oss",
    })
}

fn create_task(conf: &Value) -> Result<String, String> {
    let result = site_post("/task", &format!("conf={}", url_encode(&conf.to_string())))?;
    result["info"]
        .as_str()
        .map(str::to_string)
        .ok_or_else(|| "Task response missing id".to_string())
}

/// Returns `Some(url)` when finished, `None` while pending.
pub fn task_state(result: &Value, id: &str) -> Result<Option<String>, String> {
    let raw = result
        .get(id)
        .and_then(Value::as_array)
        .ok_or_else(|| format!("Task {} not found in response", id))?;
    match raw.first().and_then(Value::as_str) {
        Some("success") => raw
            .get(1)
            .and_then(Value::as_str)
            .map(|u| Some(u.to_string()))
            .ok_or_else(|| "Task finished without a result URL".to_string()),
        Some("error") => Err(format!("Task {} failed", id)),
        _ => Ok(None),
    }
}

fn wait_for_task(id: &str) -> Result<String, String> {
    let deadline = Instant::now() + TIMEOUT;
    loop {
        let fids = json!([id]).to_string();
        let result = site_get(&format!("/free?fids={}", url_encode(&fids)))?;
        if let Some(url) = task_state(&result, id)? {
            return Ok(url);
        }
        if Instant::now() + POLL_INTERVAL > deadline {
            return Err(format!("Task {} timed out", id));
        }
        sleep(POLL_INTERVAL);
    }
}

fn download(url: &str) -> Result<Vec<u8>, String> {
    let mut response = agent()
        .get(url)
        .call()
        .map_err(|e| format!("Download failed: {}", e))?;
    let status = response.status().as_u16();
    if !(200..300).contains(&status) {
        return Err(format!("Download failed with status {}", status));
    }
    response
        .body_mut()
        .with_config()
        .limit(512 * 1024 * 1024)
        .read_to_vec()
        .map_err(|e| format!("Download failed: {}", e))
}

/// Uploads the image, enlarges it and returns the resulting image bytes.
pub fn enlarge(
    base64_data: &str,
    filename: &str,
    opts: &EnlargeOptions,
) -> Result<Vec<u8>, String> {
    if ![2, 4, 8, 16].contains(&opts.scale) {
        return Err("Scale must be 2, 4, 8 or 16".to_string());
    }
    if !["art", "photo"].contains(&opts.style.as_str()) {
        return Err("Style must be \"art\" or \"photo\"".to_string());
    }
    if !(-1..=3).contains(&opts.noise) {
        return Err("Noise must be between -1 and 3".to_string());
    }

    let data = decode_base64(base64_data)?;
    let (w, h) = image_size(&data).ok_or("Could not read image size")?;
    let name = if filename.trim().is_empty() {
        "image.png"
    } else {
        filename.trim()
    };

    let file_url = upload(&data, name, mime_from_filename(name))?;
    let tid = create_task(&task_conf(opts, name, data.len(), w, h, &file_url))?;
    let result_url = wait_for_task(&tid)?;
    download(&result_url)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_png_size() {
        let mut d = vec![
            0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, b'I', b'H', b'D', b'R',
        ];
        d.extend_from_slice(&640u32.to_be_bytes());
        d.extend_from_slice(&480u32.to_be_bytes());
        assert_eq!(image_size(&d), Some((640, 480)));
    }

    #[test]
    fn reads_gif_size() {
        let d = [b'G', b'I', b'F', b'8', b'9', b'a', 0x20, 0x01, 0x10, 0x00];
        assert_eq!(image_size(&d), Some((288, 16)));
    }

    #[test]
    fn reads_jpeg_size() {
        let mut d = vec![0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0, 0];
        d.extend_from_slice(&[
            0xff, 0xc0, 0x00, 0x0b, 0x08, 0x01, 0xe0, 0x02, 0x80, 0x01, 0x01,
        ]);
        assert_eq!(image_size(&d), Some((640, 480)));
    }

    #[test]
    fn jpeg_without_sof_is_none() {
        let d = vec![
            0xff, 0xd8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ];
        assert_eq!(image_size(&d), None);
    }

    fn webp_header(chunk: &[u8; 4]) -> Vec<u8> {
        let mut d = vec![0u8; 30];
        d[0..4].copy_from_slice(b"RIFF");
        d[8..12].copy_from_slice(b"WEBP");
        d[12..16].copy_from_slice(chunk);
        d
    }

    #[test]
    fn reads_webp_sizes() {
        let mut x = webp_header(b"VP8X");
        x[24..27].copy_from_slice(&[0x7f, 0x02, 0x00]);
        x[27..30].copy_from_slice(&[0xdf, 0x01, 0x00]);
        assert_eq!(image_size(&x), Some((640, 480)));

        let mut l = webp_header(b"VP8L");
        let bits: u32 = 639 | (479 << 14);
        l[21..25].copy_from_slice(&bits.to_le_bytes());
        assert_eq!(image_size(&l), Some((640, 480)));

        let mut v = webp_header(b"VP8 ");
        v[26..28].copy_from_slice(&640u16.to_le_bytes());
        v[28..30].copy_from_slice(&480u16.to_le_bytes());
        assert_eq!(image_size(&v), Some((640, 480)));

        assert_eq!(image_size(&webp_header(b"XXXX")), None);
    }

    #[test]
    fn unknown_formats_are_none() {
        assert_eq!(image_size(b"nope"), None);
        assert_eq!(image_size(&[0u8; 64]), None);
    }

    #[test]
    fn parses_site_json() {
        assert!(parse_json(200, r#"{"status":"ok"}"#).is_ok());
        assert_eq!(
            parse_json(200, r#"{"status":"fail_limit"}"#).unwrap_err(),
            "Bigjpg error: fail_limit"
        );
        assert!(parse_json(500, "<html>").unwrap_err().contains("500"));
        assert!(parse_json(200, r#"{"info":"1"}"#).is_ok());
    }

    #[test]
    fn builds_conf() {
        let opts = EnlargeOptions {
            scale: 4,
            style: "photo".into(),
            noise: 1,
        };
        let conf = task_conf(&opts, "a.png", 10, 2, 3, "http://x");
        assert_eq!(conf["x2"], "4");
        assert_eq!(conf["noise"], "1");
        assert_eq!(conf["file_width"], 2);
        assert_eq!(conf["file_height"], 3);
        assert_eq!(conf["storage"], "oss");
    }

    #[test]
    fn interprets_task_state() {
        let ok = json!({"t1": ["success", "http://r"]});
        assert_eq!(task_state(&ok, "t1").unwrap(), Some("http://r".to_string()));
        assert!(task_state(&json!({"t1": ["success"]}), "t1").is_err());
        assert!(task_state(&json!({"t1": ["error"]}), "t1").is_err());
        assert_eq!(task_state(&json!({"t1": ["process"]}), "t1").unwrap(), None);
        assert!(task_state(&json!({}), "t1").is_err());
    }

    #[test]
    fn validates_options() {
        let bad = |scale, style: &str, noise| {
            enlarge(
                "aGk=",
                "a.png",
                &EnlargeOptions {
                    scale,
                    style: style.into(),
                    noise,
                },
            )
        };
        assert!(bad(3, "art", 0).unwrap_err().contains("Scale"));
        assert!(bad(2, "x", 0).unwrap_err().contains("Style"));
        assert!(bad(2, "art", 9).unwrap_err().contains("Noise"));
        assert!(bad(2, "art", 0).unwrap_err().contains("image size"));
    }
}
