// src/app/pages/financeiro/financeiro.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  FinanceiroService, FinanceiroResumo,
  ManualEntry, CreateManualEntryRequest, PeriodOption
} from '../../core/services/financeiro/financeiro.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { ToastService } from '../../core/ui/toast.service';
import { todaySP, daysAgoSP, firstOfMonthSP } from '../../core/utils/date.utils';

import {
  LucideAngularModule,
  DollarSign, TrendingUp, TrendingDown, AlertCircle,
  CheckCircle, Plus, Trash2, Edit2, X, Calendar,
  ArrowUpCircle, ArrowDownCircle, BarChart2, Users, Eye, Info,
  ChevronLeft, ChevronRight // Importados para a paginação
} from 'lucide-angular';

type Tab = 'resumo' | 'agendamentos' | 'lancamentos';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, DecimalPipe],
  templateUrl: './financeiro.component.html',
  styleUrls: ['./financeiro.component.scss'],
})
export class FinanceiroComponent implements OnInit {

  private svc   = inject(FinanceiroService);
  private auth  = inject(AuthService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  readonly icons = {
    DollarSign, TrendingUp, TrendingDown, AlertCircle,
    CheckCircle, Plus, Trash2, Edit2, X, Calendar,
    ArrowUpCircle, ArrowDownCircle, BarChart2, Users, Eye, Info,
    ChevronLeft, ChevronRight
  };

  loading      = signal(false);
  saving       = signal(false);
  data         = signal<FinanceiroResumo | null>(null);
  lancamentos  = signal<ManualEntry[]>([]);

  activeTab    = signal<Tab>('resumo');

  periods: { label: string; value: PeriodOption }[] = [
    { label: 'Hoje',        value: 'today'  },
    { label: '7 dias',      value: '7d'     },
    { label: '30 dias',     value: '30d'    },
    { label: 'Este mês',    value: 'month'  },
    { label: 'Personalizado', value: 'custom' },
  ];
  activePeriod = signal<PeriodOption>('month');
  customFrom   = '';
  customTo     = '';
  filterType   = signal<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');

  isAdmin = signal(false);
  userId  = signal<number | null>(null);

  // Paginação Lançamentos
  lancamentosPage     = signal(0);
  lancamentosPageSize = 8;

  // Modais
  showModal     = signal(false);
  editingId     = signal<number | null>(null);
  entryForm!:   FormGroup;
  categories    = signal<string[]>([]);
  showOtherField = signal(false);

  showSuccessModal = signal(false);
  successMessage   = signal('');

  viewingEntry   = signal<ManualEntry | null>(null);
  loadingDetails = signal(false);

  INCOME_CATEGORIES  = ['Corte Avulso', 'Barba Avulsa', 'Venda de Produto', 'Gorjeta', 'Outros'];
  EXPENSE_CATEGORIES = ['Material (Cera, Tônico)', 'Limpeza', 'Aluguel', 'Conta de Água/Luz', 'Equipamentos', 'Marketing', 'Outros'];

  // Resumo financeiro calculado
  get profitClass(): string {
    const n = this.data()?.netProfit ?? 0;
    return n >= 0 ? 'positive' : 'negative';
  }

  rankMax(): number {
    return Math.max(1, ...(this.data()?.byProfessional ?? []).map(p => p.totalAppointments));
  }
  svcMax(): number {
    return Math.max(1, ...(this.data()?.byService ?? []).map(s => s.totalAppointments));
  }
  rankWidth(v: number): number { return Math.round((v / this.rankMax()) * 100); }
  svcWidth(v: number): number  { return Math.round((v / this.svcMax())  * 100); }

  filteredLancamentos = computed(() => {
    const f = this.filterType();
    const list = this.lancamentos();
    if (f === 'ALL') return list;
    return list.filter(e => e.type === f);
  });

  paginatedLancamentos = computed(() => {
    const list = this.filteredLancamentos();
    const start = this.lancamentosPage() * this.lancamentosPageSize;
    return list.slice(start, start + this.lancamentosPageSize);
  });

  totalLancamentosPages = computed(() => {
    return Math.ceil(this.filteredLancamentos().length / this.lancamentosPageSize);
  });

  ngOnInit() {
    const role = (this.auth.getUserRole() ?? '').replace('ROLE_', '').toUpperCase();
    this.isAdmin.set(['DEV', 'ADMIN', 'ADM'].includes(role));
    this.userId.set(this.auth.getUserId());
    this.initForm();
    this.load();
  }

  // ── Período ───────────────────────────────────────────────────────────────

  setPeriod(p: PeriodOption) {
    this.activePeriod.set(p);
    if (p !== 'custom') this.load();
  }

  applyCustom() {
    if (this.customFrom && this.customTo) this.load();
  }

  private getFromTo(): { from: string; to: string } {
    const today = todaySP();
    const p     = this.activePeriod();
    if (p === 'custom') return { from: this.customFrom, to: this.customTo };
    if (p === 'today')  return { from: today, to: today };
    if (p === '7d')     return { from: daysAgoSP(6),  to: today };
    if (p === '30d')    return { from: daysAgoSP(29), to: today };
    return { from: firstOfMonthSP(), to: today };
  }

  periodLabel(): string {
    const m: Record<PeriodOption, string> = {
      today: 'Hoje', '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias',
      month: 'Este mês', custom: `${this.customFrom} → ${this.customTo}`
    };
    return m[this.activePeriod()];
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  load() {
    const { from, to } = this.getFromTo();
    if (!from || !to) return;
    this.loading.set(true);

    this.svc.getResumo(from, to).subscribe({
      next: d => {
        this.data.set(d);
        this.lancamentos.set(d.recentEntries ?? []);
        this.lancamentosPage.set(0);
        this.loading.set(false);
      },
      error: () => { this.toast.error('Erro ao carregar financeiro.'); this.loading.set(false); }
    });
  }

  loadLancamentos() {
    const { from, to } = this.getFromTo();
    const t = this.filterType() === 'ALL' ? undefined : this.filterType();
    this.svc.listLancamentos(from, to, t).subscribe({
      next:  list => {
        this.lancamentos.set(list);
        this.lancamentosPage.set(0);
      },
      error: ()   => this.toast.error('Erro ao carregar lançamentos.')
    });
  }

  onTabChange(tab: Tab) {
    this.activeTab.set(tab);
    if (tab === 'lancamentos') this.loadLancamentos();
  }

  setFilter(type: 'ALL' | 'INCOME' | 'EXPENSE') {
    this.filterType.set(type);
    this.lancamentosPage.set(0); // Reseta a página sempre que trocar de aba de filtro
  }

  prevLancamentosPage() {
    if (this.lancamentosPage() > 0) {
      this.lancamentosPage.set(this.lancamentosPage() - 1);
    }
  }

  nextLancamentosPage() {
    if (this.lancamentosPage() < this.totalLancamentosPages() - 1) {
      this.lancamentosPage.set(this.lancamentosPage() + 1);
    }
  }

  // Pegar apenas os 3 ultimos (Para o Dashboard/Resumo)
  getTop3RecentEntries(entries: ManualEntry[] | undefined): ManualEntry[] {
    return (entries ?? []).slice(0, 3);
  }

  // ── Modal de lançamento ───────────────────────────────────────────────────

  initForm() {
    this.entryForm = this.fb.group({
      type:        ['INCOME', Validators.required],
      category:    ['', Validators.required],
      otherCategory: [''],
      description: [''],
      amount:      [null, [Validators.required, Validators.min(0.01)]],
      entryDate:   [todaySP(), Validators.required],
    });
    this.onTypeChange('INCOME');
    this.entryForm.get('type')!.valueChanges.subscribe(v => this.onTypeChange(v));
    this.entryForm.get('category')!.valueChanges.subscribe(v => {
      this.showOtherField.set(v === 'Outros');
    });
  }

  onTypeChange(type: string) {
    this.categories.set(type === 'INCOME' ? this.INCOME_CATEGORIES : this.EXPENSE_CATEGORIES);
    this.entryForm.patchValue({ category: '', otherCategory: '' });
    this.showOtherField.set(false);
  }

  openCreate() {
    this.editingId.set(null);
    this.entryForm.reset({ type: 'INCOME', entryDate: todaySP() });
    this.onTypeChange('INCOME');
    this.showModal.set(true);
  }

  openEdit(e: ManualEntry) {
    if (!this.isAdmin()) return;
    this.editingId.set(e.id);
    this.onTypeChange(e.type);
    this.entryForm.patchValue({
      type: e.type, category: e.category,
      description: e.description, amount: e.amount,
      entryDate: e.entryDate
    });
    this.showModal.set(true);
  }

  saveEntry() {
    if (this.entryForm.invalid) return;
    const v = this.entryForm.value;
    const category = v.category === 'Outros' && v.otherCategory?.trim()
      ? v.otherCategory.trim() : v.category;

    const req: CreateManualEntryRequest = {
      type: v.type, category, description: v.description,
      amount: Number(v.amount), entryDate: v.entryDate
    };

    this.saving.set(true);
    const obs = this.editingId()
      ? this.svc.updateLancamento(this.editingId()!, req)
      : this.svc.createLancamento(req);

    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.triggerSuccess(this.editingId() ? 'Lançamento atualizado com sucesso!' : 'Lançamento criado com sucesso!');
        this.load();
        if (this.activeTab() === 'lancamentos') this.loadLancamentos();
      },
      error: err => {
        this.saving.set(false);
        this.toast.error(err.error?.message || 'Erro ao salvar.');
      }
    });
  }

  deleteEntry(id: number) {
    if (!this.isAdmin()) return;
    if (!confirm('Confirmar exclusão?')) return;
    this.svc.deleteLancamento(id).subscribe({
      next: () => {
        this.toast.success('Lançamento removido.');
        this.load();
        if (this.activeTab() === 'lancamentos') this.loadLancamentos();
      },
      error: err => this.toast.error(err.error?.message || 'Erro ao remover.')
    });
  }

  // ── Modal de Detalhes ─────────────────────────────────────────────────────
  
  openDetails(id: number) {
    const entry = this.lancamentos().find(e => e.id === id);
    if (entry) {
      this.viewingEntry.set(entry);
    } else {
      this.toast.error('Lançamento não encontrado.');
    }
  }

  closeDetails() {
    this.viewingEntry.set(null);
  }

  formatHistory(history?: string): string[] {
    if (!history) return [];
    return history.split('\n').filter(line => line.trim() !== '');
  }

  // ── Helpers e Máscaras ────────────────────────────────────────────────────

  getFormattedAmount(): string {
    const val = this.entryForm.get('amount')?.value;
    if (val === null || val === undefined || val === '') return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  }

  onCurrencyInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); 
    
    if (!value) {
      event.target.value = '';
      this.entryForm.get('amount')?.setValue(null, { emitEvent: false });
      return;
    }
    
    const numberValue = parseInt(value, 10) / 100;
    
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numberValue);
    
    event.target.value = formatted;
    this.entryForm.get('amount')?.setValue(numberValue, { emitEvent: false });
  }

  triggerSuccess(message: string) {
    this.showModal.set(false); 
    this.successMessage.set(message);
    this.showSuccessModal.set(true);

    setTimeout(() => {
      this.showSuccessModal.set(false);
    }, 2500);
  }

  fmtCurrency(v: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);
  }

  fmtDate(d: string): string {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  confirmationRate(): number {
    const d = this.data();
    if (!d?.totalAppointments) return 0;
    return Math.round((d.confirmedCount / d.totalAppointments) * 100);
  }
}