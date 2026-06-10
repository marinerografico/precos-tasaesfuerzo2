import {
  Component,
  OnDestroy,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';
import { Router } from '@angular/router';
import { WizardStateService } from '../../services/wizard-state.service';

declare var lucide: any;

@Component({
  selector: 'app-login-flow',
  templateUrl: './login-flow.component.html',
  styleUrls: ['./login-flow.component.scss']
})
export class LoginFlowComponent implements AfterViewInit, OnDestroy {
  phase: 'marketing' | 'password' | 'transition' | 'branding' = 'marketing';

  password = '';
  showPassword = false;
  errorMessage = '';
  passwordFocused = false;

  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
    private wizardState: WizardStateService
  ) {}

  ngAfterViewInit(): void {
    this.icons();
  }

  ngOnDestroy(): void {
    this.timers.forEach(t => clearTimeout(t));
  }

  onAcceder(): void {
    this.phase = 'password';
    this.password = '';
    this.errorMessage = '';
    this.cdr.markForCheck();
    setTimeout(() => this.icons(), 50);
  }

  onTogglePassword(): void {
    this.showPassword = !this.showPassword;
    this.cdr.markForCheck();
    this.timers.push(setTimeout(() => this.icons(), 50));
  }

  /** Demo: entrar sin validar contraseña; el botón permanece habilitado */
  get canEnter(): boolean {
    return true;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.phase = 'transition';
    this.cdr.markForCheck();
    this.timers.push(
      setTimeout(() => {
        this.phase = 'branding';
        this.cdr.markForCheck();
      }, 450)
    );
    const afterLoginMs = 450 + 1400;
    this.timers.push(
      setTimeout(() => {
        this.wizardState.reset();
        this.wizardState.setEntryScreen('posicion-global');
        this.wizardState.setPosicionGlobalCardView('total');
        void this.router.navigate(['/app', 'posicion-global']);
      }, afterLoginMs)
    );
  }

  private icons(): void {
    if (typeof lucide !== 'undefined') {
      setTimeout(() => {
        try {
          lucide.createIcons();
        } catch {
          /* noop */
        }
      }, 40);
    }
  }
}
