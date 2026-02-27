// src/app/core/services/appointments/appointments.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { Appointment, AppointmentFilter } from '../../models/AppointmentStatus.model';
import { PageResponse } from '../../models/PageResponse.model';

// ─────────────────────────────────────────────────────────────────────────────
// DTOs
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateInternalAppointmentRequest {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: number;
  professionalUserId: number;
  startAt: string;
}

export interface CancelAppointmentRequest {
  message: string | null;
}

export interface ProfessionalSimple {
  id: number;
  name: string;
}

export interface AvailableSlot {
  date: string;
  start: string;
  end: string;
}

export interface ServiceSimple {
  id: number;
  name: string;
  durationMinutes: number;
  responsibles: ProfessionalSimple[];
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AppointmentsService {

  // URLs diretas — sem environment
  private readonly adminUrl  = 'http://localhost:8080/api/appointments';
  private readonly catalogUrl= 'http://localhost:8080/api/admin/services';
  private readonly publicUrl = 'http://localhost:8080/public/appointments';

  constructor(private http: HttpClient) {}

  // ── Listagem & Detalhes ───────────────────────────────────────────────────

  list(filter: AppointmentFilter): Observable<PageResponse<Appointment>> {
    let params = new HttpParams();

    const add = (key: string, value: any) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    };

    add('q',                  filter.q);
    add('status',             filter.status);
    add('dateFrom',           filter.dateFrom);
    add('dateTo',             filter.dateTo);
    add('professionalUserId', filter.professionalUserId);
    add('serviceId',          filter.serviceId);
    add('page',               filter.page);
    add('size',               filter.size);
    add('sort',               filter.sort);

    return this.http.get<PageResponse<Appointment>>(this.adminUrl, { params });
  }

  getDetails(id: number): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.adminUrl}/${id}`);
  }

  // ── Operações Admin ───────────────────────────────────────────────────────

  createInternal(payload: CreateInternalAppointmentRequest): Observable<Appointment> {
    return this.http.post<Appointment>(this.adminUrl, payload);
  }

  cancelInternal(id: number, payload: CancelAppointmentRequest): Observable<void> {
    return this.http.post<void>(`${this.adminUrl}/${id}/cancel`, payload);
  }

  confirmArrival(id: number): Observable<void> {
    return this.http.post<void>(`${this.adminUrl}/${id}/confirm`, null);
  }

  markNoShow(id: number): Observable<void> {
    return this.http.post<void>(`${this.adminUrl}/${id}/no-show`, null);
  }

  // ── PDF ──────────────────────────────────────────────────────────────────

  /**
   * GET /api/appointments/{id}/pdf
   * Retorna o Blob — o componente cuida do download.
   */
  downloadReceipt(id: number): Observable<Blob> {
    return this.http.get(`${this.adminUrl}/${id}/pdf`, { responseType: 'blob' });
  }

  /**
   * GET /api/appointments/{id}/pdf/view
   * Retorna o Blob para visualização inline.
   */
  viewReceiptInline(id: number): Observable<Blob> {
    return this.http.get(`${this.adminUrl}/${id}/pdf/view`, { responseType: 'blob' });
  }

  // ── Catálogo ──────────────────────────────────────────────────────────────

  private extractResponsibles(item: any): ProfessionalSimple[] {
    const raw =
      item?.responsibleUsers ??
      item?.responsiblesUsers ??
      item?.responsibles ??
      item?.responsibleUserIds ??
      [];

    if (!Array.isArray(raw)) return [];
    return raw
      .filter((r: any) => r && typeof r === 'object')
      .map((r: any) => ({ id: Number(r.id), name: String(r.name ?? '') }))
      .filter((r: any) => !!r.id && !!r.name);
  }

  getServicesWithResponsibles(): Observable<ServiceSimple[]> {
    return this.http.get<any>(this.catalogUrl).pipe(
      map((res: any) => {
        const items = res?.data ?? res?.content ?? res ?? [];
        if (!Array.isArray(items)) return [];
        return items
          .filter((i: any) => i?.active !== false && i?.deleted !== true)
          .map((i: any) => ({
            id:              Number(i.id),
            name:            String(i.name ?? ''),
            durationMinutes: Number(i.durationMinutes ?? 30),
            responsibles:    this.extractResponsibles(i),
          }))
          .filter((s: ServiceSimple) => !!s.id && !!s.name);
      }),
      catchError(err => {
        console.error('ERRO AO BUSCAR CATALOG:', err);
        return of([]);
      })
    );
  }

  getServiceById(id: number): Observable<ServiceSimple> {
    return this.getServicesWithResponsibles().pipe(
      map(services =>
        services.find(s => s.id === id) ??
        { id: 0, name: '', durationMinutes: 0, responsibles: [] }
      )
    );
  }

  // ── Público ───────────────────────────────────────────────────────────────

  getProfessionalsByServicePublic(serviceId: number): Observable<ProfessionalSimple[]> {
    return this.http
      .get<ProfessionalSimple[]>(`${this.publicUrl}/services/${serviceId}/professionals`)
      .pipe(
        map((list: any) => {
          if (!Array.isArray(list)) return [];
          return list
            .map((p: any) => ({ id: Number(p.id), name: String(p.name ?? '') }))
            .filter((p: ProfessionalSimple) => !!p.id && !!p.name);
        }),
        catchError(() => of([]))
      );
  }

  getAvailableSlotsPublic(serviceId: number, professionalId: number, date: string): Observable<AvailableSlot[]> {
    const params = new HttpParams()
      .set('serviceId',      serviceId.toString())
      .set('professionalId', professionalId.toString())
      .set('date',           date);

    return this.http
      .get<AvailableSlot[]>(`${this.publicUrl}/slots`, { params })
      .pipe(
        map((slots: any) => {
          if (!Array.isArray(slots)) return [];
          return slots.map((s: any) => ({
            date:  String(s.date  ?? ''),
            start: String(s.start ?? '').slice(0, 5),
            end:   String(s.end   ?? '').slice(0, 5),
          })) as AvailableSlot[];
        }),
        catchError(() => of([]))
      );
  }

  getAvailableSlots(serviceId: number, professionalId: number, date: string): Observable<AvailableSlot[]> {
    return this.getAvailableSlotsPublic(serviceId, professionalId, date);
  }

  createPublic(payload: CreateInternalAppointmentRequest): Observable<any> {
    return this.http.post<any>(this.publicUrl, payload);
  }

  cancelPublicByToken(token: string): Observable<void> {
    const params = new HttpParams().set('token', token);
    return this.http.post<void>(`${this.publicUrl}/cancel`, null, { params });
  }

  getCancelInfo(token: string): Observable<any> {
    const params = new HttpParams().set('token', token);
    return this.http.get<any>(`${this.publicUrl}/cancel-info`, { params });
  }
}