import { Component, HostListener } from '@angular/core';
import { MasonryGridService } from './masonry-grid.service';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [HttpClientModule, CommonModule, NgbModule ],
  providers: [MasonryGridService],
  templateUrl: './masonry-grid.component.html',
  styleUrl: './masonry-grid.component.css'
})
export class MasonryGridComponent {
  photos: any = [];
  isLoaded :boolean[] = [];

  constructor(private masonryGridService: MasonryGridService){
    this.photos = this.masonryGridService.getPhotos();
    this.isLoaded = new Array(this.photos.length).fill(false); 
  }

  onLoad(i: number) {
    this.isLoaded[i] = true;
  }

 @HostListener('document:scroll', ['$event'])
  public onViewportScroll(){
    let pos = document.documentElement.scrollTop + window.innerHeight;
    let max = document.documentElement.scrollHeight;
    console.log(pos/max);
    
  }
}
