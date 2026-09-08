-- ============================================================
--  Sistema de Reporte y Seguimiento de Incidentes Urbanos
--  Alcaldía Municipal de Cochabamba
--
--  Esquema de base de datos para Supabase (PostgreSQL).
--
--  USO: copiar y ejecutar en:
--    Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ---------- Extensiones ----------
create extension if not exists pgcrypto;

-- ---------- Tipos enumerados ----------
create type incident_status as enum (
  'REPORTADO',
  'RECIBIDO',
  'EN_VERIFICACION',
  'VERIFICADO',
  'ASIGNADO_PARA_SOLUCION',
  'EN_ATENCION',
  'ATENDIDO',
  'CERRADO',
  'RECHAZADO'
);

create type assignment_type as enum (
  'VERIFICACION',
  'SOLUCION'
);

-- ============================================================
-- TABLAS
-- ============================================================

-- ---------- roles ----------
create table if not exists roles (
  id          bigint generated always as identity primary key,
  name        varchar(50)  not null unique,
  description text,
  active      boolean      not null default true,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

-- ---------- users ----------
create table if not exists users (
  id              bigint generated always as identity primary key,
  auth_id         uuid         unique references auth.users (id) on delete set null,
  first_name      varchar(100) not null,
  last_name       varchar(100) not null,
  birth_date      date,
  identity_number varchar(20),
  phone           varchar(20),
  email           varchar(150) not null unique,
  address         varchar(200),
  role_id         bigint       not null references roles (id),
  active          boolean      not null default true,
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now()
);

-- ---------- categories ----------
create table if not exists categories (
  id          bigint generated always as identity primary key,
  name        varchar(100) not null unique,
  description varchar(255),
  active      boolean      not null default true,
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now()
);

-- ---------- incidents ----------
create table if not exists incidents (
  id              bigint generated always as identity primary key,
  code            varchar(20)  not null unique,
  user_id         bigint       not null references users (id),
  category_id     bigint       not null references categories (id),
  title           varchar(150) not null,
  description     text         not null,
  status          incident_status not null default 'REPORTADO',
  latitude        numeric(10, 7),
  longitude       numeric(10, 7),
  address         varchar(200),
  rejected_reason text,
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now()
);

-- ---------- evidence ----------
create table if not exists evidence (
  id            bigint generated always as identity primary key,
  incident_id   bigint       not null references incidents (id) on delete cascade,
  url           varchar(500) not null,
  storage_path  varchar(500) not null,
  mime_type     varchar(100),
  size_bytes    bigint,
  uploaded_by   bigint       references users (id) on delete set null,
  created_at    timestamptz  not null default now()
);

-- ---------- locations ----------
create table if not exists locations (
  id            bigint generated always as identity primary key,
  incident_id   bigint        not null references incidents (id) on delete cascade,
  latitude      numeric(10, 7) not null,
  longitude     numeric(10, 7) not null,
  address       varchar(200),
  captured_at   timestamptz   not null default now()
);

-- ---------- assignments ----------
create table if not exists assignments (
  id              bigint generated always as identity primary key,
  incident_id     bigint          not null references incidents (id) on delete cascade,
  assignment_type assignment_type not null,
  assigned_by     bigint          not null references users (id),
  assigned_to     bigint          not null references users (id),
  note            text,
  active          boolean         not null default true,
  created_at      timestamptz     not null default now(),
  completed_at    timestamptz
);

-- ---------- history ----------
create table if not exists history (
  id            bigint generated always as identity primary key,
  incident_id   bigint        not null references incidents (id) on delete cascade,
  from_status   incident_status,
  to_status     incident_status not null,
  changed_by    bigint        references users (id) on delete set null,
  comment       text,
  created_at    timestamptz   not null default now()
);

-- ---------- notifications ----------
create table if not exists notifications (
  id           bigint generated always as identity primary key,
  incident_id  bigint        not null references incidents (id) on delete cascade,
  user_id      bigint        not null references users (id) on delete cascade,
  message      varchar(255)  not null,
  read         boolean       not null default false,
  created_at   timestamptz   not null default now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index if not exists idx_incidents_status      on incidents (status);
create index if not exists idx_incidents_user        on incidents (user_id);
create index if not exists idx_incidents_category    on incidents (category_id);
create index if not exists idx_incidents_created     on incidents (created_at);
create index if not exists idx_evidence_incident     on evidence (incident_id);
create index if not exists idx_locations_incident    on locations (incident_id);
create index if not exists idx_assignments_incident  on assignments (incident_id);
create index if not exists idx_assignments_to        on assignments (assigned_to);
create index if not exists idx_history_incident      on history (incident_id, created_at);
create index if not exists idx_notifications_user    on notifications (user_id, read);
create index if not exists idx_users_role            on users (role_id);

-- ============================================================
-- TRIGGERS (actualización automática de updated_at)
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_roles_updated      on roles;
drop trigger if exists trg_users_updated      on users;
drop trigger if exists trg_categories_updated on categories;
drop trigger if exists trg_incidents_updated  on incidents;

create trigger trg_roles_updated
  before update on roles for each row execute function set_updated_at();
create trigger trg_users_updated
  before update on users for each row execute function set_updated_at();
create trigger trg_categories_updated
  before update on categories for each row execute function set_updated_at();
create trigger trg_incidents_updated
  before update on incidents for each row execute function set_updated_at();

-- ============================================================
-- SEGURIDAD (Row Level Security)
-- ============================================================
-- El frontend NUNCA accede directamente a la base de datos:
-- todas las operaciones pasan por el backend (clave service role,
-- que omite RLS). Se habilita RLS sin políticas para bloquear
-- el acceso anónimo a las tablas.
alter table roles         enable row level security;
alter table users         enable row level security;
alter table categories    enable row level security;
alter table incidents     enable row level security;
alter table evidence      enable row level security;
alter table locations     enable row level security;
alter table assignments   enable row level security;
alter table history       enable row level security;
alter table notifications enable row level security;

-- ============================================================
-- DATOS INICIALES (seed)
-- ============================================================

-- Roles
insert into roles (name, description) values
  ('CIUDADANO', 'Ciudadano que reporta y da seguimiento a incidentes'),
  ('RECEPCION', 'Encargado de recepción: recibe y asigna incidentes para verificación'),
  ('VERIFICADOR', 'Personal de verificación: comprueba la existencia del problema'),
  ('ENCARGADO_SOLUCION', 'Encargado de solución: asigna incidentes al área responsable'),
  ('PERSONAL_SOLUCION', 'Personal de solución: atiende y soluciona los incidentes'),
  ('ADMINISTRADOR', 'Administrador del sistema')
on conflict (name) do nothing;

-- Categorías iniciales
insert into categories (name, description) values
  ('Residuos', 'Acumulación de basura, contenedores llenos, residuos en espacios públicos'),
  ('Baches', 'Calles deterioradas, huecos o daños en la calzada'),
  ('Alumbrado público', 'Luminarias dañadas, apagadas o con problemas'),
  ('Espacios públicos', 'Parques, plazas y otras áreas públicas deterioradas'),
  ('Infraestructura urbana', 'Daños en elementos de infraestructura municipal'),
  ('Otros', 'Incidentes que no corresponden a las categorías anteriores')
on conflict (name) do nothing;