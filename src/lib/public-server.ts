export type PublicRecordLookup<T> = {
  available: boolean;
  data: T | null;
};

const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]*$/;
const SAFE_SELECT = /^[a-z0-9_, ]+$/;

export async function publicRecordLookup<T>(
  table: string,
  column: string,
  value: string,
  select: string,
): Promise<PublicRecordLookup<T>> {
  const baseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey || baseUrl.includes('example.supabase.co')) return { available: false, data: null };
  if (!SAFE_IDENTIFIER.test(table) || !SAFE_IDENTIFIER.test(column) || !SAFE_SELECT.test(select)) {
    throw new Error('Invalid public record lookup.');
  }

  const url = new URL(`/rest/v1/${table}`, baseUrl);
  url.searchParams.set('select', select);
  url.searchParams.set(column, `eq.${value}`);
  url.searchParams.set('limit', '1');

  try {
    const response = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    if (!response.ok) return { available: false, data: null };
    const rows = await response.json();
    return {
      available: true,
      data: Array.isArray(rows) && rows.length > 0 ? rows[0] as T : null,
    };
  } catch (error) {
    console.error('[public-record-lookup]', error);
    return { available: false, data: null };
  }
}

export async function publicRecordExists(
  table: string,
  column: string,
  value: string,
): Promise<boolean | null> {
  const result = await publicRecordLookup<Record<string, unknown>>(table, column, value, column);
  if (!result.available) return null;
  return Boolean(result.data);
}
