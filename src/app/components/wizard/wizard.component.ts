import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';
import {
  WizardStateService,
  WizardState
} from '../../services/wizard-state.service';
import {
  isPrestamoFlowSlug,
  slugToWizardPatch,
  wizardStateToNavigateCommands,
  wizardStateToSlug
} from '../../app-routing.constants';

@Component({
  selector: 'app-wizard',
  templateUrl: './wizard.component.html',
  styleUrls: ['./wizard.component.scss']
})
export class WizardComponent implements OnInit, OnDestroy {
  state$: Observable<WizardState>;
  currentStep = 1;
  totalSteps = 9;

  private readonly destroy$ = new Subject<void>();
  /** Evita bucle URL ↔ estado al aplicar el segmento desde el navegador */
  private pauseUrlSync = false;

  constructor(
    private wizardState: WizardStateService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.state$ = this.wizardState.state$;
  }

  ngOnInit(): void {
    this.applyRouteToState(this.route.snapshot.paramMap.get('pantalla'), this.route.snapshot.paramMap.get('subPantalla'));

    this.route.paramMap
      .pipe(
        map(pm => ({
          pantalla: pm.get('pantalla'),
          subPantalla: pm.get('subPantalla')
        })),
        distinctUntilChanged((a, b) => a.pantalla === b.pantalla && a.subPantalla === b.subPantalla),
        takeUntil(this.destroy$)
      )
      .subscribe(({ pantalla, subPantalla }) => {
        this.applyRouteToState(pantalla, subPantalla);
      });

    this.state$
      .pipe(
        map(s => wizardStateToNavigateCommands(s).join('\0')),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(pathKey => {
        if (this.pauseUrlSync) {
          return;
        }
        const state = this.wizardState.getCurrentState();
        const commands = wizardStateToNavigateCommands(state);
        const currentPantalla = this.route.snapshot.paramMap.get('pantalla');
        const currentSub = this.route.snapshot.paramMap.get('subPantalla');
        const targetSub = commands.length > 2 ? commands[2] : null;
        const pantallaMatches = currentPantalla === commands[1];
        const subMatches = (currentSub ?? null) === (targetSub ?? null);
        if (!pantallaMatches || !subMatches) {
          this.router.navigate(commands);
        }
      });

    this.state$.pipe(takeUntil(this.destroy$)).subscribe(state => {
      this.currentStep = state.currentStep;
      if (state.currentStep === 4 && state.hasUpdatedPotential) {
        setTimeout(() => {
          this.wizardState.setCurrentStep(6);
        }, 0);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  nextStep(): void {
    this.wizardState.nextStep();
  }

  previousStep(): void {
    this.wizardState.previousStep();
  }

  goToStep(step: number): void {
    this.wizardState.setCurrentStep(step);
  }

  private applyRouteToState(pantalla: string | null, subPantalla: string | null): void {
    if (!pantalla) {
      return;
    }
    const patch = slugToWizardPatch(pantalla);
    if (!patch) {
      void this.router.navigate(['/app', 'posicion-global'], { replaceUrl: true });
      return;
    }

    const state = this.wizardState.getCurrentState();
    const expectedSlug = wizardStateToSlug(state);
    const expectedSub = state.currentStep === 3 ? state.prestamoFlowSlug ?? null : null;
    const routeSub = subPantalla && isPrestamoFlowSlug(subPantalla) ? subPantalla : null;

    if (pantalla === expectedSlug && routeSub === expectedSub) {
      return;
    }

    this.pauseUrlSync = true;
    if (pantalla === 'prestamos') {
      this.wizardState.applyPrestamoFlowFromUrl(routeSub);
    } else {
      this.wizardState.setCurrentStep(patch.step);
      if (patch.entryScreen) {
        this.wizardState.setEntryScreen(patch.entryScreen);
      }
    }
    queueMicrotask(() => {
      this.pauseUrlSync = false;
    });
  }
}
