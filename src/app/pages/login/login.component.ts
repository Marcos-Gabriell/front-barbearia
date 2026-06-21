import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router'; 
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../../core/ui/toast.service';
import { AuthService, LoginPayload, LoginResponse } from '../../core/services/auth/auth.service';
import { TokenService } from '../../core/services/auth/token.service';
import { TurnstileComponent } from '../../components/turnstlie/Turnstile.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TurnstileComponent], 
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private fb         = inject(FormBuilder);
  private toast      = inject(ToastService);
  private authService  = inject(AuthService);
  private tokenService = inject(TokenService);
  private router     = inject(Router);
  private route      = inject(ActivatedRoute);
  private platformId = inject(PLATFORM_ID); // ← FIX

  @ViewChild(TurnstileComponent) turnstile?: TurnstileComponent;

  isLoading = false;
  showPassword = false;
  showContactModal = false;
  returnUrl: string = '/dashboard';

  turnstileSiteKey = environment.turnstileSiteKey;
  turnstileToken: string | null = null;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false] 
  });

  ngOnInit(): void {
    // ← FIX: só acessa localStorage no browser, não no SSR
    if (isPlatformBrowser(this.platformId)) {
      const savedEmail = localStorage.getItem('remembered_email');
      if (savedEmail) {
        this.form.patchValue({ email: savedEmail, rememberMe: true });
      }
    }
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  openContactModal() { this.showContactModal = true; }
  closeContactModal() { this.showContactModal = false; }

  onTurnstileVerify(token: string) { this.turnstileToken = token; }
  onTurnstileExpire() { this.turnstileToken = null; }
  onTurnstileError() { this.turnstileToken = null; }

  submit() {
    if (this.isLoading) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.turnstileToken) {
      this.toast.warning('Aguarde a verificação de segurança carregar e tente novamente.');
      return;
    }

    this.isLoading = true;
    const { rememberMe, ...credentials } = this.form.value;
    const payload: LoginPayload = {
      ...(credentials as LoginPayload),
      turnstileToken: this.turnstileToken,
    };

    this.authService.login(payload).subscribe({
      next: (response: LoginResponse) => {
        this.isLoading = false;
        
        const access  = response?.data?.token;
        const refresh = response?.data?.refreshToken;

        if (!access) {
          this.toast.error('Erro no login: Token não recebido.');
          return;
        }

        this.tokenService.setAccess(access);
        if (refresh) this.tokenService.setRefresh(refresh);

        // ← FIX: só acessa localStorage no browser
        if (isPlatformBrowser(this.platformId)) {
          if (rememberMe) {
            localStorage.setItem('remembered_email', payload.email);
          } else {
            localStorage.removeItem('remembered_email');
          }
        }

        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.turnstile?.reset();
        this.turnstileToken = null;

        if (err.status === 401 || err.status === 403 || err.status === 500) {
          this.toast.error('E-mail ou senha incorretos.');
        } else if (err.status === 0) {
          this.toast.error('Sem conexão com o servidor.');
        } else if (err.status === 400) {
          this.toast.error(err.error?.message || 'Verificação de segurança falhou. Tente novamente.');
        } else {
          this.toast.error('Ocorreu um erro inesperado.');
        }
      }
    });
  }
}