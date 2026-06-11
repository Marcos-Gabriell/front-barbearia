import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="nf-wrap">

      <div class="nf-code">
        <span class="nf-digit" style="animation-delay:0s">4</span>
        <span class="nf-digit nf-zero" style="animation-delay:0.08s">0</span>
        <span class="nf-digit" style="animation-delay:0.16s">4</span>
      </div>

      <h1 class="nf-title">Página não encontrada</h1>
      <p class="nf-sub">A URL que você tentou acessar não existe ou foi removida.</p>

      <div class="nf-actions">
        <button class="nf-btn-primary" (click)="router.navigate(['/dashboard'])">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </button>
        <button class="nf-btn-secondary" (click)="back()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Voltar
        </button>
      </div>

    </div>
  `,
  styles: [`
    .nf-wrap {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      background-color: var(--bg-main);
      text-align: center;
      user-select: none;
    }

    /* ── 404 ── */
    .nf-code {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-bottom: 28px;
    }

    .nf-digit {
      font-size: clamp(72px, 16vw, 130px);
      font-weight: 800;
      line-height: 1;
      letter-spacing: -3px;
      color: var(--text-main);
      opacity: 0.15;
      animation: nfPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    .nf-zero {
      opacity: 1;
      color: #10b981;
      position: relative;
    }

    .nf-zero::after {
      content: '';
      position: absolute;
      bottom: 6px;
      left: 50%;
      transform: translateX(-50%);
      height: 3px;
      width: 0;
      background: #10b981;
      border-radius: 2px;
      animation: nfLine 0.4s ease 0.5s forwards;
    }

    /* ── Textos ── */
    .nf-title {
      font-size: clamp(16px, 3.5vw, 22px);
      font-weight: 700;
      color: var(--text-main);
      margin: 0 0 8px;
      animation: nfUp 0.5s ease 0.25s both;
    }

    .nf-sub {
      font-size: 14px;
      color: var(--text-muted);
      max-width: 340px;
      line-height: 1.6;
      margin: 0 0 32px;
      animation: nfUp 0.5s ease 0.35s both;
    }

    /* ── Botões ── */
    .nf-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
      animation: nfUp 0.5s ease 0.45s both;
    }

    button {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .nf-btn-primary {
      background: #10b981;
      color: #fff;
      box-shadow: 0 4px 14px rgba(16,185,129,0.2);
    }
    .nf-btn-primary:hover  { background: #059669; transform: translateY(-1px); }
    .nf-btn-primary:active { transform: scale(0.97); }

    .nf-btn-secondary {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border-color);
    }
    .nf-btn-secondary:hover  { background: var(--bg-card); color: var(--text-main); }
    .nf-btn-secondary:active { transform: scale(0.97); }

    /* ── Animações ── */
    @keyframes nfPop {
      from { opacity: 0; transform: scale(0.6) translateY(20px); }
      to   { opacity: inherit; transform: scale(1) translateY(0); }
    }
    @keyframes nfUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes nfLine {
      to { width: 55%; }
    }
  `]
})
export class NotFoundComponent {
  constructor(public router: Router, private location: Location) {}
  back() { this.location.back(); }
}