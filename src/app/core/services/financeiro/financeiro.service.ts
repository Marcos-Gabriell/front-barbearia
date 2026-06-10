// src/app/core/services/financeiro/financeiro.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ManualEntry {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string | null;
  amount: number;
  entryDate: string;
  professionalName: string | null;
  createdByUsername: string;
  createdAt: string;
  editedAt: string | null;
  editedByUsername: string | null;
  editCount?: number; 
  editHistory?: string;
}

export interface CreateManualEntryRequest {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description?: string;
  amount: number;
  entryDate?: string;
  professionalUserId?: number;
}

export interface RevenueByProfessional {
  professionalId: number;
  professionalName: string;
  totalAppointments: number;
  totalRevenue: number;
  confirmedCount: number;
  noShowCount: number;
  noShowRate: number;
  averageTicket: number;
}

export interface RevenueByService {
  serviceId: number;
  serviceName: string;
  totalAppointments: number;
  totalRevenue: number;
  averageTicket: number;
}

export interface FinanceiroResumo {
  from: string;
  to: string;
  totalAppointments: number;
  confirmedCount: number;
  canceledCount: number;
  noShowCount: number;
  appointmentsRevenue: number;  // só agendamentos
  manualIncome: number;          // entradas manuais
  manualExpense: number;         // saídas manuais
  totalRevenue: number;          // appointmentsRevenue + manualIncome
  totalExpense: number;          // manualExpense
  netProfit: number;             // totalRevenue - totalExpense
  averageTicket: number;
  occupancyRate: number;
  byProfessional: RevenueByProfessional[];
  byService: RevenueByService[];
  recentEntries: ManualEntry[];
}

export type PeriodOption = 'today' | '7d' | '30d' | 'month' | 'custom';

@Injectable({ providedIn: 'root' })
export class FinanceiroService {

  private readonly base = 'https://api.falcaobarbearia.com.br/api/financeiro';

  constructor(private http: HttpClient) {}

  getResumo(from?: string, to?: string, professionalId?: number): Observable<FinanceiroResumo> {
    let params = new HttpParams();
    if (from)           params = params.set('from', from);
    if (to)             params = params.set('to', to);
    if (professionalId) params = params.set('professionalId', String(professionalId));
    return this.http.get<FinanceiroResumo>(`${this.base}/resumo`, { params });
  }

  listLancamentos(from?: string, to?: string, type?: string): Observable<ManualEntry[]> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    if (type && type !== 'ALL') params = params.set('type', type);
    return this.http.get<ManualEntry[]>(`${this.base}/lancamentos`, { params });
  }

  createLancamento(req: CreateManualEntryRequest): Observable<ManualEntry> {
    return this.http.post<ManualEntry>(`${this.base}/lancamentos`, req);
  }

  updateLancamento(id: number, req: CreateManualEntryRequest): Observable<ManualEntry> {
    return this.http.put<ManualEntry>(`${this.base}/lancamentos/${id}`, req);
  }

  deleteLancamento(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/lancamentos/${id}`);
  }

  getCategorias(type: 'INCOME' | 'EXPENSE'): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/categorias`, { params: { type } });
  }
}