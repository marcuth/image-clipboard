# 📋 ImageClipboard

<p align="center">
  <img src="public/logo.svg" alt="ImageClipboard Logo" width="128" height="128" />
</p>

<p align="center">
  <strong>Fast, sleek, and modern desktop screenshot, drawing, and annotation suite.</strong><br />
  Built for the modern desktop with <strong>Tauri v2</strong>, <strong>React 19</strong>, <strong>Tailwind CSS 4</strong>, and <strong>shadcn/ui</strong>.
</p>

<p align="center">
  <a href="https://github.com/marcuth/image-clipboard/releases/latest"><img src="https://img.shields.io/github/v/release/marcuth/ImageClipboard?color=6366f1&label=release" alt="Latest Release" /></a>
  <a href="https://github.com/marcuth/image-clipboard/releases"><img src="https://img.shields.io/github/downloads/marcuth/ImageClipboard/total?color=10b981" alt="Downloads" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License MIT" /></a>
  <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri-v2-24C8D8?logo=tauri&logoColor=white" alt="Tauri v2" /></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" alt="React 19" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS 4" /></a>
</p>

<p align="center">
  <a href="https://github.com/marcuth/image-clipboard/releases/latest"><strong>Download Latest Release</strong></a> •
  <a href="https://github.com/marcuth/image-clipboard/releases">All Releases</a> •
  <a href="https://github.com/marcuth/image-clipboard/issues">Report Bug</a> •
  <a href="https://marcuth.dev">Author Website</a>
</p>

---

## ⚡ Highlights

ImageClipboard combines the speed and simplicity of web-based screenshot tools with the power and safety of a native desktop application. Everything happens locally on your machine—no data is sent anywhere unless you explicitly choose to upload.

- **Instant Start:** Paste image data from your clipboard (`Ctrl+V`), drag-and-drop any image file, or create a blank canvas.
- **Default Crop-First Workflow:** Opens directly with the **Crop Area** tool ready to crop unwanted borders and focus on what matters.
- **Drawing & Annotation Suite:** Smooth brush with Bézier line smoothing, straight lines with 45° angle snapping, rectangles, ellipses, arrows, text, and eyedropper color sampling.
- **Spotlight Focus (`F`):** Highlight important details with crisp spotlight apertures while blurring and dimming the background.
- **Censor & Blur (`X`):** Easily obfuscate passwords, API tokens, emails, and sensitive user data with rounded pixel blur.
- **Native Clipboard Copy (`Ctrl+C`):** Copy the annotated bitmap directly to the OS clipboard in PNG format.
- **Catbox Cloud Integration:** Direct anonymous image hosting via [Catbox](https://catbox.moe/) through native desktop HTTP requests with instant share links.
- **Modern Design:** Polished dark & light mode with shadcn/ui components, custom toolbars, zoom/pan controls, and smooth animations.

---

## 📥 Releases & Downloads

Pre-built binaries for Windows, macOS, and Linux are available on the GitHub Releases page:

👉 **[Download the Latest Release](https://github.com/marcuth/image-clipboard/releases/latest)**

| Platform    | Package Format           | Status    |
| :---------- | :----------------------- | :-------- |
| **Windows** | `.msi`, `.exe` installer | Supported |
| **macOS**   | `.dmg`, `.app`           | Supported |
| **Linux**   | `.deb`, `.AppImage`      | Supported |

---

## 🎨 Features & Capabilities

### 1. Welcome & Onboarding

- **Start From Scratch:** Blank canvas with custom dimensions or popular presets (1920×1080 FHD, 1280×720 HD, 1024×768, 1024×1024 1:1, 2048×2048) and background colors (including transparency).
- **Paste Image Data:** Global `Ctrl+V` listener captures screenshots and clipboard images from anywhere.
- **Drop Image Files:** Drag & drop support for PNG, JPG, WEBP, GIF, SVG, and BMP files or browse via the file dialog.

### 2. Annotation & Drawing Tools

| Key | Tool                      | Description                                                                                     |
| :-: | :------------------------ | :---------------------------------------------------------------------------------------------- |
| `C` | **Crop Area** _(Default)_ | Interactive crop box with darkened exterior mask, size readout, and `Enter`/`Esc` confirmation. |
| `L` | **Line**                  | Crisp straight lines. Hold `Shift` to snap angle in 45° increments.                             |
| `B` | **Smooth Brush**          | Freehand drawing with optional Bézier curve path smoothing.                                     |
| `R` | **Rectangle**             | Stroke and fill with optional rounded corners. Hold `Shift` for 1:1 square.                     |
| `E` | **Ellipse**               | Ellipses and circles. Hold `Shift` for 1:1 circle, `Ctrl` to draw from center.                  |
| `F` | **Focus Spotlight**       | Highlights a specific rectangle while blurring and dimming the background.                      |
| `X` | **Blur & Censor**         | Pixelated blur to obscure sensitive text and personal information.                              |
| `A` | **Arrow**                 | Directed arrow pointers with crisp triangular arrowheads.                                       |
| `T` | **Text**                  | In-place typography annotation with solid dark backdrop pill.                                   |
| `I` | **Eyedropper**            | Sample any pixel color directly from the canvas.                                                |
| `V` | **Select & Pan**          | Pan around the canvas or drag with mouse middle-click / mouse wheel.                            |

### 3. Contextual Properties & Controls

- **Color Popover:** Quick-palette colors, transparent fill support, and custom HEX code input.
- **Stroke Weight Slider:** Real-time thickness slider from 1px to 48px with visual line preview.
- **Undo / Redo History:** Unlimited state history stack (`Ctrl+Z` / `Ctrl+Y`).
- **Zoom Controls:** Zoom Fit, 100% Actual Size, zoom slider (10% to 500%), and zoom in/out shortcuts.

### 4. Export & Sharing

- **Copy to Clipboard (`Ctrl+C`):** Generates a PNG blob directly into the OS clipboard.
- **Local File Download:** Export as PNG, JPG (with quality slider 10%–100%), or WEBP.
- **Catbox Upload:** Direct upload to [Catbox.moe](https://catbox.moe/) powered by native Rust backend requests with no CORS issues, providing immediate shareable links.

---

## ⌨️ Keyboard Shortcuts

| Shortcut                        | Action                                               |
| :------------------------------ | :--------------------------------------------------- |
| `Ctrl + V`                      | Paste image from clipboard                           |
| `Ctrl + C`                      | Copy current canvas to clipboard                     |
| `Ctrl + S`                      | Open Export & Save dialog                            |
| `Ctrl + Z`                      | Undo last operation                                  |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Redo last operation                                  |
| `C`                             | Select Crop tool                                     |
| `L`                             | Select Line tool                                     |
| `B`                             | Select Brush tool                                    |
| `R`                             | Select Rectangle tool                                |
| `E`                             | Select Ellipse tool                                  |
| `F`                             | Select Focus Spotlight tool                          |
| `X`                             | Select Blur & Censor tool                            |
| `A`                             | Select Arrow tool                                    |
| `T`                             | Select Text tool                                     |
| `I`                             | Select Eyedropper tool                               |
| `V`                             | Select / Pan tool                                    |
| `Enter`                         | Commit active crop or text                           |
| `Escape`                        | Cancel active crop or text                           |
| `Shift` (Hold)                  | Snap angle (Line) / Force 1:1 ratio (Rect & Ellipse) |

---

## 🛠 Tech Stack

- **Framework:** [Tauri v2](https://tauri.app/)
- **Frontend:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite 7](https://vite.dev/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Icons:** [react-icons/lu](https://react-icons.github.io/react-icons/icons/lu/) (Lucide)
- **Validation:** [Zod v4](https://zod.dev/)
- **Backend:** Rust (Tauri core + ureq + base64)

---

## 🚀 Development & Build

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) & Cargo (latest stable)

### Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/marcuth/image-clipboard.git
cd ImageClipboard

# 2. Install dependencies
npm install

# 3. Start Vite frontend dev server
npm run dev

# 4. Run the full Tauri desktop application
npm run tauri dev
```

### Production Build

```bash
# Compile TypeScript & build frontend
npm run build

# Package the native desktop binary
npm run tauri build
```

The compiled desktop installer and executable will be available inside `src-tauri/target/release/bundle/`.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by **[Marcuth](https://marcuth.dev)**.
