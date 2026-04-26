'use client';

import { useState } from 'react';

type Form = {
  type: string; strength: string; amountMg?: number | null; perMl?: number | null; packaging?: string | null;
};

type Drug = {
  name: string; brandNames: string; category: string; routes: string;
  composition?: string | null; indication?: string | null; contraindication?: string | null;
  sideEffects?: string | null; warning?: string | null;
  pediMgPerKgDose?: number | null; pediMgPerKgDay?: number | null;
  pediMaxPerDose?: number | null; pediMaxPerDay?: number | null;
  pediFreqPerDay?: number | null; pediMinAgeMonths?: number | null;
  pediNotes?: string | null;
  adultDoseMin?: number | null; adultDoseMax?: number | null;
  adultMaxPerDay?: number | null; adultFreqPerDay?: number | null;
  adultNotes?: string | null;
  isActive?: boolean;
  forms: Form[];
};

const empty: Drug = {
  name: '', brandNames: '', category: '', routes: 'ORAL',
  composition: '', indication: '', contraindication: '', sideEffects: '', warning: '',
  pediMgPerKgDose: null, pediMgPerKgDay: null, pediMaxPerDose: null, pediMaxPerDay: null,
  pediFreqPerDay: null, pediMinAgeMonths: null, pediNotes: '',
  adultDoseMin: null, adultDoseMax: null, adultMaxPerDay: null, adultFreqPerDay: null, adultNotes: '',
  isActive: true,
  forms: [],
};

const num = (v: string): number | null => (v === '' ? null : Number(v));

export function DrugForm({
  initial, onSubmit, busy,
}: { initial?: Drug; onSubmit: (data: Drug) => void; busy?: boolean }) {
  const [d, setD] = useState<Drug>(initial ?? empty);

  const set = <K extends keyof Drug>(k: K, v: Drug[K]) => setD((x) => ({ ...x, [k]: v }));

  const setForm = (i: number, k: keyof Form, v: any) => {
    setD((x) => ({ ...x, forms: x.forms.map((f, idx) => idx === i ? { ...f, [k]: v } : f) }));
  };
  const addForm = () =>
    setD((x) => ({ ...x, forms: [...x.forms, { type: 'TABLET', strength: '', amountMg: null, perMl: null }] }));
  const removeForm = (i: number) =>
    setD((x) => ({ ...x, forms: x.forms.filter((_, idx) => idx !== i) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(d);
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <Row>
        <Field label="Nama (generic)"><input className={inputCls} value={d.name} onChange={(e) => set('name', e.target.value)} required /></Field>
        <Field label="Kategori"><input className={inputCls} value={d.category} onChange={(e) => set('category', e.target.value)} required /></Field>
      </Row>
      <Row>
        <Field label="Brand names (CSV)"><input className={inputCls} value={d.brandNames ?? ''} onChange={(e) => set('brandNames', e.target.value)} /></Field>
        <Field label="Routes (CSV)"><input className={inputCls} value={d.routes} onChange={(e) => set('routes', e.target.value)} required placeholder="ORAL,INJECTION" /></Field>
      </Row>

      <Field label="Komposisi"><textarea className={inputCls} value={d.composition ?? ''} onChange={(e) => set('composition', e.target.value)} /></Field>
      <Field label="Indikasi"><textarea className={inputCls} value={d.indication ?? ''} onChange={(e) => set('indication', e.target.value)} /></Field>
      <Field label="Kontraindikasi"><textarea className={inputCls} value={d.contraindication ?? ''} onChange={(e) => set('contraindication', e.target.value)} /></Field>
      <Field label="Efek samping"><textarea className={inputCls} value={d.sideEffects ?? ''} onChange={(e) => set('sideEffects', e.target.value)} /></Field>
      <Field label="Peringatan"><textarea className={inputCls} value={d.warning ?? ''} onChange={(e) => set('warning', e.target.value)} /></Field>

      <h3 className="font-semibold pt-4 border-t border-stone-200">Dosis Pediatri</h3>
      <Row>
        <Field label="mg/kg/dose"><input className={inputCls} type="number" step="any" value={d.pediMgPerKgDose ?? ''} onChange={(e) => set('pediMgPerKgDose', num(e.target.value))} /></Field>
        <Field label="mg/kg/day"><input className={inputCls} type="number" step="any" value={d.pediMgPerKgDay ?? ''} onChange={(e) => set('pediMgPerKgDay', num(e.target.value))} /></Field>
        <Field label="Max per dose"><input className={inputCls} type="number" step="any" value={d.pediMaxPerDose ?? ''} onChange={(e) => set('pediMaxPerDose', num(e.target.value))} /></Field>
      </Row>
      <Row>
        <Field label="Max per day"><input className={inputCls} type="number" step="any" value={d.pediMaxPerDay ?? ''} onChange={(e) => set('pediMaxPerDay', num(e.target.value))} /></Field>
        <Field label="Frekuensi/hari"><input className={inputCls} type="number" value={d.pediFreqPerDay ?? ''} onChange={(e) => set('pediFreqPerDay', num(e.target.value))} /></Field>
        <Field label="Min usia (bln)"><input className={inputCls} type="number" value={d.pediMinAgeMonths ?? ''} onChange={(e) => set('pediMinAgeMonths', num(e.target.value))} /></Field>
      </Row>
      <Field label="Catatan dosis anak"><textarea className={inputCls} value={d.pediNotes ?? ''} onChange={(e) => set('pediNotes', e.target.value)} /></Field>

      <h3 className="font-semibold pt-4 border-t border-stone-200">Dosis Dewasa</h3>
      <Row>
        <Field label="Min dosis (mg)"><input className={inputCls} type="number" step="any" value={d.adultDoseMin ?? ''} onChange={(e) => set('adultDoseMin', num(e.target.value))} /></Field>
        <Field label="Max dosis (mg)"><input className={inputCls} type="number" step="any" value={d.adultDoseMax ?? ''} onChange={(e) => set('adultDoseMax', num(e.target.value))} /></Field>
        <Field label="Max per day"><input className={inputCls} type="number" step="any" value={d.adultMaxPerDay ?? ''} onChange={(e) => set('adultMaxPerDay', num(e.target.value))} /></Field>
        <Field label="Frekuensi/hari"><input className={inputCls} type="number" value={d.adultFreqPerDay ?? ''} onChange={(e) => set('adultFreqPerDay', num(e.target.value))} /></Field>
      </Row>
      <Field label="Catatan dosis dewasa"><textarea className={inputCls} value={d.adultNotes ?? ''} onChange={(e) => set('adultNotes', e.target.value)} /></Field>

      <h3 className="font-semibold pt-4 border-t border-stone-200">Sediaan</h3>
      {d.forms.map((f, i) => (
        <div key={i} className="border border-stone-200 rounded p-3 space-y-2">
          <Row>
            <Field label="Tipe"><input className={inputCls} value={f.type} onChange={(e) => setForm(i, 'type', e.target.value)} placeholder="TABLET / SYRUP / INJECTION" /></Field>
            <Field label="Strength (display)"><input className={inputCls} value={f.strength} onChange={(e) => setForm(i, 'strength', e.target.value)} placeholder="500 mg / 125 mg/5ml" /></Field>
          </Row>
          <Row>
            <Field label="amountMg"><input className={inputCls} type="number" step="any" value={f.amountMg ?? ''} onChange={(e) => setForm(i, 'amountMg', num(e.target.value))} /></Field>
            <Field label="perMl (untuk cairan)"><input className={inputCls} type="number" step="any" value={f.perMl ?? ''} onChange={(e) => setForm(i, 'perMl', num(e.target.value))} /></Field>
            <Field label="Kemasan"><input className={inputCls} value={f.packaging ?? ''} onChange={(e) => setForm(i, 'packaging', e.target.value)} /></Field>
          </Row>
          <button type="button" onClick={() => removeForm(i)} className="text-red-600 text-sm">Hapus sediaan</button>
        </div>
      ))}
      <button type="button" onClick={addForm} className="text-primary text-sm">+ Tambah sediaan</button>

      <div className="pt-4 border-t border-stone-200 flex gap-2">
        <button disabled={busy} className="bg-primary text-white px-6 py-2 rounded hover:bg-primaryDark disabled:opacity-50">
          {busy ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </form>
  );
}

const inputCls = 'w-full border border-stone-300 rounded px-3 py-2 text-sm';

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-stone-700 font-medium">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
