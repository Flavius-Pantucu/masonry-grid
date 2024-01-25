import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class MasonryGridService {
  curr_page :number = 1;
  per_page  :number = 20;

  access_key :string = environment.ACCESS_KEY;
  api_url    :string = environment.API_URL;

  constructor(private http: HttpClient) { }
  
  getPhotos(): Observable<Object> {
    return this.http.get(this.api_url, {
      params:{
        page: this.curr_page,
        per_page: this.per_page,
        client_id: this.access_key
      }
    });
  }

  getBatchSize(){
    return this.per_page;
  }

  setCurrentPage(page: number){
    this.curr_page = page;
  }

  getCurrentPage(){
    return this.curr_page;
  }
}
