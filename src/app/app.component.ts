import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MasonryGridComponent } from './masonry-grid/masonry-grid.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, MasonryGridComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'masonry-grid';
}
