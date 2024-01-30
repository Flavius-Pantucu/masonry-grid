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
  photosPerColumn: number = 0;

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
    
    this.photosPerColumn = this.calculatePPR();

    this.currentOffsetHeight = new Array(this.photosPerColumn).fill(0);
    this.totalOffsetHeight = new Array(this.photosPerColumn).fill(0);

    this.masonryGridService.getPhotos().subscribe({
      next: (data: any) =>
      {
        data = this.sortImages(data);
        
        this.currentBatch = data;
        this.insertBatch('append');
      },
      error: (error: any) => console.log(error)
    });
  }

  calculatePPR(){
    if(this.innerWidth < 768) return 1;
    else if(this.innerWidth < 992) return 2;
    else if(this.innerWidth < 1400) return 4;
    else return 5;
  }

  setPhotoPosition(photoDiv: HTMLDivElement, i: number,  image:any, insertType: string){
    if(insertType == 'append'){
      if(Math.round(this.totalOffsetWidth - this.innerWidth) == 0){
        this.totalOffsetWidth = 0;
        this.currentOffsetWidth = 0;
      } 
      let currentColumn = Math.round(this.totalOffsetWidth * this.photosPerColumn / this.innerWidth);
      
      photoDiv.style.left = this.totalOffsetWidth + 'px';
      photoDiv.style.top = this.totalOffsetHeight[currentColumn] + 'px';
      
      this.currentOffsetWidth += (Math.round((this.innerWidth / this.photosPerColumn) * 100) / 100);
      this.currentOffsetHeight[currentColumn] += (this.innerWidth * image.height) / (image.width * this.photosPerColumn);

      this.totalOffsetWidth += (Math.round((this.innerWidth / this.photosPerColumn) * 100) / 100);
      this.totalOffsetHeight[currentColumn] += (this.innerWidth * image.height) / (image.width * this.photosPerColumn);
    }else if(insertType == 'prepend'){
      if(Math.round(this.currentOffsetWidth) == 0)
        this.currentOffsetWidth = this.innerWidth;

      let currentColumn = Math.round(this.currentOffsetWidth * this.photosPerColumn / this.innerWidth) - 1;
      
      photoDiv.style.left = (this.currentOffsetWidth - this.innerWidth / this.photosPerColumn) + 'px';
      photoDiv.style.top = this.currentOffsetHeight[currentColumn] - (this.innerWidth * image.height) / (image.width * this.photosPerColumn) + 'px';
    
      this.currentOffsetWidth -= (Math.round((this.innerWidth / this.photosPerColumn) * 100) / 100);
      this.currentOffsetHeight[currentColumn] -= (this.innerWidth * image.height) / (image.width * this.photosPerColumn); 
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
    photoDiv.style.width = 100 / this.photosPerColumn + '%';

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
      var imageColumn = Math.round(parseFloat(photo.style.left) * this.photosPerColumn / this.innerWidth);
      var oldValue = this.batchesOffsetHeight[lastBatchDeleted][imageColumn];
      var newValue = insertType == 'append' ? currentValue - oldValue : currentValue + oldValue;
      
      photo.style.top = newValue + 'px';
    });
    
    for(let index = 0; index < this.photosPerColumn; index++){
      if(insertType == 'append'){
        var deletedBatchHeight = this.batchesOffsetHeight[lastBatchDeleted][index % this.photosPerColumn];
        this.totalOffsetHeight[index] -= deletedBatchHeight;
      }else{
        var lastBatchAdded = this.batchesOffsetHeight.length - 1;

        var addedBatchHeight = this.batchesOffsetHeight[lastBatchDeleted][index % this.photosPerColumn];
        var deletedBatchHeight = this.batchesOffsetHeight[lastBatchAdded][index % this.photosPerColumn];
        
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
    
    this.totalOffsetHeight = new Array(this.photosPerColumn).fill(0);
    this.totalOffsetWidth = 0;

    this.currentOffsetHeight = new Array(this.photosPerColumn).fill(0);
    this.currentOffsetWidth = 0;

    for(let i = 0; i < remainingPhotos.length; i++){
      var image = remainingPhotos[i];

      if(Math.round(this.totalOffsetWidth - this.innerWidth) == 0)
        this.totalOffsetWidth = 0;
      
      let currentColumn = Math.round(this.totalOffsetWidth * this.photosPerColumn / this.innerWidth);

      image.style.width = 100 / this.photosPerColumn + '%';
      image.style.left = this.totalOffsetWidth + 'px';
      image.style.top = this.totalOffsetHeight[currentColumn] + 'px';
      
      this.totalOffsetWidth += (Math.round((this.innerWidth / this.photosPerColumn) * 100) / 100);
      this.totalOffsetHeight[currentColumn] += (this.innerWidth * image.offsetHeight) / (image.offsetWidth * this.photosPerColumn);
    }
  }

  recalculateOffsets(){
    for(let i = 0; i < this.batchesImagesSizes.length; i++){
      var newOffsetHeight = new Array(this.photosPerColumn).fill(0);
      var newOffsetWidth = 0;
      for(let j = 0; j < this.batchesImagesSizes[i].length; j++){
        if(Math.round(newOffsetWidth - this.innerWidth) == 0) newOffsetWidth = 0;
        
        var image = this.batchesImagesSizes[i][j];

        var currentColumn = Math.round(newOffsetWidth * this.photosPerColumn / this.innerWidth);

        newOffsetWidth += (Math.round((this.innerWidth / this.photosPerColumn) * 100) / 100);
        newOffsetHeight[currentColumn] += (this.innerWidth * image.height) / (image.width * this.photosPerColumn);
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

  sortImages(data : any){
    data = data.sort((a: any, b: any) => (a.height * 1920) / a.width - (b.height * 1920) / b.width);

    let newArray = [];
    
    let rows = data.length / this.photosPerColumn;

    for(let i = 0; i < rows; i++){
      let array = data.slice(this.photosPerColumn * i, this.photosPerColumn * (i + 1));
      i % 2 == 1 ? newArray.push(array.reverse()) : newArray.push(array);
    }

    //shuffle rows
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    
    newArray = newArray.flat();

    //shuffle columns items
    let randomShuffles = Math.floor(Math.random() * 4) + 2;
    for(let i = 0; i < randomShuffles; i++) {
      for(let j = 0; j < this.photosPerColumn; j++) {
        let a = Math.floor(Math.random() * rows);
        let b = Math.floor(Math.random() * rows);
        [newArray[a * this.photosPerColumn + j], newArray[b * this.photosPerColumn + j]] =
          [newArray[b * this.photosPerColumn + j], newArray[a * this.photosPerColumn + j]];
      }
    }

    return newArray;
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
    
    if(scrollPercentage > 0.90 && scrollDirection == 'down'){
      loadOptions = 'next';
      currentPage++;
    }
    else if(scrollPercentage < 0.10 && scrollDirection == 'up' && this.masonryGridService.getCurrentPage() >= 3){
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
        data = this.sortImages(data);

        if(loadOptions == 'next'){
          if(this.previousBatch.length != 0){
            this.deletedBatches.push(currentPage - 2);
            this.deleteBatch('first');
          }
          this.previousBatch = this.currentBatch;
          this.currentBatch = data;
          this.insertBatch('append');

          if(this.deletedBatches.length > 0){
            let batchIndex = this.deletedBatches.slice(-1)[0] - 1;
            let batch = this.batchesOffsetHeight[batchIndex];
            let offsetScroll = batch.reduce( ( p, c ) => p + c, 0 ) / batch.length;
            
            this.scrollPosition = newScrollPosition - offsetScroll;
            window.scrollTo({top : newScrollPosition - offsetScroll, behavior: 'smooth'})
          }
        }
        else if(loadOptions == 'previous'){
          let lastBatchDeleted = this.deletedBatches.slice(-1)[0];

          this.currentOffsetWidth = this.batchesOffsetWidth[lastBatchDeleted - 1];
          this.currentOffsetHeight = [...this.batchesOffsetHeight[lastBatchDeleted - 1]];

          let offsetScroll = this.currentOffsetHeight.reduce( ( p, c ) => p + c, 0 ) / this.currentOffsetHeight.length;

          this.deleteBatch('last');
          this.currentBatch = this.previousBatch;
          this.previousBatch = data;
          this.insertBatch('prepend');

          this.masonryGridService.setCurrentPage(++currentPage);

          this.scrollPosition = newScrollPosition + offsetScroll;
          window.scrollTo({top : newScrollPosition + offsetScroll, behavior: 'smooth'})
        }      
        setTimeout(() => this.batchTimeout = false, 500);
      },
      error: (error: any) =>
      console.log(error)
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize($event: any) {
    this.innerWidth = $event.target.innerWidth;
    
    this.photosPerColumn = this.calculatePPR();

    this.repositionImages();
    this.recalculateOffsets();
  }
}
