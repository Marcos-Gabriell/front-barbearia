// src/app/core/services/clients/clients.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  totalAppointments: number;
  createdAt: string;
  lastAppointmentAt: string | null;
}

export interface ClientAppointment {
  id: number;
  code: string;
  serviceName: string;
  professionalName: string;
  startAt: string;
  status: string;
  durationMinutes: number;
}

interface ApiResponse<T> { data: T; }

@Injectable({ providedIn: 'root' })
export class ClientsService {

  private readonly BASE = 'https://api.falcaobarbearia.com.br/api/clients';

  constructor(private http: HttpClient) {}

  list(q?: string): Observable<Client[]> {
    let params = new HttpParams();
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<ApiResponse<Client[]>>(this.BASE, { params })
      .pipe(map(r => r.data));
  }

  getById(id: number): Observable<Client> {
    return this.http.get<ApiResponse<Client>>(`${this.BASE}/${id}`)
      .pipe(map(r => r.data));
  }

  getAppointments(id: number): Observable<ClientAppointment[]> {
    return this.http.get<ApiResponse<ClientAppointment[]>>(`${this.BASE}/${id}/appointments`)
      .pipe(map(r => r.data));
  }
}