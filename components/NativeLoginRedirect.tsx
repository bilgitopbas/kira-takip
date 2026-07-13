"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativeApp } from "@/lib/native";

export default function NativeLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;
    fetch("/api/dashboard/profile")
      .then((r) => {
        router.replace(r.ok ? "/dashboard" : "/login");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return null;
}
