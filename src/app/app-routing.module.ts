import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppEntryRedirectComponent } from './components/app-entry-redirect/app-entry-redirect.component';
import { LoginFlowComponent } from './components/login-flow/login-flow.component';
import { WizardComponent } from './components/wizard/wizard.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', component: AppEntryRedirectComponent },
  { path: 'acceso', component: LoginFlowComponent },
  { path: 'app/:pantalla', component: WizardComponent },
  { path: '**', component: AppEntryRedirectComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled'
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
