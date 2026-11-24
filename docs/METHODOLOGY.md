# Methodology & Scientific Basis

SaafSaans shows numbers, so it owes you the maths. Every quantitative claim in
the product is produced by the deterministic engine in `lib/`, not by the
language model. This document lists each formula, its inputs, and its source.

## 1. CPCB National Air Quality Index (`lib/aqi.ts`)

India's National AQI (Central Pollution Control Board, 2014) maps each pollutant
concentration to a 0–500 sub-index via piecewise-linear interpolation between
published breakpoints. The reported AQI is the **maximum** sub-index across
pollutants; the pollutant achieving it is the **dominant** pollutant.

Sub-index within a band:

```
I = I_low + (I_high − I_low) / (C_high − C_low) × (C − C_low)
```

Breakpoint tables implemented for PM2.5, PM10, NO₂, O₃, SO₂ and CO.
Categories: Good (0–50), Satisfactory (51–100), Moderate (101–200),
Poor (201–300), Very Poor (301–400), Severe (401–500).

**Honesty note.** CPCB AQI uses pollutant-specific averaging windows (24 h for
PM, 8 h for O₃/CO). Open-Meteo supplies modelled *hourly* values, so we treat the
hourly value as an **indicative** input and label the result an estimate, not a
regulatory measurement.

## 2. Inhaled dose (`lib/health.ts`)

```
dose (µg) = concentration (µg/m³) × ventilation (m³/h) × time (h)
```

Minute-ventilation (breathing rate) by activity is taken from the
**US EPA Exposure Factors Handbook (2011), Chapter 6**:

| Activity | m³/h |
| --- | --- |
| Rest / sleep | 0.4 |
| Sedentary (sitting, commuting) | 0.5 |
| Light | 1.1 |
| Moderate (brisk walk, play) | 1.6 |
| Vigorous (running, hard cycling) | 3.0 |

## 3. Cigarette-equivalent

We use the **Berkeley Earth** anchor (R. Muller, 2015): inhaling roughly **440 µg
of PM2.5** approximates the particulate load of one cigarette — equivalently, a
24-hour average of ~22 µg/m³ ≈ one cigarette per day.

```
cigarette-equivalent = dose (µg) ÷ 440
```

This converts an abstract microgram figure into something a family intuitively
understands, which is the whole point of the Breath Ledger.

## 4. Indoor concentration — steady-state mass balance (`indoorPm25`)

```
C_in / C_out = (P · a) / (a + k + λ)        λ = CADR / Volume
```

- `P` penetration factor (0.7 sealed / 1.0 windows open)
- `a` air-exchange / infiltration rate (0.5 /h sealed, 2.0 /h open)
- `k` PM2.5 deposition rate (0.2 /h)
- `λ` clean-air delivery from a purifier = CADR ÷ room volume

This is standard indoor-aerosol physics (e.g. Nazaroff, *Indoor Air*, 2004). The
"auto-size" button solves for the CADR that delivers **5 air changes per hour**
of clean air, a common clean-room target: `CADR = 5 × Volume`.

## 5. Commute exposure (`commuteExposure`, `rankCommute`)

For each mode we compute trip time from distance and typical speed, an in-cabin
concentration from the ambient value times a mode exposure ratio, and then the
inhaled dose with the mode's activity-level ventilation:

| Mode | Speed (km/h) | Exposure ratio | Activity |
| --- | --- | --- | --- |
| Walk | 5 | 1.00 | moderate |
| Cycle | 15 | 1.00 | vigorous |
| Motorbike | 25 | 1.15 | sedentary |
| Auto-rickshaw | 20 | 1.20 | sedentary |
| Bus | 18 | 0.90 | sedentary |
| Metro | 32 | 0.75 | sedentary |
| Car (fresh air) | 24 | 0.85 | sedentary |
| Car (recirc + filter) | 24 | 0.40 | sedentary |

Exposure ratios are informed by in-vehicle vs ambient PM studies (e.g. Int Panis
et al., *Atmospheric Environment*, 2010, for active modes) and cabin-filtration /
recirculation literature. Active modes carry extra dose through elevated
ventilation, which the dose formula captures directly.

## 6. Community avoided emissions (`lib/community.ts`)

Per-week pledge savings use typical Indian passenger-car intensity
(~0.17 kg CO₂/km, ARAI/IPCC range) and household fuel-switch estimates. CO₂
savings are expressed as a "trees working" equivalent using ~0.4 kg CO₂ absorbed
per mature tree per week (~21 kg/year).

## 7. Vulnerability weighting (`lib/personas.ts`)

Persona `sensitivity` multipliers (1.0 = general adult) weight the **risk
framing** only — never the physical dose maths. Children, seniors, pregnant
people and cardio-respiratory patients experience larger health effects at the
same concentration (WHO 2021 Global Air Quality Guidelines; US EPA Integrated
Science Assessment for Particulate Matter, 2019).

---

### Sources

- Central Pollution Control Board, *National Air Quality Index* report, 2014.
- US EPA, *Exposure Factors Handbook*, 2011 (Ch. 6, inhalation rates).
- Berkeley Earth, *Air Pollution and Cigarette Equivalence*, R. Muller, 2015.
- W. Nazaroff, "Indoor particle dynamics," *Indoor Air*, 2004.
- Int Panis et al., "Exposure to particulate matter in traffic," *Atmospheric Environment*, 2010.
- WHO, *Global Air Quality Guidelines*, 2021.

_All external data and factors are used for estimation and education, not medical diagnosis._
