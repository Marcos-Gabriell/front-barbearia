import { Injectable, signal } from '@angular/core';
import { User } from './user-profile.service'; 

@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  readonly currentUser = signal<User | null>(null);
  setUser(user: User | null) {
    this.currentUser.set(user);
  }
}