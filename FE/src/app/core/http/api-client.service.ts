import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn:'root'
})
export class ApiClientService {
  private http = inject(HttpClient);
  get<T>(url: string) {
    return this.http.get<T>(url);
  }

  post<T>(url:string,body:unknown) {
    return this.http.post<T>(url,body);
  }

  put<T>(url: string, body: unknown) {
    return this.http.put<T>(url, body);
  }

  delete<T>(url: string) {
    return this.http.delete<T>(url);
  }
}
