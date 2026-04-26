-- =============================================================
-- Seed Admin User Default
-- =============================================================
-- 1 super_admin + 2 admin (semua password default: admin123)
-- WAJIB GANTI password setelah login pertama!
-- Password di-hash dengan bcrypt via pgcrypto (kompatibel dengan bcryptjs di backend).
--
-- Role:
--   super_admin → akses penuh, bisa kelola admin lain (di masa depan)
--   admin       → akses CRUD obat & ICD-10 standar

INSERT INTO "AdminUser" ("id", "email", "password", "name", "role", "isActive")
VALUES
  ('admin_default', 'admin@dosis.app',  crypt('admin123', gen_salt('bf', 10)), 'Super Admin', 'super_admin', TRUE),
  ('admin_001',     'admin1@dosis.app', crypt('admin123', gen_salt('bf', 10)), 'Admin Satu',  'admin',       TRUE),
  ('admin_002',     'admin2@dosis.app', crypt('admin123', gen_salt('bf', 10)), 'Admin Dua',   'admin',       TRUE)
ON CONFLICT ("email") DO NOTHING;

-- ===== CARA GANTI PASSWORD ADMIN VIA SQL =====
-- (Jalankan ini setelah login pertama, ganti 'PASSWORD_BARU_ANDA')
-- UPDATE "AdminUser"
--   SET "password" = crypt('PASSWORD_BARU_ANDA', gen_salt('bf', 10)),
--       "updatedAt" = CURRENT_TIMESTAMP
--   WHERE "email" = 'admin@dosis.app';

-- ===== CARA UPGRADE/DOWNGRADE ROLE =====
-- UPDATE "AdminUser" SET "role" = 'super_admin' WHERE "email" = '...';
-- UPDATE "AdminUser" SET "role" = 'admin'       WHERE "email" = '...';

-- Verifikasi
SELECT "id", "email", "name", "role", "isActive", "createdAt"
FROM "AdminUser"
ORDER BY "role" DESC, "email";
