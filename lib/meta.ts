type MetaHealth = {
  ok: boolean;
  pageId?: string;
  pageName?: string;
  igBusinessId?: string;
  igUsername?: string;
  scopes?: string[];
  warnings?: string[];
};

const GRAPH = "https://graph.facebook.com/v19.0";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

async function graphGet<T>(path: string, params: Record<string, string>) {
  const url = new URL(GRAPH + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    // Next.js route handlers run on server; keep it simple.
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok) {
    const msg = json?.error?.message ?? `Graph API error (${res.status})`;
    throw new Error(msg);
  }
  return json as T;
}

/**
 * Minimal Meta Graph API connectivity check.
 *
 * Expectations (env vars):
 * - META_PAGE_ID
 * - META_PAGE_ACCESS_TOKEN (page token with needed scopes)
 *
 * Optional:
 * - META_IG_BUSINESS_ACCOUNT_ID (if you already know it)
 */
export async function metaHealthCheck(): Promise<MetaHealth> {
  const pageId = requiredEnv("META_PAGE_ID");
  const token = requiredEnv("META_PAGE_ACCESS_TOKEN");

  const warnings: string[] = [];

  const page = await graphGet<{ id: string; name: string; instagram_business_account?: { id: string } }>(
    `/${pageId}`,
    {
      fields: "id,name,instagram_business_account",
      access_token: token,
    }
  );

  // IG business account id: env override wins, else try to infer from page.
  const igBusinessId =
    process.env.META_IG_BUSINESS_ACCOUNT_ID || page.instagram_business_account?.id;

  let igUsername: string | undefined;
  if (igBusinessId) {
    try {
      const ig = await graphGet<{ id: string; username?: string }>(`/${igBusinessId}`, {
        fields: "id,username",
        access_token: token,
      });
      igUsername = ig.username;
    } catch (e) {
      warnings.push(
        `Could not fetch IG username for igBusinessId=${igBusinessId}. If posting fails later, check token scopes and that the Page is connected to the IG business account.`
      );
    }
  } else {
    warnings.push(
      "No instagram_business_account detected on this page. If you want IG posting, connect the Page to an Instagram business account or set META_IG_BUSINESS_ACCOUNT_ID."
    );
  }

  return {
    ok: true,
    pageId: page.id,
    pageName: page.name,
    igBusinessId,
    igUsername,
    warnings: warnings.length ? warnings : undefined,
  };
}
