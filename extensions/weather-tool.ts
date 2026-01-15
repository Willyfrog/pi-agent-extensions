import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
  const defaultLocation = "Torrejón de Ardoz";

  const runLookup = async (
    locationInput: string | undefined,
    formatInput: string | undefined,
    signal?: AbortSignal
  ) => {
    const location = locationInput?.trim() || defaultLocation;
    const format = formatInput?.trim() || "3";
    const baseUrl = `https://wttr.in/${encodeURIComponent(location)}`;
    const url = `${baseUrl}?format=${encodeURIComponent(format)}&m`;

    const result = await pi.exec("curl", ["-fsSL", url], { signal });
    const output = result.stdout.trim();

    return { result, output, url };
  };

  pi.registerTool({
    name: "weather",
    label: "Weather",
    description: "Get current weather or a short forecast via wttr.in (metric units).",
    parameters: Type.Object({
      location: Type.Optional(
        Type.String({
          description: "City name, ZIP, or lat,lon. Defaults to Torrejón de Ardoz.",
        })
      ),
      format: Type.Optional(
        Type.String({
          description: "wttr.in format string. Default is '3'; try 'v2' for details.",
        })
      ),
    }),
    async execute(toolCallId, params, onUpdate, ctx, signal) {
      if (signal?.aborted) {
        return { content: [{ type: "text", text: "Cancelled" }] };
      }

      const { result, output, url } = await runLookup(
        params.location,
        params.format,
        signal
      );

      if (result.code !== 0) {
        const message = result.stderr.trim() || "Weather lookup failed.";
        return {
          content: [{ type: "text", text: message }],
          details: { url, exitCode: result.code, stderr: result.stderr },
          isError: true,
        };
      }

      return {
        content: [{ type: "text", text: output || "(no output)" }],
        details: { url, exitCode: result.code },
      };
    },
  });

  pi.registerCommand("weather", {
    description: "Show weather (metric units). Usage: /weather [location] [format]",
    handler: async (args, ctx) => {
      const parts = args.trim().split(/\s+/).filter(Boolean);
      const location = parts[0];
      const format = parts[1];

      if (!ctx.hasUI) {
        return;
      }

      const { result, output, url } = await runLookup(location, format);
      if (result.code !== 0) {
        const message = result.stderr.trim() || "Weather lookup failed.";
        ctx.ui.notify(message, "error");
        return;
      }

      ctx.ui.notify(output || "(no output)", "info");
      ctx.ui.setStatus("weather", `Fetched ${url}`);
    },
  });
}
