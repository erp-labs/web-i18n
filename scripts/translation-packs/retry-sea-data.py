#!/usr/bin/env python3
"""Retry EN strings that were not translated (still identical to EN)."""
import importlib.util
import json
import sys
import time
from pathlib import Path

from deep_translator import GoogleTranslator

ROOT = Path(__file__).resolve().parents[2]
ENTRIES = ROOT / "scripts/translation-packs/sea-entries.json"
OUT_DIR = ROOT / "scripts/translation-packs/data"
LOCALES = {"th": "th", "id": "id", "ms": "ms"}

spec = importlib.util.spec_from_file_location(
    "gen", Path(__file__).resolve().parent / "generate-sea-data.py",
)
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)


def log(msg: str) -> None:
    print(msg, flush=True)


def main() -> None:
    entries = json.loads(ENTRIES.read_text(encoding="utf-8"))

    for loc, code in LOCALES.items():
        strings_path = OUT_DIR / f"{loc}-strings.json"
        string_map: dict[str, str] = json.loads(strings_path.read_text(encoding="utf-8"))
        translator = GoogleTranslator(source="en", target=code)
        retry = [en for en, val in string_map.items() if val == en and not gen.should_skip_translate(en)]
        log(f"{loc}: retrying {len(retry)} strings")
        for i, en in enumerate(retry, 1):
            protected, tokens = gen.protect(en)
            for attempt in range(5):
                try:
                    translated = translator.translate(protected)
                    string_map[en] = gen.restore(translated, tokens)
                    break
                except Exception as e:
                    wait = 2 ** attempt
                    log(f"warn {loc} [{i}/{len(retry)}] attempt {attempt + 1}: {e}")
                    time.sleep(wait)
            time.sleep(0.25)
            if i % 10 == 0:
                log(f"{loc}: retried {i}/{len(retry)}")
        strings_path.write_text(json.dumps(string_map, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        by_page: dict[str, dict[str, str]] = {}
        for item in entries:
            by_page.setdefault(item["pageId"], {})[item["key"]] = string_map[item["en"]]
        nested = {pid: gen.unflatten(keys) for pid, keys in by_page.items()}
        (OUT_DIR / f"{loc}.json").write_text(
            json.dumps(nested, ensure_ascii=False, indent=2) + "\n", encoding="utf-8",
        )
        log(f"wrote {loc}.json")


if __name__ == "__main__":
    main()
