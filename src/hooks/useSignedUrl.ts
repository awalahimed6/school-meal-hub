import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Extracts the bucket name and file path from a stored URL or path.
 * Handles both full public URLs and raw file paths.
 */
function parseBucketPath(storedValue: string): { bucket: string; path: string } | null {
  if (!storedValue) return null;

  // Match full Supabase public URL pattern
  const publicUrlPattern = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;
  const match = storedValue.match(publicUrlPattern);
  if (match) {
    return { bucket: match[1], path: match[2] };
  }

  // Match signed URL pattern  
  const signedUrlPattern = /\/storage\/v1\/object\/sign\/([^/]+)\/(.+?)(\?|$)/;
  const signedMatch = storedValue.match(signedUrlPattern);
  if (signedMatch) {
    return { bucket: signedMatch[1], path: signedMatch[2] };
  }

  return null;
}

// Buckets that are now private and need signed URLs
const PRIVATE_BUCKETS = new Set(["student-profiles", "meal-photos"]);

/**
 * Returns a signed URL for a stored image URL/path if the bucket is private.
 * For public buckets or external URLs, returns the original URL.
 */
export function useSignedUrl(storedUrl: string | null | undefined): string | undefined {
  const [signedUrl, setSignedUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!storedUrl) {
      setSignedUrl(undefined);
      return;
    }

    const parsed = parseBucketPath(storedUrl);

    // If it's not a Supabase storage URL, return as-is (external URL)
    if (!parsed) {
      setSignedUrl(storedUrl);
      return;
    }

    // If bucket is not private, return the original URL
    if (!PRIVATE_BUCKETS.has(parsed.bucket)) {
      setSignedUrl(storedUrl);
      return;
    }

    // Generate a signed URL (valid for 1 hour)
    let cancelled = false;
    supabase.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.path, 3600)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          // Fallback to original URL if signing fails
          setSignedUrl(storedUrl);
        } else {
          setSignedUrl(data.signedUrl);
        }
      });

    return () => { cancelled = true; };
  }, [storedUrl]);

  return signedUrl;
}

/**
 * Batch version: returns signed URLs for multiple stored URLs.
 */
export function useSignedUrls(storedUrls: (string | null | undefined)[]): (string | undefined)[] {
  const [signedUrls, setSignedUrls] = useState<(string | undefined)[]>([]);

  useEffect(() => {
    if (!storedUrls.length) {
      setSignedUrls([]);
      return;
    }

    let cancelled = false;

    Promise.all(
      storedUrls.map(async (url) => {
        if (!url) return undefined;
        const parsed = parseBucketPath(url);
        if (!parsed || !PRIVATE_BUCKETS.has(parsed.bucket)) return url;

        const { data, error } = await supabase.storage
          .from(parsed.bucket)
          .createSignedUrl(parsed.path, 3600);

        return error || !data?.signedUrl ? url : data.signedUrl;
      })
    ).then((results) => {
      if (!cancelled) setSignedUrls(results);
    });

    return () => { cancelled = true; };
  }, [JSON.stringify(storedUrls)]);

  return signedUrls;
}
