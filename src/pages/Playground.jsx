import PageTemplate from "./PageTemplate";
import PlaygroundDesktop from "@/components/playground/PlaygroundDesktop";

export default function Playground() {
  return (
    <PageTemplate ready desktop>
      <PlaygroundDesktop />
    </PageTemplate>
  );
}
