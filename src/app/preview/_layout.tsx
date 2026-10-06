import { Stack } from "expo-router";
import { FlowProvider } from "../../features/interfaces/Flow";
export default function PreviewLayout() {
  return (
    <FlowProvider demo>
      <Stack screenOptions={{ headerShown: false, animation: "none" }} />
    </FlowProvider>
  );
}
