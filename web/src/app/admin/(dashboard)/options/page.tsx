import { OptionsEditor } from "@/components/admin/options-editor";

export default function AdminOptionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl">Options</h1>
        <p className="text-sm text-fg-muted">
          These appear as filters in the shop. Use ↑ ↓ to set their order. Changes go live after you tap Publish
          changes on the Dashboard.
        </p>
      </div>
      <OptionsEditor
        table="categories"
        title="Categories"
        itemLabel="category"
        description="Each product belongs to one category, e.g. Necklaces or Bracelets."
      />
      <OptionsEditor
        table="colors"
        title="Colours"
        itemLabel="colour"
        description="Tap a circle to change the swatch colour shown in the shop."
        withColour
      />
      <OptionsEditor
        table="materials"
        title="Materials"
        itemLabel="material"
        description="e.g. Pearl, Glass, Metal. A product can have several."
      />
    </div>
  );
}
