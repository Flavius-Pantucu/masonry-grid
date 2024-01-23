import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class MasonryGridService {
  curr_page :number = 1;
  per_page :number = 20;

  api_url :string = environment.API_URL;
  access_key :string = environment.ACCESS_KEY;

  photos :any = [];

  constructor(private http: HttpClient) { }
  
  getInitialPhotos(): Observable<Object> {
    return this.http.get(this.api_url, {
      params:{
        page: this.curr_page,
        per_page: this.per_page,
        client_id: this.access_key
      }
    });
  }

  getNextBatch(): Observable<Object> {
    return this.http.get(this.api_url, {
      params:{
        page: ++this.curr_page,
        per_page: this.per_page,
        client_id: this.access_key
      }
    });
  }
}
