-- =============================================================
-- Seed Drug + DrugForm (30 obat starter)
-- Idempotent — boleh dijalankan ulang.
-- =============================================================

-- ===== 1. Paracetamol =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_paracetamol','Paracetamol','paracetamol','Panadol, Sanmol, Tempra, Pamol, Biogesic','Analgesik / Antipiretik','ORAL,RECTAL,INJECTION','Paracetamol (acetaminophen)','Demam dan nyeri ringan-sedang.','Hipersensitivitas paracetamol; gangguan hati berat.','Jarang: ruam, hepatotoksisitas pada dosis berlebih.','Dosis maksimum dewasa 4 g/hari. Hati-hati pada gangguan hati & alkoholik kronis.',15,1000,4000,4,0,'10–15 mg/kgBB/dosis tiap 4–6 jam, maks 60 mg/kgBB/hari (atau 4 g/hari, mana lebih kecil).',500,1000,4000,4,'500–1000 mg tiap 4–6 jam, maks 4 g/hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_paracetamol_1','d_paracetamol','TABLET','500 mg',500,NULL,'Strip 10 tablet'),
('f_paracetamol_2','d_paracetamol','TABLET','650 mg',650,NULL,'Strip 10 tablet'),
('f_paracetamol_3','d_paracetamol','SYRUP','120 mg / 5 ml',120,5,'Botol 60 ml'),
('f_paracetamol_4','d_paracetamol','SYRUP','160 mg / 5 ml',160,5,'Botol 60 ml'),
('f_paracetamol_5','d_paracetamol','DROPS','100 mg / 1 ml',100,1,'Botol 15 ml'),
('f_paracetamol_6','d_paracetamol','SUPPOSITORY','125 mg',125,NULL,NULL),
('f_paracetamol_7','d_paracetamol','INJECTION','10 mg / 1 ml',10,1,'Vial 100 ml')
ON CONFLICT ("id") DO NOTHING;

-- ===== 2. Ibuprofen =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ibuprofen','Ibuprofen','ibuprofen','Proris, Bufect, Brufen, Arfen','AINS (Analgesik / Antipiretik / Antiinflamasi)','ORAL','Ibuprofen','Demam, nyeri, inflamasi.','Tukak lambung aktif, gangguan ginjal berat, asma berat, perdarahan aktif, anak < 6 bulan.','Mual, dispepsia, perdarahan saluran cerna, gangguan ginjal.','Berikan bersama makanan. Hindari pada dehidrasi.',10,400,2400,3,6,'5–10 mg/kgBB/dosis tiap 6–8 jam, maks 40 mg/kgBB/hari. Tidak untuk usia < 6 bulan.',200,400,1200,3,'200–400 mg tiap 6–8 jam, maks 1200 mg/hari (OTC). Resep dokter dapat sampai 2400 mg/hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ibuprofen_1','d_ibuprofen','TABLET','200 mg',200,NULL,NULL),
('f_ibuprofen_2','d_ibuprofen','TABLET','400 mg',400,NULL,NULL),
('f_ibuprofen_3','d_ibuprofen','SYRUP','100 mg / 5 ml',100,5,'Botol 60 ml'),
('f_ibuprofen_4','d_ibuprofen','SUSPENSION','200 mg / 5 ml',200,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 3. Amoxicillin =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_amoxicillin','Amoxicillin','amoxicillin','Amoxsan, Yusimox, Kalmoxillin, Amoxil','Antibiotik (Penisilin)','ORAL,INJECTION','Amoxicillin trihydrate','Infeksi saluran napas, otitis media, infeksi saluran kemih, infeksi kulit.','Hipersensitivitas penisilin / sefalosporin.','Diare, mual, ruam, kandidiasis.','Tanyakan riwayat alergi penisilin. Selesaikan kursus penuh.',15,50,1000,3000,3,0,'25–50 mg/kgBB/hari dibagi 3 dosis. Untuk otitis media / pneumonia: 80–90 mg/kgBB/hari dibagi 2–3 dosis.',500,1000,3000,3,'500 mg tiap 8 jam atau 875 mg tiap 12 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_amoxicillin_1','d_amoxicillin','CAPSULE','250 mg',250,NULL,NULL),
('f_amoxicillin_2','d_amoxicillin','CAPSULE','500 mg',500,NULL,NULL),
('f_amoxicillin_3','d_amoxicillin','TABLET','500 mg',500,NULL,NULL),
('f_amoxicillin_4','d_amoxicillin','SYRUP','125 mg / 5 ml',125,5,'Botol 60 ml (kering)'),
('f_amoxicillin_5','d_amoxicillin','SYRUP','250 mg / 5 ml',250,5,'Botol 60 ml (kering)'),
('f_amoxicillin_6','d_amoxicillin','INJECTION','1 g vial',1000,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 4. Amoxicillin-Clavulanate =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_amoxiclav','Amoxicillin-Clavulanate','amoxicillin-clavulanate','Augmentin, Clavamox, Claneksi','Antibiotik (Penisilin + Beta-laktamase Inhibitor)','ORAL,INJECTION','Amoxicillin + asam klavulanat','Infeksi resistensi beta-laktamase: sinusitis, otitis media, ISK, infeksi kulit.','Riwayat hepatitis kolestatik akibat amoxiclav, hipersensitivitas penisilin.','Diare (lebih sering dari amoxicillin), mual, ruam.','Dosis berdasarkan komponen amoxicillin.',15,45,875,1750,2,3,'25–45 mg/kgBB/hari (komponen amoxicillin) dibagi 2 dosis. Untuk infeksi berat: 90 mg/kgBB/hari.',625,1000,3000,2,'625 mg tiap 8 jam atau 1000 mg tiap 12 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_amoxiclav_1','d_amoxiclav','TABLET','500/125 mg',500,NULL,NULL),
('f_amoxiclav_2','d_amoxiclav','TABLET','875/125 mg',875,NULL,NULL),
('f_amoxiclav_3','d_amoxiclav','SYRUP','125/31.25 mg / 5 ml',125,5,NULL),
('f_amoxiclav_4','d_amoxiclav','SYRUP','250/62.5 mg / 5 ml',250,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 5. Cefixime =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_cefixime','Cefixime','cefixime','Cefspan, Fixiphar, Helixim, Maxpro','Antibiotik (Sefalosporin Generasi 3)','ORAL','Cefixime trihydrate','ISK, gonore tanpa komplikasi, infeksi saluran napas, otitis media.','Hipersensitivitas sefalosporin.','Diare, mual, ruam.','Hati-hati pada riwayat alergi penisilin (cross-reactivity ~5%).',4,8,200,400,2,6,'8 mg/kgBB/hari dibagi 1–2 dosis.',200,400,400,2,'200 mg tiap 12 jam atau 400 mg/hari sekali sehari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_cefixime_1','d_cefixime','CAPSULE','100 mg',100,NULL,NULL),
('f_cefixime_2','d_cefixime','CAPSULE','200 mg',200,NULL,NULL),
('f_cefixime_3','d_cefixime','SYRUP','100 mg / 5 ml',100,5,'Botol 30 ml')
ON CONFLICT ("id") DO NOTHING;

-- ===== 6. Ceftriaxone =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ceftriaxone','Ceftriaxone','ceftriaxone','Ceftrix, Terfacef, Brospec','Antibiotik (Sefalosporin Generasi 3)','INJECTION','Ceftriaxone sodium','Infeksi berat: sepsis, meningitis, pneumonia berat, demam tifoid.','Hipersensitivitas sefalosporin. Neonatus dengan hiperbilirubinemia. Tidak dicampur larutan kalsium.','Diare, eosinofilia, peningkatan enzim hati, reaksi hipersensitivitas.','Pemberian IM nyeri — encerkan dengan lidokain 1%. Pemberian IV pelan ≥ 30 menit pada anak.',50,80,2000,4000,1,0,'50–80 mg/kgBB/hari sekali sehari. Meningitis: 100 mg/kgBB/hari (maks 4 g) dibagi 1–2 dosis.',1000,2000,4000,1,'1–2 g/hari sekali sehari. Meningitis: 2 g tiap 12 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ceftriaxone_1','d_ceftriaxone','INJECTION','1 g vial',1000,NULL,NULL),
('f_ceftriaxone_2','d_ceftriaxone','INJECTION','500 mg vial',500,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 7. Cefadroxil =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_cefadroxil','Cefadroxil','cefadroxil','Lostacef, Droxefa, Cefat','Antibiotik (Sefalosporin Generasi 1)','ORAL','Cefadroxil monohydrate','Infeksi kulit, faringitis streptokokus, ISK tidak berkomplikasi.','Hipersensitivitas sefalosporin.','Diare, mual, ruam.','Sesuaikan dosis pada gangguan ginjal.',15,30,1000,2000,2,0,'30 mg/kgBB/hari dibagi 2 dosis.',500,1000,2000,2,'500 mg tiap 12 jam atau 1 g/hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_cefadroxil_1','d_cefadroxil','CAPSULE','500 mg',500,NULL,NULL),
('f_cefadroxil_2','d_cefadroxil','SYRUP','125 mg / 5 ml',125,5,NULL),
('f_cefadroxil_3','d_cefadroxil','SYRUP','250 mg / 5 ml',250,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 8. Azithromycin =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_azithromycin','Azithromycin','azithromycin','Zithromax, Zibramax, Aztrin','Antibiotik (Makrolida)','ORAL,INJECTION','Azithromycin dihydrate','Infeksi saluran napas, infeksi kulit ringan, alternatif untuk alergi penisilin.','Hipersensitivitas makrolida, gangguan hati berat.','Mual, diare, nyeri perut, perpanjangan QT.','Hati-hati pada pasien dengan QT interval memanjang.',10,500,500,1,6,'10 mg/kgBB hari pertama, lalu 5 mg/kgBB/hari hari ke-2 sampai 5. Atau 10 mg/kgBB/hari × 3 hari.',250,500,500,1,'500 mg hari 1, lalu 250 mg/hari hari 2–5. Atau 500 mg/hari × 3 hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_azithromycin_1','d_azithromycin','TABLET','250 mg',250,NULL,NULL),
('f_azithromycin_2','d_azithromycin','TABLET','500 mg',500,NULL,NULL),
('f_azithromycin_3','d_azithromycin','SYRUP','200 mg / 5 ml',200,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 9. Cotrimoxazole =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_cotrimoxazole','Cotrimoxazole','cotrimoxazole','Bactrim, Sanprima, Primazole','Antibiotik (Sulfonamid + Trimethoprim)','ORAL,INJECTION','Sulfamethoxazole 400 mg + Trimethoprim 80 mg (single strength) / 800 + 160 (double strength)','ISK, profilaksis PCP, infeksi saluran napas, diare bakterial.','Defisiensi G6PD, gangguan hati/ginjal berat, hamil trimester 1 & 3, neonatus < 2 bulan.','Ruam (termasuk SJS), gangguan hematologi, kristaluria.','Asupan cairan adekuat. Stop bila ruam.',4,8,160,320,2,2,'Berdasarkan komponen trimethoprim: 8 mg/kgBB/hari dibagi 2 dosis. Untuk PCP: 15–20 mg/kgBB/hari.',160,320,640,2,'160 mg trimethoprim (= 1 tablet DS) tiap 12 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_cotrimoxazole_1','d_cotrimoxazole','TABLET','480 mg (SS)',480,NULL,NULL),
('f_cotrimoxazole_2','d_cotrimoxazole','TABLET','960 mg (DS)',960,NULL,NULL),
('f_cotrimoxazole_3','d_cotrimoxazole','SYRUP','240 mg / 5 ml',240,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 10. Metronidazole =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMgPerKgDay","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_metronidazole','Metronidazole','metronidazole','Flagyl, Trichodazol, Farizol','Antibiotik (Nitroimidazol)','ORAL,INJECTION,TOPICAL','Metronidazole','Infeksi anaerob, amubiasis, giardiasis, vaginosis bakterial, H. pylori (kombinasi).','Hipersensitivitas, hamil trimester 1.','Rasa logam di mulut, mual, neuropati perifer (jangka panjang).','Hindari alkohol selama dan 48 jam setelah terapi (efek disulfiram).',7.5,30,500,2000,3,0,'Amubiasis: 35–50 mg/kgBB/hari dibagi 3 dosis × 7–10 hari. Giardiasis: 15 mg/kgBB/hari.',250,500,2000,3,'500 mg tiap 8 jam × 7–10 hari (infeksi anaerob/amubiasis).')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_metronidazole_1','d_metronidazole','TABLET','250 mg',250,NULL,NULL),
('f_metronidazole_2','d_metronidazole','TABLET','500 mg',500,NULL,NULL),
('f_metronidazole_3','d_metronidazole','SYRUP','125 mg / 5 ml',125,5,NULL),
('f_metronidazole_4','d_metronidazole','INJECTION','500 mg / 100 ml',500,100,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 11. Ciprofloxacin =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ciprofloxacin','Ciprofloxacin','ciprofloxacin','Ciproxin, Baquinor, Interflox','Antibiotik (Fluorokuinolon)','ORAL,INJECTION,OPHTHALMIC,OTIC','Ciprofloxacin HCl','ISK, gastroenteritis bakterial, infeksi tulang, prostatitis.','Hipersensitivitas kuinolon, anak < 18 tahun (umumnya), hamil/menyusui.','Mual, diare, tendinopati, fototoksisitas, perpanjangan QT.','Tidak rutin pada anak; bila digunakan, dosis 10–20 mg/kgBB tiap 12 jam (kasus tertentu).',15,750,1500,2,12,'Hanya pada indikasi khusus (ISK kompleks, antrax). 10–20 mg/kgBB tiap 12 jam.',250,750,1500,2,'250–750 mg tiap 12 jam tergantung indikasi.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ciprofloxacin_1','d_ciprofloxacin','TABLET','250 mg',250,NULL,NULL),
('f_ciprofloxacin_2','d_ciprofloxacin','TABLET','500 mg',500,NULL,NULL),
('f_ciprofloxacin_3','d_ciprofloxacin','INJECTION','200 mg / 100 ml',200,100,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 12. Doxycycline =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_doxycycline','Doxycycline','doxycycline','Vibramycin, Dohixat, Siclidon','Antibiotik (Tetrasiklin)','ORAL','Doxycycline hyclate','Akne, leptospirosis, klamidia, malaria profilaksis, demam tifus.','Anak < 8 tahun, hamil & menyusui, hipersensitivitas tetrasiklin.','Esofagitis, fototoksisitas, perubahan warna gigi (anak).','Minum dengan air banyak, posisi tegak. Hindari paparan matahari.','Tidak direkomendasikan untuk anak < 8 tahun karena diskolorasi gigi permanen.',100,200,200,2,'100 mg tiap 12 jam (loading 200 mg hari pertama).')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_doxycycline_1','d_doxycycline','CAPSULE','100 mg',100,NULL,NULL),
('f_doxycycline_2','d_doxycycline','TABLET','100 mg',100,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 13. Dexamethasone =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_dexamethasone','Dexamethasone','dexamethasone','Kalmethasone, Oradexon, Mexolon','Kortikosteroid','ORAL,INJECTION,TOPICAL,OPHTHALMIC','Dexamethasone / Dexamethasone sodium phosphate','Inflamasi berat, alergi berat, edema serebral, kroup, COVID-19 hipoksemia.','Infeksi sistemik tak terkontrol, hipersensitivitas.','Hiperglikemia, retensi cairan, gangguan tidur, supresi adrenal jangka panjang.','Tappering off bila terapi > 7–10 hari.',0.15,16,16,1,0,'Kroup: 0.15–0.6 mg/kgBB sekali (maks 16 mg). Antiinflamasi: 0.08–0.3 mg/kgBB/hari.',0.5,9,16,2,'0.5–9 mg/hari tergantung indikasi. COVID-19: 6 mg/hari × 10 hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_dexamethasone_1','d_dexamethasone','TABLET','0.5 mg',0.5,NULL,NULL),
('f_dexamethasone_2','d_dexamethasone','TABLET','0.75 mg',0.75,NULL,NULL),
('f_dexamethasone_3','d_dexamethasone','INJECTION','5 mg / 1 ml',5,1,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 14. Methylprednisolone =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_methylprednisolone','Methylprednisolone','methylprednisolone','Medrol, Methylon, Lameson','Kortikosteroid','ORAL,INJECTION','Methylprednisolone / Methylprednisolone sodium succinate','Asma akut berat, alergi, rheumatologic, autoimun.','Infeksi sistemik tak terkontrol, hipersensitivitas.','Sama dengan kortikosteroid lain.','Tappering off bila terapi > 7 hari.',1,60,60,2,0,'Asma akut: 1–2 mg/kgBB/hari dibagi 1–2 dosis (maks 60 mg/hari) × 5 hari.',4,48,60,2,'4–48 mg/hari tergantung indikasi.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_methylprednisolone_1','d_methylprednisolone','TABLET','4 mg',4,NULL,NULL),
('f_methylprednisolone_2','d_methylprednisolone','TABLET','8 mg',8,NULL,NULL),
('f_methylprednisolone_3','d_methylprednisolone','TABLET','16 mg',16,NULL,NULL),
('f_methylprednisolone_4','d_methylprednisolone','INJECTION','125 mg vial',125,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 15. Cetirizine =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_cetirizine','Cetirizine','cetirizine','Incidal-OD, Cerini, Estin','Antihistamin H1 (generasi 2)','ORAL','Cetirizine HCl','Rinitis alergi, urtikaria.','Hipersensitivitas. Hati-hati gangguan ginjal.','Kantuk ringan, mulut kering.','Dosis 5 mg/hari pada gangguan ginjal.',0.25,10,10,1,6,'6–12 bln: 2.5 mg/hari. 1–2 thn: 2.5 mg 1–2x/hari. 2–6 thn: 5 mg/hari atau 2.5 mg 2x. > 6 thn: 10 mg/hari.',10,10,10,1,'10 mg sekali sehari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_cetirizine_1','d_cetirizine','TABLET','10 mg',10,NULL,NULL),
('f_cetirizine_2','d_cetirizine','SYRUP','5 mg / 5 ml',5,5,NULL),
('f_cetirizine_3','d_cetirizine','DROPS','10 mg / 1 ml',10,1,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 16. Loratadine =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_loratadine','Loratadine','loratadine','Claritin, Lorahis, Alloris','Antihistamin H1 (generasi 2)','ORAL','Loratadine','Rinitis alergi, urtikaria kronik.','Hipersensitivitas.','Sakit kepala, kantuk ringan.','Sesuaikan dosis pada gangguan hati berat.',0.2,10,10,1,24,'2–5 thn: 5 mg/hari. > 6 thn: 10 mg/hari.',10,10,10,1,'10 mg sekali sehari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_loratadine_1','d_loratadine','TABLET','10 mg',10,NULL,NULL),
('f_loratadine_2','d_loratadine','SYRUP','5 mg / 5 ml',5,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 17. Salbutamol =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_salbutamol','Salbutamol','salbutamol','Ventolin, Lasal, Astharol','Bronkodilator (Beta-2 Agonis Short-acting)','ORAL,INHALATION,INJECTION','Salbutamol sulfate','Bronkospasme, asma akut, PPOK eksaserbasi.','Hipersensitivitas. Hati-hati hipertiroid, aritmia.','Tremor, takikardia, hipokalemia (dosis tinggi).','Inhaler / nebulizer = pilihan utama untuk asma akut.',0.1,4,16,4,0,'Oral: 0.1–0.15 mg/kgBB/dosis tiap 6–8 jam. Nebulizer: 0.15 mg/kgBB (min 2.5 mg, maks 5 mg).',2,4,16,4,'Oral 2–4 mg tiap 6–8 jam. Nebulizer 2.5–5 mg tiap 4–6 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_salbutamol_1','d_salbutamol','TABLET','2 mg',2,NULL,NULL),
('f_salbutamol_2','d_salbutamol','TABLET','4 mg',4,NULL,NULL),
('f_salbutamol_3','d_salbutamol','SYRUP','2 mg / 5 ml',2,5,NULL),
('f_salbutamol_4','d_salbutamol','INHALER','100 mcg / puff',0.1,NULL,NULL),
('f_salbutamol_5','d_salbutamol','INJECTION','0.5 mg / 1 ml',0.5,1,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 18. Ambroxol =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ambroxol','Ambroxol','ambroxol','Mucopect, Mucos, Epexol','Mukolitik','ORAL','Ambroxol HCl','Sekret kental pada saluran napas.','Hipersensitivitas, ulkus peptikum aktif.','Mual, dispepsia, ruam jarang.','Pastikan asupan cairan adekuat.',0.5,30,3,0,'< 2 thn: 7.5 mg 2x. 2–5 thn: 7.5 mg 2–3x. 6–12 thn: 15 mg 2–3x.',30,30,90,3,'30 mg tiap 8 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ambroxol_1','d_ambroxol','TABLET','30 mg',30,NULL,NULL),
('f_ambroxol_2','d_ambroxol','SYRUP','15 mg / 5 ml',15,5,NULL),
('f_ambroxol_3','d_ambroxol','SYRUP','30 mg / 5 ml',30,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 19. Ondansetron =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ondansetron','Ondansetron','ondansetron','Zofran, Narfoz, Vometron','Antiemetik (5-HT3 antagonist)','ORAL,INJECTION','Ondansetron HCl','Mual & muntah karena kemoterapi, gastroenteritis berat.','Hipersensitivitas, sindrom QT panjang.','Sakit kepala, konstipasi, perpanjangan QT.','Hati-hati pada gangguan elektrolit.',0.15,8,24,3,6,'0.1–0.15 mg/kgBB tiap 8 jam, maks 8 mg/dosis.',4,8,24,3,'4–8 mg tiap 8 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ondansetron_1','d_ondansetron','TABLET','4 mg',4,NULL,NULL),
('f_ondansetron_2','d_ondansetron','TABLET','8 mg',8,NULL,NULL),
('f_ondansetron_3','d_ondansetron','INJECTION','4 mg / 2 ml',4,2,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 20. Domperidone =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_domperidone','Domperidone','domperidone','Motilium, Vomistop, Vomitas','Antiemetik (Antagonis dopamin)','ORAL','Domperidone','Mual, muntah, dispepsia fungsional.','Sindrom QT panjang, perdarahan saluran cerna, prolaktinoma.','Mulut kering, sakit kepala, perpanjangan QT.','Pemakaian seminim mungkin (idealnya ≤ 7 hari).',0.25,10,30,3,12,'0.25 mg/kgBB tiap 8 jam (maks 10 mg/dosis).',10,10,30,3,'10 mg tiap 8 jam, maks 7 hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_domperidone_1','d_domperidone','TABLET','10 mg',10,NULL,NULL),
('f_domperidone_2','d_domperidone','SYRUP','5 mg / 5 ml',5,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 21. Omeprazole =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_omeprazole','Omeprazole','omeprazole','Losec, Omevell, Stomacer','PPI (Proton Pump Inhibitor)','ORAL,INJECTION','Omeprazole','GERD, ulkus peptikum, dispepsia, profilaksis stress ulcer.','Hipersensitivitas.','Sakit kepala, diare, hipomagnesemia (jangka panjang).','Diminum 30 menit sebelum makan.',1,40,40,1,12,'1 mg/kgBB/hari sekali sehari (maks 40 mg).',20,40,80,1,'20–40 mg sekali sehari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_omeprazole_1','d_omeprazole','CAPSULE','20 mg',20,NULL,NULL),
('f_omeprazole_2','d_omeprazole','CAPSULE','40 mg',40,NULL,NULL),
('f_omeprazole_3','d_omeprazole','INJECTION','40 mg vial',40,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 22. Ranitidine =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_ranitidine','Ranitidine','ranitidine','Zantac, Rantin, Ranin','Antagonis H2','ORAL,INJECTION','Ranitidine HCl','Tukak lambung, GERD ringan-sedang.','Hipersensitivitas. Banyak negara tarik karena pengotor NDMA.','Sakit kepala, konstipasi.','Cek status izin edar — banyak yang ditarik karena NDMA.',2,150,300,2,1,'4–8 mg/kgBB/hari dibagi 2 dosis.',150,300,600,2,'150 mg tiap 12 jam atau 300 mg malam hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_ranitidine_1','d_ranitidine','TABLET','150 mg',150,NULL,NULL),
('f_ranitidine_2','d_ranitidine','INJECTION','25 mg / 1 ml',25,1,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 23. Oralit =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediNotes","adultNotes")
VALUES ('d_oralit','Oralit','oralit','Oralit, Pharolit, Aqualyte','Cairan rehidrasi oral','ORAL','NaCl, KCl, Na sitrat, glukosa (formula WHO)','Rehidrasi pada diare akut.','Dehidrasi berat dengan syok (butuh IV), muntah persisten, ileus.','Hipernatremia bila penyiapan salah.','Larutkan 1 sachet dalam 200 ml air matang.','< 1 thn: 50–100 ml tiap mencret. 1–5 thn: 100–200 ml tiap mencret. ≥ 5 thn: ad libitum.','200 ml tiap mencret, semau pasien.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_oralit_1','d_oralit','TABLET','1 sachet → 200 ml',0,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 24. Zinc =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_zinc','Zinc','zinc','Zincpro, Zinkid, L-Zinc','Suplemen','ORAL','Zinc sulfate / Zinc gluconate','Adjuvant tata laksana diare anak (10–14 hari), defisiensi zinc.','Hipersensitivitas.','Mual, rasa logam.','Sebaiknya tidak bersamaan dengan antibiotik tetrasiklin / kuinolon.',20,20,1,0,'< 6 bln: 10 mg/hari × 10–14 hari. ≥ 6 bln: 20 mg/hari × 10–14 hari.',20,40,40,1,'20–40 mg/hari sebagai suplemen.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_zinc_1','d_zinc','TABLET','20 mg',20,NULL,NULL),
('f_zinc_2','d_zinc','SYRUP','10 mg / 5 ml',10,5,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 25. Furosemide =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_furosemide','Furosemide','furosemide','Lasix, Farsix, Uresix','Diuretik loop','ORAL,INJECTION','Furosemide','Edema (gagal jantung, gangguan ginjal, sirosis), hipertensi.','Anuria, hipovolemia, hipersensitivitas sulfa.','Hipokalemia, hiponatremia, dehidrasi, ototoksisitas (IV cepat).','Monitor elektrolit.',1,40,80,2,0,'Oral 1–2 mg/kgBB/dosis. IV 0.5–1 mg/kgBB/dosis tiap 6–12 jam.',20,80,240,2,'20–80 mg/hari oral. IV 20–40 mg, dapat diulang.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_furosemide_1','d_furosemide','TABLET','40 mg',40,NULL,NULL),
('f_furosemide_2','d_furosemide','INJECTION','10 mg / 1 ml',10,1,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 26. Amlodipine =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_amlodipine','Amlodipine','amlodipine','Norvask, Tensivask, Amdixal','Antihipertensi (CCB Dihidropiridin)','ORAL','Amlodipine besylate','Hipertensi, angina.','Syok kardiogenik, stenosis aorta berat.','Edema tungkai, sakit kepala, flushing.','Mulai dosis rendah pada lansia.',0.1,5,10,1,72,'≥ 6 thn: 2.5–5 mg/hari sekali sehari.',5,10,10,1,'5–10 mg sekali sehari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_amlodipine_1','d_amlodipine','TABLET','5 mg',5,NULL,NULL),
('f_amlodipine_2','d_amlodipine','TABLET','10 mg',10,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 27. Captopril =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_captopril','Captopril','captopril','Capoten, Tensobon, Acepress','Antihipertensi (ACE Inhibitor)','ORAL','Captopril','Hipertensi, gagal jantung, post-MI, nefropati diabetik.','Hamil, stenosis arteri renalis bilateral, riwayat angioedema ACE-I.','Batuk kering, hiperkalemia, hipotensi, angioedema.','Diminum 1 jam sebelum makan.',0.3,25,150,3,0,'Inisial 0.3 mg/kgBB tiap 8 jam, titrasi.',12.5,50,150,3,'12.5–50 mg tiap 8 jam.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_captopril_1','d_captopril','TABLET','12.5 mg',12.5,NULL,NULL),
('f_captopril_2','d_captopril','TABLET','25 mg',25,NULL,NULL),
('f_captopril_3','d_captopril','TABLET','50 mg',50,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 28. Metformin =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMgPerKgDose","pediMaxPerDose","pediMaxPerDay","pediFreqPerDay","pediMinAgeMonths","pediNotes","adultDoseMin","adultDoseMax","adultMaxPerDay","adultFreqPerDay","adultNotes")
VALUES ('d_metformin','Metformin','metformin','Glucophage, Glumin, Diabex','Antidiabetik (Biguanid)','ORAL','Metformin HCl','Diabetes mellitus tipe 2, sindrom ovarium polikistik.','GFR < 30 mL/min, asidosis metabolik, gagal jantung berat dekompensasi.','Mual, diare, defisiensi B12 jangka panjang, asidosis laktat (jarang).','Stop sementara saat kontras IV. Diminum bersama makan.',10,1000,2000,2,120,'≥ 10 thn: mulai 500 mg 1x, naikkan tiap 1 minggu (maks 2000 mg/hari).',500,1000,2000,3,'500 mg 1–2x/hari, titrasi sampai maks 2000 mg/hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_metformin_1','d_metformin','TABLET','500 mg',500,NULL,NULL),
('f_metformin_2','d_metformin','TABLET','850 mg',850,NULL,NULL),
('f_metformin_3','d_metformin','TABLET','1000 mg',1000,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 29. Mupirocin =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMinAgeMonths","pediNotes","adultNotes")
VALUES ('d_mupirocin','Mupirocin','mupirocin','Bactroban, Pibaksin, Pirotop','Antibiotik topikal','TOPICAL','Mupirocin 2%','Impetigo, infeksi kulit superfisial, dekolonisasi MRSA hidung.','Hipersensitivitas.','Iritasi lokal, gatal.','Hindari kontak mata.',2,'Oles 2–3x/hari × 5–10 hari.','Oles 2–3x/hari × 5–10 hari.')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_mupirocin_1','d_mupirocin','OINTMENT','2% / 5 g',0,NULL,NULL),
('f_mupirocin_2','d_mupirocin','OINTMENT','2% / 15 g',0,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- ===== 30. Hydrocortisone =====
INSERT INTO "Drug" ("id","name","nameLower","brandNames","category","routes","composition","indication","contraindication","sideEffects","warning","pediMinAgeMonths","pediNotes","adultNotes")
VALUES ('d_hydrocortisone','Hydrocortisone','hydrocortisone','Berlicort, Hidcort, Steroderm','Kortikosteroid topikal (potensi rendah)','TOPICAL','Hydrocortisone 1% / 2.5%','Dermatitis, eksim, gigitan serangga.','Infeksi kulit (virus, jamur, bakteri tak diobati), rosacea, akne.','Atrofi kulit (jangka panjang), striae, telangiektasia.','Hindari di wajah jangka panjang. Untuk anak: maks 7 hari.',1,'Oles tipis 2x/hari, maks 7 hari di wajah/lipatan.','Oles tipis 2x/hari sampai gejala teratasi (maks 2 minggu).')
ON CONFLICT ("id") DO NOTHING;
INSERT INTO "DrugForm" ("id","drugId","type","strength","amountMg","perMl","packaging") VALUES
('f_hydrocortisone_1','d_hydrocortisone','CREAM','1% / 5 g',0,NULL,NULL),
('f_hydrocortisone_2','d_hydrocortisone','CREAM','2.5% / 10 g',0,NULL,NULL)
ON CONFLICT ("id") DO NOTHING;

-- =============================================================
-- Verifikasi
-- =============================================================
SELECT
  (SELECT COUNT(*) FROM "Drug")     AS total_drugs,
  (SELECT COUNT(*) FROM "DrugForm") AS total_forms;
