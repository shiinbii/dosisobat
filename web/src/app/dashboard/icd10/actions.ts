'use server';

import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';

export type Icd10Input = {
  code: string;
  description: string;
  descriptionId: string | null;
  category: string | null;
  isActive: boolean;
};

export async function upsertIcd10(data: Icd10Input): Promise<void> {
  const code = data.code.trim().toUpperCase();
  const { error } = await supabaseAdmin
    .from('Icd10')
    .upsert(
      {
        code,
        description: data.description,
        descriptionId: data.descriptionId,
        category: data.category,
        isActive: data.isActive ?? true,
      },
      { onConflict: 'code' }
    );
  if (error) throw new Error(`Gagal upsert Icd10: ${error.message}`);
  revalidatePath('/dashboard/icd10');
}

export async function deleteIcd10(code: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('Icd10')
    .update({ isActive: false })
    .eq('code', code);
  if (error) throw new Error(`Gagal hapus: ${error.message}`);
  revalidatePath('/dashboard/icd10');
}
