import { Component, HostListener } from '@angular/core';
import { MasonryGridService } from './masonry-grid.service';
import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ElementSchemaRegistry } from '@angular/compiler';

@Component({
  selector: 'app-masonry-grid',
  standalone: true,
  imports: [CommonModule, NgbModule],
  templateUrl: './masonry-grid.component.html',
  styleUrl: './masonry-grid.component.css'
})
export class MasonryGridComponent {
  previousBatch: any = [];
  currentBatch:  any = [];
  
  scrollPosition: number = 0;
  
  batchTimeout:   boolean = false;

  innerHeight:  number = 0;
  innerWidth:   number = 0;
  photosPerRow: number = 0;

  totalOffsetHeight: number[] = [];
  totalOffsetWidth:  number = 0;

  currentOffsetHeight: number[] = [];
  currentOffsetWidth:  number = 0;

  batchesImagesSizes:  any[][] = [];
  batchesOffsetHeight: number[][] = [];
  batchesOffsetWidth:  number[] = [];
  deletedBatches:      number[] = [];

  constructor(private masonryGridService: MasonryGridService){ 
  }

  ngOnInit() {
    this.innerHeight = window.innerHeight;
    this.innerWidth = window.innerWidth;
    
    this.photosPerRow = this.calculatePPR();

    this.currentOffsetHeight = new Array(this.photosPerRow).fill(0);
    this.totalOffsetHeight = new Array(this.photosPerRow).fill(0);

    this.masonryGridService.getPhotos().subscribe({
      next: (data: any) =>
      {
        this.currentBatch = data;
        this.insertBatch('append');
      },
      error: (error: any) => console.log(error)
    });
  }

  calculatePPR(){
    if(this.innerWidth < 768) return 1;
    else if(this.innerWidth < 992) return 2;
    else if(this.innerWidth < 1200) return 3;
    else return 4;
  }

  setPhotoPosition(photoDiv: HTMLDivElement, i: number,  image:any, insertType: string){
    if(insertType == 'append'){
      if(Math.round(this.totalOffsetWidth - this.innerWidth) == 0){
        this.totalOffsetWidth = 0;
        this.currentOffsetWidth = 0;
      } 
      let currentColumn = Math.round(this.totalOffsetWidth * this.photosPerRow / this.innerWidth);
      
      photoDiv.style.left = this.totalOffsetWidth + 'px';
      photoDiv.style.top = this.totalOffsetHeight[currentColumn] + 'px';
      
      this.currentOffsetWidth += (Math.round((this.innerWidth / this.photosPerRow) * 100) / 100);
      this.currentOffsetHeight[currentColumn] += (this.innerWidth * image.height) / (image.width * this.photosPerRow);

      this.totalOffsetWidth += (Math.round((this.innerWidth / this.photosPerRow) * 100) / 100);
      this.totalOffsetHeight[currentColumn] += (this.innerWidth * image.height) / (image.width * this.photosPerRow);
    }else if(insertType == 'prepend'){
      if(Math.round(this.currentOffsetWidth) == 0)
        this.currentOffsetWidth = this.innerWidth;

      let currentColumn = Math.round(this.currentOffsetWidth * this.photosPerRow / this.innerWidth) - 1;
      
      photoDiv.style.left = (this.currentOffsetWidth - this.innerWidth / this.photosPerRow) + 'px';
      photoDiv.style.top = this.currentOffsetHeight[currentColumn] - (this.innerWidth * image.height) / (image.width * this.photosPerRow) + 'px';
    
      this.currentOffsetWidth -= (Math.round((this.innerWidth / this.photosPerRow) * 100) / 100);
      this.currentOffsetHeight[currentColumn] -= (this.innerWidth * image.height) / (image.width * this.photosPerRow); 
    }

    return photoDiv;
  }

  createPhotoDiv(i: number, image: any, insertType: string){
    let photo = document.createElement('img');
    photo.src = image.urls.regular;
    photo.classList.add('mw-100','mh-100','h-auto','w-auto','object-fit-contain','rounded-3');
    
    let photoDiv = document.createElement('div');
    photoDiv.classList.add('photo-container','p-2');
    photoDiv.style.position = 'absolute';
    photoDiv.style.width = 100 / this.photosPerRow + '%';

    this.setPhotoPosition(photoDiv,i,image,insertType);

    photoDiv.append(photo);

    return photoDiv;
  }

  translateImages(insertType: string){
    if(this.deletedBatches.length == 0) return;
    
    let remainingPhotos: any[] = Array.from(document.getElementsByClassName('photo-container'));
    
    let lastBatchDeleted = this.deletedBatches.slice(-1)[0] - 1;
    
    remainingPhotos.forEach((photo) => {
      var currentValue = parseFloat(photo.style.top);
      var imageColumn = Math.round(parseFloat(photo.style.left) * this.photosPerRow / this.innerWidth);
      var oldValue = this.batchesOffsetHeight[lastBatchDeleted][imageColumn];
      var newValue = insertType == 'append' ? currentValue - oldValue : currentValue + oldValue;
      
      photo.style.top = newValue + 'px';
    });
    
    for(let index = 0; index < this.photosPerRow; index++){
      if(insertType == 'append'){
        var deletedBatchHeight = this.batchesOffsetHeight[lastBatchDeleted][index % this.photosPerRow];
        this.totalOffsetHeight[index] -= deletedBatchHeight;
      }else{
        var lastBatchAdded = this.batchesOffsetHeight.length - 1;

        var addedBatchHeight = this.batchesOffsetHeight[lastBatchDeleted][index % this.photosPerRow];
        var deletedBatchHeight = this.batchesOffsetHeight[lastBatchAdded][index % this.photosPerRow];
        
        this.totalOffsetHeight[index] = this.totalOffsetHeight[index] + addedBatchHeight - deletedBatchHeight;
      }
    }

    if(insertType == 'prepend'){
      this.batchesOffsetHeight.pop();
      this.batchesImagesSizes.pop();
    } 
  }

  insertBatch(insertType: string){
    this.currentOffsetWidth = 0;
    this.currentOffsetHeight.fill(0);

    let batchSize = this.masonryGridService.getBatchSize();

    let container = document.getElementById('photosContainer')!;

    let batch;
    if(insertType == 'append')
      batch = this.currentBatch;
    else if(insertType == 'prepend')
      batch = this.previousBatch.reverse();

    if(insertType == 'prepend'){
      let lastBatchDeleted = this.deletedBatches.slice(-1)[0];

      this.currentOffsetWidth = this.batchesOffsetWidth[lastBatchDeleted - 1];
      this.currentOffsetHeight = [...this.batchesOffsetHeight[lastBatchDeleted - 1]];
      
      this.translateImages(insertType);
      
      this.deletedBatches.pop();
    }

    for(let i = 0; i < batchSize; i++){
      let photoDiv = this.createPhotoDiv(i,batch[i],insertType);

      if(insertType == 'append')
        container.appendChild(photoDiv);
      else if(insertType == 'prepend')
        container.prepend(photoDiv);
    }
    
    if(insertType == 'append'){
      this.saveImagesSizes(batch);

      this.batchesOffsetHeight.push([...this.currentOffsetHeight]);
      this.batchesOffsetWidth.push(this.currentOffsetWidth);
      
      this.translateImages(insertType);
    }    
  }

  deleteBatch(batchType: string){
    let batchSize = this.masonryGridService.getBatchSize();

    let container = document.getElementById('photosContainer')!;

    for(var i = 0; i < batchSize; i++){
      let child;

      if(batchType == 'first') child = container.firstChild!;
      else if(batchType == 'last') child = container.lastChild!;
      else return;
      
      container.removeChild(child);
    }
  }

  repositionImages(){
    let remainingPhotos: any[] = Array.from(document.getElementsByClassName('photo-container'));
    
    this.totalOffsetHeight = new Array(this.photosPerRow).fill(0);
    this.totalOffsetWidth = 0;

    this.currentOffsetHeight = new Array(this.photosPerRow).fill(0);
    this.currentOffsetWidth = 0;

    for(let i = 0; i < remainingPhotos.length; i++){
      var image = remainingPhotos[i];

      if(Math.round(this.totalOffsetWidth - this.innerWidth) == 0)
        this.totalOffsetWidth = 0;
      
      let currentColumn = Math.round(this.totalOffsetWidth * this.photosPerRow / this.innerWidth);

      image.style.width = 100 / this.photosPerRow + '%';
      image.style.left = this.totalOffsetWidth + 'px';
      image.style.top = this.totalOffsetHeight[currentColumn] + 'px';
      
      this.totalOffsetWidth += (Math.round((this.innerWidth / this.photosPerRow) * 100) / 100);
      this.totalOffsetHeight[currentColumn] += (this.innerWidth * image.offsetHeight) / (image.offsetWidth * this.photosPerRow);
    }
  }

  recalculateOffsets(){
    for(let i = 0; i < this.batchesImagesSizes.length; i++){
      var newOffsetHeight = new Array(this.photosPerRow).fill(0);
      var newOffsetWidth = 0;
      for(let j = 0; j < this.batchesImagesSizes[i].length; j++){
        if(Math.round(newOffsetWidth - this.innerWidth) == 0) newOffsetWidth = 0;
        
        var image = this.batchesImagesSizes[i][j];

        var currentColumn = Math.round(newOffsetWidth * this.photosPerRow / this.innerWidth);

        newOffsetWidth += (Math.round((this.innerWidth / this.photosPerRow) * 100) / 100);
        newOffsetHeight[currentColumn] += (this.innerWidth * image.height) / (image.width * this.photosPerRow);
      }
      this.batchesOffsetHeight[i] = [...newOffsetHeight];
      this.batchesOffsetWidth[i] = newOffsetWidth;
    }
  }

  saveImagesSizes(data : any){
    let batch = [];
    for(let i = 0; i < data.length; i++){
      batch.push({
        'width' : data[i].width,
        'height' : data[i].height
      });
    }
    this.batchesImagesSizes.push(batch);    
  }

 @HostListener('document:scroll', ['$event'])
  onScroll(){
    if(this.batchTimeout == true)
      return;
    
    let screenHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    let newScrollPosition = document.documentElement.scrollTop;
    let scrollPercentage = newScrollPosition / screenHeight;
    let scrollDirection = this.scrollPosition < newScrollPosition ? 'down' : 'up';

    this.scrollPosition = newScrollPosition;

    let loadOptions :string = '';
    
    let currentPage = this.masonryGridService.getCurrentPage();
    
    if(scrollPercentage > 0.75  && scrollDirection == 'down'){
      loadOptions = 'next';
      currentPage++;
    }
    else if(scrollPercentage < 0.25 && scrollDirection == 'up' && this.masonryGridService.getCurrentPage() >= 3){
      loadOptions = 'previous';
      currentPage -= 2;
    }
    else
      return;

    this.batchTimeout = true;

    this.masonryGridService.setCurrentPage(currentPage);
    
    this.masonryGridService.getPhotos().subscribe({
      next: (data: any) =>
      {
        if(loadOptions == 'next'){
          if(this.previousBatch.length != 0){
            this.deletedBatches.push(currentPage - 2);
            this.deleteBatch('first');
          }
          this.previousBatch = this.currentBatch;
          this.currentBatch = data;
          this.insertBatch('append');
        }
        else if(loadOptions == 'previous'){
          this.deleteBatch('last');
          this.currentBatch = this.previousBatch;
          this.previousBatch = data;
          this.insertBatch('prepend');

          this.masonryGridService.setCurrentPage(++currentPage);
        }        
      },
      error: (error: any) =>
      console.log(error)
    });
    
    loadOptions == 'next' ? 
      window.scrollTo(0,document.documentElement.scrollHeight * 0.3):
      window.scrollTo(0,document.documentElement.scrollHeight * 0.5);

    setTimeout(() => this.batchTimeout = false, 500);
  }

  @HostListener('window:resize', ['$event'])
  onResize($event: any) {
    this.innerWidth = $event.target.innerWidth;
    
    this.photosPerRow = this.calculatePPR();

    this.repositionImages();
    this.recalculateOffsets();
  }
}
