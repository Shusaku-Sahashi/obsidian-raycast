import { Action, ActionPanel, closeMainWindow, Form, getPreferenceValues, open, popToRoot } from "@raycast/api";
import { DailyNoteAppendPreferences } from "./utils/preferences";
import { getObsidianTarget, ObsidianTargetType } from "./utils/utils";
import { useObsidianVaults } from "./utils/hooks";
import { vaultPluginCheck } from "./api/vault/plugins/plugins.service";
import { clearCache } from "./api/cache/cache.service";
import { applyTemplates } from "./api/templating/templating.service";
import { useForm } from "@raycast/utils";

interface DailyNoteAppendContent {
  text: string;
}

function formatText(content: string): string {
  const prefix = "\n\t";
  return prefix + content.replaceAll(/\r?\n/g, prefix);
}

export default function DailyNoteAppend() {
  const { vaults, ready } = useObsidianVaults();
  const { appendTemplate, heading, vaultName, prepend, silent } = getPreferenceValues<DailyNoteAppendPreferences>();
  const [vaultsWithPlugin] = vaultPluginCheck(vaults, "obsidian-advanced-uri");

  const { handleSubmit, itemProps } = useForm<DailyNoteAppendContent>({
    onSubmit: async (input) => {
      if (!ready || !itemProps.text) {
        return;
      }

      const content = await applyTemplates(formatText(input.text), appendTemplate);

      const target = getObsidianTarget({
        type: ObsidianTargetType.DailyNoteAppend,
        vault: vaultsWithPlugin.find((vault) => vault.name === vaultName) || vaultsWithPlugin[0],
        text: content,
        heading: heading,
        prepend: prepend,
        silent: silent,
      });

      await open(target);
      clearCache();
      await popToRoot();
      await closeMainWindow();
    },
  });

  // Only show the vault selection list if we have multiple vaults and no specific vault configured
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Append" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea title="Add line" placeholder="Input content" {...itemProps.text} />
    </Form>
  );
}
