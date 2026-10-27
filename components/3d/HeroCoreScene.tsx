"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { SceneFallback } from "./SceneFallback";

const DynamicThreeCanvas = dynamic(
  () => import("./ThreeCoreCanvas").then((mod) => mod.ThreeCoreCanvas),
  {
    ssr: false,
    loading: () => <SceneFallback />,
  }
);

export function HeroCoreScene() {
  return <DynamicThreeCanvas />;
}
