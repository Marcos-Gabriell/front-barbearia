// src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  DashboardService, AdminDashboard, ProfessionalDashboard, PeriodOption
} from '../../core/services/dashboard/dashboard.service';
import { AppointmentsService } from '../../core/services/appointments/appointments.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/ui/toast.service';

import {
  LucideAngularModule, CalendarDays, DollarSign, TrendingUp, TrendingDown, AlertCircle,
  CheckCircle, XCircle, UserCheck, Activity, Award, BarChart2,
  LayoutDashboard, User, Scissors, Clock, Target
} from 'lucide-angular';

type Role     = 'DEV' | 'ADMIN' | 'ADM' | 'STAFF';
type DashView = 'geral' | 'minha-agenda';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DecimalPipe, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {

  private svc     = inject(DashboardService);
  private apptSvc = inject(AppointmentsService);
  private auth    = inject(AuthService);
  private toast   = inject(ToastService);
  private router  = inject(Router);

  readonly icons = {
    CalendarDays, DollarSign, TrendingUp, TrendingDown, AlertCircle,
    CheckCircle, XCircle, UserCheck, Activity, Award, BarChart2,
    LayoutDashboard, User, Scissors, Clock, Target
  };

  role    = signal<Role>('STAFF');
  userId  = signal<number | null>(null);
  
  // Regra global: Apenas DEV, ADMIN ou ADM são considerados administradores
  isAdmin = computed(() => ['DEV', 'ADMIN', 'ADM'].includes(this.role()));
  dashView = signal<DashView>('geral');

  loading   = signal(false);
  adminData = signal<AdminDashboard | null>(null);
  staffData = signal<ProfessionalDashboard | null>(null);

  staffPeriods: { label: string; value: PeriodOption }[] = [
    { label: 'Hoje',     value: 'today' },
    { label: '7 dias',   value: '7d'    },
    { label: '30 dias',  value: '30d'   },
    { label: 'Este mês', value: 'month' },
  ];
  staffPeriod = signal<PeriodOption>('today');

  periods: { label: string; value: PeriodOption }[] = [
    { label: 'Hoje',     value: 'today' },
    { label: '7 dias',   value: '7d'    },
    { label: '30 dias',  value: '30d'   },
    { label: 'Este mês', value: 'month' },
  ];
  activePeriod = signal<PeriodOption>('today');

  private _today = new Date().toISOString().split('T')[0];
  selectedDateFrom = signal(this._today);
  selectedDateTo   = signal(this._today);

  heatmapDays  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  heatmapHours = Array.from({ length: 11 }, (_, i) => i + 8);

  ngOnInit() {
    const raw = (this.auth.getUserRole() ?? '').trim().toUpperCase().replace('ROLE_','');
    this.role.set(['DEV','ADMIN','ADM','STAFF'].includes(raw) ? raw as Role : 'STAFF');
    this.userId.set(this.auth.getUserId());

    // LOGICA: Se não for ADMIN/DEV, força a view para 'minha-agenda'
    if (!this.isAdmin()) {
      this.dashView.set('minha-agenda');
    }

    this.load();
  }

  load() {
    this.loading.set(true);
    if (this.isAdmin() && this.dashView() === 'geral') {
      this.svc.getAdminDashboard(
        this.selectedDateFrom(),
        this.selectedDateTo(),
        this.activePeriod()
      ).subscribe({
        next:  d => { this.adminData.set(d); this.loading.set(false); },
        error: () => { this.toast.error('Erro ao carregar dashboard.'); this.loading.set(false); }
      });
    } else {
      this.svc.getProfessionalDashboard(
        this.userId() ?? undefined,
        this.selectedDateFrom(),
        this.selectedDateTo()
      ).subscribe({
        next:  d => { this.staffData.set(d); this.loading.set(false); },
        error: () => { this.toast.error('Erro ao carregar dashboard.'); this.loading.set(false); }
      });
    }
  }

  setPeriod(p: PeriodOption) {
    this.activePeriod.set(p);
    const { from, to } = this.periodToDates(p);
    this.selectedDateFrom.set(from);
    this.selectedDateTo.set(to);
    this.load();
  }
  setStaffPeriod(p: PeriodOption) {
    this.staffPeriod.set(p);
    const { from, to } = this.periodToDates(p);
    this.selectedDateFrom.set(from);
    this.selectedDateTo.set(to);
    this.load();
  }

  staffPeriodLabel(): string {
    const m: Record<string, string> = { today: 'Hoje', '7d': '7 dias', '30d': '30 dias', month: 'Este mês' };
    return m[this.staffPeriod()] ?? '';
  }
  onDateFromChange(v: string) { this.selectedDateFrom.set(v); this.load(); }
  onDateToChange(v: string)   { this.selectedDateTo.set(v);   this.load(); }
  
  setView(v: DashView) {
    // Trava de segurança extra: impede que o STAFF acesse a Visão Geral
    if (!this.isAdmin() && v === 'geral') return;
    this.dashView.set(v); 
    this.load(); 
  }

  private periodToDates(p: PeriodOption): { from: string; to: string } {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const sub = (days: number) => {
      const d = new Date(today); d.setDate(d.getDate() - days); return d;
    };
    switch (p) {
      case 'today': return { from: fmt(today), to: fmt(today) };
      case '7d':    return { from: fmt(sub(6)), to: fmt(today) };
      case '30d':   return { from: fmt(sub(29)), to: fmt(today) };
      case 'month': {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: fmt(first), to: fmt(today) };
      }
    }
  }

  periodLabel(): string {
    const m: Record<string, string> = { today: 'Hoje', '7d': '7 dias', '30d': '30 dias', month: 'Este mês' };
    return m[this.activePeriod()] ?? '';
  }

  // Métodos do Heatmap
  getHeatCount(day: string, hour: number): number { return this.adminData()?.heatmap?.find(c => c.dayOfWeek === day && c.hour === hour)?.count ?? 0; }
  getHeatMax(): number { return Math.max(1, ...(this.adminData()?.heatmap ?? []).map(c => c.count)); }
  getHeatOpacity(day: string, hour: number): number {
    const c = this.getHeatCount(day, hour);
    return c ? (c / this.getHeatMax()) * 0.85 + 0.1 : 0.04;
  }

  // Métodos do Gráfico de Barras
  getDayTotal(day: string): number { return (this.adminData()?.heatmap ?? []).filter(c => c.dayOfWeek === day).reduce((s, c) => s + c.count, 0); }
  getDayMax(): number { return Math.max(1, ...this.heatmapDays.map(d => this.getDayTotal(d))); }

  // Ranking
  rankBarWidth(count: number): number {
    const max = Math.max(1, ...(this.adminData()?.byProfessional ?? []).map(p => p.totalAppointments));
    return Math.round((count / max) * 100);
  }

  // Helpers
  fmtCurrency(v: number): string { return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0); }
  monthDiff(curr: number, prev: number): string {
    if (!prev) return '+0%';
    const p = ((curr - prev) / prev) * 100;
    return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
  }
  isPositive(curr: number, prev: number): boolean { return curr >= prev; }

  getStatusLabel(s: string): string { return ({PENDING:'Pendente',CONFIRMED:'Confirmado',CANCELLED:'Cancelado',NO_SHOW:'No-Show'} as any)[s] || s; }
  getStatusClass(s: string): string { return ({PENDING:'pending',CONFIRMED:'confirmed',CANCELLED:'cancelled',NO_SHOW:'no_show'} as any)[s] || ''; }
  fmtTime(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
  }

  confirmArrival(id: number) {
    this.apptSvc.confirmArrival(id).subscribe({
      next:  () => { this.toast.success('Chegada confirmada!'); this.load(); },
      error: err => this.toast.error(err.error?.message || 'Erro.')
    });
  }
  markNoShow(id: number) {
    this.apptSvc.markNoShow(id).subscribe({
      next:  () => { this.toast.success('No-show registrado.'); this.load(); },
      error: err => this.toast.error(err.error?.message || 'Erro.')
    });
  }
}