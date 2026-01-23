import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { TokenService } from './core/services/auth/token.service';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ToastContainerComponent } from './core/ui/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private router = inject(Router);
  private tokenService = inject(TokenService);

  showSidebar = false;
  isMobileMenuOpen = false;

  private readonly noSidebar = new Set([
    'login', 
    'not-found', 
    'recuperar-senha', 
    'setup-conta'
  ]);

  constructor() {
    this.updateSidebar(this.router.url);

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.updateSidebar(e.urlAfterRedirects));
  }

  private updateSidebar(url: string) {
    const firstSegment = this.getFirstSegment(url);

    if (this.noSidebar.has(firstSegment)) {
      this.showSidebar = false;
      return;
    }

    const access = this.tokenService.getAccess();
    this.showSidebar = !!access && !this.tokenService.isExpired(access);
  }

  private getFirstSegment(url: string): string {
    const tree = this.router.parseUrl(url);
    const segments = tree.root.children['primary']?.segments ?? [];
    return segments[0]?.path ?? '';
  }

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}