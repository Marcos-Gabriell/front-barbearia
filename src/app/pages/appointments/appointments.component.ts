// src/app/pages/appointments/appointments.component.ts
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, FormGroup, Validators, FormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';

import {
  AppointmentsService,
  CreateInternalAppointmentRequest,
  ProfessionalSimple,
  AvailableSlot,
  ServiceSimple
} from '../../core/services/appointments/appointments.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { Appointment, AppointmentFilter, AppointmentStatus } from '../../core/models/AppointmentStatus.model';
import { ToastService } from '../../core/ui/toast.service';

import {
  LucideAngularModule,
  Plus, Search, X, CalendarDays, User, Scissors, Clock,
  UserCheck, Check, ChevronLeft, ChevronRight,
  CalendarX2, Eye, History, AlertCircle, Info, CheckCircle,
  Mail, Phone, MessageSquare, FileDown, Download, Ban, ShieldAlert
} from 'lucide-angular';

type Role = 'DEV' | 'ADMIN' | 'ADM' | 'STAFF';

@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, LucideAngularModule],
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.scss'],
})
export class AppointmentsComponent implements OnInit {

  private api          = inject(AppointmentsService);
  private auth         = inject(AuthService);
  private fb           = inject(NonNullableFormBuilder);
  private toastService = inject(ToastService);

  readonly icons = {
    Plus, Search, X, CalendarDays, User, Scissors, Clock,
    UserCheck, Check, ChevronLeft, ChevronRight,
    CalendarX2, Eye, History, AlertCircle, Info, CheckCircle,
    Mail, Phone, MessageSquare, FileDown, Download, Ban, ShieldAlert
  };

  role:   Role;
  userId: number | null;

  loading       = signal(false);
  pageIndex     = signal(0);
  pageSize      = signal(6);
  totalElements = signal(0);
  items         = signal<Appointment[]>([]);

  canPickProfessional = computed(() =>
    this.role === 'DEV' || this.role === 'ADMIN' || this.role === 'ADM'
  );

  form = this.fb.group({
    q:                  '',
    status:             '' as AppointmentStatus | '',
    dateFrom:           '',
    dateTo:             '',
    professionalUserId: this.fb.control<number | null>(null),
  });

  // ── UI State ──────────────────────────────────────────────────────────────
  filtersOpen = false;

  // ── Wizard ────────────────────────────────────────────────────────────────
  showNewAppointmentModal  = signal(false);
  isSavingAppointment      = signal(false);
  newAppointmentForm!:       FormGroup;
  todayDate                = new Date().toISOString().split('T')[0];
  formError                = signal<string | null>(null);
  currentStep              = signal(1);

  availableServices        = signal<ServiceSimple[]>([]);
  isLoadingServices        = signal(false);

  modalProfessionals       = signal<ProfessionalSimple[]>([]);
  isLoadingProfessionals   = signal(false);

  professionalPage         = signal(0);
  professionalsPerPage     = 12;

  paginatedProfessionals = computed(() => {
    const all   = this.modalProfessionals();
    const start = this.professionalPage() * this.professionalsPerPage;
    return all.slice(start, start + this.professionalsPerPage);
  });

  totalProfessionalPages = computed(() =>
    Math.ceil(this.modalProfessionals().length / this.professionalsPerPage)
  );

  availableSlots     = signal<AvailableSlot[]>([]);
  isLoadingSlots     = signal(false);
  selectedSlot       = signal<AvailableSlot | null>(null);

  slotPage           = signal(0);
  slotsPerPage       = 12;

  paginatedSlots = computed(() => {
    const all   = this.availableSlots();
    const start = this.slotPage() * this.slotsPerPage;
    return all.slice(start, start + this.slotsPerPage);
  });

  totalSlotPages = computed(() =>
    Math.ceil(this.availableSlots().length / this.slotsPerPage)
  );

  prevSlotPage()         { if (this.slotPage() > 0)                                       this.slotPage.set(this.slotPage() - 1); }
  nextSlotPage()         { if (this.slotPage() < this.totalSlotPages() - 1)               this.slotPage.set(this.slotPage() + 1); }
  prevProfessionalPage() { if (this.professionalPage() > 0)                               this.professionalPage.set(this.professionalPage() - 1); }
  nextProfessionalPage() { if (this.professionalPage() < this.totalProfessionalPages()-1) this.professionalPage.set(this.professionalPage() + 1); }

  // ── Modais ────────────────────────────────────────────────────────────────
  showDetailsModal     = signal(false);
  selectedAppointment  = signal<Appointment | null>(null);

  showCancelModal      = signal(false);
  isCancelling         = signal(false);
  appointmentToCancel  = signal<Appointment | null>(null);
  cancelMessage        = '';

  showSuccessModal     = signal(false);
  successTitle         = signal('');
  successMessage       = signal('');
  successAppointmentId = signal<number | null>(null);

  isDownloadingPdf        = signal(false);
  isDownloadingPdfDetails = signal(false);

  constructor() {
    const rawRole = this.auth.getUserRole();
    this.role     = this.normalizeRole(rawRole);
    this.userId   = this.auth.getUserId();
  }

  ngOnInit() {
    this.initNewAppointmentForm();
    this.setupFormListeners();
    this.loadServices();
    this.load();
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  private normalizeRole(role: string | null | undefined): Role {
    if (!role) return 'STAFF';
    let n = role.trim().toUpperCase();
    if (n.startsWith('ROLE_')) n = n.replace('ROLE_', '');
    if (['DEV', 'ADMIN', 'ADM', 'STAFF'].includes(n)) return n as Role;
    return 'STAFF';
  }

  private initNewAppointmentForm() {
    this.newAppointmentForm = this.fb.group({
      clientName:         ['', [Validators.required, Validators.minLength(3)]],
      clientEmail:        ['', [Validators.required, Validators.email]],
      clientPhone:        ['', [Validators.required, Validators.pattern(/^\(\d{2}\) \d{5}-\d{4}$/)]],
      serviceId:          this.fb.control<number | null>(null, Validators.required),
      professionalUserId: this.fb.control<number | null>(null, Validators.required),
      date:               ['', Validators.required],
    });
  }

  private setupFormListeners() {
    if (!this.canPickProfessional() && this.userId) {
      this.form.patchValue({ professionalUserId: this.userId }, { emitEvent: false });
      this.form.get('professionalUserId')?.disable({ emitEvent: false });
    }
    this.form.valueChanges.pipe(debounceTime(400)).subscribe(() => {
      this.pageIndex.set(0);
      this.load();
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  DADOS
  // ════════════════════════════════════════════════════════════════════════

  loadServices() {
    this.isLoadingServices.set(true);
    this.api.getServicesWithResponsibles().subscribe({
      next: services => { this.availableServices.set(services); this.isLoadingServices.set(false); },
      error: ()      => this.isLoadingServices.set(false)
    });
  }

  load() {
    this.loading.set(true);
    const raw = this.form.getRawValue();
    const filter: AppointmentFilter = {
      q:                  raw.q?.trim()             || undefined,
      status:             raw.status                || undefined,
      dateFrom:           raw.dateFrom              || undefined,
      dateTo:             raw.dateTo                || undefined,
      professionalUserId: raw.professionalUserId ?? undefined,
      page:               this.pageIndex(),
      size:               this.pageSize(),
      sort:               'startAt,desc',
    };

    this.api.list(filter).subscribe({
      next: res => {
        this.items.set(res.content ?? []);
        this.totalElements.set(res.totalElements ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Erro ao carregar agendamentos.');
        this.loading.set(false);
      },
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  PDF
  // ════════════════════════════════════════════════════════════════════════

  downloadReceipt(appt: Appointment, fromSuccessModal = false) {
    if (!appt?.id) return;

    fromSuccessModal
      ? this.isDownloadingPdf.set(true)
      : this.isDownloadingPdfDetails.set(true);

    this.api.downloadReceipt(appt.id).subscribe({
      next: (blob: Blob) => {
        const code     = appt.code || String(appt.id);
        const url      = URL.createObjectURL(blob);
        const link     = document.createElement('a');
        link.href      = url;
        link.download  = `comprovante-${code}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        fromSuccessModal
          ? this.isDownloadingPdf.set(false)
          : this.isDownloadingPdfDetails.set(false);
      },
      error: () => {
        this.toastService.error('Não foi possível baixar o comprovante.');
        fromSuccessModal
          ? this.isDownloadingPdf.set(false)
          : this.isDownloadingPdfDetails.set(false);
      }
    });
  }

  downloadReceiptById(id: number, code?: string) {
    if (!id) return;
    this.isDownloadingPdf.set(true);
    this.api.downloadReceipt(id).subscribe({
      next: (blob: Blob) => {
        const url     = URL.createObjectURL(blob);
        const link    = document.createElement('a');
        link.href     = url;
        link.download = `comprovante-${code || id}.pdf`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        this.isDownloadingPdf.set(false);
      },
      error: () => {
        this.toastService.error('Não foi possível baixar o comprovante.');
        this.isDownloadingPdf.set(false);
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  WIZARD
  // ════════════════════════════════════════════════════════════════════════

  nextStep() {
    if (this.canGoNext()) {
      const step = this.currentStep();
      if (step === 2) this.loadProfessionalsForService();
      this.currentStep.set(step + 1);
    }
  }

  prevStep() {
    if (this.currentStep() > 1) this.currentStep.set(this.currentStep() - 1);
  }

  canGoNext(): boolean {
    const step = this.currentStep();
    const f    = this.newAppointmentForm;

    if (step === 1) return (
      f.get('clientName')?.valid  === true &&
      f.get('clientEmail')?.valid === true &&
      f.get('clientPhone')?.valid === true
    );
    if (step === 2) return !!f.get('serviceId')?.value;
    if (step === 3) return !!f.get('professionalUserId')?.value;

    // ─── ETAPA 4: precisa de data E horário selecionado ───────────────────
    // BUG CORRIGIDO: antes retornava true sem verificar slot
    if (step === 4) return !!f.get('date')?.value && this.selectedSlot() !== null;

    return true;
  }

  selectService(id: number) {
    this.newAppointmentForm.patchValue({ serviceId: id, professionalUserId: null, date: '' });
    this.modalProfessionals.set([]);
    this.availableSlots.set([]);
    this.selectedSlot.set(null);
  }

  selectProfessional(id: number) {
    this.newAppointmentForm.patchValue({ professionalUserId: id, date: '' });
    this.availableSlots.set([]);
    this.selectedSlot.set(null);
  }

  private loadProfessionalsForService() {
    const serviceId = this.newAppointmentForm.get('serviceId')?.value;
    if (!serviceId) return;

    this.isLoadingProfessionals.set(true);
    const cached = this.availableServices().find(s => s.id === Number(serviceId));

    if (cached?.responsibles?.length) {
      this.modalProfessionals.set(cached.responsibles);
      this.isLoadingProfessionals.set(false);
      return;
    }

    this.api.getServiceById(Number(serviceId)).subscribe({
      next:  service => { this.modalProfessionals.set(service?.responsibles ?? []); this.isLoadingProfessionals.set(false); },
      error: ()      => { this.modalProfessionals.set([]);                          this.isLoadingProfessionals.set(false); }
    });
  }

  onDateChange() {
    const serviceId      = this.newAppointmentForm.get('serviceId')?.value;
    const professionalId = this.newAppointmentForm.get('professionalUserId')?.value;
    const date           = this.newAppointmentForm.get('date')?.value;

    this.availableSlots.set([]);
    this.selectedSlot.set(null);
    this.slotPage.set(0);
    if (!serviceId || !professionalId || !date) return;

    this.isLoadingSlots.set(true);
    this.api.getAvailableSlots(Number(serviceId), Number(professionalId), date).subscribe({
      next:  slots => { this.availableSlots.set(slots); this.slotPage.set(0); this.isLoadingSlots.set(false); },
      error: ()    => { this.availableSlots.set([]);                          this.isLoadingSlots.set(false); }
    });
  }

  selectSlot(slot: AvailableSlot)       { this.selectedSlot.set(slot); }
  canSubmitNewAppointment(): boolean    { return !!this.newAppointmentForm.get('date')?.value && this.selectedSlot() !== null; }
  getSelectedServiceName(): string      { const id = Number(this.newAppointmentForm.get('serviceId')?.value);          return this.availableServices().find(s => s.id === id)?.name || ''; }
  getSelectedProfessionalName(): string { const id = Number(this.newAppointmentForm.get('professionalUserId')?.value); return this.modalProfessionals().find(p => p.id === id)?.name || ''; }

  submitNewAppointment() {
    this.formError.set(null);
    if (!this.canSubmitNewAppointment()) { this.formError.set('Selecione uma data e horário.'); return; }

    this.isSavingAppointment.set(true);
    const v    = this.newAppointmentForm.value as any;
    const slot = this.selectedSlot()!;

    const payload: CreateInternalAppointmentRequest = {
      clientName:         String(v.clientName).trim(),
      clientEmail:        String(v.clientEmail).trim().toLowerCase(),
      clientPhone:        String(v.clientPhone).replace(/\D/g, ''),
      serviceId:          Number(v.serviceId),
      professionalUserId: Number(v.professionalUserId),
      startAt:            `${v.date}T${slot.start}:00`,
    };

    this.api.createInternal(payload).subscribe({
      next: appt => {
        this.isSavingAppointment.set(false);
        this.closeNewAppointmentModal();
        this.successAppointmentId.set(appt.id);
        this.triggerSuccess('Agendamento Criado!', `Código: ${appt.code || appt.id}`, appt);
        this.load();
      },
      error: err => {
        this.isSavingAppointment.set(false);
        this.formError.set(err.error?.message || 'Erro ao criar.');
      },
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  //  FILTROS & PAGINAÇÃO
  // ════════════════════════════════════════════════════════════════════════

  hasActiveFilters(): boolean {
    const raw = this.form.getRawValue();
    return !!(raw.q || raw.status || raw.dateFrom || raw.dateTo);
  }

  clearFilters() {
    this.form.patchValue({
      q: '', status: '', dateFrom: '', dateTo: '',
      professionalUserId: this.canPickProfessional() ? null : this.userId
    });
  }

  maxPageIndex(): number { return Math.max(0, Math.ceil(this.totalElements() / this.pageSize()) - 1); }
  prevPage()             { if (this.pageIndex() > 0)                   { this.pageIndex.set(this.pageIndex() - 1); this.load(); } }
  nextPage()             { if (this.pageIndex() < this.maxPageIndex()) { this.pageIndex.set(this.pageIndex() + 1); this.load(); } }

  // ════════════════════════════════════════════════════════════════════════
  //  STATUS HELPERS
  // ════════════════════════════════════════════════════════════════════════

  badgeClass(status: AppointmentStatus): string {
    return ({ PENDING: 'pending', CONFIRMED: 'confirmed', CANCELLED: 'cancelled', NO_SHOW: 'noshow' } as any)[status] || '';
  }

  getStatusLabel(status: AppointmentStatus): string {
    return ({ PENDING: 'Pendente', CONFIRMED: 'Confirmado', CANCELLED: 'Cancelado', NO_SHOW: 'No-Show' } as any)[status] || status;
  }

  canConfirm(a: Appointment): boolean {
    const now     = new Date();
    const startAt = new Date(a.startAt);
    return now >= new Date(startAt.getTime() - 10 * 60_000) &&
           now <= new Date(startAt.getTime() + 10 * 60_000);
  }


  // ════════════════════════════════════════════════════════════════════════
  //  AUDIT HELPERS
  // ════════════════════════════════════════════════════════════════════════

  getCancelOriginLabel(appt: Appointment | null): string {
    if (!appt?.cancelReason) return '-';
    if (appt.cancelReason === 'CLIENT')         return 'Cliente (online)';
    if (appt.cancelReason === 'SYSTEM_NO_SHOW') return 'Sistema (automático)';
    return 'Interno';
  }

  getCancelledByLabel(appt: Appointment | null): string {
    if (!appt?.cancelReason) return '-';
    if (appt.cancelReason === 'CLIENT')         return appt.clientName || '-';
    if (appt.cancelReason === 'SYSTEM_NO_SHOW') return 'Sistema';
    return appt.createdByRole || 'Equipe';
  }

  getCreatedByLabel(appt: Appointment | null): string {
    if (!appt) return '-';
    if (!appt.createdByRole || appt.createdByRole === 'PUBLIC') return 'Cliente (online)';
    return appt.createdByRole;
  }

  formatPhone(phone?: string | null): string {
    if (!phone) return '-';
    const d = phone.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    return phone;
  }

  // ════════════════════════════════════════════════════════════════════════
  //  MODAIS
  // ════════════════════════════════════════════════════════════════════════

  openDetails(appointment: Appointment) {
    this.selectedAppointment.set(appointment);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal() {
    this.showDetailsModal.set(false);
    this.selectedAppointment.set(null);
  }

  openNewAppointmentModal() {
    this.newAppointmentForm.reset({ clientName: '', clientEmail: '', clientPhone: '', serviceId: null, professionalUserId: null, date: '' });
    this.modalProfessionals.set([]);
    this.availableSlots.set([]);
    this.selectedSlot.set(null);
    this.formError.set(null);
    this.currentStep.set(1);
    this.showNewAppointmentModal.set(true);
  }

  closeNewAppointmentModal() { this.showNewAppointmentModal.set(false); }

  onPhoneInput(event: any) {
    let n = event.target.value.replace(/\D/g, '');
    if (n.length > 11) n = n.substring(0, 11);
    let f = n;
    if (n.length > 2) f = `(${n.slice(0, 2)}) ${n.slice(2)}`;
    if (n.length > 7) f = `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
    this.newAppointmentForm.get('clientPhone')?.setValue(f, { emitEvent: false });
  }

  openCancel(appointment: Appointment) {
    this.appointmentToCancel.set(appointment);
    this.cancelMessage = '';
    this.showCancelModal.set(true);
  }

  closeCancelModal() {
    this.showCancelModal.set(false);
    this.appointmentToCancel.set(null);
  }

  confirmCancel() {
    const appt = this.appointmentToCancel();
    if (!appt) return;

    this.isCancelling.set(true);
    this.api.cancelInternal(appt.id, { message: this.cancelMessage || null }).subscribe({
      next: () => {
        this.isCancelling.set(false);
        this.closeCancelModal();
        this.triggerSuccess('Agendamento Cancelado', `O agendamento de ${appt.clientName} foi cancelado com sucesso.`);
        this.load();
      },
      error: err => {
        this.isCancelling.set(false);
        this.toastService.error(err.error?.message || 'Erro ao cancelar.');
      },
    });
  }

  confirmArrival(appt: Appointment) {
    this.api.confirmArrival(appt.id).subscribe({
      next:  () => { this.triggerSuccess('Chegada Confirmada!', `${appt.clientName} chegou para o atendimento.`); this.load(); },
      error: err => this.toastService.error(err.error?.message || 'Erro ao confirmar.'),
    });
  }


  // ── Modal de sucesso ──────────────────────────────────────────────────────
  private _successAppt: Appointment | null = null;
  get successAppt(): Appointment | null { return this._successAppt; }

  private triggerSuccess(title: string, message: string, appt?: Appointment) {
    this.successTitle.set(title);
    this.successMessage.set(message);
    this._successAppt = appt ?? null;
    this.showSuccessModal.set(true);
  }

  closeSuccessModal() {
    this.showSuccessModal.set(false);
    this._successAppt = null;
  }
}