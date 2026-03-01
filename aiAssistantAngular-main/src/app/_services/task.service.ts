import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { Task, AdminUser } from '@app/_models/task';

const baseUrl = `${environment.apiUrl}/tasks`;

@Injectable({ providedIn: 'root' })
export class TaskService {
    constructor(private http: HttpClient) {}

    getAll() {
        return this.http.get<Task[]>(baseUrl);
    }

    getAdminUsers() {
        return this.http.get<AdminUser[]>(`${baseUrl}/admin/users`);
    }

    getAdminUserTasks(userId: number) {
        return this.http.get<Task[]>(`${baseUrl}/admin/users/${userId}/tasks`);
    }

    create(params: any) {
        return this.http.post<Task>(baseUrl, params);
    }

    update(id: number, params: any) {
        return this.http.put<Task>(`${baseUrl}/${id}`, params);
    }

    edit(id: number, params: any) {
        return this.http.put<Task>(`${baseUrl}/${id}/edit`, params);
    }

    deactivate(id: number) {
        return this.http.put<Task>(`${baseUrl}/${id}/deactivate`, {});
    }

    delete(id: number) {
        return this.http.delete(`${baseUrl}/${id}`);
    }
}