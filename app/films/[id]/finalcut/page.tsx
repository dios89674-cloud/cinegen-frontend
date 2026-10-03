"use client";

// Finalcut is now merged into the film detail page.
// Redirect legacy /finalcut URLs to /films/[id].
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function FinalCutRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const filmId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    router.replace(`/films/${filmId}`);
  }, [filmId, router]);

  return null;
}
