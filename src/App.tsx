import { ErrorBoundary } from "@/components/ErrorBoundary";
import MeteoRadar from "@/components/MeteoRadar";

export default function App() {
  return (
    <ErrorBoundary>
      <MeteoRadar />
    </ErrorBoundary>
  );
}
