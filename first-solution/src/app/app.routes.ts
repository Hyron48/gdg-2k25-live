import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/virtual-assistant/virtual-assistant').then(c => c.VirtualAssistant)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
