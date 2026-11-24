import type { ActivityLevel, PersonaId } from "./types";

/**
 * Persona definitions.
 *
 * `sensitivity` is a transparent, evidence-informed vulnerability multiplier applied
 * ONLY to the health-risk framing (not to the physical inhaled-dose math, which is
 * governed by ventilation + concentration + time). Children, the elderly, pregnant
 * people and those with cardio-respiratory conditions experience larger health effects
 * at the same PM2.5 concentration (WHO 2021 Global Air Quality Guidelines; US EPA
 * Integrated Science Assessment for Particulate Matter, 2019).
 */
export interface PersonaDef {
  id: PersonaId;
  label: string;
  emoji: string;
  sensitivity: number; // 1.0 = general adult baseline
  note: string;
}

export const PERSONAS: Record<PersonaId, PersonaDef> = {
  infant: {
    id: "infant",
    label: "Infant (0–2)",
    emoji: "👶",
    sensitivity: 1.9,
    note: "Developing lungs and high breathing rate per kg of body weight.",
  },
  child: {
    id: "child",
    label: "Child (3–12)",
    emoji: "🧒",
    sensitivity: 1.6,
    note: "Lungs still developing; spends more active time outdoors.",
  },
  teen: {
    id: "teen",
    label: "Teen (13–18)",
    emoji: "🧑",
    sensitivity: 1.2,
    note: "Often high outdoor exertion (sports, commute).",
  },
  adult: {
    id: "adult",
    label: "Adult",
    emoji: "🧑‍💼",
    sensitivity: 1.0,
    note: "General population baseline.",
  },
  senior: {
    id: "senior",
    label: "Senior (60+)",
    emoji: "🧓",
    sensitivity: 1.7,
    note: "Higher risk of cardiac and respiratory complications.",
  },
  pregnant: {
    id: "pregnant",
    label: "Pregnant",
    emoji: "🤰",
    sensitivity: 1.6,
    note: "PM2.5 linked to low birth weight and pre-term birth.",
  },
  asthmatic: {
    id: "asthmatic",
    label: "Asthma / COPD",
    emoji: "🫁",
    sensitivity: 1.8,
    note: "Airways hyper-reactive; smog can trigger acute attacks.",
  },
  heart: {
    id: "heart",
    label: "Heart condition",
    emoji: "❤️",
    sensitivity: 1.7,
    note: "PM2.5 raises risk of arrhythmia and ischaemic events.",
  },
  athlete: {
    id: "athlete",
    label: "Athlete / runner",
    emoji: "🏃",
    sensitivity: 1.1,
    note: "Sustained high ventilation multiplies inhaled dose.",
  },
  outdoor_worker: {
    id: "outdoor_worker",
    label: "Outdoor worker",
    emoji: "👷",
    sensitivity: 1.4,
    note: "Long unavoidable outdoor exposure during peak pollution.",
  },
};

export const PERSONA_LIST: PersonaDef[] = Object.values(PERSONAS);

/**
 * Minute-ventilation (breathing rate) by activity level, in cubic metres per hour.
 * Values are adult short-term inhalation rates adapted from the
 * US EPA Exposure Factors Handbook (2011), Chapter 6, Table 6-2.
 */
export const VENTILATION_M3_PER_H: Record<ActivityLevel, number> = {
  rest: 0.4,
  sedentary: 0.5,
  light: 1.1,
  moderate: 1.6,
  vigorous: 3.0,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  rest: "Sleeping / resting",
  sedentary: "Sitting (desk, commute)",
  light: "Light activity (housework, slow walk)",
  moderate: "Moderate (brisk walk, play)",
  vigorous: "Vigorous (running, hard cycling)",
};
