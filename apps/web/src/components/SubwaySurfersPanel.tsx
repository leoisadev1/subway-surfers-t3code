import {
  ClapperboardIcon,
  Gamepad2Icon,
  Volume2Icon,
  VolumeXIcon,
  PanelRightCloseIcon,
  RotateCcwIcon,
} from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";

import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { Toggle, ToggleGroup } from "./ui/toggle-group";

const SUBWAY_SURFERS_URL =
  "https://files.gamezhero.com/game/905/1d1/9051d1173be765fb/data/index.html";
const SUBWAY_SURFERS_WATCH_VIDEO_ID = "hJcv2nZ8x84";
const SUBWAY_SURFERS_WATCH_DURATION_SECONDS = 4_570;

function randomWatchStartSeconds(): number {
  const maxStart = Math.max(0, SUBWAY_SURFERS_WATCH_DURATION_SECONDS - 45);
  return Math.floor(Math.random() * (maxStart + 1));
}

type SubwaySurfersMode = "play" | "watch";

interface SubwaySurfersPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PANEL_MODE_COPY = {
  play: {
    embedLabel: "Loading Subway Surfers...",
    title: "Subway Surfers",
  },
  watch: {
    embedLabel: "Loading gameplay...",
    title: "Subway Surfers gameplay",
  },
} as const satisfies Record<
  SubwaySurfersMode,
  {
    embedLabel: string;
    title: string;
  }
>;

export const SubwaySurfersPanel = memo(function SubwaySurfersPanel({
  open,
  onOpenChange,
}: SubwaySurfersPanelProps) {
  if (!open) {
    return null;
  }

  const [mode, setMode] = useState<SubwaySurfersMode>("play");
  const [watchMuted, setWatchMuted] = useState(true);
  const [watchStartSeconds, setWatchStartSeconds] = useState(() => randomWatchStartSeconds());
  const [frameKeyByMode, setFrameKeyByMode] = useState<Record<SubwaySurfersMode, number>>({
    play: 0,
    watch: 0,
  });
  const [frameLoadedByMode, setFrameLoadedByMode] = useState<Record<SubwaySurfersMode, boolean>>({
    play: false,
    watch: false,
  });
  const watchFrameRef = useRef<HTMLIFrameElement | null>(null);

  const activeModeCopy = PANEL_MODE_COPY[mode];
  const watchEmbedUrl = useMemo(() => {
    const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const params = new URLSearchParams({
      autoplay: "1",
      controls: "1",
      enablejsapi: "1",
      loop: "1",
      modestbranding: "1",
      mute: watchMuted ? "1" : "0",
      playsinline: "1",
      playlist: SUBWAY_SURFERS_WATCH_VIDEO_ID,
      rel: "0",
      origin,
      start: String(watchStartSeconds),
    });
    return `https://www.youtube-nocookie.com/embed/${SUBWAY_SURFERS_WATCH_VIDEO_ID}?${params.toString()}`;
  }, [watchMuted, watchStartSeconds]);

  const handleReload = useCallback(() => {
    setFrameLoadedByMode((current) => ({ ...current, [mode]: false }));
    if (mode === "watch") {
      setWatchStartSeconds(randomWatchStartSeconds());
    }
    setFrameKeyByMode((current) => ({ ...current, [mode]: current[mode] + 1 }));
  }, [mode]);

  const toggleWatchMuted = useCallback(() => {
    setWatchMuted((current) => {
      const nextMuted = !current;
      watchFrameRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: nextMuted ? "mute" : "unMute",
          args: [],
        }),
        "*",
      );
      if (!nextMuted) {
        watchFrameRef.current?.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: "playVideo",
            args: [],
          }),
          "*",
        );
      }
      return nextMuted;
    });
  }, []);

  return (
    <div className="flex h-full w-[min(92vw,430px)] max-w-[430px] shrink-0 flex-col border-l border-border/70 bg-background">
      <div className="flex h-full min-h-0 flex-col bg-background">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Gamepad2Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Subway Surfers</p>
              <p className="text-xs text-muted-foreground">Embedded game panel</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <ToggleGroup
              className="shrink-0"
              variant="outline"
              size="xs"
              value={[mode]}
              onValueChange={(value) => {
                const nextMode = value[0];
                if (nextMode === "play" || nextMode === "watch") {
                  setMode(nextMode);
                  setFrameLoadedByMode((current) => ({ ...current, [nextMode]: false }));
                  if (nextMode === "watch") {
                    setWatchStartSeconds(randomWatchStartSeconds());
                  }
                  setFrameKeyByMode((current) => ({
                    ...current,
                    [nextMode]: current[nextMode] + 1,
                  }));
                }
              }}
            >
              <Toggle aria-label="Play Subway Surfers" value="play">
                <Gamepad2Icon className="size-3.5" />
                Play
              </Toggle>
              <Toggle aria-label="Watch Subway Surfers gameplay" value="watch">
                <ClapperboardIcon className="size-3.5" />
                Watch
              </Toggle>
            </ToggleGroup>
            {mode === "watch" ? (
              <Button
                size="icon-xs"
                variant="ghost"
                aria-label={watchMuted ? "Turn sound on" : "Mute gameplay"}
                onClick={toggleWatchMuted}
              >
                {watchMuted ? (
                  <VolumeXIcon className="size-3.5" />
                ) : (
                  <Volume2Icon className="size-3.5" />
                )}
              </Button>
            ) : null}
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Reload Subway Surfers"
              onClick={handleReload}
            >
              <RotateCcwIcon className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label="Close Subway Surfers panel"
              onClick={() => onOpenChange(false)}
            >
              <PanelRightCloseIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div
          className={
            mode === "play"
              ? "flex min-h-0 flex-1 flex-col p-0"
              : "flex min-h-0 flex-1 flex-col p-4"
          }
        >
          <div
            className={
              mode === "watch"
                ? "relative flex min-h-0 flex-1 items-center justify-center"
                : "relative min-h-0 flex-1 overflow-hidden bg-black"
            }
          >
            {!frameLoadedByMode[mode] ? (
              <div
                className={
                  mode === "watch"
                    ? "absolute inset-0 z-1 flex items-center justify-center rounded-xl bg-black/85 text-white"
                    : "absolute inset-0 z-1 flex flex-col items-center justify-center gap-2 bg-black/85 text-white"
                }
              >
                <Spinner className="size-5" />
                <p className="text-sm font-medium">{activeModeCopy.embedLabel}</p>
              </div>
            ) : null}
            {mode === "play" ? (
              <div className="relative size-full overflow-hidden">
                <iframe
                  key={frameKeyByMode.play}
                  title="Subway Surfers"
                  src={SUBWAY_SURFERS_URL}
                  className="absolute top-1/2 left-1/2 h-[104%] w-[104%] -translate-x-1/2 -translate-y-1/2 border-0"
                  allow="autoplay; fullscreen; gamepad"
                  allowFullScreen
                  loading="eager"
                  referrerPolicy="no-referrer"
                  sandbox="allow-downloads allow-forms allow-pointer-lock allow-popups allow-same-origin allow-scripts"
                  onLoad={() =>
                    setFrameLoadedByMode((current) => ({
                      ...current,
                      play: true,
                    }))
                  }
                />
              </div>
            ) : (
              <div className="relative h-full w-full overflow-hidden rounded-xl border border-border/70 bg-black shadow-xs">
                <div className="flex h-full w-full items-center justify-center">
                  <iframe
                    key={frameKeyByMode.watch}
                    ref={watchFrameRef}
                    title="Subway Surfers gameplay"
                    src={watchEmbedUrl}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="eager"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-presentation allow-popups allow-same-origin allow-scripts"
                    onLoad={() =>
                      setFrameLoadedByMode((current) => ({
                        ...current,
                        watch: true,
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
