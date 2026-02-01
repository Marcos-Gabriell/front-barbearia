import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY'
  | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface IntervalDTO {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

export interface DayConfigDTO {
  dayOfWeek: DayOfWeek;
  active: boolean;
  startTime: string | null; 
  endTime: string | null;   
  breaks: IntervalDTO[];
}

export interface ScheduleRequestDTO {
  days: DayConfigDTO[];
}

@Injectable({ providedIn: 'root' })
export class MyAvailabilityService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api/users/me';

  getMySchedule(): Observable<ScheduleRequestDTO> {
    return this.http.get<ScheduleRequestDTO>(`${this.API_URL}/schedule`);
  }

  updateMySchedule(payload: ScheduleRequestDTO): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.API_URL}/schedule`, payload);
  }
}
