import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Professional {
  id: number;
  name: string;
  email: string;
  role: 'DEV' | 'ADMIN' | 'STAFF' | string;
  active: boolean;
}

export interface IntervalDTO {
  start: string;
  end: string;
}

export interface DayConfig {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY' | string;
  active: boolean;
  startTime: string | null;
  endTime: string | null;
  breaks: IntervalDTO[];
}

export interface ScheduleRequest {
  days: DayConfig[];
}

export interface BlockRequest {
  targetUserId: number;

  startDate: string;
  endDate: string;

  fullDay: boolean;

  startTime?: string;
  endTime?: string;

  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class AvailabilityService {

  private readonly baseUrl = 'http://localhost:8080';
  private readonly apiUrl = `${this.baseUrl}/api/availability`;

  constructor(private http: HttpClient) {}

  getManageableProfessionals(): Observable<Professional[]> {
    return this.http.get<Professional[]>(`${this.apiUrl}/professionals`);
  }

  getSchedule(targetUserId: number): Observable<ScheduleRequest> {
    return this.http.get<ScheduleRequest>(`${this.apiUrl}/schedule/${targetUserId}`);
  }

  updateSchedule(targetUserId: number, schedule: ScheduleRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/schedule/${targetUserId}`, schedule);
  }

  createBlock(request: BlockRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/block`, request);
  }
}
