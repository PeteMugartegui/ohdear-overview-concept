import { createFileRoute } from "@tanstack/react-router";
import { OverviewApp } from "@/components/overview/overview-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <OverviewApp />;
}
