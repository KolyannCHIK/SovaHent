import { Suspense } from "react";
import AnimeGrid from "@/components/AnimeGrid";
import Sidebar from "@/components/Sidebar";
import MirrorBanner from "@/components/MirrorBanner";
import SupportBanner from "@/components/SupportBanner";

export default function Home() {
  return (
    <>
      <MirrorBanner />
      <SupportBanner />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <Suspense fallback={<div className="flex-1" />}>
            <AnimeGrid />
          </Suspense>
          <Suspense fallback={<div className="w-72" />}>
            <Sidebar />
          </Suspense>
        </div>
      </div>
    </>
  );
}
