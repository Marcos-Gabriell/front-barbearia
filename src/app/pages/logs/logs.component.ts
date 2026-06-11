import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TokenService } from '../../core/services/auth/token.service';

export interface AppLog {
  id: number;
  level: string;
  category: string;
  message: string;
  details?: string;
  refId?: number;
  refCode?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit, OnDestroy {

  private http         = inject(HttpClient);
  private tokenService = inject(TokenService);

  logs         = signal<AppLog[]>([]);
  totalElements = signal(0);
  totalPages   = signal(0);
  isLoading    = signal(false);
  expandedId   = signal<number | null>(null);
  autoRefresh  = signal(true);

  // Filtros
  filterLevel    = '';
  filterCategory = '';
  filterSearch   = '';
  page           = 0;
  size           = 50;

  levels     = ['', 'INFO', 'WARN', 'ERROR'];
  categories = ['', 'APPOINTMENT', 'EMAIL', 'SCHEDULER', 'AUTH', 'SYSTEM'];

  private refreshInterval?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.load();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.stopAutoRefresh();
  }

  load() {
    this.isLoading.set(true);
    let params = new HttpParams()
      .set('page', this.page)
      .set('size', this.size);

    if (this.filterLevel)    params = params.set('level',    this.filterLevel);
    if (this.filterCategory) params = params.set('category', this.filterCategory);
    if (this.filterSearch)   params = params.set('search',   this.filterSearch);

    const token = this.tokenService.getAccess();
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    this.http.get<PageResponse<AppLog>>(`https://api.falcaobarbearia.com.br/admin/logs`, { params, headers })
      .subscribe({
        next: (res) => {
          this.logs.set(res.content);
          this.totalElements.set(res.totalElements);
          this.totalPages.set(res.totalPages);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  applyFilters() {
    this.page = 0;
    this.load();
  }

  clearFilters() {
    this.filterLevel = '';
    this.filterCategory = '';
    this.filterSearch = '';
    this.page = 0;
    this.load();
  }

  goToPage(p: number) {
    if (p < 0 || p >= this.totalPages()) return;
    this.page = p;
    this.load();
  }

  toggleExpand(id: number) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  toggleAutoRefresh() {
    this.autoRefresh.set(!this.autoRefresh());
    if (this.autoRefresh()) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  private startAutoRefresh() {
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(() => {
      if (this.autoRefresh() && this.page === 0) this.load();
    }, 5000);
  }

  private stopAutoRefresh() {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  levelClass(level: string): string {
    return { INFO: 'badge-info', WARN: 'badge-warn', ERROR: 'badge-error' }[level] ?? '';
  }

  categoryClass(cat: string): string {
    return {
      APPOINTMENT: 'cat-appointment',
      EMAIL:       'cat-email',
      SCHEDULER:   'cat-scheduler',
      AUTH:        'cat-auth',
      SYSTEM:      'cat-system',
    }[cat] ?? '';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }

  get pages(): number[] {
    const total = this.totalPages();
    const current = this.page;
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(0, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    return range;
  }
}