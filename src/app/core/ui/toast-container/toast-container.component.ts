import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ToastService, ToastType } from '../toast.service';

@Component({
  selector: 'ui-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-host" aria-live="polite" aria-atomic="true">
      <div *ngFor="let t of toast.toasts$ | async; trackBy: trackById"
          class="toast"
          [class.toast--success]="t.type==='success'"
          [class.toast--error]="t.type==='error'"
          [class.toast--warning]="t.type==='warning'"
          [class.toast--info]="t.type==='info'">

        <div class="toast__bar"></div>

        <div class="toast__content">
          <div class="toast__icon">
            <svg *ngIf="t.type==='warning'" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.516 11.59c.75 1.334-.213 2.986-1.742 2.986H3.483c-1.53 0-2.492-1.652-1.743-2.986L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3a1 1 0 01-1 1z"/>
            </svg>

            <svg *ngIf="t.type==='success'" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M16.707 5.293a1 1 0 010 1.414l-7.364 7.364a1 1 0 01-1.414 0L3.293 9.435a1 1 0 111.414-1.414l3.02 3.02 6.657-6.657a1 1 0 011.323-.091z"/>
            </svg>

            <svg *ngIf="t.type==='error'" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5h2v2H9v-2zm0-8h2v6H9V5z"/>
            </svg>

            <svg *ngIf="t.type==='info'" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9 9h2v6H9V9zm1-4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/>
            </svg>
          </div>

          <div class="toast__text">
            <div class="toast__title">{{ titleOf(t.type) }}</div>
            <div class="toast__message">{{ t.message }}</div>
          </div>

          <button class="toast__close" (click)="toast.remove(t.id)" aria-label="Fechar">✕</button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./toast-container.component.scss']
})
export class ToastContainerComponent {
  constructor(public toast: ToastService) {}

  trackById = (_: number, t: any) => t.id;

  titleOf(type: ToastType) {
    switch (type) {
      case 'warning': return 'Atenção';
      case 'success': return 'Sucesso';
      case 'error':   return 'Erro';
      default:        return 'Informação';
    }
  }
}
