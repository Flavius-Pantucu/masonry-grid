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
  previous_batch: any = [];
  current_batch: any = [];
  next_batch: any = [];
  
  batchTimeout: boolean = false;

  constructor(private masonryGridService: MasonryGridService){ 
  }

  ngOnInit() {
    this.masonryGridService.getInitialPhotos().subscribe({
      next: (data: any) =>
      {
        this.current_batch = data;
        this.populateGrid();
      },
      error: (error: any) =>
        console.log(error)
    });

  }

  populateGrid(){
    let container = document.getElementById('photosContainer');
    for(let i = 0; i < this.current_batch.length; i++){
      let photoDiv = document.createElement('div');
      photoDiv.classList.add('d-flex', 'justify-content-center', 'p-1');

      let photo = document.createElement('img');
      photo.src = this.current_batch[i].urls.raw;
      photo.classList.add('w-75','rounded-4');
    
      photoDiv.append(photo);

      container?.appendChild(photoDiv);
    }
  }

  loadNextBatch(){
    let container = document.getElementById('photosContainer');
    for(let i = 0; i < this.current_batch.length; i++){
      let photoDiv = document.createElement('div');
      photoDiv.classList.add('d-flex', 'justify-content-center', 'p-1');

      let photo = document.createElement('img');
      photo.src = this.current_batch[i].urls.raw;
      photo.classList.add('w-75','rounded-4');
    
      photoDiv.append(photo);

      container?.appendChild(photoDiv);
    }
  }

 @HostListener('document:scroll', ['$event'])
  public onScroll(){
    let pos = document.documentElement.scrollTop + window.innerHeight;
    let max = document.documentElement.scrollHeight;
    
    if(pos / max > 0.75 && this.batchTimeout == false){
      this.batchTimeout = true;
      this.masonryGridService.getNextBatch().subscribe({
        next: (data: any) =>
        {
          if(this.previous_batch.length == 0){
            this.previous_batch = this.current_batch;
            this.current_batch = data;
            this.loadNextBatch();
          }
          else{
            console.log("TBD");
          }
        },
        error: (error: any) =>
          console.log(error)
      });
      setTimeout(() => this.batchTimeout = false,1500);
    }
  }
}
