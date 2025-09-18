import {Routes} from '@angular/router';

export const routes: Routes = [
    {
        path: 'screen',
        loadComponent: () => import('./components/virtual-assistant/virtual-assistant').then(c => c.VirtualAssistant)
    },
    {
        path: 'camera',
        loadComponent: () => import('./components/camera-virtual-assistant/camera-virtual-assistant').then(c => c.CameraVirtualAssistant)
    },
    {
        path: '**',
        redirectTo: 'screen'
    }
];
