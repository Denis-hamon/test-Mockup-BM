import type { Metadata } from "next";
import { IntakeStepper } from "@/components/intake/intake-stepper";

export const metadata: Metadata = {
  title: "Nouvelle demande juridique - LegalConnect",
};

export default function IntakePage() {
  return <IntakeStepper />;
}
