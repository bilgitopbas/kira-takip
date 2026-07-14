"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativeApp } from "@/lib/native";

export default function NativeLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;
    fetch("/api/dashboard/profile")
      .then(async (r) => {
        if (!r.ok) {
          router.replace("/login");
          return;
        }
        const data = await r.json();
        router.replace(data.role === "ADMIN" ? "/admin" : "/dashboard");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return null;
}
