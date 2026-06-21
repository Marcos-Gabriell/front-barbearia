import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
  Input,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onTurnstileLoadAngular?: () => void;
  }
}

const SCRIPT_ID = 'cf-turnstile-script';

/**
 * Componente reutilizável do Cloudflare Turnstile.
 *
 * Uso:
 *   <app-turnstile (verify)="onTurnstileVerify($event)" (expire)="turnstileToken = null"></app-turnstile>
 *
 * A site key fica em environment.turnstileSiteKey (mesma para todos os domínios
 * cadastrados no widget — falcaobarbearia.com.br e admin.falcaobarbearia.com.br).
 */
@Component({
  selector: 'app-turnstile',
  standalone: true,
  imports: [CommonModule],
  template: `<div #container></div>`,
})
export class TurnstileComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  @Input() siteKey!: string;
  @Output() verify = new EventEmitter<string>();
  @Output() expire = new EventEmitter<void>();
  @Output() error = new EventEmitter<void>();

  private widgetId: string | null = null;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    if (!this.siteKey) {
      console.error('[TurnstileComponent] siteKey não informada.');
      return;
    }

    if (window.turnstile) {
      this.renderWidget();
    } else {
      if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoadAngular';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      window.onTurnstileLoadAngular = () => this.renderWidget();
    }
  }

  private renderWidget(): void {
    if (!window.turnstile || this.widgetId) return;
    this.widgetId = window.turnstile.render(this.containerRef.nativeElement, {
      sitekey: this.siteKey,
      callback: (token: string) => this.verify.emit(token),
      'expired-callback': () => this.expire.emit(),
      'error-callback': () => this.error.emit(),
      theme: 'light',
      size: 'normal',
    });
  }

  /** Permite resetar o widget manualmente (ex: depois de um erro de submit) */
  reset(): void {
    if (this.widgetId && window.turnstile) {
      window.turnstile.reset(this.widgetId);
    }
  }

  ngOnDestroy(): void {
    if (this.widgetId && window.turnstile) {
      window.turnstile.remove(this.widgetId);
      this.widgetId = null;
    }
  }
}