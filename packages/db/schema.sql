-- Única tabla del sistema (ADR-0004). Correr una vez en la consola SQL de Neon.
CREATE TABLE IF NOT EXISTS perfiles (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  data JSONB NOT NULL, -- objeto Perfil del contrato (@vigente/schema)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
