// src/app/core/models/AppointmentStatus.model.ts

/**
 * Status de um agendamento - alinhado com o backend
 */
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';

/**
 * Motivo do cancelamento
 */
export type AppointmentCancelReason = 
  | 'CLIENT'      // Cancelado pelo cliente
  | 'STAFF'       // Cancelado pelo staff
  | 'ADMIN'       // Cancelado pelo admin
  | 'DEV'         // Cancelado pelo dev
  | 'SYSTEM_NO_SHOW'; // Marcado como no-show pelo sistema

/**
 * Agendamento com todos os detalhes
 */
export interface Appointment {
  id: number;
  
  /** Código único do agendamento (formato: AAMM-XXXX, ex: 2502-0001) */
  code: string;
  
  // Dados do cliente
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  
  // Dados do serviço
  serviceId: number;
  serviceName: string;
  durationMinutes: number;
  
  // Dados do profissional
  professionalUserId: number;
  professionalName: string;
  professionalEmail?: string;
  
  // Horários
  startAt: string; // ISO datetime
  endAt: string;   // ISO datetime
  
  // Status
  status: AppointmentStatus;
  
  // Cancelamento
  cancelReason?: AppointmentCancelReason | null;
  cancelMessage?: string | null;
  canceledAt?: string | null;
  
  // Confirmação
  confirmedAt?: string | null;
  
  // Auditoria
  createdAt?: string;
  createdByUserId?: number | null;
  createdByRole?: string;
  updatedAt?: string | null;
}

/**
 * Filtros para listagem de agendamentos
 */
export interface AppointmentFilter {
  q?: string;
  status?: AppointmentStatus;
  dateFrom?: string;
  dateTo?: string;
  professionalUserId?: number;
  serviceId?: number;
  page?: number;
  size?: number;
  sort?: string;
}