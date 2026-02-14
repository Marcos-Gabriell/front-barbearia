import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserProfileService, User } from '../../core/services/users/user-profile.service';
import { ToastService } from '../../core/ui/toast.service';
import { CurrentUserService } from '../../core/services/users/current-user.service';

import {
  LucideAngularModule,
  User as UserIcon,
  Mail,
  Shield,
  Lock,
  Edit2,
  X,
  Clock,
  Phone,
  CalendarDays,
  ChevronDown,
  Plus,
  Trash2
} from 'lucide-angular';

import {
  MyAvailabilityService,
  DayOfWeek,
  ScheduleRequestDTO,
  DayConfigDTO,
  IntervalDTO
} from '../../core/services/availability/my-availability.service';

type ModalType = 'NAME' | 'EMAIL' | 'PASSWORD' | 'PHONE' | 'SCHEDULE' | null;

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
  private availabilityService = inject(MyAvailabilityService);
  private fb = inject(FormBuilder);

  readonly icons = {
    UserIcon, Mail, Shield, Lock, Edit2, X, Clock, Phone,
    CalendarDays, ChevronDown, Plus, Trash2
  };

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

  isScheduleLoading = signal(false);
  isScheduleSaving = signal(false);

  schedule = signal<ScheduleRequestDTO>({ days: [] });
  originalSchedule = signal<ScheduleRequestDTO>({ days: [] });

  expandedDay = signal<DayOfWeek | null>(null);

  scheduleFilter = signal<'all' | 'active' | 'inactive'>('all');

  scheduleDaysFiltered = computed(() => {
    const days = this.scheduleDaysOrdered();
    const filter = this.scheduleFilter();
    
    if (filter === 'active') return days.filter(d => d.active);
    if (filter === 'inactive') return days.filter(d => !d.active);
    return days;
  });

  readonly dayLabel: Record<DayOfWeek, string> = {
    SUNDAY: 'Domingo',
    MONDAY: 'Segunda',
    TUESDAY: 'Terça',
    WEDNESDAY: 'Quarta',
    THURSDAY: 'Quinta',
    FRIDAY: 'Sexta',
    SATURDAY: 'Sábado'
  };

  readonly weekOrder: DayOfWeek[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY'
  ];

  scheduleDaysOrdered = computed(() => {
    const map = new Map<DayOfWeek, DayConfigDTO>();
    (this.schedule().days || []).forEach((d: DayConfigDTO) => map.set(d.dayOfWeek, d));
    return this.weekOrder.map(dow => map.get(dow)).filter(Boolean) as DayConfigDTO[];
  });

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

    if (type === 'SCHEDULE') {
      this.openScheduleModal();
    }
  }

  closeModal() {
    this.activeModal.set(null);
  }

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
      next: () => {
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
      next: () => {
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
      next: () => {
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

  private openScheduleModal() {
    this.expandedDay.set(null);
    this.scheduleFilter.set('all');
    this.isScheduleLoading.set(true);
    this.activeModal.set('SCHEDULE');

    this.availabilityService.getMySchedule().subscribe({
      next: (res: ScheduleRequestDTO) => {
        const normalized = this.normalizeSchedule(res);
        this.schedule.set(this.deepClone(normalized));
        this.originalSchedule.set(this.deepClone(normalized));
        this.isScheduleLoading.set(false);
      },
      error: () => {
        this.isScheduleLoading.set(false);
        this.toastService.error('Erro ao carregar sua disponibilidade.');
      }
    });
  }

  closeScheduleModal() {
    this.activeModal.set(null);
    this.expandedDay.set(null);
    this.scheduleFilter.set('all');
  }

  toggleExpand(day: DayConfigDTO) {
    if (!day.active) return;

    if (this.expandedDay() === day.dayOfWeek) {
      this.expandedDay.set(null);
      return;
    }

    this.expandedDay.set(day.dayOfWeek);
  }

  onToggleActive(day: DayConfigDTO, checked: boolean) {
    day.active = checked;

    if (!checked) {
      day.startTime = null;
      day.endTime = null;
      day.breaks = [];
      if (this.expandedDay() === day.dayOfWeek) this.expandedDay.set(null);
      return;
    }

    if (!day.startTime) day.startTime = '09:00';
    if (!day.endTime) day.endTime = '18:00';
  }

  addBreak(day: DayConfigDTO) {
    if (!day.active) return;

    if ((day.breaks?.length || 0) >= 3) {
      this.toastService.warning('Máximo de 3 pausas por dia.');
      return;
    }

    const start = '12:00';
    const end = '13:00';

    day.breaks = day.breaks || [];
    day.breaks.push({ start, end });
  }

  removeBreak(day: DayConfigDTO, index: number) {
    day.breaks.splice(index, 1);
  }

  saveSchedule() {
    if (!this.hasScheduleChanged()) {
      this.toastService.info('Nenhuma alteração detectada na agenda.');
      return;
    }

    const err = this.validateScheduleFront();
    if (err) {
      this.toastService.warning(err);
      return;
    }

    this.isScheduleSaving.set(true);

    const payload: ScheduleRequestDTO = {
      days: this.schedule().days.map((d: DayConfigDTO) => ({
        dayOfWeek: d.dayOfWeek,
        active: d.active,
        startTime: d.active ? this.toHHmmss(d.startTime) : null,
        endTime: d.active ? this.toHHmmss(d.endTime) : null,
        breaks: (d.active ? (d.breaks || []) : []).map((b: IntervalDTO) => ({
          start: this.toHHmmss(b.start)!,
          end: this.toHHmmss(b.end)!
        }))
      }))
    };

    this.availabilityService.updateMySchedule(payload).subscribe({
      next: () => {
        this.isScheduleSaving.set(false);
        const normalized = this.normalizeSchedule(payload);
        this.schedule.set(this.deepClone(normalized));
        this.originalSchedule.set(this.deepClone(normalized));
        this.triggerSuccess('Agenda Salva!', 'Sua disponibilidade foi atualizada com sucesso.');
      },
      error: (e: any) => {
        this.isScheduleSaving.set(false);
        this.toastService.error(e?.error?.message || 'Erro ao salvar disponibilidade.');
      }
    });
  }

  private validateScheduleFront(): string | null {
    const days = this.schedule().days || [];

    if (days.length !== 7) return 'Agenda inválida: deve conter os 7 dias da semana.';

    for (const day of days) {
      if (!day.dayOfWeek) return 'Dia da semana inválido.';
      if (!day.active) {
        if (day.breaks?.length) return `${this.dayLabel[day.dayOfWeek]} está inativo e não pode ter pausas.`;
        continue;
      }

      if (!day.startTime || !day.endTime) return `${this.dayLabel[day.dayOfWeek]} deve ter início e fim.`;

      const ws = this.timeToMin(day.startTime);
      const we = this.timeToMin(day.endTime);
      if (ws >= we) return `${this.dayLabel[day.dayOfWeek]}: início deve ser antes do fim.`;

      const breaks = (day.breaks || []).slice();
      if (breaks.length > 3) return `${this.dayLabel[day.dayOfWeek]}: máximo 3 pausas.`;

      const sorted = breaks
        .map((b: IntervalDTO) => ({ ...b }))
        .sort((a: IntervalDTO, b: IntervalDTO) => this.timeToMin(a.start) - this.timeToMin(b.start));

      let lastEnd: number | null = null;

      for (const b of sorted) {
        if (!b.start || !b.end) return `${this.dayLabel[day.dayOfWeek]}: pausa deve ter início e fim.`;

        const bs = this.timeToMin(b.start);
        const be = this.timeToMin(b.end);

        if (bs >= be) return `${this.dayLabel[day.dayOfWeek]}: pausa inválida (início antes do fim).`;
        if (bs < ws || be > we) return `${this.dayLabel[day.dayOfWeek]}: pausa deve ficar dentro do expediente.`;

        if (lastEnd !== null) {
          if (bs < lastEnd) return `${this.dayLabel[day.dayOfWeek]}: pausas não podem se sobrepor.`;
          if (bs === lastEnd) return `${this.dayLabel[day.dayOfWeek]}: pausas não podem ficar coladas.`;
        }

        lastEnd = be;
      }
    }

    return null;
  }

  private hasScheduleChanged(): boolean {
    const a = this.normalizeSchedule(this.schedule());
    const b = this.normalizeSchedule(this.originalSchedule());
    return JSON.stringify(a) !== JSON.stringify(b);
  }

  private normalizeSchedule(s: ScheduleRequestDTO): ScheduleRequestDTO {
    const days = (s?.days || []).map((d: DayConfigDTO) => ({
      dayOfWeek: d.dayOfWeek,
      active: !!d.active,
      startTime: d.startTime ? this.toHHmm(d.startTime) : null,
      endTime: d.endTime ? this.toHHmm(d.endTime) : null,
      breaks: (d.breaks || []).map((b: IntervalDTO) => ({
        start: this.toHHmm(b.start),
        end: this.toHHmm(b.end)
      }))
    }));

    return { days };
  }

  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private toHHmm(value: string): string {
    if (!value) return value;
    return value.length >= 5 ? value.slice(0, 5) : value;
  }

  private toHHmmss(value: string | null): string | null {
    if (!value) return null;
    if (value.length === 5) return `${value}:00`;
    return value;
  }

  private timeToMin(value: string): number {
    const v = this.toHHmm(value);
    const [h, m] = v.split(':').map(n => parseInt(n, 10));
    return (h * 60) + m;
  }
}