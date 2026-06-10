// src/app/pages/clients/clients.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientsService, Client, ClientAppointment } from '../../core/services/clients/clients.service';
import { ToastService } from '../../core/ui/toast.service';

import { 
  LucideAngularModule, Search, Mail, Phone, Calendar, 
  History, X, ChevronLeft, ChevronRight, User 
} from 'lucide-angular';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.scss'],
})
export class ClientsComponent implements OnInit {

  readonly icons = { Search, Mail, Phone, Calendar, History, X, ChevronLeft, ChevronRight, User };

  loading        = signal(false);
  loadingHistory = signal(false);
  clients        = signal<Client[]>([]);
  
  // Busca
  searchQuery    = signal('');

  // Paginação de Clientes (10 em 10)
  clientPage     = signal(0);
  clientPageSize = signal(10);

  filteredClients = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.clients();
    return this.clients().filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  pagedClients = computed(() => {
    const start = this.clientPage() * this.clientPageSize();
    return this.filteredClients().slice(start, start + this.clientPageSize());
  });

  clientTotalPages = computed(() => Math.ceil(this.filteredClients().length / this.clientPageSize()));

  // Modal e Histórico
  showHistory    = signal(false);
  selectedClient = signal<Client | null>(null);
  history        = signal<ClientAppointment[]>([]);
  
  // Filtro do Histórico
  historyFilter  = signal<'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'NO_SHOW'>('ALL');

  filteredHistory = computed(() => {
    if (this.historyFilter() === 'ALL') return this.history();
    return this.history().filter(h => h.status === this.historyFilter());
  });

  // Paginação do Histórico (5 em 5)
  historyPage     = signal(0);
  historyPageSize = signal(5);

  historyPaged = computed(() => {
    const start = this.historyPage() * this.historyPageSize();
    return this.filteredHistory().slice(start, start + this.historyPageSize());
  });

  historyTotalPages = computed(() => Math.ceil(this.filteredHistory().length / this.historyPageSize()));

  constructor(
    private svc: ClientsService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.svc.list('').subscribe({
      next: (res: Client[]) => {
        this.clients.set(res);
        this.clientPage.set(0);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Erro ao carregar clientes.');
        this.loading.set(false);
      }
    });
  }

  onSearchChange(val: string) {
    this.searchQuery.set(val);
    this.clientPage.set(0); // Reseta a página ao buscar
  }

  clearSearch() {
    this.searchQuery.set('');
    this.clientPage.set(0);
  }

  // Controles Paginação Clientes
  clientPrevPage() { if (this.clientPage() > 0) this.clientPage.set(this.clientPage() - 1); }
  clientNextPage() { if (this.clientPage() < this.clientTotalPages() - 1) this.clientPage.set(this.clientPage() + 1); }

  openHistory(client: Client) {
    this.selectedClient.set(client);
    this.showHistory.set(true);
    this.loadingHistory.set(true);
    this.historyFilter.set('ALL');
    this.historyPage.set(0);

    this.svc.getAppointments(client.id).subscribe({
      next: (res: ClientAppointment[]) => { 
        this.history.set(res); 
        this.loadingHistory.set(false); 
      },
      error: () => { 
        this.toast.error('Erro ao carregar histórico.'); 
        this.loadingHistory.set(false); 
      }
    });
  }

  closeHistory() {
    this.showHistory.set(false);
    this.selectedClient.set(null);
  }

  setHistoryFilter(status: 'ALL' | 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'NO_SHOW') {
    this.historyFilter.set(status);
    this.historyPage.set(0); // Reseta a paginação ao filtrar
  }

  // Controles Paginação Histórico
  historyPrevPage() { if (this.historyPage() > 0) this.historyPage.set(this.historyPage() - 1); }
  historyNextPage() { if (this.historyPage() < this.historyTotalPages() - 1) this.historyPage.set(this.historyPage() + 1); }

  // Helpers de UI
  getInitial(name: string): string {
    return name?.charAt(0)?.toUpperCase() || '?';
  }

  formatPhone(phone?: string | null): string {
    if (!phone) return 'Não informado';
    const d = phone.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    return phone;
  }

  fmtDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  fmtDatetime(iso: string): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  getStatusLabel(s: string): string {
    const m: Record<string, string> = {
      PENDING: 'Pendente', CONFIRMED: 'Confirmado',
      CANCELLED: 'Cancelado', NO_SHOW: 'No-show'
    };
    return m[s] ?? s;
  }

  getStatusClass(s: string): string {
    const m: Record<string, string> = {
      PENDING: 'pending', CONFIRMED: 'confirmed',
      CANCELLED: 'cancelled', NO_SHOW: 'noshow'
    };
    return m[s] ?? 'gray';
  }
}