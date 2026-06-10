import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/** Redirige la raíz y rutas desconocidas al login. */
@Component({
  selector: 'app-entry-redirect',
  template: ''
})
export class AppEntryRedirectComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    void this.router.navigateByUrl('/acceso', { replaceUrl: true });
  }
}
