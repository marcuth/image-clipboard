import { EditorFooter } from "@/components/editor/editor-footer"
import { EditorHeader } from "@/components/editor/editor-header"
import { EditorStage } from "@/components/editor/editor-stage"
import { loadImageFromBlob } from "@/services/image-service"
import { WelcomeScreen } from "@/components/welcome-screen"
import { useCanvasEditor } from "@/hooks/use-canvas-editor"
import { Toaster } from "@/components/ui/sonner"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export function App() {
    const [editorOpen, setEditorOpen] = useState(false)

    // Dark theme state
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem("theme")
        return saved ? saved === "dark" : true
    })

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add("dark")
            localStorage.setItem("theme", "dark")
        } else {
            document.documentElement.classList.remove("dark")
            localStorage.setItem("theme", "light")
        }
    }, [isDark])

    // Canvas editor hook
    const {
        canvasRef,
        previewCanvasRef,
        containerRef,
        width,
        height,
        zoom,
        setZoom,
        panOffset,
        setPanOffset,
        activeTool,
        setActiveTool,
        settings,
        setSettings,
        canUndo,
        canRedo,
        undo,
        redo,
        zoomFit,
        zoom100,
        handleCopyToClipboard,
        cursorPos,
        cropRect,
        applyCrop,
        cancelCrop,
        saveDialogOpen,
        setSaveDialogOpen,
        textInput,
        setTextInput,
        commitText,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        initCanvas,
    } = useCanvasEditor(editorOpen)

    // Global Paste Listener (works on both Welcome and Editor)
    useEffect(() => {
        function handleGlobalPaste(e: ClipboardEvent) {
            // Ignore if typing inside text input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return
            }

            const items = e.clipboardData?.items
            if (!items) return

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith("image/")) {
                    const file = items[i].getAsFile()
                    if (file) {
                        e.preventDefault()
                        loadImageFromBlob(file)
                            .then((img) => {
                                setEditorOpen(true)
                                initCanvas(img)
                                toast.success(
                                    "Pasted screenshot from clipboard!",
                                )
                            })
                            .catch(() => {
                                toast.error("Failed to load pasted image.")
                            })
                        return
                    }
                }
            }
        }

        window.addEventListener("paste", handleGlobalPaste)
        return () => window.removeEventListener("paste", handleGlobalPaste)
    }, [initCanvas])

    // Mouse wheel zoom or pan in editor stage
    function handleWheel(e: React.WheelEvent<HTMLDivElement>) {
        if (e.ctrlKey || e.metaKey) {
            // Zoom
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.1 : 0.1
            setZoom(
                Math.max(0.1, Math.min(5, Number((zoom + delta).toFixed(2)))),
            )
        } else {
            // Pan
            setPanOffset((prev) => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY,
            }))
        }
    }

    function handleStartBlank(w: number, h: number, bgColor: string) {
        setEditorOpen(true)
        initCanvas(null, { width: w, height: h, backgroundColor: bgColor })
    }

    function handleLoadImage(img: HTMLImageElement) {
        setEditorOpen(true)
        initCanvas(img)
    }

    function handleReturnHome() {
        setEditorOpen(false)
    }

    return (
        <div className="w-screen h-screen overflow-hidden flex flex-col bg-background text-foreground font-sans antialiased">
            <Toaster position="bottom-right" richColors />

            {!editorOpen ? (
                <WelcomeScreen
                    onCreateCanvas={handleStartBlank}
                    onLoadImage={handleLoadImage}
                    isDark={isDark}
                    onToggleDark={() => setIsDark((prev) => !prev)}
                />
            ) : (
                <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
                    <EditorHeader
                        activeTool={activeTool}
                        onSelectTool={setActiveTool}
                        settings={settings}
                        onUpdateSettings={setSettings}
                        onHome={handleReturnHome}
                        onCopyToClipboard={handleCopyToClipboard}
                        canvasRef={canvasRef}
                        saveDialogOpen={saveDialogOpen}
                        setSaveDialogOpen={setSaveDialogOpen}
                        isDark={isDark}
                        onToggleDark={() => setIsDark((prev) => !prev)}
                    />

                    <EditorStage
                        containerRef={containerRef}
                        canvasRef={canvasRef}
                        previewCanvasRef={previewCanvasRef}
                        width={width}
                        height={height}
                        zoom={zoom}
                        panOffset={panOffset}
                        activeTool={activeTool}
                        cropRect={cropRect}
                        onApplyCrop={applyCrop}
                        onCancelCrop={cancelCrop}
                        textInput={textInput}
                        onTextInputChange={(val) =>
                            setTextInput((prev) => ({ ...prev, value: val }))
                        }
                        onCommitText={commitText}
                        onCancelText={() =>
                            setTextInput({
                                x: 0,
                                y: 0,
                                value: "",
                                visible: false,
                            })
                        }
                        settings={settings}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onWheel={handleWheel}
                    />

                    <EditorFooter
                        canUndo={canUndo}
                        canRedo={canRedo}
                        onUndo={undo}
                        onRedo={redo}
                        width={width}
                        height={height}
                        zoom={zoom}
                        onZoomChange={setZoom}
                        onZoomFit={zoomFit}
                        onZoom100={zoom100}
                        cursorPos={cursorPos}
                        activeTool={activeTool}
                    />
                </div>
            )}
        </div>
    )
}

export default App
