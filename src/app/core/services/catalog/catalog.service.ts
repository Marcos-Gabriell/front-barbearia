import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CatalogItem,
  ApiResponse,
  CreateCatalogRequest,
  UpdateCatalogRequest,
  ApiMessageResponse
} from '../../models/catalog.model';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly API_URL = 'http://localhost:8080/api/admin/services';

  constructor(private http: HttpClient) {}

  listAll(): Observable<ApiResponse<CatalogItem[]>> {
    return this.http.get<ApiResponse<CatalogItem[]>>(this.API_URL);
  }

  create(request: CreateCatalogRequest): Observable<ApiResponse<CatalogItem>> {
    return this.http.post<ApiResponse<CatalogItem>>(this.API_URL, request);
  }

  update(id: number, request: UpdateCatalogRequest): Observable<ApiResponse<CatalogItem>> {
    return this.http.put<ApiResponse<CatalogItem>>(`${this.API_URL}/${id}`, request);
  }

  toggleActive(id: number): Observable<ApiResponse<CatalogItem>> {
    return this.http.patch<ApiResponse<CatalogItem>>(`${this.API_URL}/${id}/toggle-active`, {});
  }

  delete(id: number): Observable<ApiMessageResponse> {
    return this.http.delete<ApiMessageResponse>(`${this.API_URL}/${id}`);
  }
}
