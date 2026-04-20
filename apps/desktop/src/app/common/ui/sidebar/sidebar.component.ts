import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-sidebar',
  styleUrl: './sidebar.styles.scss',
  template: `
    <mat-sidenav-container class="sidebar">
      <mat-sidenav mode="side">
        <button matButton="outlined">Navigation</button>
      </mat-sidenav>
      <mat-sidenav-content>
        <ng-content />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  standalone: true,
  imports: [MatIconModule, MatSlideToggleModule, MatSidenavModule],
})
export class SidebarComponent implements OnInit {
  constructor() {}
  ngOnInit() {
    console.log('Sidebar init');
  }
}
