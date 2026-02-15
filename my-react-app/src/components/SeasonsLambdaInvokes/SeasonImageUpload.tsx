import { useRef, useState } from "react";
import type { ActiveSupportedCinema } from "../../types/cinemaSeasons";
import {
  processImageFile,
  sanitizeImageName,
  type ProcessedImage,
} from "../../utils/processImage";
import "./SeasonImageUpload.css";

const LAMBDA_URL =
  "https://3xtvetxqkvp5h5wsstfzr4hysq0isbyf.lambda-url.eu-north-1.on.aws/";

const ASSETS_BASE_URL =
  "https://kinoma-assets.s3.amazonaws.com/cinema_seasons_images";

interface Props {
  cinemaId: ActiveSupportedCinema;
  seasonKey: string;
  existingImages: string[];
}

const IMAGE_NAME_RE = /^[a-zA-Z0-9_-]+$/;

export function SeasonImageUpload({
  cinemaId,
  seasonKey,
  existingImages,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localImages, setLocalImages] = useState<string[]>([]);
  const allImages = [...existingImages, ...localImages];

  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(
    null,
  );
  const [imageName, setImageName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const nameValid = IMAGE_NAME_RE.test(imageName);

  async function handleFile(file: File) {
    setError(null);
    setSuccess(false);
    setProcessing(true);

    try {
      const processed = await processImageFile(file);
      setProcessedImage(processed);
      setImageName(sanitizeImageName(file.name));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to process image");
    } finally {
      setProcessing(false);
    }
  }

  function clearSelection() {
    setProcessedImage(null);
    setImageName("");
    setError(null);
    setSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function upload() {
    if (!processedImage || !nameValid) return;

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(LAMBDA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handler: "upload_season_image",
          cinema_id: cinemaId,
          season_key: seasonKey,
          image_name: imageName,
          image_data: processedImage.base64,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      const lookupKey: string = json.lookup_key;

      // add to local list so thumbnail appears immediately
      if (!allImages.includes(lookupKey)) {
        setLocalImages((prev) => [...prev, lookupKey]);
      }

      setSuccess(true);
      setProcessedImage(null);
      setImageName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  // ── drag handlers ──────────────────────

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave() {
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  // ── render ─────────────────────────────

  function extractName(lookupKey: string): string {
    const parts = lookupKey.split("/");
    const last = parts[parts.length - 1] ?? lookupKey;
    return last.replace(/\.webp$/, "");
  }

  function imageUrl(lookupKey: string): string {
    // Encode each path segment to handle spaces / special chars in season names
    const encoded = lookupKey
      .split("/")
      .map((seg) => encodeURIComponent(seg))
      .join("/");
    return `${ASSETS_BASE_URL}/${encoded}`;
  }

  return (
    <div>
      {/* existing images */}
      {allImages.length > 0 ? (
        <div className="siu-thumbnails">
          {allImages.map((key) => (
            <div key={key} className="siu-thumbnail">
              <img
                src={imageUrl(key)}
                alt={extractName(key)}
                loading="lazy"
              />
              <div className="siu-thumbnail-name">{extractName(key)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="siu-empty">No images yet</div>
      )}

      {/* drop zone */}
      {!processedImage && !processing && (
        <div
          className={`siu-dropzone${isDragging ? " dragging" : ""}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          Drop an image here or click to select
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
        </div>
      )}

      {processing && (
        <div style={{ color: "#888", fontSize: "0.85rem", marginTop: 10 }}>
          Processing image...
        </div>
      )}

      {/* preview + name + upload */}
      {processedImage && (
        <div className="siu-preview">
          <img src={processedImage.dataUrl} alt="Preview" />
          <div className="siu-preview-meta">
            {processedImage.width} x {processedImage.height} WebP
          </div>

          <div className="siu-name-group">
            <div className="siu-name-label">Image name</div>
            <input
              className="siu-name-input"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="e.g. hero, banner_1"
            />
            {imageName && !nameValid && (
              <div className="siu-name-error">
                Only letters, digits, hyphens, and underscores allowed
              </div>
            )}
          </div>

          <div className="siu-actions">
            <button
              className="siu-upload-btn"
              disabled={uploading || !nameValid || !imageName}
              onClick={upload}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button
              className="siu-cancel-btn"
              onClick={clearSelection}
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && <div className="siu-feedback error">{error}</div>}
      {success && (
        <div className="siu-feedback success">Image uploaded!</div>
      )}
    </div>
  );
}
