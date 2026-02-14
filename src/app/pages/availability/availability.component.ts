import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AvailabilityService, Professional, ScheduleRequest, DayConfig, IntervalDTO } from '../../core/services/availability/availability.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/ui/toast.service';

import {
  LucideAngularModule,
  ChevronDown,
  Plus,
  Trash2,
  X
} from 'lucide-angular';

type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

@Component({
  selector: 'app-availability',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './availability.component.html',
  styleUrls: ['./availability.component.scss']
})
export class AvailabilityComponent implements OnInit {
  private availabilityService = inject(AvailabilityService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  readonly icons = { ChevronDown, Plus, Trash2, X };

  professionals = signal<Professional[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  currentUserRole = signal<'DEV' | 'ADMIN' | 'STAFF' | string>('');

  currentPage = signal(1);
  itemsPerPage = 4;

  professionalsPaginated = computed(() => {
    const allPros = this.professionals();
    const page = this.currentPage();
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return allPros.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.professionals().length / this.itemsPerPage);
  });

  hasPrevPage = computed(() => this.currentPage() > 1);
  hasNextPage = computed(() => this.currentPage() < this.totalPages());

  showSuccessModal = signal(false);
  successTitle = signal('');
  successMessage = signal('');

  scheduleModalOpen = signal(false);
  selectedProfessional = signal<Professional | null>(null);
  
  isScheduleLoading = signal(false);
  isScheduleSaving = signal(false);

  schedule = signal<ScheduleRequest>({ days: [] });
  originalSchedule = signal<ScheduleRequest>({ days: [] });

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
    'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
  ];

  scheduleDaysOrdered = computed(() => {
    const map = new Map<DayOfWeek, DayConfig>();
    (this.schedule().days || []).forEach((d: DayConfig) => map.set(d.dayOfWeek as DayOfWeek, d));
    return this.weekOrder.map(dow => map.get(dow)).filter(Boolean) as DayConfig[];
  });

  ngOnInit(): void {
    const rawRole = this.authService.getUserRole?.() ?? '';
    const normalizedRole = (rawRole || '').replace('ROLE_', '').toUpperCase();
    this.currentUserRole.set(normalizedRole);

    this.loadProfessionals();
  }

  loadProfessionals(): void {
    this.loading.set(true);
    this.error.set(null);

    this.availabilityService.getManageableProfessionals().subscribe({
      next: (data) => {
        const sorted = (data || []).slice().sort((a, b) => {
          if (a.active !== b.active) return a.active ? -1 : 1;
          return (a.name || '').localeCompare(b.name || '');
        });

        this.professionals.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erro ao carregar profissionais:', err);
        this.error.set('Erro ao carregar profissionais. Tente novamente.');
        this.loading.set(false);
      }
    });
  }

  viewSchedule(professional: Professional): void {
    if (!professional?.active) return;
    
    this.selectedProfessional.set(professional);
    this.openScheduleModal();
  }

  private openScheduleModal() {
    this.expandedDay.set(null);
    this.scheduleFilter.set('all');
    this.scheduleModalOpen.set(true);
    this.isScheduleLoading.set(true);

    const targetUserId = this.selectedProfessional()?.id;
    if (!targetUserId) return;

    this.availabilityService.getSchedule(targetUserId).subscribe({
      next: (res: ScheduleRequest) => {
        const normalized = this.normalizeSchedule(res);
        this.schedule.set(this.deepClone(normalized));
        this.originalSchedule.set(this.deepClone(normalized));
        this.isScheduleLoading.set(false);
      },
      error: () => {
        this.isScheduleLoading.set(false);
        this.toastService.error('Erro ao carregar disponibilidade.');
      }
    });
  }

  closeScheduleModal() {
    this.scheduleModalOpen.set(false);
    this.expandedDay.set(null);
    this.scheduleFilter.set('all');
    setTimeout(() => {
      this.selectedProfessional.set(null);
    }, 300);
  }

  toggleExpand(day: DayConfig) {
    if (!day.active) return;
    if (this.expandedDay() === day.dayOfWeek) {
      this.expandedDay.set(null);
      return;
    }
    this.expandedDay.set(day.dayOfWeek as DayOfWeek);
  }

  onToggleActive(day: DayConfig, checked: boolean) {
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

  addBreak(day: DayConfig) {
    if (!day.active) return;
    if ((day.breaks?.length || 0) >= 3) {
      this.toastService.warning('Máximo de 3 pausas por dia.');
      return;
    }
    day.breaks = day.breaks || [];
    day.breaks.push({ start: '12:00', end: '13:00' });
  }

  removeBreak(day: DayConfig, index: number) {
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
    const targetUserId = this.selectedProfessional()?.id;
    if (!targetUserId) return;

    const payload: ScheduleRequest = {
      days: this.schedule().days.map((d: DayConfig) => ({
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

    this.availabilityService.updateSchedule(targetUserId, payload).subscribe({
      next: () => {
        this.isScheduleSaving.set(false);
        const normalized = this.normalizeSchedule(payload);
        this.schedule.set(this.deepClone(normalized));
        this.originalSchedule.set(this.deepClone(normalized));
        this.triggerSuccess('Agenda Salva!', 'A disponibilidade foi atualizada com sucesso.');
      },
      error: (e: any) => {
        this.isScheduleSaving.set(false);
        this.toastService.error(e?.error?.message || 'Erro ao salvar disponibilidade.');
      }
    });
  }

  getDayLabel(dayOfWeek: string): string {
    return this.dayLabel[dayOfWeek as DayOfWeek] || dayOfWeek;
  }

  private validateScheduleFront(): string | null {
    const days = this.schedule().days || [];
    if (days.length !== 7) return 'Agenda inválida: deve conter os 7 dias da semana.';

    for (const day of days) {
      if (!day.dayOfWeek) return 'Dia da semana inválido.';
      if (!day.active) {
        if (day.breaks?.length) return `${this.getDayLabel(day.dayOfWeek)} está inativo e não pode ter pausas.`;
        continue;
      }

      if (!day.startTime || !day.endTime) return `${this.getDayLabel(day.dayOfWeek)} deve ter início e fim.`;

      const ws = this.timeToMin(day.startTime);
      const we = this.timeToMin(day.endTime);
      if (ws >= we) return `${this.getDayLabel(day.dayOfWeek)}: início deve ser antes do fim.`;

      const breaks = (day.breaks || []).slice();
      if (breaks.length > 3) return `${this.getDayLabel(day.dayOfWeek)}: máximo 3 pausas.`;

      const sorted = breaks
        .map((b: IntervalDTO) => ({ ...b }))
        .sort((a: IntervalDTO, b: IntervalDTO) => this.timeToMin(a.start) - this.timeToMin(b.start));

      let lastEnd: number | null = null;

      for (const b of sorted) {
        if (!b.start || !b.end) return `${this.getDayLabel(day.dayOfWeek)}: pausa deve ter início e fim.`;

        const bs = this.timeToMin(b.start);
        const be = this.timeToMin(b.end);

        if (bs >= be) return `${this.getDayLabel(day.dayOfWeek)}: pausa inválida.`;
        if (bs < ws || be > we) return `${this.getDayLabel(day.dayOfWeek)}: pausa fora do expediente.`;

        if (lastEnd !== null) {
          if (bs < lastEnd) return `${this.getDayLabel(day.dayOfWeek)}: pausas sobrepostas.`;
          if (bs === lastEnd) return `${this.getDayLabel(day.dayOfWeek)}: pausas coladas.`;
        }
        lastEnd = be;
      }
    }
    return null;
  }

  private hasScheduleChanged(): boolean {
    return JSON.stringify(this.normalizeSchedule(this.schedule())) !== 
           JSON.stringify(this.normalizeSchedule(this.originalSchedule()));
  }

  private normalizeSchedule(s: ScheduleRequest): ScheduleRequest {
    const days = (s?.days || []).map((d: DayConfig) => ({
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

  private triggerSuccess(title: string, message: string): void {
    this.closeScheduleModal();
    this.successTitle.set(title);
    this.successMessage.set(message);
    this.showSuccessModal.set(true);
  }

  closeSuccessModal(): void {
    this.showSuccessModal.set(false);
    this.successTitle.set('');
    this.successMessage.set('');
  }

  getRoleBadgeClass(role: string): string {
    const normalized = (role || '').toUpperCase();
    const roleMap: Record<string, string> = {
      DEV: 'badge-dev',
      ADMIN: 'badge-admin',
      STAFF: 'badge-staff'
    };
    return roleMap[normalized] || 'badge-default';
  }

  getRoleLabel(role: string): string {
    const normalized = (role || '').toUpperCase();
    const labelMap: Record<string, string> = {
      DEV: 'Desenvolvedor',
      ADMIN: 'Administrador',
      STAFF: 'Profissional'
    };
    return labelMap[normalized] || role;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextPage(): void {
    if (this.hasNextPage()) {
      this.currentPage.set(this.currentPage() + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage(): void {
    if (this.hasPrevPage()) {
      this.currentPage.set(this.currentPage() - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);

      if (start > 2) {
        pages.push(-1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < total - 1) {
        pages.push(-1);
      }

      pages.push(total);
    }

    return pages;
  }
}