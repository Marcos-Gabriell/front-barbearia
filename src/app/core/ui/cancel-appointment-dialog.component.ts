import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Appointment } from '../../core/models/AppointmentStatus.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  template: `
  <div class="p-5">
    <div class="text-lg font-semibold text-zinc-900">Cancelar agendamento</div>

    <div class="mt-1 text-sm text-zinc-500">
      {{ data.appointment.clientName }} • {{ data.appointment.serviceName }} •
      {{ data.appointment.startAt | date:'dd/MM HH:mm' }}
    </div>

    <form [formGroup]="form" class="mt-4">
      <label class="text-xs text-zinc-500">Mensagem (opcional)</label>

      <textarea
        formControlName="message"
        class="mt-1 w-full min-h-[110px] rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-200"
        placeholder="Ex: Cliente solicitou alteração / Barbeiro indisponível..."
      ></textarea>

      <div class="mt-1 text-[11px] text-zinc-400">
        O backend decide quem recebe (cliente/barbeiro) conforme sua regra.
      </div>
    </form>

    <div class="mt-5 flex items-center justify-end gap-2">
      <button class="rounded-xl border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50"
        (click)="ref.close()">
        Voltar
      </button>

      <button class="rounded-xl bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        (click)="submit()">
        Confirmar cancelamento
      </button>
    </div>
  </div>
  `,
})
export class CancelAppointmentDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public ref: MatDialogRef<CancelAppointmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { appointment: Appointment }
  ) {
    this.form = this.fb.group({
      message: [''],
    });
  }

  submit() {
    const message = (this.form.value?.message ?? '').trim();
    this.ref.close({ message });
  }
}
