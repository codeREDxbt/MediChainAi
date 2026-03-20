alter table public.analysis_results
add column if not exists model_source text;

update public.analysis_results
set model_source = 'openrouter'
where model_source is null or btrim(model_source) = '';

alter table public.analysis_results
alter column model_source set default 'openrouter';

alter table public.analysis_results
alter column model_source set not null;

drop index if exists public.analysis_results_scan_id_key;

create unique index if not exists analysis_results_scan_id_model_source_key
on public.analysis_results (scan_id, model_source);
