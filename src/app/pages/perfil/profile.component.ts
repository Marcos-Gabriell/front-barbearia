import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserProfileService, User } from '../../core/services/users/user-profile.service';
import { ToastService } from '../../core/ui/toast.service';
import { CurrentUserService } from '../../core/services/users/current-user.service';
import { LucideAngularModule, User as UserIcon, Mail, Shield, Lock, Edit2, X, Clock, Phone } from 'lucide-angular';

type ModalType = 'NAME' | 'EMAIL' | 'PASSWORD' | 'PHONE' | null;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private profileService = inject(UserProfileService);
  private toastService = inject(ToastService);
  private currentUserService = inject(CurrentUserService);
  private fb = inject(FormBuilder);

  readonly icons = { UserIcon, Mail, Shield, Lock, Edit2, X, Clock, Phone };

  user = signal<User | null>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  activeModal = signal<ModalType>(null);
  
  showSuccessModal = signal(false);
  successTitle = signal('');
  successMessage = signal('');
  pendingReload = signal(false); 

  verificationCode = signal('');
  showEmailCodeInput = signal(false);

  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  nameForm!: FormGroup;
  emailForm!: FormGroup;
  passwordForm!: FormGroup;
  phoneForm!: FormGroup;

  ngOnInit() {
    this.initForms();
    this.fetchProfile();
  }

  private initForms() {
    this.nameForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]]
    });
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.phoneForm = this.fb.group({
      phone: ['', [Validators.pattern(/^\(\d{2}\) \d{5}-\d{4}$/)]]
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmNewPassword')?.value
      ? null : { mismatch: true };
  }

  fetchProfile() {
    this.isLoading.set(true);
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.user.set(data);
        this.currentUserService.setUser(data); 
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Erro ao carregar perfil.');
        this.isLoading.set(false);
      }
    });
  }

  truncateEmail(email: string | null | undefined): string {
    if (!email) return '';
    const limit = 22; 
    if (email.length <= limit) return email;
    return email.substring(0, limit) + '...';
  }

  formatPhoneDisplay(phone: string | null | undefined): string {
    if (!phone || phone.trim() === '') return 'Não informado'; 
    const value = phone.replace(/\D/g, '');
    if (value.length === 11) return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    if (value.length === 10) return `(${value.slice(0, 2)}) ${value.slice(2, 6)}-${value.slice(6)}`;
    return value;
  }

  onPhoneInput(event: any) {
    let numbers = event.target.value.replace(/\D/g, '');
    if (numbers.length > 11) numbers = numbers.substring(0, 11);
    let formatted = numbers;
    if (numbers.length > 2) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length > 7) formatted = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    this.phoneForm.get('phone')?.setValue(formatted, { emitEvent: false });
  }

  openModal(type: ModalType) {
    this.activeModal.set(type);
    
    if (type === 'NAME') {
      this.nameForm.patchValue({ name: this.user()?.name });
    }
    if (type === 'EMAIL') {
      this.emailForm.patchValue({ email: this.user()?.email });
      this.showEmailCodeInput.set(false);
      this.verificationCode.set('');
    }
    if (type === 'PHONE') {
      const currentPhone = this.user()?.phone || '';
      const displayValue = this.formatPhoneDisplay(currentPhone);
      const inputValue = displayValue === 'Não informado' ? '' : displayValue;
      this.phoneForm.patchValue({ phone: inputValue });
    }
    if (type === 'PASSWORD') {
      this.passwordForm.reset();
    }
  }

  closeModal() { this.activeModal.set(null); }

  
  closeSuccessModal() {
    this.showSuccessModal.set(false);
    this.successTitle.set('');
    this.successMessage.set('');
    
    if (this.pendingReload()) {
      window.location.reload();
    }
  }

  private triggerSuccess(title: string, message: string, reloadAfter: boolean = false) {
    this.closeModal(); 
    this.successTitle.set(title);
    this.successMessage.set(message);
    this.pendingReload.set(reloadAfter);
    this.showSuccessModal.set(true); 
  }

  onCodeInput(event: any) {
    const input = event.target;
    const numericValue = input.value.replace(/[^0-9]/g, '');
    if (input.value !== numericValue) input.value = numericValue;
    this.verificationCode.set(numericValue);
  }


  updateName() {
    if (this.nameForm.invalid) return;
    const newName = this.nameForm.get('name')?.value?.trim();
    
    if (newName === this.user()?.name) {
      this.toastService.info('Nenhuma alteração detectada.');
      this.closeModal();
      return; 
    }

    this.isSaving.set(true);
    const payload = {
        name: newName,
        email: this.user()?.email!,
        phone: this.user()?.phone 
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (res) => {
        this.fetchProfile(); 
        this.isSaving.set(false);
        this.triggerSuccess('Nome Atualizado!', 'Seu nome de exibição foi alterado com sucesso.');
      },
      error: (err) => this.handleError(err)
    });
  }

  initiateEmailUpdate() {
    if (this.emailForm.invalid) return;
    const newEmail = this.emailForm.get('email')?.value?.trim();

    if (newEmail === this.user()?.email) {
      this.toastService.info('O e-mail informado é o mesmo atual.');
      return;
    }

    this.isSaving.set(true);
    const payload = {
        name: this.user()?.name!,
        email: newEmail,
        phone: this.user()?.phone 
    };

    this.profileService.updateProfile(payload).subscribe({
      next: (res) => {
        this.toastService.success('Código enviado para seu novo e-mail.');
        this.showEmailCodeInput.set(true);
        this.isSaving.set(false);
      },
      error: (err) => this.handleError(err)
    });
  }

  updatePhone() {
    if (this.phoneForm.invalid) return;
    const rawPhone = this.phoneForm.get('phone')?.value?.replace(/\D/g, '') || '';
    const currentPhoneRaw = this.user()?.phone?.replace(/\D/g, '') || '';

    if (rawPhone === currentPhoneRaw) {
      this.toastService.info('Nenhuma alteração.');
      this.closeModal();
      return;
    }

    this.isSaving.set(true);
    const payload = {
        name: this.user()?.name!,
        email: this.user()?.email!,
        phone: rawPhone
    };

    this.profileService.updateProfile(payload).subscribe({
      next: () => {
        this.fetchProfile();
        this.isSaving.set(false);
        this.triggerSuccess('Telefone Salvo!', 'Seu número de contato foi atualizado.');
      },
      error: (err) => this.handleError(err)
    });
  }

  confirmEmailUpdate() {
    if (!this.verificationCode() || this.verificationCode().length < 6) {
      this.toastService.warning('Digite o código de 6 números.');
      return;
    }

    this.isSaving.set(true);
    this.profileService.confirmEmail(this.verificationCode()).subscribe({
      next: (res: any) => {
        if (res.token) localStorage.setItem('token', res.token);
        this.isSaving.set(false);
        this.triggerSuccess('E-mail Confirmado!', 'Seu endereço de e-mail foi atualizado. O sistema será recarregado.', true);
      },
      error: (err) => this.handleError(err)
    });
  }

  updatePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    
    this.isSaving.set(true);
    this.profileService.changePassword(this.passwordForm.value).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.triggerSuccess('Senha Alterada!', 'Sua senha foi redefinida com segurança.');
      },
      error: (err) => this.handleError(err)
    });
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm') {
    if (field === 'current') this.showCurrentPassword.set(!this.showCurrentPassword());
    if (field === 'new') this.showNewPassword.set(!this.showNewPassword());
    if (field === 'confirm') this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  private handleError(err: any) {
    this.toastService.error(err.error?.message || 'Ocorreu um erro.');
    this.isSaving.set(false);
  }
}