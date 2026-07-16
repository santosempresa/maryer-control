-- Dados reais de julho/2026 (Dra. Diana) — lote 1 de 12 pacientes.
-- weekdays de cada paciente foi calculado a partir dos próprios dias informados
-- (ex.: Sandra Maria compareceu dia 6 e 13, os dois caem numa segunda-feira).
-- Horário ficou com placeholder 08:00 pra todo mundo — ajusta depois direto na
-- tela de cada paciente quando tiver o horário real. start_date = 01/07 (não
-- afeta o relatório de julho, só serve de referência de "desde quando" o app
-- passaria a gerar sessões futuras pra esse paciente).
-- Victor Lucas e Luciana Barroso entram só como cadastro (sem dia ainda).

with new_patients as (
  insert into patients (name, plan, weekdays, time, start_date, status) values
    ('Sandra Maria', '1x_semana', '["seg"]'::jsonb, '08:00', '2026-07-01', 'active'),
    ('Larrisy dos Santos', '1x_semana', '["seg"]'::jsonb, '08:00', '2026-07-01', 'active'),
    ('Josefae Marcelino', '1x_semana', '["sab"]'::jsonb, '08:00', '2026-07-01', 'active'),
    ('Julia Monica', '1x_semana', '["sab"]'::jsonb, '08:00', '2026-07-01', 'active'),
    ('Ellen Ruth', '2x_semana', '["qui","sab"]'::jsonb, '08:00', '2026-07-01', 'active'),
    ('Jackson da Costa', '1x_semana', '["sab"]'::jsonb, '08:00', '2026-07-01', 'active'),
    ('Rimer de Oliveira', '1x_semana', '["sab"]'::jsonb, '08:00', '2026-07-01', 'active'),
    ('Amanda Silva', '1x_semana', '["sab"]'::jsonb, '08:00', '2026-07-01', 'active'),
    ('Victor Lucas', '1x_semana', '["seg"]'::jsonb, '08:00', '2026-07-01', 'active'),
    ('Gustavo Nassie', '1x_semana', '["qui"]'::jsonb, '08:00', '2026-07-01', 'active'),
    ('Luciana Barroso', '1x_semana', '["seg"]'::jsonb, '08:00', '2026-07-01', 'active'),
    ('Matheus Oliveira', '1x_semana', '["sab"]'::jsonb, '08:00', '2026-07-01', 'active')
  returning id, name, plan
),
attendance (name, scheduled_date) as (
  values
    ('Sandra Maria', '2026-07-06'::date),
    ('Sandra Maria', '2026-07-13'::date),
    ('Larrisy dos Santos', '2026-07-06'::date),
    ('Larrisy dos Santos', '2026-07-13'::date),
    ('Josefae Marcelino', '2026-07-11'::date),
    ('Julia Monica', '2026-07-11'::date),
    ('Ellen Ruth', '2026-07-02'::date),
    ('Ellen Ruth', '2026-07-04'::date),
    ('Jackson da Costa', '2026-07-04'::date),
    ('Rimer de Oliveira', '2026-07-04'::date),
    ('Amanda Silva', '2026-07-04'::date),
    ('Gustavo Nassie', '2026-07-02'::date),
    ('Gustavo Nassie', '2026-07-09'::date),
    ('Matheus Oliveira', '2026-07-11'::date)
)
insert into sessions (patient_id, scheduled_date, scheduled_time, status, plan)
select np.id, a.scheduled_date, '08:00', 'done', np.plan
from attendance a
join new_patients np on np.name = a.name;
