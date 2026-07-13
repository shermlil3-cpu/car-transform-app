"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Upload, Link as LinkIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

export function ImageDropzone({ label, value, onChange }: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Upload failed.");
          return;
        }
        onChange(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFilePick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFilePick}
        />

        {value ? (
          <div className="relative w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt={label} className="mx-auto max-h-40 rounded-md object-contain" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="absolute -right-2 -top-2 rounded-full bg-background p-1 shadow"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : isUploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">Drag & drop, or click to browse</p>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="...or paste an image URL"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-xs"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
