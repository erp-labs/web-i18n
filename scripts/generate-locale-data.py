#!/usr/bin/env python3
"""Generate locale translation data from unique EN strings (sequential, rate-limited)."""
import json
import re
import sys
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[1]
ENTRIES = ROOT / "scripts/translation-packs/sea-entries.json"
OUT_DIR = ROOT / "scripts/translation-packs/data"

KEEP_LITERAL = [
    "Vouus", "Pregoi", "Work App", "Work Desk", "Xero", "Autopilot", "Knowledge",
    "ERPNext", "Slack", "PDF", "Prego AI", "Frappe", "Stripe", "InvoiceNow",
    "Gemini 3", "ChatGPT", "Claude", "Google Drive", "DiRT", "HMAC", "DNS", "API",
    "BYO", "RPO", "RTO", "Layer A", "Layer B", "Layer C", "Tier 0", "Net 30",
    "GST", "VAT", "SWIFT", "BIC", "NRIC", "FIN", "IRAS", "CPF", "MOM", "S-Pass",
    "Acme Pte Ltd", "pregoi.com", "SGD", "GMT+8", "YYYY-MM-DD", "johndoe@gmail.com",
    "client@example.com", "billing@yourcompany.com", "+65 6123 4567", "+65 9123 4567",
    "--:--", "CRM", "ERP", "WP", "EP", "PR", "TODAY", "Email",
]

GOOGLE_TARGETS = {"th": "th", "id": "id", "ms": "ms", "ru": "ru", "my": "my"}


def log(msg: str) -> None:
    print(msg, flush=True)


def protect(text: str) -> tuple[str, list[str]]:
    tokens: list[str] = []
    out = text

    def repl_brace(m: re.Match) -> str:
        tokens.append(m.group(0))
        return f"\uE000{len(tokens)-1}\uE001"

    out = re.sub(r"\{\{[^}]+\}\}|\{[^}]+\}", repl_brace, out)
    for term in sorted(set(KEEP_LITERAL), key=len, reverse=True):
        if term not in out:
            continue
        tokens.append(term)
        out = out.replace(term, f"\uE000{len(tokens)-1}\uE001")
    return out, tokens


def restore(text: str, tokens: list[str]) -> str:
    out = text
    for i, tok in enumerate(tokens):
        out = out.replace(f"\uE000{i}\uE001", tok)
    return out


def should_skip_translate(en: str) -> bool:
    if not en or not en.strip():
        return True
    if en in KEEP_LITERAL:
        return True
    if re.fullmatch(r"[\d\s%×+\-:/@.,()#—–…·|~]+", en):
        return True
    if re.fullmatch(r"[A-Za-z0-9@._+\-:/]+", en) and " " not in en:
        return True
    return False


def unflatten(flat: dict[str, str]) -> dict:
    root: dict = {}
    for path, value in flat.items():
        parts = path.split(".")
        cur = root
        for part in parts[:-1]:
            cur = cur.setdefault(part, {})
        cur[parts[-1]] = value
    return root


def translate_all(unique_en: list[str], locale: str, code: str) -> dict[str, str]:
    translator = GoogleTranslator(source="en", target=code)
    out: dict[str, str] = {}
    total = len(unique_en)
    for i, en in enumerate(unique_en, 1):
        if should_skip_translate(en):
            out[en] = en
        else:
            protected, tokens = protect(en)
            try:
                translated = translator.translate(protected)
                out[en] = restore(translated, tokens)
            except Exception as e:
                log(f"warn {locale} [{i}/{total}]: {e}")
                out[en] = en
                time.sleep(1.0)
            time.sleep(0.25)
        if i % 25 == 0 or i == total:
            log(f"{locale}: translated {i}/{total}")
    return out


def main() -> None:
    locales = sys.argv[1:] if len(sys.argv) > 1 else ["ru", "my"]
    for loc in locales:
        if loc not in GOOGLE_TARGETS:
            log(f"skip unknown locale: {loc}")
            sys.exit(1)

    entries = json.loads(ENTRIES.read_text(encoding="utf-8"))
    unique_en = sorted({item["en"] for item in entries})
    log(f"unique EN strings: {len(unique_en)}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for loc in locales:
        code = GOOGLE_TARGETS[loc]
        log(f"generating {loc} ({code})…")
        locale_map = translate_all(unique_en, loc, code)
        (OUT_DIR / f"{loc}-strings.json").write_text(
            json.dumps(locale_map, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        by_page: dict[str, dict[str, str]] = {}
        for item in entries:
            by_page.setdefault(item["pageId"], {})[item["key"]] = locale_map[item["en"]]
        nested = {pid: unflatten(keys) for pid, keys in by_page.items()}
        out_path = OUT_DIR / f"{loc}.json"
        out_path.write_text(json.dumps(nested, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        log(f"wrote {out_path} ({len(nested)} pages)")


if __name__ == "__main__":
    main()
