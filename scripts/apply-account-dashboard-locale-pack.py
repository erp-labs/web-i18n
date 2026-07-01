#!/usr/bin/env python3
"""Apply translations for account dashboard i18n pack (4 pages × 12 locales)."""
from __future__ import annotations

import json
import re
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "sources/en/account"
LOCALES_ROOT = ROOT / "locales"
ADMIN_DICT = ROOT.parent / "core-platform/apps/admin-web/dictionaries"

LOCALES = ["ja", "zh", "ar", "vi", "th", "id", "ms", "si", "ur", "hi", "ru", "my"]
PAGES = [
    ("shell.nav.page.json", "shell_nav"),
    ("dashboard.setup.page.json", "dashboard_setup"),
    ("dashboard.widgets.page.json", "dashboard_widgets"),
    ("profile.fields.page.json", "profile_fields"),
]

KEEP_LITERAL = [
    "Vouus",
    "Work App",
    "Work Desk",
    "Frappe",
    "Stripe",
    "Email",
    "AI",
]

GOOGLE_TARGETS = {
    "ja": "ja",
    "zh": "zh-CN",
    "ar": "ar",
    "vi": "vi",
    "th": "th",
    "id": "id",
    "ms": "ms",
    "si": "si",
    "ur": "ur",
    "hi": "hi",
    "ru": "ru",
    "my": "my",
}


def protect(text: str) -> tuple[str, list[str]]:
    tokens: list[str] = []
    out = text

    def repl_brace(m: re.Match[str]) -> str:
        tokens.append(m.group(0))
        return f"\uE000{len(tokens) - 1}\uE001"

    out = re.sub(r"\{[^}]+\}", repl_brace, out)
    for term in sorted(set(KEEP_LITERAL), key=len, reverse=True):
        if term not in out:
            continue
        tokens.append(term)
        out = out.replace(term, f"\uE000{len(tokens) - 1}\uE001")
    return out, tokens


def restore(text: str, tokens: list[str]) -> str:
    out = text
    for i, tok in enumerate(tokens):
        out = out.replace(f"\uE000{i}\uE001", tok)
    return out


def translate_value(en: str, locale: str, retries: int = 3) -> str:
    if not en.strip():
        return en
    protected, tokens = protect(en)
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            translated = GoogleTranslator(source="en", target=GOOGLE_TARGETS[locale]).translate(protected)
            return restore(translated, tokens)
        except Exception as err:  # noqa: BLE001
            last_err = err
            time.sleep(0.5 * (attempt + 1))
    print(f"  warn: fallback EN for {locale!r}: {en!r} ({last_err})")
    return en


def translate_keys(en_keys: dict[str, str], locale: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for key, value in en_keys.items():
        out[key] = translate_value(value, locale)
        time.sleep(0.05)
    return out


def patch_page(locale: str, page_file: str, ns: str, translated_keys: dict[str, str]) -> None:
    path = LOCALES_ROOT / locale / "account" / page_file
    doc = json.loads(path.read_text(encoding="utf-8"))
    doc["keys"] = translated_keys
    doc.setdefault("meta", {})
    doc["meta"]["translationStatus"] = "reviewed"
    doc["meta"]["method"] = "google-translate-pack"
    path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)}")


def sync_admin_dict(locale: str) -> None:
    merged: dict[str, object] = {}
    account_dir = LOCALES_ROOT / locale / "account"
    for name in sorted(account_dir.glob("*.page.json")):
        doc = json.loads(name.read_text(encoding="utf-8"))
        key = doc["pageId"].replace("account.", "").replace(".", "_")
        merged[key] = doc["keys"]
    out = ADMIN_DICT / f"{locale}.json"
    out.write_text(json.dumps(merged, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"  synced admin {out.name}")


def main() -> None:
    import sys

    only = sys.argv[1:] if len(sys.argv) > 1 else LOCALES
    en_pages: dict[str, dict[str, str]] = {}
    for page_file, ns in PAGES:
        doc = json.loads((SOURCES / page_file).read_text(encoding="utf-8"))
        en_pages[ns] = doc["keys"]

    for locale in only:
        print(f"\n=== {locale} ===")
        translated_by_ns: dict[str, dict[str, str]] = {}
        for page_file, ns in PAGES:
            translated_by_ns[ns] = translate_keys(en_pages[ns], locale)
            patch_page(locale, page_file, ns, translated_by_ns[ns])
        sync_admin_dict(locale)

    print("\nDone.")


if __name__ == "__main__":
    main()
