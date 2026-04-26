-- =============================================================
-- Seed Admin User Default
-- Email:    admin@dosis.app
-- Password: admin123       (WAJIB GANTI setelah login pertama!)
-- =============================================================
-- Password di-hash dengan bcrypt via pgcrypto (kompatibel dengan bcryptjs di backend).
-- Format hash: $2a$10$... — bisa diverifikasi oleh bcrypt.compare() di Node.js.

INSERT INTO "AdminUser" ("id", "email", "password", "name", "role", "isActive")
VALUES (
  'admin_default',
  'admin@dosis.app',
  crypt('admin123', gen_salt('bf', 10)),
  'Default Admin',
  'admin',
  TRUE
)
ON CONFLICT ("email") DO NOTHING;

-- ===== CARA GANTI PASSWORD ADMIN VIA SQL =====
-- (Jalankan ini setelah login pertama, ganti 'PASSWORD_BARU_ANDA')
-- UPDATE "AdminUser"
--   SET "password" = crypt('PASSWORD_BARU_ANDA', gen_salt('bf', 10)),
--       "updatedAt" = CURRENT_TIMESTAMP
--   WHERE "email" = 'admin@dosis.app';

-- Verifikasi
SELECT "id", "email", "name", "role", "isActive", "createdAt" FROM "AdminUser";
