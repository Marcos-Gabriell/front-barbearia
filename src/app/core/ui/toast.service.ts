import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastItem[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();
  private idCounter = 1;

  private push(type: ToastType, message: string, durationMs = 5000) {
    const id = this.idCounter++;
    const nextList = [...this.toastsSubject.value, { id, type, message }];
    this.toastsSubject.next(nextList);
    if (durationMs > 0) setTimeout(() => this.remove(id), durationMs);
  }

  success(msg: string) { this.push('success', msg); }
  error(msg: string) { this.push('error', msg); }
  info(msg: string) { this.push('info', msg); }
  warn(msg: string) { this.push('warning', msg); }
  warning(msg: string) { this.push('warning', msg); }

  remove(id: number) {
    this.toastsSubject.next(this.toastsSubject.value.filter(t => t.id !== id));
  }

  clearAll() { this.toastsSubject.next([]); }
}
