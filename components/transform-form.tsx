"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Play, AlertCircle, Image as ImageIcon } from "lucide-react";
import { ImageDropzone } from "@/components/image-dropzone";
import {
  DEFAULT_START_VEHICLE,
  DEFAULT_END_VEHICLE,
} from "@/lib/prompt-template";

type RunState = "idle" | "starting" | "polling" | "done" | "error";

export function TransformForm() {
  const [startImageUrl, setStartImageUrl] = useState("");
  const [endImageUrl, setEndImageUrl] = useState("");
  const [startVehicle, setStartVehicle] = useState(DEFAULT_START_VEHICLE);
  const [endVehicle, setEndVehicle] = useState(DEFAULT_END_VEHICLE);
  const [duration, setDuration] = useState("5");
  const [resolution, setResolution] = useState("720p");

  const [state, setState] = useState<RunState>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const pollRun = useCallback((runId: string) => {
    setState("polling");
    pollTimer.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${runId}`);
        const data = await res.json();

        if (data.error) {
          if (pollTimer.current) clearInterval(pollTimer.current);
          setErrorMsg(data.error);
          setState("error");
          return;
        }

        if (data.status === "COMPLETED") {
          if (pollTimer.current) clearInterval(pollTimer.current);
          setVideoUrl(data.videoUrl);
          setState("done");
        } else if (data.status === "FAILED" || data.status === "CANCELED") {
          if (pollTimer.current) clearInterval(pollTimer.current);
          setErrorMsg(`Generation ${data.status.toLowerCase()}.`);
          setState("error");
        }
      } catch (err) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        setErrorMsg(err instanceof Error ? err.message : "Polling failed");
        setState("error");
      }
    }, 4000);
  }, []);

  const handleGenerate = useCallback(async () => {
    setErrorMsg(null);
    setVideoUrl(null);

    if (!startImageUrl || !endImageUrl) {
      setErrorMsg("Please provide both images (upload or paste a URL).");
      setState("error");
      return;
    }

    setState("starting");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startImageUrl,
          endImageUrl,
          startVehicle,
          endVehicle,
          duration: Number(duration),
          resolution,
          aspectRatio: "4:3",
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to start generation.");
        setState("error");
        return;
      }

      pollRun(data.runId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to start generation.");
      setState("error");
    }
  }, [startImageUrl, endImageUrl, startVehicle, endVehicle, duration, resolution, pollRun]);

  const isBusy = state === "starting" || state === "polling";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Car Transformation Generator</h1>
        <p className="text-sm text-muted-foreground">
          Drop in a starting car image and an ending car image, hit Generate, and play the
          mechanical transformation video.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ImageIcon className="h-4 w-4" /> Images
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ImageDropzone
            label="Starting car"
            value={startImageUrl}
            onChange={setStartImageUrl}
          />
          <ImageDropzone
            label="Ending car"
            value={endImageUrl}
            onChange={setEndImageUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Describe the vehicles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-desc">Starting vehicle description</Label>
            <Input
              id="start-desc"
              value={startVehicle}
              onChange={(e) => setStartVehicle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-desc">Ending vehicle description</Label>
            <Input
              id="end-desc"
              value={endVehicle}
              onChange={(e) => setEndVehicle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duration (seconds)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[4, 5, 6, 8, 10, 12, 15].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}s
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Resolution</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["480p", "720p", "1080p", "4k"].map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" size="lg" onClick={handleGenerate} disabled={isBusy}>
        {isBusy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {state === "starting" ? "Starting..." : "Generating..."}
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" /> Generate
          </>
        )}
      </Button>

      {state === "error" && errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {state === "done" && videoUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent>
            <video src={videoUrl} controls autoPlay className="w-full rounded-lg" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
