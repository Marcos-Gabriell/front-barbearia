// src/app/core/utils/tz-date.pipe.ts
// Pipe customizado que sempre aplica America/Sao_Paulo
import { Pipe, PipeTransform } from '@angular/core';
import { TZ } from './date.utils';

@Pipe({ name: 'tzDate', standalone: true, pure: true })
export class TzDatePipe implements PipeTransform {
  transform(value: string | null | undefined, format: 'date' | 'time' | 'datetime' | 'short' = 'date'): string {
    if (!value) return '—';
    const d = new Date(value);
    const base = { timeZone: TZ } as Intl.DateTimeFormatOptions;
    switch (format) {
      case 'time':
        return d.toLocaleTimeString('pt-BR', { ...base, hour: '2-digit', minute: '2-digit' });
      case 'datetime':
        return d.toLocaleString('pt-BR', { ...base, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      case 'short':
        return d.toLocaleDateString('pt-BR', { ...base, day: '2-digit', month: '2-digit' });
      default:
        return d.toLocaleDateString('pt-BR', { ...base, day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  }
}