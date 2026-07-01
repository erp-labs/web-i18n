#!/usr/bin/env python3
"""Apply ru/my www translation patches for home, shell, and subpages."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCALES = ROOT / "locales"

# page stem -> { locale -> { key -> value } }
PATCHES: dict[str, dict[str, dict[str, str]]] = {
    "home": {
        "ru": {
            "hero_description": "Единая платформа для людей, финансов и согласований — без таблиц и ручного переключения между системами.",
            "pillars_0_title": "Связанность",
            "pillars_0_description": "HR, финансы и операции в одной записи.",
            "pillars_1_title": "Автоматизация",
            "pillars_1_description": "Согласования и задачи без беготни.",
            "pillars_2_title": "Надёжность",
            "pillars_2_description": "Аудиторские следы и региональное соответствие из коробки.",
            "proof_0": "14-дневная пробная версия, кредитная карта не нужна",
            "proof_1": "Запуск за ~2 недели",
            "proof_2": "eInvoice, готовый к InvoiceNow",
            "proof_3": "Мобильный захват и согласования",
            "problem_0_title": "Согласования застревают в чатах",
            "problem_0_tagline": "Передачи останавливаются, когда статус живёт в личных сообщениях.",
            "problem_1_title": "Охота за данными в конце месяца",
            "problem_1_tagline": "Финансы ищут чеки по разным инструментам и файлам.",
            "problem_2_title": "Решения без доказательств",
            "problem_2_tagline": "Руководители действуют на устаревших данных без аудиторского следа.",
            "features_subtitle": "Единая основа для того, как работает бизнес.",
            "modules_0_title": "HR и посещаемость",
            "modules_0_tagline": "От отметки до зарплаты по одному пути согласования.",
            "modules_1_title": "Управление расходами",
            "modules_1_tagline": "Захват и согласование без беготни.",
            "learn_more": "Подробнее",
            "stats_0_label": "Меньше ручной работы",
            "stats_1_label": "Быстрее закрытие",
            "testimonial_title": "Автоматизация на реальной основе рабочих процессов",
            "testimonial_quote": "Закрытие месяца раньше занимало три дня сбора данных. Теперь это однодневная проверка — основа рабочих процессов берёт на себя то, что раньше делалось вручную.",
            "testimonial_footnote": "Присоединяйтесь к командам в Сингапуре и по всей Юго-Восточной Азии.",
            "pricing_headline": "Тарифы, которые растут вместе с вами",
            "support_0_title": "Записаться на живое демо",
            "support_0_cta": "Записаться на демо",
            "support_1_description": "14-дневная пробная версия Pro, требуется рабочая почта, кредитная карта не нужна.",
            "support_2_description": "Обсудите цены, миграцию или корпоративные требования.",
            "support_2_cta": "Связаться с отделом продаж",
            "faq_title": "Частые вопросы",
            "faq_more_docs": "Больше вопросов в документации →",
            "faq_0_q": "Чем {brand} отличается от традиционной ERP?",
            "faq_1_q": "Что вы имеете в виду под автоматизацией рабочих процессов?",
            "faq_1_a": "Это возможность выполнять повторяющиеся бизнес-шаги — уведомления, маршрутизацию, окна зарплаты, отправку счетов — по заданным правилам с полной историей вместо разовых ручных действий.",
            "faq_3_q": "Как защищены наши бизнес-данные?",
            "faq_4_q": "Есть ли бесплатная пробная версия?",
        },
        "my": {
            "meta_title": "Vouus | လွယ်ကူပြီး ပေါင်းစည်းထားသော ERP",
            "pillars_0_title": "ချိတ်ဆက်ထားသည်",
            "pillars_1_title": "အလိုအလျောက်လုပ်ဆောင်သည်",
            "pillars_2_title": "ခိုင်မာစွာကာကွယ်နိုင်သည်",
            "modules_0_title": "HR နှင့် တက်ကြွမှု",
            "modules_3_tagline": "သင့်အဖွဲ့ ထိန်းသိမ်းနိုင်သော အတည်ပြုချက်များကို ထုတ်ဝေပါ။",
            "faq_title": "မေးလေ့ရှိသော မေးခွန်းများ",
            "hero_cta_primary": "အခမဲ့ စမ်းသပ်မှု စတင်ရန်",
            "hero_cta_secondary": "၁၅ မိနစ်အတွင်း ကြည့်ရန်",
        },
    },
    "shell": {
        "ru": {
            "mega_1_item_0_label": "Для предприятий",
            "mega_2_label": "Для предприятий",
            "mega_2_section_0_title": "Для предприятий",
            "mega_2_item_4_description": "Примеры внедрения для предприятий",
            "mega_2_cta": "Связаться с отделом корпоративных продаж",
            "footer_1_item_0_label": "Для предприятий",
        },
        "my": {
            "mega_1_item_0_label": "လုပ်ငန်းအကြီးစား",
            "mega_2_label": "လုပ်ငန်းအကြီးစား",
            "mega_2_section_0_title": "လုပ်ငန်းအကြီးစား",
            "mega_2_item_4_description": "လုပ်ငန်းအကြီးစား rollout ဥပမာများ",
            "mega_2_cta": "လုပ်ငန်းအကြီးစား အရောင်းကို ဆက်သွယ်ရန်",
            "footer_1_item_0_label": "လုပ်ငန်းအကြီးစား",
            "mega_3_cta": "အခမဲ့ စမ်းသပ်မှု စတင်ရန်",
            "ask_sales_label": "အရောင်းကို မေးမြန်းရန်",
        },
    },
    "product_overview": {
        "ru": {
            "hero_description": "Проектируйте людей, финансы и задачи — затем автоматизируйте.",
            "meta_title": "Vouus | Обзор продукта",
        },
        "my": {
            "hero_description": "လူများ၊ ငွေနှင့် လုပ်ဆောင်စရာများကို ဒီဇိုင်းဆွဲပြီး အလိုအလျောက်လုပ်ဆောင်ပါ။",
            "meta_title": "Vouus | ထုတ်ကုန်ခြုံငုံသုံးသပ်ချက်",
        },
    },
    "product_hr": {
        "ru": {
            "hero_description": "HR-операции на одной основе рабочих процессов — посещаемость, отпуска и зарплата с аудируемой историей в {brand}.",
        },
        "my": {
            "hero_description": "HR လုပ်ငန်းများကို workflow spine တစ်ခုတည်းတွင် — attendance၊ leave နှင့် payroll သည် {brand} တွင် audit-ready history မျှဝေသည်။",
        },
    },
    "product_hr-attendance": {
        "ru": {"hero_description": "Мобильная отметка, представления для менеджеров и аналитика в реальном времени."},
        "my": {"hero_description": "မိုဘိုင်းဖြင့် check-in၊ manager views နှင့် live analytics။"},
    },
    "product_leave": {
        "ru": {"hero_description": "Запрашивайте, согласовывайте и оставайтесь на одной волне."},
        "my": {"hero_description": "တောင်းဆို၊ အတည်ပြုပြီး တစ်သွေးတည်းဖြစ်နေပါ။"},
    },
    "product_expense": {
        "ru": {"hero_description": "Захват, согласование и синхронизация с бухгалтерией."},
        "my": {"hero_description": "ဖမ်းယူ၊ အတည်ပြုပြီး accounting သို့ sync လုပ်ပါ။"},
    },
    "product_einvoice-accounting": {
        "ru": {"hero_description": "Проверяйте, проводите и контролируйте из одного окна."},
        "my": {"hero_description": "တစ်ခုတည်းသော view မှ validate၊ post နှင့် control လုပ်ပါ။"},
    },
    "product_workflow-builder": {
        "ru": {"hero_description": "Перетаскивайте, ветвите и публикуйте без кода."},
        "my": {"hero_description": "Code မလိုဘဲ drag၊ branch နှင့် publish လုပ်ပါ။"},
    },
    "solutions_smb": {
        "ru": {"hero_description": "Проверенные настройки по умолчанию; растите вместе с автоматизацией."},
        "my": {"hero_description": "လမ်းညွှန်ထားသော default များ — automation အပြည့်အဝ grow လုပ်ပါ။"},
    },
    "solutions_use-cases": {
        "ru": {"hero_description": "Отраслевые шаблоны на одном холсте."},
        "my": {"hero_description": "Industry patterns တစ်ခုတည်းသော canvas ပေါ်တွင်။"},
    },
    "solutions_enterprise": {
        "ru": {
            "hero_title": "Корпоративный контроль. Работа продолжается.",
            "hero_description": "Управление, SLA и масштаб без потери аудиторских следов.",
            "meta_title": "Vouus | Решения для предприятий",
            "meta_description": "Корпоративное управление, безопасность и масштабирование на платформе {brand}.",
        },
        "my": {
            "hero_title": "လုပ်ငန်းအကြီးစား ထိန်းချုပ်မှု။ အလုပ်ဆက်လက်လုပ်ဆောင်နေသည်။",
            "hero_description": "Audit trails မဆုံးရှုံးဘဲ governance၊ SLA နှင့် scale။",
            "meta_title": "Vouus | လုပ်ငန်းအကြီးစား ဖြေရှင်းချက်များ",
            "meta_description": "{brand} ပလက်ဖorm တွင် corporate governance၊ security နှင့် scale။",
        },
    },
    "about": {
        "ru": {
            "hero_title": "Мы строим платформу, на которой работа не останавливается",
            "meta_title": "Vouus | О нас",
        },
        "my": {
            "hero_title": "အလုပ်ရပ်မသွားသော platform တစ်ခု တည်ဆောက်နေပါသည်",
            "meta_title": "Vouus | ကျွန်ုပ်တို့အကြောင်း",
        },
    },
    "contact": {
        "ru": {
            "hero_title": "Свяжитесь с нами",
            "meta_title": "Vouus | Контакты",
        },
        "my": {
            "hero_title": "ကျွန်ုပ်တို့ထံ ဆက်သွယ်ပါ",
            "meta_title": "Vouus | ဆက်သွယ်ရန်",
        },
    },
    "blog": {
        "ru": {
            "hero_title": "Блог Vouus",
            "meta_title": "Vouus | Блог",
        },
        "my": {
            "hero_title": "Vouus Blog",
            "meta_title": "Vouus | ဘလော့",
        },
    },
}


def apply_patches() -> None:
    for stem, locale_map in PATCHES.items():
        for locale, keys in locale_map.items():
            path = LOCALES / locale / "www" / f"{stem}.page.json"
            if not path.exists():
                print(f"skip missing {path}")
                continue
            doc = json.loads(path.read_text(encoding="utf-8"))
            doc["keys"].update(keys)
            path.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            print(f"patched {locale}/www/{stem}.page.json ({len(keys)} keys)")


if __name__ == "__main__":
    apply_patches()
