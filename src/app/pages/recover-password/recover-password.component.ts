import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss']
})
export class RecoverPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  step = signal<1 | 2 | 3>(1);
  isLoading = signal(false);
  savedEmail = signal('');
  savedCode = signal('');
  showPassword = signal(false);

  passwordStrength = signal(0);
  strengthLabel = signal(''); 
  strengthColor = signal('');

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  codeForm = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  passwordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmNewPassword: ['', [Validators.required]]
  });

  submitEmail() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    
    const email = this.emailForm.value.email!;
    this.isLoading.set(true);

    this.authService.requestRecovery(email).subscribe({
      next: () => {
        this.toast.success('Código enviado para seu e-mail!');
        this.savedEmail.set(email);
        this.step.set(2);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        
        if (err.status === 404) {
          this.toast.error('E-mail não encontrado no sistema.');
        } else if (err.status === 400 && err.error?.message?.includes('inativo')) {
          this.toast.warning('Usuário inativo. Contate o suporte.');
        } else {
          this.toast.error('Erro ao conectar com o servidor.');
        }
      }
    });
  }

  submitCode() {
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      this.toast.warning('O código deve ter 6 números.');
      return;
    }

    const code = this.codeForm.value.code!;
    const email = this.savedEmail();

    this.isLoading.set(true); 

    this.authService.validateRecoveryCode(email, code).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success('Código verificado!');
        this.savedCode.set(code);
        this.step.set(3);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err.error?.message || 'Código incorreto ou expirado.');
      }
    });
  }

  submitPassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmNewPassword } = this.passwordForm.value;

    if (newPassword !== confirmNewPassword) {
      this.toast.warning('As senhas não conferem.');
      return;
    }

    this.isLoading.set(true);

    const payload = {
      email: this.savedEmail(),
      code: this.savedCode(),
      newPassword: newPassword!,
      confirmNewPassword: confirmNewPassword!
    };

    this.authService.confirmRecovery(payload).subscribe({
      next: () => {
        this.toast.success('Senha alterada com sucesso!');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Erro ao redefinir senha.');
        this.isLoading.set(false);
      }
    });
  }

  onCodeInput(event: any) {
    const input = event.target;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.codeForm.controls.code.setValue(input.value);
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  updatePasswordStrength(event: any) {
    const password = event.target.value || '';
    let score = 0;

    if (password.length >= 6) score++;
    if (/\d/.test(password)) score++;
    if (password.length >= 8 || /[^a-zA-Z0-9]/.test(password) || /[A-Z]/.test(password)) score++;

    this.passwordStrength.set(score);

    if (password.length === 0) {
      this.strengthLabel.set('');
      this.strengthColor.set('');
    } else if (score <= 1) {
      this.strengthLabel.set('Fraca');
      this.strengthColor.set('weak');
    } else if (score === 2) {
      this.strengthLabel.set('Média');
      this.strengthColor.set('medium');
    } else {
      this.strengthLabel.set('Forte');
      this.strengthColor.set('strong');
    }
  }
}