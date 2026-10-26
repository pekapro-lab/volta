import { createFileRoute } from "@tanstack/react-router";
import { Groovebox } from "@/components/groovebox";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Groovebox />;
}
