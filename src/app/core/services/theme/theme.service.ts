import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  
  isDark = signal<boolean>(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      
      if (savedTheme === 'dark') {
        this.isDark.set(true);
      }

      effect(() => {
        const dark = this.isDark();
        if (dark) {
          document.body.classList.add('dark-theme');
          localStorage.setItem('theme', 'dark');
        } else {
          document.body.classList.remove('dark-theme');
          localStorage.setItem('theme', 'light');
        }
      });
    }
  }

  toggle() {
    this.isDark.update(val => !val);
  }
}