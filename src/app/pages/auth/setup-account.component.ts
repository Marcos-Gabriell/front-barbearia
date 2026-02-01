import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '../../core/services/users/user.service'; 

@Component({
  selector: 'app-setup-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './setup-account.component.html',
  styleUrls: ['./setup-account.component.scss']
})
export class SetupAccountComponent implements OnInit {
  form: FormGroup;
  token = '';
  
  isLoading = true;
  isValidToken = false;
  isSuccess = false;
  
  globalErrorMessage = '';
  submissionError = '';
  
  invitedEmail = '';
  passwordStrength = 0;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      phone: ['', [Validators.pattern(/^\(\d{2}\) \d{5}-\d{4}$/)]],
      password: ['', [Validators.required, Validators.minLength(6), this.hasNumberValidator]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  hasNumberValidator(control: AbstractControl) {
    const hasNumber = /\d/.test(control.value);
    return hasNumber ? null : { noNumber: true };
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.isLoading = false;
      this.globalErrorMessage = 'Link inválido ou expirado.';
      return;
    }

    this.userService.validateInviteToken(this.token).subscribe({
      next: (res: any) => {
        this.isValidToken = true;
        this.invitedEmail = res.email;
        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.globalErrorMessage = err.error?.message || 'Este convite expirou.';
      }
    });

    this.form.get('password')?.valueChanges.subscribe(val => {
        this.calculateStrength(val);
        this.submissionError = ''; 
    });
    
    this.form.valueChanges.subscribe(() => this.submissionError = ''); 

    this.form.get('phone')?.valueChanges.subscribe(val => {
      if (val) this.formatPhone(val);
    });
  }

  formatPhone(value: string) {
    let numbers = value.replace(/\D/g, '');
    if (numbers.length > 11) numbers = numbers.substring(0, 11);
    let formatted = numbers;
    if (numbers.length > 2) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length > 7) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    if (formatted !== value) {
      this.form.get('phone')?.setValue(formatted, { emitEvent: false });
    }
  }

  calculateStrength(password: string) {
    if (!password) { this.passwordStrength = 0; return; }
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8 && /[0-9]/.test(password)) score++;
    if (password.length >= 10 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;
    this.passwordStrength = score;
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }

  onSubmit() {
    if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
    }

    const { password, confirmPassword } = this.form.value;
    if (password !== confirmPassword) {
      this.submissionError = 'As senhas não conferem.';
      return;
    }

    this.isLoading = true;
    this.submissionError = '';
    
    // Envia apenas números ou vazio
    const rawPhone = this.form.value.phone ? this.form.value.phone.replace(/\D/g, '') : '';

    const payload = {
      token: this.token,
      name: this.form.value.name,
      phone: rawPhone,
      password: this.form.value.password,
      confirmPassword: this.form.value.confirmPassword
    };

    this.userService.completeInvite(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccess = true;
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err.error?.message || err.error || 'Erro desconhecido';
        this.submissionError = typeof msg === 'string' ? msg : 'Erro ao criar conta. Tente novamente.';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}