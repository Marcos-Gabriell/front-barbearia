import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations'; // <--- CORREÇÃO AQUI
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

import { LucideAngularModule, User, Mail, Shield, CheckCircle, AlertCircle, Loader2, Clock, Calendar, ChevronRight, Lock } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    provideAnimations(), // <--- ISSO HABILITA AS ANIMAÇÕES E TIRA O ERRO
    
    importProvidersFrom(LucideAngularModule.pick({ 
      User, 
      Mail, 
      Shield, 
      CheckCircle, 
      AlertCircle, 
      Loader2, 
      Clock, 
      Calendar, 
      ChevronRight, 
      Lock 
    })),
  ],
};