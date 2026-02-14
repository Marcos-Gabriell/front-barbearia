import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core'; 
import { CommonModule } from '@angular/common'; 
import { RouterModule, Router } from '@angular/router'; 
 
import { UserService } from '../../core/services/users/user.service';  
import { AuthService } from '../../core/services/auth/auth.service'; 
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
   
  public currentUserService = inject(CurrentUserService); 
  public themeService = inject(ThemeService);  
 
  @Input() isMobileOpen = false; 
  @Output() mobileClose = new EventEmitter<void>(); 
   
  isCollapsed = false; 
  showLogoutModal = false; 
  appVersion = '1.0.0'; 
 
  currentUser = this.currentUserService.currentUser; 
 
  menuItems = [ 
    { icon: 'dashboard', label: 'Dashboard', route: '/dashboard', roles: [] }, 
    { icon: 'catalog', label: 'Catálogo', route: '/catalogo', roles: ['DEV', 'ADMIN'] }, 
    { icon: 'agenda', label: 'Gestão de Agendas', route: '/availability', roles: ['DEV', 'ADMIN'] }, 
    { icon: 'finance', label: 'Financeiro', route: '/financeiro', roles: [] }, 
    { icon: 'users', label: 'Usuários', route: '/usuarios', roles: ['DEV', 'ADMIN'] }, 
  ]; 
 
  filteredMenuItems: any[] = []; 
 
  ngOnInit(): void { 
    if (!this.currentUser()) { 
      this.loadUserProfile(); 
    } else { 
      this.filterMenuByRole(this.currentUser()?.role || ''); 
    } 
  } 
 
  loadUserProfile() { 
    this.userService.getProfile().subscribe({ 
      next: (user) => { 
        this.currentUserService.setUser(user); 
        this.filterMenuByRole(user.role); 
      }, 
      error: (err) => { 
        console.error('Erro sidebar:', err); 
      } 
    }); 
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