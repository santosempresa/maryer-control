-- Migration 02 (16/07/2026) — "Excluir paciente"
--
-- Rode este script UMA VEZ no SQL Editor do Supabase, no mesmo projeto que já
-- roda em produção. Ele só mexe na restrição de status da tabela patients.
--
-- Por que: excluir um paciente não pode apagar as sessões que ela já realizou,
-- porque elas entram no faturamento e no relatório do estúdio. Como sessions
-- referencia patients com "on delete cascade", apagar a linha do paciente
-- levaria o histórico junto. Então a exclusão é lógica: o paciente passa a
-- status 'deleted', some das listas do app, e as sessões continuam de pé.
--
-- É seguro rodar mais de uma vez.

alter table patients drop constraint if exists patients_status_check;

alter table patients
  add constraint patients_status_check
  check (status in ('active', 'inactive', 'deleted'));
