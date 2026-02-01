import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../core/services/users/user.service';
import { User, UserRole } from '../../core/models/user.model';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit, OnDestroy {
  users: User[] = [];
  isLoading = false;
  currentUserId: number | null = null;
  currentUserRole: string | null = null; // Armazena a role do usuário logado

  currentPage = 1;
  itemsPerPage = 10;
  
  showFormModal = false;
  showDetailsModal = false;
  showDeleteModal = false;
  showResetModal = false; 
  
  showSuccessInviteModal = false;
  invitedEmail = '';

  showGenericSuccessModal = false;
  genericSuccessTitle = '';
  genericSuccessMessage = '';

  resetStep: 'confirm' | 'success' = 'confirm';
  tempPasswordDisplay = '';
  modalSuccessTitle = ''; 
  successMessage = ''; 
  
  countdown = 60;
  private timerInterval: any = null;

  toast = { visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' };
  private toastTimeout: any;

  isEditing = false;
  selectedUser: User | null = null;
  form: FormGroup;
  submitted = false; 
  
  // Lista de roles que será filtrada dinamicamente
  availableRoles: UserRole[] = [];
  
  emailDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com.br', 'live.com', 'icloud.com'];
  emailSuggestions: string[] = [];

  constructor(
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      name: [''],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      role: ['STAFF', [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Carrega o perfil PRIMEIRO para saber quem é o usuário logado
    this.userService.getProfile().subscribe({
      next: (user) => { 
        this.currentUserId = user.id; 
        this.currentUserRole = user.role; 
        
        // SÓ carrega a lista depois de saber a role do usuário logado
        // para aplicar o filtro corretamente
        this.loadUsers();
      },
      error: (err) => console.error('Erro ao carregar perfil:', err)
    });
    
    this.form.get('email')?.valueChanges.subscribe(val => this.handleEmailSuggestions(val));
  }

  ngOnDestroy(): void {
    this.stopCountdown();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  handleEmailSuggestions(value: string) {
    if (!value || !value.includes('@')) { 
      this.emailSuggestions = []; 
      return; 
    }

    const parts = value.split('@');
    if (parts.length > 2) return; 
    
    const domainPart = parts[1];
    if (this.emailDomains.includes(domainPart)) {
      this.emailSuggestions = [];
      return;
    }

    this.emailSuggestions = this.emailDomains.filter(d => d.startsWith(domainPart));
  }

  selectSuggestion(domain: string) {
    const currentEmail = this.form.get('email')?.value || '';
    const userPart = currentEmail.split('@')[0];
    this.form.patchValue({ email: `${userPart}@${domain}` });
    this.emailSuggestions = [];
  }

  // Lógica de permissão de criação (Mantida conforme pedido anterior)
  updateAvailableRoles() {
    if (this.currentUserRole === 'DEV') {
      this.availableRoles = ['STAFF', 'ADMIN', 'DEV'];
    } else if (this.currentUserRole === 'ADMIN') {
      this.availableRoles = ['STAFF'];
    } else {
      this.availableRoles = ['STAFF'];
    }
  }

  openCreate() {
    this.isEditing = false;
    this.selectedUser = null;
    this.submitted = false;
    this.updateAvailableRoles();

    this.form.get('name')?.clearValidators();
    this.form.get('name')?.updateValueAndValidity();
    
    const defaultRole = (this.availableRoles.length === 1) ? this.availableRoles[0] : 'STAFF';
    this.form.reset({ role: defaultRole });

    this.showFormModal = true;
    this.emailSuggestions = [];
  }

  openEdit(user: User) {
    this.isEditing = true;
    this.selectedUser = user;
    this.submitted = false;
    this.updateAvailableRoles();

    this.form.get('name')?.setValidators([Validators.required, Validators.minLength(3)]);
    this.form.get('name')?.updateValueAndValidity();
    this.form.patchValue({
      name: user.name,
      email: user.email,
      role: user.role
    });
    this.showFormModal = true;
    this.emailSuggestions = [];
  }

  onSubmit() {
    this.submitted = true; 
    if (this.form.invalid) return;

    const req = this.form.value;

    if (this.isEditing && this.selectedUser) {
      if (req.name === this.selectedUser.name && 
          req.email === this.selectedUser.email && 
          req.role === this.selectedUser.role) {
        this.closeModals(); return; 
      }

      this.isLoading = true;
      this.userService.update(this.selectedUser.id, req).subscribe({
        next: () => {
          this.loadUsers();
          this.showFormModal = false;
          this.genericSuccessTitle = 'Alterações Salvas!';
          this.genericSuccessMessage = 'Os dados do usuário foram atualizados com sucesso.';
          this.showGenericSuccessModal = true;
          this.isLoading = false;
        },
        error: (err) => {
          this.triggerToast(err.error?.message || 'Erro ao atualizar', 'error');
          this.isLoading = false;
        }
      });
    } 
    else {
      this.isLoading = true;
      this.userService.invite({ email: req.email, role: req.role }).subscribe({
        next: () => {
          this.showFormModal = false;
          this.isLoading = false; 
          this.invitedEmail = req.email;
          this.showSuccessInviteModal = true; 
        },
        error: (err) => {
          this.triggerToast(err.error?.message || 'Erro ao enviar convite', 'error');
          this.isLoading = false;
        }
      });
    }
  }

  deleteUser() { 
      if(!this.selectedUser) return;
      this.isLoading = true;
      this.userService.delete(this.selectedUser.id).subscribe({
          next: () => { 
            this.loadUsers(); 
            this.showDeleteModal = false;
            this.genericSuccessTitle = 'Usuário Excluído!';
            this.genericSuccessMessage = 'O usuário foi removido do sistema com sucesso.';
            this.showGenericSuccessModal = true;
            this.isLoading = false;
          },
          error: () => { 
            this.isLoading = false; 
            this.triggerToast('Erro ao excluir', 'error'); 
          }
      });
  }

  confirmResetPass() {
      if(!this.selectedUser) return;
      this.isLoading = true;
      this.userService.resetPassword(this.selectedUser.id).subscribe({
          next: (res) => { 
              this.isLoading = false; 
              this.tempPasswordDisplay = res.temporaryPassword;
              this.resetStep = 'success'; 
              this.modalSuccessTitle = 'Senha Resetada!'; 
              this.startCountdown(); 
          },
          error: () => { this.isLoading = false; this.triggerToast('Erro reset', 'error'); }
      });
  }

  triggerToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast = { visible: true, message, type };
    this.toastTimeout = setTimeout(() => { this.toast.visible = false; }, 3500);
  }

  get f() { return this.form.controls; }

  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.users.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number { return Math.ceil(this.users.length / this.itemsPerPage) || 1; }

  changePage(page: number) { if (page >= 1 && page <= this.totalPages) this.currentPage = page; }

  loadUsers() {
    this.isLoading = true;
    this.userService.list().subscribe({
      next: (data) => { 
        // LÓGICA DE FILTRAGEM ALTERADA AQUI
        if (this.currentUserRole === 'DEV') {
            // Se sou DEV, vejo todo mundo (incluindo outros DEVs)
            this.users = data;
        } else {
            // Se sou ADMIN ou STAFF, filtro para NÃO ver DEVs
            this.users = data.filter(u => u.role !== 'DEV'); 
        }
        this.isLoading = false; 
      },
      error: () => { this.isLoading = false; }
    });
  }

  startCountdown() {
    this.stopCountdown(); this.countdown = 60; 
    this.timerInterval = setInterval(() => { this.countdown--; if (this.countdown <= 0) this.closeModals(); }, 1000);
  }
  stopCountdown() { if (this.timerInterval) clearInterval(this.timerInterval); }

  closeModals() {
    this.stopCountdown(); 
    this.showFormModal = false; 
    this.showDetailsModal = false;
    this.showDeleteModal = false; 
    this.showResetModal = false;
    this.showSuccessInviteModal = false;
    this.showGenericSuccessModal = false;
    this.selectedUser = null; 
    this.emailSuggestions = [];
    this.isLoading = false; 
    this.submitted = false;
  }

  copyToClipboard(text: string) { navigator.clipboard.writeText(text); this.triggerToast('Copiado!', 'success'); }
  openDetails(user: User) { this.selectedUser = user; this.showDetailsModal = true; }
  confirmDelete(user: User) { this.selectedUser = user; this.showDeleteModal = true; }
  
  toggleActive(user: User) {
      if(!user.active && confirm('Ativar?')) {
          this.userService.activate(user.id).subscribe(() => { this.loadUsers(); this.triggerToast('Ativado', 'success'); });
      }
  }

  openResetModal(user: User) { this.selectedUser = user; this.resetStep = 'confirm'; this.showResetModal = true; }
}