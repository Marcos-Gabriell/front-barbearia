// src/app/core/utils/date.utils.ts
export const TZ = 'America/Sao_Paulo';

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit'
  });
}

export function fmtDatetime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    timeZone: TZ, weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}

/** Retorna a data de hoje no fuso de Brasília no formato YYYY-MM-DD */
export function todaySP(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

/** Retorna a data de N dias atrás no fuso de Brasília no formato YYYY-MM-DD */
export function daysAgoSP(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}

/** Retorna o primeiro dia do mês corrente no fuso de Brasília no formato YYYY-MM-DD */
export function firstOfMonthSP(): string {
  const now = new Date();
  const sp  = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  sp.setDate(1);
  return sp.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
}