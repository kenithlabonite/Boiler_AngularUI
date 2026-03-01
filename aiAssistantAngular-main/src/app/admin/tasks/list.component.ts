import { Component, OnInit } from '@angular/core';
import { TaskService } from '@app/_services/task.service';
import { Task, AdminUser } from '@app/_models/task';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    // View states: 'users' | 'tasks'
    view: 'users' | 'tasks' = 'users';

    // Users list
    users: AdminUser[] = [];
    selectedUser: AdminUser | null = null;

    // Tasks for selected user
    tasks: Task[] = [];
    loading = false;

    // Create Task
    showForm = false;
    newTask = { title: '', description: '', deadline: '' };
    showFormError = false;
    showDuplicateError = false;
    showSuccess = false;

    // Edit
    showEditModal = false;
    editTask: Partial<Task> & { id?: number; deadlineInput?: string } = {};
    editError = '';

    // Deactivate
    taskToDeactivate: number | null = null;
    showDeactivateModal = false;

    // Delete
    taskToDelete: number | null = null;
    showDeleteModal = false;

    // Activity Log
    showLog = false;
    logs: { time: string; user: string; action: string; task: string }[] = [];

    constructor(private taskService: TaskService) {}

    ngOnInit() { this.loadUsers(); }

    loadUsers() {
        this.loading = true;
        this.taskService.getAdminUsers().subscribe(users => {
            this.users = users;
            this.loading = false;
        });
    }

    selectUser(user: AdminUser) {
        this.selectedUser = user;
        this.view = 'tasks';
        this.loadUserTasks();
    }

    goBack() {
        this.view = 'users';
        this.selectedUser = null;
        this.tasks = [];
        this.showForm = false;
        this.loadUsers();
    }

    loadUserTasks() {
        if (!this.selectedUser) return;
        this.loading = true;
        this.taskService.getAdminUserTasks(this.selectedUser.AccountId).subscribe(tasks => {
            this.tasks = tasks.sort((a, b) => {
                if (a.status === 'Completed' && b.status !== 'Completed') return 1;
                if (a.status !== 'Completed' && b.status === 'Completed') return -1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            this.loading = false;
            this.buildLogs();
        });
    }

    buildLogs() {
        this.logs = this.tasks.map(t => ({
            time: t.created_at,
            user: t.creator
                ? `${t.creator.firstName} ${t.creator.lastName}`
                : (this.selectedUser ? `${this.selectedUser.firstName} ${this.selectedUser.lastName}` : 'Unknown'),
            action: 'Created',
            task: t.title
        })).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    }

    get activeTasks() { return this.tasks.filter(t => t.isActive !== false); }
    get highTasks() { return this.activeTasks.filter(t => t.priority === 'High' && t.status !== 'Completed'); }
    get mediumTasks() { return this.activeTasks.filter(t => t.priority === 'Medium' && t.status !== 'Completed'); }
    get lowTasks() { return this.activeTasks.filter(t => t.priority === 'Low' && t.status !== 'Completed'); }
    get completedTasks() { return this.activeTasks.filter(t => t.status === 'Completed'); }

    safeDate(val: string): Date | null {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    }

    deadlineInputValue(task: Task): string {
        const d = this.safeDate(task.deadline);
        return d ? d.toISOString().split('T')[0] : '';
    }

    createTask() {
        this.showDuplicateError = false;
        if (!this.newTask.title || !this.newTask.description) {
            this.showFormError = true;
            return;
        }
        this.showFormError = false;
        this.taskService.create(this.newTask).subscribe({
            next: () => {
                this.newTask = { title: '', description: '', deadline: '' };
                this.showForm = false;
                this.showSuccess = true;
                setTimeout(() => this.showSuccess = false, 3000);
                this.loadUserTasks();
            },
            error: (err) => {
                if (err?.error?.message?.toLowerCase().includes('duplicate')) {
                    this.showDuplicateError = true;
                }
            }
        });
    }

    updateStatus(task: Task, status: string) {
        this.taskService.update(task.id, { status }).subscribe(() => this.loadUserTasks());
    }

    openEdit(task: Task) {
        this.editTask = { ...task, deadlineInput: this.deadlineInputValue(task) };
        this.editError = '';
        this.showEditModal = true;
    }

    submitEdit() {
        if (!this.editTask.title || !this.editTask.description) {
            this.editError = 'Title and description are required.';
            return;
        }
        this.taskService.edit(this.editTask.id!, {
            title: this.editTask.title,
            description: this.editTask.description,
            deadline: this.editTask.deadlineInput || undefined,
            priority: this.editTask.priority
        }).subscribe(() => {
            this.showEditModal = false;
            this.loadUserTasks();
        });
    }

    promptDeactivate(id: number) {
        this.taskToDeactivate = id;
        this.showDeactivateModal = true;
    }

    confirmDeactivate() {
        if (!this.taskToDeactivate) return;
        this.taskService.deactivate(this.taskToDeactivate).subscribe(() => {
            this.taskToDeactivate = null;
            this.showDeactivateModal = false;
            this.loadUserTasks();
        });
    }

    deleteTask(id: number) {
        this.taskToDelete = id;
        this.showDeleteModal = true;
    }

    confirmDelete() {
        if (!this.taskToDelete) return;
        this.taskService.delete(this.taskToDelete).subscribe(() => {
            this.taskToDelete = null;
            this.showDeleteModal = false;
            this.loadUserTasks();
        });
    }

    get today(): string {
        return new Date().toISOString().split('T')[0];
    }
}