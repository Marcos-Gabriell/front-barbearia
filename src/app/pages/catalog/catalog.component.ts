import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CatalogService } from '../../core/services/catalog/catalog.service';
import { UserService } from '../../core/services/users/user.service';

import {
  ApiResponse,
  CatalogItem,
  CreateCatalogRequest,
  UpdateCatalogRequest,
  UserSummary
} from '../../core/models/catalog.model';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogListComponent implements OnInit {

  services: CatalogItem[] = [];
  visibleServices: CatalogItem[] = [];
  users: UserSummary[] = [];
  usersLoading = false;
  currentPage = 1;
  itemsPerPage = 4;
  totalPages = 0;
  isPageLoading = true;
  isLoading = false;

  showFormModal = false;
  showDeleteModal = false;
  showToggleModal = false;
  showSuccessModal = false;
  showDetailsModal = false;
  showUserSelectModal = false;

  successMessage = '';
  errorMessage = '';
  submitted = false;

  tempSelectedUserIds: number[] = [];
  userPage = 1;
  userPageSize = 6;
  userTotalPages = 0;
  paginatedUsers: UserSummary[] = [];

  currentItem: CatalogItem | null = null;

  formData: UpdateCatalogRequest = {
    name: '',
    price: 0,
    durationMinutes: 30,
    description: '',
    active: true,
    responsibleUserIds: []
  };

  formattedPrice: string = 'R$ 0,00';

  constructor(
    private catalogService: CatalogService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadServices();
    this.loadUsers();
  }

  loadServices(): void {
    this.isPageLoading = true;
    this.catalogService.listAll().subscribe({
      next: (res: ApiResponse<CatalogItem[]>) => {
        this.services = res.data || [];
        this.currentPage = 1;
        this.updateView();
        this.isPageLoading = false;
      },
      error: () => { this.isPageLoading = false; }
    });
  }

  loadUsers(): void {
    this.usersLoading = true;
    this.userService.listStaffForCatalog().subscribe({
      next: (res: ApiResponse<UserSummary[]>) => {
        this.users = res.data || [];
        this.usersLoading = false;
      },
      error: () => { this.usersLoading = false; }
    });
  }

  updateView(): void {
    this.totalPages = Math.ceil(this.services.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) this.currentPage = this.totalPages;
    if (this.currentPage < 1) this.currentPage = 1;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.visibleServices = this.services.slice(start, end);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateView();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  updateUserPagination(): void {
    this.userTotalPages = Math.ceil(this.users.length / this.userPageSize);
    if (this.userPage > this.userTotalPages && this.userTotalPages > 0) this.userPage = this.userTotalPages;
    if (this.userPage < 1) this.userPage = 1;
    const start = (this.userPage - 1) * this.userPageSize;
    const end = start + this.userPageSize;
    this.paginatedUsers = this.users.slice(start, end);
  }

  nextUserPage(): void {
    if (this.userPage < this.userTotalPages) {
      this.userPage++;
      this.updateUserPagination();
    }
  }

  prevUserPage(): void {
    if (this.userPage > 1) {
      this.userPage--;
      this.updateUserPagination();
    }
  }
  
  openUserSelectModal(): void {
    this.tempSelectedUserIds = [...this.formData.responsibleUserIds];
    this.userPage = 1;
    this.updateUserPagination();
    this.showUserSelectModal = true;
  }

  closeUserSelectModal(): void {
    this.showUserSelectModal = false;
  }

  isTempUserSelected(id: number): boolean {
    return this.tempSelectedUserIds.includes(id);
  }

  toggleTempUserSelection(id: number): void {
    const idx = this.tempSelectedUserIds.indexOf(id);
    if (idx > -1) {
      this.tempSelectedUserIds.splice(idx, 1);
    } else {
      this.tempSelectedUserIds.push(id);
    }
  }

  confirmUserSelection(): void {
    this.formData.responsibleUserIds = [...this.tempSelectedUserIds];
    this.closeUserSelectModal();
  }

  getUserName(id: number): string {
    const u = this.users.find(x => x.id === id);
    return u?.name || `#${id}`;
  }

  formatCurrencyValue(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  onPriceInput(event: any): void {
    let rawValue = event.target.value.replace(/\D/g, '');
    if (!rawValue) {
      this.formData.price = 0;
      this.formattedPrice = 'R$ 0,00';
      return;
    }
    const numberValue = parseFloat(rawValue) / 100;
    this.formData.price = numberValue;
    this.formattedPrice = this.formatCurrencyValue(numberValue);
    event.target.value = this.formattedPrice;
  }

  incrementDuration(): void {
    this.formData.durationMinutes = (this.formData.durationMinutes || 0) + 5;
  }

  decrementDuration(): void {
    if ((this.formData.durationMinutes || 0) > 5) {
      this.formData.durationMinutes -= 5;
    }
  }

  openForm(item?: CatalogItem): void {
    this.errorMessage = '';
    this.submitted = false;

    if (item) {
      this.currentItem = item;
      const idsFromItem: number[] = (item as any)?.responsibleUserIds || (item.responsibleUsers?.map(u => u.id) ?? []);
      this.formData = {
        name: item.name,
        price: item.price,
        durationMinutes: item.durationMinutes,
        description: item.description || '',
        active: item.active,
        responsibleUserIds: Array.isArray(idsFromItem) ? [...idsFromItem] : []
      };
      this.formattedPrice = this.formatCurrencyValue(item.price);
    } else {
      this.currentItem = null;
      this.formData = {
        name: '',
        price: 0,
        durationMinutes: 30,
        description: '',
        active: true,
        responsibleUserIds: []
      };
      this.formattedPrice = 'R$ 0,00';
    }
    this.showFormModal = true;
  }

  save(): void {
    this.submitted = true;
    this.errorMessage = '';

    let hasError = false;

    if (!this.formData.name || this.formData.name.trim().length < 3) hasError = true;
    if (this.formData.price === null || this.formData.price === undefined) hasError = true;
    if (!this.formData.durationMinutes || this.formData.durationMinutes < 5) hasError = true;
    if (!this.formData.responsibleUserIds || this.formData.responsibleUserIds.length === 0) hasError = true;

    if (hasError) {
      this.errorMessage = 'Todos os campos são obrigatórios.';
      return;
    }

    this.isLoading = true;
    this.formData.name = this.formData.name.trim();

    const request$ = this.currentItem?.id
      ? this.catalogService.update(this.currentItem.id, this.formData)
      : this.catalogService.create(this.formData);

    request$.subscribe({
      next: (res: ApiResponse<CatalogItem>) => {
        if (this.currentItem?.id) {
          const idx = this.services.findIndex(s => s.id === res.data.id);
          if (idx !== -1) this.services[idx] = res.data;
          this.openSuccess('Serviço atualizado com sucesso!');
        } else {
          this.services.unshift(res.data);
          this.openSuccess('Serviço criado com sucesso!');
        }
        this.updateView();
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || '';
        if (msg.includes('already exists')) {
          this.errorMessage = 'Já existe um serviço com este nome.';
        } else {
          this.errorMessage = msg || 'Erro ao processar solicitação.';
        }
      }
    });
  }

  closeModals(): void {
    this.showFormModal = false;
    this.showDeleteModal = false;
    this.showToggleModal = false;
    this.showSuccessModal = false;
    this.showDetailsModal = false;
    this.showUserSelectModal = false;
    this.currentItem = null;
    this.isLoading = false;
  }

  openSuccess(msg: string): void {
    this.closeModals();
    this.successMessage = msg;
    this.showSuccessModal = true;
  }

  confirmDelete(item: CatalogItem): void {
    this.currentItem = item;
    this.showDeleteModal = true;
  }

  executeDelete(): void {
    if (!this.currentItem) return;
    this.isLoading = true;
    this.catalogService.delete(this.currentItem.id).subscribe({
      next: () => {
        this.services = this.services.filter(s => s.id !== this.currentItem?.id);
        this.updateView();
        this.openSuccess('Serviço excluído com sucesso!');
      },
      error: () => this.isLoading = false
    });
  }

  confirmToggleStatus(item: CatalogItem): void {
    this.currentItem = item;
    this.showToggleModal = true;
  }

  executeToggle(): void {
    if (!this.currentItem) return;
    this.isLoading = true;
    this.catalogService.toggleActive(this.currentItem.id).subscribe({
      next: (res: ApiResponse<CatalogItem>) => {
        const item = this.services.find(s => s.id === this.currentItem?.id);
        if (item) item.active = res.data.active;
        this.updateView();
        this.openSuccess(`Serviço ${res.data.active ? 'ativado' : 'desativado'} com sucesso!`);
      },
      error: () => this.isLoading = false
    });
  }

  openDetailsModal(item: CatalogItem): void {
    this.currentItem = item;
    this.showDetailsModal = true;
  }

  trackById(index: number, item: CatalogItem): number {
    return item.id;
  }
}