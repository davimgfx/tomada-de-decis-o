import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { EstadoService } from './services/estado.service';

const autenticado: CanActivateFn = () => {
  const estado = inject(EstadoService);
  return estado.usuario() ? true : inject(Router).createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login').then((m) => m.Login) },
  {
    path: '',
    canActivate: [autenticado],
    loadComponent: () => import('./pages/layout').then((m) => m.Layout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard').then((m) => m.Dashboard) },
      { path: 'simulacao', loadComponent: () => import('./pages/simulacao').then((m) => m.SimulacaoPage) },
      { path: 'ranking', loadComponent: () => import('./pages/ranking').then((m) => m.Ranking) },
    ],
  },
  { path: '**', redirectTo: '' },
];
