# PPC Automation Demo

Veřejná demo verze systému, kterým denně monitoruji klientské Google Ads účty. Ukazuje **strukturu kontrol, logiku vyhodnocení a formát výstupů** — běží čistě na fiktivních datech, bez API klíčů a bez napojení na živé účty.

## Co to je

- Simulace denního běhu monitoringu (13 kontrolních modulů)
- Měsíční reporting se status badge (🟢🟡🔴)
- Adapter pattern: `MockDataSource` (demo) vs. `GoogleAdsDataSource` (stub pro produkci)
- Výstup do konzole a do `output/daily-report.md`

## Co to není

- Produkční systém — know-how je v **prahových hodnotách per klient**, checklistech a každodenní práci s výstupy
- Dashboard, e-maily, Google Sheets integrace ani AI utility (Typo Checker, negativní KW)

Více o přístupu ke správě účtů: [honzabrzak.cz/jak-pracuji](https://honzabrzak.cz/jak-pracuji)

## Spustit online (pro klienty)

**Live demo:** [honzabbbb.github.io/ppc-automations-demo](https://honzabbbb.github.io/ppc-automations-demo)

Otevři odkaz → klikni **Spustit demo** → uvidíš report v prohlížeči. Žádná instalace, žádné API klíče.

> Po prvním pushi může trvat 1–2 minuty, než GitHub Pages naběhne. V repo musí být zapnuté Pages (Settings → Pages → source: GitHub Actions).

## Jak spustit lokálně

```bash
# 1. Přejdi do složky projektu
cd "ppc automations demo"

# 2. (Volitelné) Ověř testy — vyžaduje Node 18+
npm test

# 3. Spusť simulovaný denní běh
npm run demo
```

Výstup najdeš v konzoli a v souboru `output/daily-report.md`.

## Ukázka výstupu (zkráceno)

```
## Denní kontroly

### CRITICAL
- **LeadFlow Demo — lead gen** · `ACCOUNT TOTAL`
  - Invalid Payment Method [app]
  - ...

### HIGH
- **Modora Home — e-shop** · `ACCOUNT TOTAL`
  - Budget Overspend + High PNO (CRITICAL) [app]

## Měsíční reporting
### 🟡 Modora Home — e-shop
- Status: **Střední výkon**
- V červnu 2026 jsme investovali 42 000 Kč ...
```

## Struktura

```
src/
├── data-source/     # DataSource rozhraní + MockDataSource
├── checks/          # 13 kontrol (zrcadlo produkční logiky)
├── reporting/       # Měsíční reporty
├── report/          # Formátování denního reportu
└── runner.js        # npm run demo
fixtures/            # 3 fiktivní účty (e-shop, služby, lead gen)
tests/               # Unit testy nad fixtures
```

## Mock účty

| ID | Typ | Záměrné problémy |
|----|-----|------------------|
| 8001002001 | e-shop | vysoké PNO, app overspend |
| 8001002002 | služby (leadgen) | zero imp/click, underspend, slabá RSA, nízké QS |
| 8001002003 | lead gen | disapproved entity, billing, overspend, no conversions |

Všechna data jsou smyšlená — žádná podobnost s reálnými klienty.

## Licence / použití

Demo repozitář je určený pro marketing a transparentnost. Produkční kód, prahy a klientské konfigurace zůstávají v privátním repozitáři.
