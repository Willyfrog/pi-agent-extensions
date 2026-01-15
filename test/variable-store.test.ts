import variableStore from "../.pi/extensions/variable-store";
import { createExtensionHarness } from "./extension-harness";

describe("variable-store extension", () => {
  it("stores variables with descriptions", async () => {
    const harness = createExtensionHarness();
    variableStore(harness.api);
    await harness.trigger("session_start");

    const tool = harness.tools.get("variables");
    expect(tool).toBeDefined();

    const setResult = await tool!.execute("call-1", {
      action: "set",
      key: "%home_address",
      value: "Calle Mayor 1, Madrid",
      description: "Home address for travel questions",
    });
    harness.appendToolResult("variables", setResult.details);

    const listResult = await tool!.execute("call-2", { action: "list" });
    const listText = listResult.content?.[0]?.text ?? "";
    expect(listText).toContain("%home_address = Calle Mayor 1, Madrid — Home address for travel questions");
  });

  it("reconstructs state from session history", async () => {
    const first = createExtensionHarness();
    variableStore(first.api);
    await first.trigger("session_start");

    const tool = first.tools.get("variables")!;
    const result = await tool.execute("call-3", {
      action: "set",
      key: "%office",
      value: "Plaza Mayor 2, Madrid",
      description: "Office location",
    });
    first.appendToolResult("variables", result.details);

    const second = createExtensionHarness(first.sessionManager.getEntries());
    variableStore(second.api);
    await second.trigger("session_start");

    const listResult = await second.tools.get("variables")!.execute("call-4", { action: "list" });
    const listText = listResult.content?.[0]?.text ?? "";
    expect(listText).toContain("%office = Plaza Mayor 2, Madrid — Office location");
  });
});
