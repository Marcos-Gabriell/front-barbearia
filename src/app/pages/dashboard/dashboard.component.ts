import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  
  kpis = [
    { title: 'Agendamentos', value: '142', change: '+12%', icon: 'calendar', color: 'blue' },
    { title: 'Equipe Ativa', value: '8', change: 'Estável', icon: 'users', color: 'purple' },
    { title: 'Receita do Mês', value: 'R$ 12.450', change: '+5%', icon: 'money', color: 'green' },
    { title: 'Cancelamentos', value: '3', change: '-2%', icon: 'cancel', color: 'red' }
  ];

  topServices = [
    { name: 'Corte Degradê', count: 450, percent: 85 },
    { name: 'Barba Terapia', count: 320, percent: 60 },
    { name: 'Sobrancelha', count: 120, percent: 30 },
    { name: 'Pigmentação', count: 80, percent: 20 },
  ];

  revenueData = [40, 60, 45, 80, 55, 90, 70]; 
}