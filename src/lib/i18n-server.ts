import { cookies } from "next/headers";
import { getDictionary, type Locale, type Dictionary } from "@/i18n";

/**
 * Server-side helper: read locale from cookie and return dictionary.
 * Use in Server Components where useT() hook is not available.
 */
export async function getServerT(): Promise<{ locale: Locale; t: Dictionary }> {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "vi") as Locale;
  return { locale, t: getDictionary(locale) };
}
