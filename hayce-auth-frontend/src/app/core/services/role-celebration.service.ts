import { Injectable, signal } from '@angular/core';

export interface RoleCelebrationMessage {
  title: string;
  body: string;
  roleName: string;
}

@Injectable({ providedIn: 'root' })
export class RoleCelebrationService {
  private readonly messageState = signal<RoleCelebrationMessage | null>(null);

  readonly message = this.messageState.asReadonly();

  setMessage(message: RoleCelebrationMessage): void {
    this.messageState.set(message);
  }

  clear(): void {
    this.messageState.set(null);
  }
}
