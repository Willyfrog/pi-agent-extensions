import { StringEnum } from "@mariozechner/pi-ai";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

type VariableAction = "list" | "get" | "set" | "delete" | "clear";

interface VariableEntry {
  value: string;
  description?: string;
}

interface VariableDetails {
  action: VariableAction;
  variables: Record<string, VariableEntry>;
  key?: string;
  value?: string;
  description?: string;
  error?: string;
}

const VariableParams = Type.Object({
  action: StringEnum(["list", "get", "set", "delete", "clear"] as const),
  key: Type.Optional(
    Type.String({
      description: "Variable name (for get, set, delete)",
    })
  ),
  value: Type.Optional(
    Type.String({
      description: "Variable value (for set)",
    })
  ),
  description: Type.Optional(
    Type.String({
      description: "Optional description (for set)",
    })
  ),
});

const normalizeKey = (key?: string) => {
  const trimmed = key?.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith("%") ? trimmed.slice(1) : trimmed;
};

const formatVariables = (variables: Record<string, VariableEntry>) => {
  const entries = Object.entries(variables).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) {
    return "No variables stored.";
  }
  return entries
    .map(([key, entry]) => {
      const description = entry.description ? ` — ${entry.description}` : "";
      return `%${key} = ${entry.value}${description}`;
    })
    .join("\n");
};

export default function (pi: ExtensionAPI) {
  let variables: Record<string, VariableEntry> = {};

  const reconstructState = (ctx: ExtensionContext) => {
    variables = {};

    for (const entry of ctx.sessionManager.getBranch()) {
      if (entry.type !== "message") continue;
      const msg = entry.message;
      if (msg.role !== "toolResult" || msg.toolName !== "variables") continue;

      const details = msg.details as VariableDetails | undefined;
      if (details?.variables) {
        variables = { ...details.variables };
      }
    }
  };

  pi.on("session_start", async (_event, ctx) => reconstructState(ctx));
  pi.on("session_switch", async (_event, ctx) => reconstructState(ctx));
  pi.on("session_fork", async (_event, ctx) => reconstructState(ctx));
  pi.on("session_tree", async (_event, ctx) => reconstructState(ctx));

  pi.registerTool({
    name: "variables",
    label: "Variables",
    description:
      "Store and retrieve user variables. Actions: list, get (key), set (key+value+description), delete (key), clear. Use %prefix to refer to variables.",
    parameters: VariableParams,

    async execute(_toolCallId, params) {
      const action = params.action as VariableAction;
      const key = normalizeKey(params.key);
      const value = params.value?.trim();
      const description = params.description?.trim();

      const details: VariableDetails = {
        action,
        variables: { ...variables },
        key,
        value,
        description,
      };

      switch (action) {
        case "list":
          return {
            content: [{ type: "text", text: formatVariables(variables) }],
            details,
          };

        case "get":
          if (!key) {
            details.error = "key required";
            return {
              content: [{ type: "text", text: "Error: key required for get" }],
              details,
              isError: true,
            };
          }
          if (!(key in variables)) {
            details.error = "not found";
            return {
              content: [{ type: "text", text: `No stored value for "%${key}".` }],
              details,
              isError: true,
            };
          }
          details.value = variables[key].value;
          details.description = variables[key].description;
          const descriptionText = variables[key].description
            ? ` (${variables[key].description})`
            : "";
          return {
            content: [
              {
                type: "text",
                text: `Stored value for "%${key}": ${variables[key].value}${descriptionText}`,
              },
            ],
            details,
          };

        case "set":
          if (!key || !value) {
            details.error = "key and value required";
            return {
              content: [{ type: "text", text: "Error: key and value required for set" }],
              details,
              isError: true,
            };
          }
          variables = {
            ...variables,
            [key]: {
              value,
              description,
            },
          };
          return {
            content: [{ type: "text", text: `Saved "%${key}".` }],
            details: { ...details, variables: { ...variables } },
          };

        case "delete":
          if (!key) {
            details.error = "key required";
            return {
              content: [{ type: "text", text: "Error: key required for delete" }],
              details,
              isError: true,
            };
          }
          if (!(key in variables)) {
            details.error = "not found";
            return {
              content: [{ type: "text", text: `"%${key}" was not stored.` }],
              details,
              isError: true,
            };
          }
          const { [key]: _removed, ...rest } = variables;
          variables = rest;
          return {
            content: [{ type: "text", text: `Removed "%${key}".` }],
            details: { ...details, variables: { ...variables } },
          };

        case "clear":
          variables = {};
          return {
            content: [{ type: "text", text: "Cleared all variables." }],
            details: { ...details, variables: {} },
          };
      }
    },
  });

  pi.registerCommand("vars", {
    description: "Show stored variables. Usage: /vars",
    handler: async (_args, ctx) => {
      if (!ctx.hasUI) {
        return;
      }

      const output = formatVariables(variables);
      ctx.ui.notify(output, "info");
    },
  });
}
