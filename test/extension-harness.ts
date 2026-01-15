import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

type ToolResult = {
  content?: Array<{ type: "text"; text: string }>;
  details?: unknown;
  isError?: boolean;
};

type ToolDefinition = {
  name: string;
  execute: (...args: any[]) => Promise<ToolResult> | ToolResult;
  description?: string;
  label?: string;
  parameters?: unknown;
};

type CommandDefinition = {
  description?: string;
  handler: (args: string, ctx: MockExtensionContext) => Promise<void> | void;
};

type SessionEntry = {
  type: "message";
  message: {
    role: "toolResult";
    toolName: string;
    details?: unknown;
  };
};

class MockSessionManager {
  private entries: SessionEntry[];

  constructor(entries: SessionEntry[] = []) {
    this.entries = entries;
  }

  getBranch(): SessionEntry[] {
    return this.entries;
  }

  getEntries(): SessionEntry[] {
    return this.entries;
  }

  append(entry: SessionEntry): void {
    this.entries.push(entry);
  }
}

class MockUI {
  public notifications: Array<{ message: string; level: string }> = [];

  notify(message: string, level: "info" | "warning" | "error" | "success"): void {
    this.notifications.push({ message, level });
  }
}

export class MockExtensionContext {
  readonly sessionManager: MockSessionManager;
  readonly ui = new MockUI();
  readonly hasUI = true;

  constructor(sessionManager: MockSessionManager) {
    this.sessionManager = sessionManager;
  }
}

export class ExtensionHarness {
  private handlers = new Map<string, Array<(event: unknown, ctx: MockExtensionContext) => unknown>>();
  readonly tools = new Map<string, ToolDefinition>();
  readonly commands = new Map<string, CommandDefinition>();
  readonly sessionManager: MockSessionManager;
  readonly ctx: MockExtensionContext;

  constructor(entries: SessionEntry[] = []) {
    this.sessionManager = new MockSessionManager(entries);
    this.ctx = new MockExtensionContext(this.sessionManager);
  }

  get api(): ExtensionAPI {
    const api: Partial<ExtensionAPI> = {
      on: (event, handler) => {
        const list = this.handlers.get(event) ?? [];
        list.push(handler as (event: unknown, ctx: MockExtensionContext) => unknown);
        this.handlers.set(event, list);
      },
      registerTool: (tool) => {
        this.tools.set(tool.name, tool as ToolDefinition);
      },
      registerCommand: (name, command) => {
        this.commands.set(name, command as CommandDefinition);
      },
    };

    return api as ExtensionAPI;
  }

  async trigger(event: string, eventData: unknown = {}): Promise<void> {
    const list = this.handlers.get(event) ?? [];
    for (const handler of list) {
      await handler(eventData, this.ctx);
    }
  }

  appendToolResult(toolName: string, details?: unknown): void {
    this.sessionManager.append({
      type: "message",
      message: {
        role: "toolResult",
        toolName,
        details,
      },
    });
  }
}

export const createExtensionHarness = (entries: SessionEntry[] = []) => new ExtensionHarness(entries);
