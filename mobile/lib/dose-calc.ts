/**
 * Dose calculation engine. Pure functions — easy to unit test.
 */

export type DrugDoseInfo = {
  pediMgPerKgDose?: number | null;
  pediMgPerKgDay?: number | null;
  pediMaxPerDose?: number | null;
  pediMaxPerDay?: number | null;
  pediFreqPerDay?: number | null;
  pediMinAgeMonths?: number | null;
  pediNotes?: string | null;
  adultDoseMin?: number | null;
  adultDoseMax?: number | null;
  adultMaxPerDay?: number | null;
  adultFreqPerDay?: number | null;
  adultNotes?: string | null;
};

export type DrugFormInfo = {
  id: string;
  type: string;       // TABLET, SYRUP, ...
  strength: string;   // display
  amountMg?: number | null;
  perMl?: number | null;
};

export type PediatricInput = {
  weightKg: number;
  ageMonths?: number;
};

export type PediatricResult = {
  ok: boolean;
  reason?: string;     // why not ok
  perDoseMg: number;
  perDayMg: number;
  freqPerDay: number;
  capped: { perDose: boolean; perDay: boolean };
  warnings: string[];
  formConversions: FormConversion[];
};

export type AdultResult = {
  ok: boolean;
  reason?: string;
  perDoseMinMg: number;
  perDoseMaxMg: number;
  freqPerDay: number;
  perDayMinMg: number;
  perDayMaxMg: number;
  warnings: string[];
  formConversions: FormConversion[]; // computed against the high end
};

export type FormConversion = {
  formId: string;
  formType: string;
  strength: string;
  // For tablet/capsule/etc → "X tablet/dosis"
  // For syrup/suspension → "Y ml/dosis"
  amountText: string;
  numericAmount?: number;
  unitLabel?: string; // "tablet", "ml", "..."
};

const SOLID_TYPES = new Set(['TABLET', 'CAPSULE', 'SUPPOSITORY']);
const LIQUID_TYPES = new Set(['SYRUP', 'SUSPENSION', 'DROPS', 'INJECTION']);

function fmt(n: number, digits = 2) {
  if (!isFinite(n)) return '-';
  // Trim trailing zeros nicely
  return Number(n.toFixed(digits)).toString();
}

function convertToForm(perDoseMg: number, form: DrugFormInfo): FormConversion {
  const t = form.type.toUpperCase();
  if (SOLID_TYPES.has(t) && form.amountMg && form.amountMg > 0) {
    const tabs = perDoseMg / form.amountMg;
    return {
      formId: form.id,
      formType: form.type,
      strength: form.strength,
      numericAmount: tabs,
      unitLabel: t === 'CAPSULE' ? 'kapsul' : t === 'SUPPOSITORY' ? 'supp' : 'tablet',
      amountText: `${fmt(tabs)} ${t === 'CAPSULE' ? 'kapsul' : t === 'SUPPOSITORY' ? 'supp' : 'tablet'} per dosis`,
    };
  }
  if (LIQUID_TYPES.has(t) && form.amountMg && form.perMl && form.amountMg > 0 && form.perMl > 0) {
    const mgPerMl = form.amountMg / form.perMl;
    const ml = perDoseMg / mgPerMl;
    return {
      formId: form.id,
      formType: form.type,
      strength: form.strength,
      numericAmount: ml,
      unitLabel: 'ml',
      amountText: `${fmt(ml)} ml per dosis`,
    };
  }
  return {
    formId: form.id,
    formType: form.type,
    strength: form.strength,
    amountText: 'Konversi tidak tersedia untuk sediaan ini',
  };
}

export function calcPediatric(
  drug: DrugDoseInfo,
  forms: DrugFormInfo[],
  input: PediatricInput
): PediatricResult {
  const warnings: string[] = [];

  if (drug.pediMgPerKgDose == null && drug.pediMgPerKgDay == null) {
    return {
      ok: false,
      reason: 'Obat ini tidak memiliki dosis pediatri.',
      perDoseMg: 0, perDayMg: 0, freqPerDay: 0,
      capped: { perDose: false, perDay: false },
      warnings, formConversions: [],
    };
  }
  if (input.weightKg <= 0 || input.weightKg > 200) {
    return {
      ok: false,
      reason: 'Berat badan tidak valid (0–200 kg).',
      perDoseMg: 0, perDayMg: 0, freqPerDay: 0,
      capped: { perDose: false, perDay: false },
      warnings, formConversions: [],
    };
  }
  if (drug.pediMinAgeMonths && input.ageMonths != null && input.ageMonths < drug.pediMinAgeMonths) {
    warnings.push(`Tidak direkomendasikan di bawah usia ${drug.pediMinAgeMonths} bulan.`);
  }

  const freq = drug.pediFreqPerDay ?? 3;
  let perDoseMg = 0;

  if (drug.pediMgPerKgDose != null) {
    perDoseMg = drug.pediMgPerKgDose * input.weightKg;
  } else if (drug.pediMgPerKgDay != null) {
    perDoseMg = (drug.pediMgPerKgDay * input.weightKg) / freq;
  }

  let cappedPerDose = false;
  if (drug.pediMaxPerDose != null && perDoseMg > drug.pediMaxPerDose) {
    perDoseMg = drug.pediMaxPerDose;
    cappedPerDose = true;
  }

  let perDayMg = perDoseMg * freq;
  let cappedPerDay = false;
  if (drug.pediMaxPerDay != null && perDayMg > drug.pediMaxPerDay) {
    perDayMg = drug.pediMaxPerDay;
    perDoseMg = perDayMg / freq;
    cappedPerDay = true;
  }

  if (cappedPerDose) warnings.push('Dosis per kali dibatasi ke dosis maksimum.');
  if (cappedPerDay) warnings.push('Dosis per hari dibatasi ke dosis maksimum harian.');

  const formConversions = forms.map((f) => convertToForm(perDoseMg, f));

  return {
    ok: true,
    perDoseMg,
    perDayMg,
    freqPerDay: freq,
    capped: { perDose: cappedPerDose, perDay: cappedPerDay },
    warnings,
    formConversions,
  };
}

export function calcAdult(drug: DrugDoseInfo, forms: DrugFormInfo[]): AdultResult {
  const warnings: string[] = [];
  if (drug.adultDoseMin == null && drug.adultDoseMax == null) {
    return {
      ok: false,
      reason: 'Obat ini tidak memiliki dosis dewasa.',
      perDoseMinMg: 0, perDoseMaxMg: 0, freqPerDay: 0,
      perDayMinMg: 0, perDayMaxMg: 0,
      warnings, formConversions: [],
    };
  }
  const min = drug.adultDoseMin ?? drug.adultDoseMax ?? 0;
  const max = drug.adultDoseMax ?? drug.adultDoseMin ?? 0;
  const freq = drug.adultFreqPerDay ?? 3;
  let perDayMin = min * freq;
  let perDayMax = max * freq;
  if (drug.adultMaxPerDay != null && perDayMax > drug.adultMaxPerDay) {
    perDayMax = drug.adultMaxPerDay;
    warnings.push('Dosis maksimum harian dewasa membatasi total per hari.');
  }
  const formConversions = forms.map((f) => convertToForm(max, f));
  return {
    ok: true,
    perDoseMinMg: min,
    perDoseMaxMg: max,
    freqPerDay: freq,
    perDayMinMg: perDayMin,
    perDayMaxMg: perDayMax,
    warnings,
    formConversions,
  };
}

export function freqLabel(freq: number): string {
  switch (freq) {
    case 1: return '1× sehari';
    case 2: return '2× sehari (tiap 12 jam)';
    case 3: return '3× sehari (tiap 8 jam)';
    case 4: return '4× sehari (tiap 6 jam)';
    case 6: return '6× sehari (tiap 4 jam)';
    default: return `${freq}× sehari`;
  }
}
