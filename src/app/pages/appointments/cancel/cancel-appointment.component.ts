import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, CalendarX, Scissors, Clock, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-angular';
import { AppointmentsService } from '../../../core/services/appointments/appointments.service';

type PageState = 'loading' | 'confirm' | 'canceling' | 'success' | 'error' | 'already-canceled' | 'expired';

interface AppointmentInfo {
  clientName: string;
  serviceName: string;
  professionalName: string;
  startAt: string;
  code?: string;
}

@Component({
  selector: 'app-cancel-appointment',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './cancel-appointment.component.html',   // ← corrigido (era .html.html)
  styleUrls: ['./cancel-appointment.component.scss']  // ← corrigido (era cancelappointment)
})
export class CancelAppointmentComponent implements OnInit {

  readonly CalendarX     = CalendarX;
  readonly Scissors      = Scissors;
  readonly Clock         = Clock;
  readonly User          = User;
  readonly CheckCircle   = CheckCircle;
  readonly XCircle       = XCircle;
  readonly AlertTriangle = AlertTriangle;

  state  = signal<PageState>('loading');
  token  = signal<string>('');
  appt   = signal<AppointmentInfo | null>(null);
  errMsg = signal<string>('');

  formattedDate = computed(() => {
    const a = this.appt();
    if (!a) return '';
    try {
      return new Date(a.startAt).toLocaleDateString('pt-BR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
      });
    } catch { return a.startAt; }
  });

  formattedTime = computed(() => {
    const a = this.appt();
    if (!a) return '';
    try {
      return new Date(a.startAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  });

  constructor(
    private route:   ActivatedRoute,
    private router:  Router,
    private service: AppointmentsService
  ) {}

  ngOnInit() {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (!t || t.trim() === '') {
      this.state.set('error');
      this.errMsg.set('Token de cancelamento não informado.');
      return;
    }
    this.token.set(t);
    this.loadAppointmentInfo(t);
  }

  private loadAppointmentInfo(token: string) {
    this.service.getCancelInfo(token).subscribe({
      next: (data: AppointmentInfo) => {
        this.appt.set(data);
        this.state.set('confirm');
      },
      error: (err: any) => {
        const status = err?.status;
        const msg    = (err?.error?.message ?? '').toLowerCase();

        if (status === 404 || msg.includes('inválido') || msg.includes('expirado')) {
          this.state.set('expired');
        } else if (msg.includes('cancelado')) {
          this.state.set('already-canceled');
        } else {
          this.state.set('confirm');
        }
      }
    });
  }

  confirmCancel() {
    this.state.set('canceling');
    this.service.cancelPublicByToken(this.token()).subscribe({
      next: () => this.state.set('success'),
      error: (err: any) => {
        const msg = (err?.error?.message ?? '').toLowerCase();
        if (msg.includes('expirado') || msg.includes('inválido')) {
          this.state.set('expired');
        } else if (msg.includes('cancelado')) {
          this.state.set('already-canceled');
        } else {
          this.state.set('error');
          this.errMsg.set(err?.error?.message || 'Ocorreu um erro. Tente novamente ou entre em contato.');
        }
      }
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  isState(s: PageState) {
    return this.state() === s;
  }
}