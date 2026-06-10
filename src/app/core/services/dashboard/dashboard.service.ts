// src/app/core/services/dashboard/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TimelineAppointment {
  id: number; code: string; clientName: string; serviceName: string;
  durationMinutes: number; startAt: string; endAt: string; status: string;
  canConfirm: boolean; canMarkNoShow: boolean;
}

export interface ProfessionalDashboard {
  professionalId: number; professionalName: string;
  todayAppointments: TimelineAppointment[];
  todayTotal: number; todayConfirmed: number; todayPending: number;
  todayNoShow: number; todayCanceled: number; occupancyRateToday: number;
}

export interface HeatmapCell { dayOfWeek: string; hour: number; count: number; }

export interface ProfessionalRanking {
  professionalId: number; professionalName: string;
  totalAppointments: number; totalRevenue: number;
  confirmedCount: number; noShowCount: number; noShowRate: number;
  averageTicket: number;
}

export interface AdminDashboard {
  date: string;
  todayTotal: number; todayConfirmed: number; todayPending: number;
  todayNoShow: number; todayCanceled: number; todayRevenue: number;
  currentMonthTotal: number; prevMonthTotal: number;
  currentMonthRevenue: number; prevMonthRevenue: number;
  professionals: ProfessionalDashboard[];
  heatmap: HeatmapCell[];
  noShowRate30Days: number;
  byProfessional: ProfessionalRanking[];
}

export type PeriodOption = 'today' | '7d' | '30d' | 'month';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private readonly base = 'https://api.falcaobarbearia.com.br/api/dashboard';

  constructor(private http: HttpClient) {}

  getAdminDashboard(
    dateFrom?: string,
    dateTo?: string,
    period: PeriodOption = 'month'
  ): Observable<AdminDashboard> {
    let params = new HttpParams();

    if (dateFrom) params = params.set('dateFrom', dateFrom);
    if (dateTo)   params = params.set('dateTo',   dateTo);

    // periodDays só vai se não tiver intervalo personalizado
    if (!dateFrom && !dateTo) {
      const days = this.toDays(period);
      if (days !== null) params = params.set('periodDays', String(days));
    }

    return this.http.get<AdminDashboard>(`${this.base}/admin`, { params });
  }

  getProfessionalDashboard(
    professionalId?: number,
    dateFrom?: string,
    dateTo?: string
  ): Observable<ProfessionalDashboard> {
    let params = new HttpParams();
    if (professionalId) params = params.set('professionalId', String(professionalId));
    if (dateFrom)       params = params.set('dateFrom', dateFrom);
    if (dateTo)         params = params.set('dateTo',   dateTo);
    return this.http.get<ProfessionalDashboard>(`${this.base}/profissional`, { params });
  }

  private toDays(period: PeriodOption): number | null {
    switch (period) {
      case 'today': return 1;
      case '7d':    return 7;
      case '30d':   return 30;
      case 'month': return null;
    }
  }
}