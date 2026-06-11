import { Component, OnInit, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule, Router } from '@angular/router'; 
 
import { UserService } from '../../core/services/users/user.service';  
import { AuthService } from '../../core/services/auth/auth.service'; 
import { TokenService } from '../../core/services/auth/token.service';
import { CurrentUserService } from '../../core/services/users/current-user.service'; 
import { ThemeService } from '../../core/services/theme/theme.service';  
 
@Component({ 
  selector: 'app-sidebar', 
  standalone: true, 
  imports: [CommonModule, RouterModule], 
  templateUrl: './sidebar.component.html', 
  styleUrls: ['./sidebar.component.scss'] 
}) 
export class SidebarComponent implements OnInit { 
   
  private router = inject(Router); 
  private userService = inject(UserService); 
  private authService = inject(AuthService); 
  private tokenService = inject(TokenService);
   
  public currentUserService = inject(CurrentUserService); 
  public themeService = inject(ThemeService);  
 
  @Input() isMobileOpen = false; 
  @Output() mobileClose = new EventEmitter<void>(); 
   
  isCollapsed = false; 
  showLogoutModal = false; 
  appVersion = '1.0.0'; 
 
  currentUser = this.currentUserService.currentUser;
  logoSrc = computed(() => this.themeService.isDark() ? '/logo1.png' : '/logo2.png'); 
 
  menuItems = [ 
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard', roles: [] }, 
    { icon: 'finance', label: 'Financeiro', route: '/financeiro', roles: ['DEV', 'ADMIN'] }, 
    { icon: 'appointments', label: 'Agendamentos', route: '/agendamentos', roles: [] },
    { icon: 'catalog', label: 'Catálogo', route: '/catalogo', roles: ['DEV', 'ADMIN'] }, 
    { icon: 'agenda', label: 'Agenda', route: '/agenda', roles: ['DEV', 'ADMIN'] }, 
    { icon: 'clients', label: 'Clientes', route: '/clientes', roles: ['DEV', 'ADMIN'] },
    { icon: 'users', label: 'Usuários', route: '/usuarios', roles: ['DEV', 'ADMIN'] }, 
    { icon: 'logs', label: 'Logs', route: '/logs', roles: ['DEV', 'ADMIN'] },
  ]; 
 
  filteredMenuItems: any[] = []; 
 
  ngOnInit(): void { 
    if (!this.hasValidSession()) {
      this.currentUserService.setUser(null);
      this.filterMenuByRole('');
      return;
    }

    if (!this.currentUser()) { 
      this.loadUserProfile(); 
    } else { 
      this.filterMenuByRole(this.currentUser()?.role || ''); 
    } 
  } 
 
  loadUserProfile() { 
    if (!this.hasValidSession()) {
      this.currentUserService.setUser(null);
      this.filterMenuByRole('');
      return;
    }

    this.userService.getProfile().subscribe({ 
      next: (user) => { 
        this.currentUserService.setUser(user); 
        this.filterMenuByRole(user.role); 
      }, 
      error: () => { 
        this.currentUserService.setUser(null);
        this.filterMenuByRole('');
      } 
    }); 
  } 

  private hasValidSession(): boolean {
    const access = this.tokenService.getAccess();
    return !!access && !this.tokenService.isExpired(access);
  }
 
  filterMenuByRole(role: string) { 
    this.filteredMenuItems = this.menuItems.filter(item =>  
      item.roles.length === 0 || item.roles.includes(role) 
    ); 
  } 
   
  toggleSidebar() {  
    this.isCollapsed = !this.isCollapsed;  
  } 
   
  toggleMobileMenu() {  
    this.isMobileOpen = !this.isMobileOpen;  
  } 
   
  closeMobile() {  
    this.isMobileOpen = false; 
    this.mobileClose.emit(); 
  } 
 
  logout(event?: Event) { 
    if (event) event.stopPropagation(); 
    this.showLogoutModal = true; 
  } 
 
  confirmLogout() { 
    this.showLogoutModal = false; 
    this.authService.logout().subscribe({ 
      next: () => { 
        this.currentUserService.setUser(null); 
        this.router.navigate(['/login']); 
      }, 
      error: () => this.router.navigate(['/login']) 
    }); 
  } 
 
  cancelLogout() { 
    this.showLogoutModal = false; 
  } 
 
  navigateToProfile() { 
    this.closeMobile(); 
    this.router.navigate(['/perfil']); 
  } 
}