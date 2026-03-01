import { Component, OnInit } from '@angular/core';
import { TaskService } from '@app/_services/task.service';
import { Task } from '@app/_models/task';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    tasks: Task[] = [];
    loading = false;
    showForm = false;
    newTask = { title: '', description: '', deadline: '' };
    taskToDelete: number | null = null;
    showDeleteModal = false;
    showFormError = false;
    showDuplicateError = false;
    showSuccess = false;

    // Edit
    showEditModal = false;
    editTask: Partial<Task> & { id?: number } = {};
    editError = '';

    // Deactivate
    taskToDeactivate: number | null = null;
    showDeactivateModal = false;

    constructor(private taskService: TaskService) {}

    ngOnInit() { this.loadTasks(); }

    loadTasks() {
        this.loading = true;
        this.taskService.getAll().subscribe(tasks => {
            this.tasks = tasks
                .filter(t => t.isActive !== false)
                .sort((a, b) => {
                    if (a.status === 'Completed' && b.status !== 'Completed') return 1;
                    if (a.status !== 'Completed' && b.status === 'Completed') return -1;
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });
            this.loading = false;
        });
    }

    get highTasks() { return this.tasks.filter(t => t.priority === 'High' && t.status !== 'Completed'); }
    get mediumTasks() { return this.tasks.filter(t => t.priority === 'Medium' && t.status !== 'Completed'); }
    get lowTasks() { return this.tasks.filter(t => t.priority === 'Low' && t.status !== 'Completed'); }
    get completedTasks() { return this.tasks.filter(t => t.status === 'Completed'); }

    safeDate(val: string): Date | null {
        if (!val) return null;
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
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
                this.loadTasks();
            },
            error: (err) => {
                if (err?.error?.message?.toLowerCase().includes('duplicate')) {
                    this.showDuplicateError = true;
                }
            }
        });
    }

    // Edit
    openEdit(task: Task) {
        this.editTask = { ...task };
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
            description: this.editTask.description
            // Note: user cannot set deadline — backend resets it
        }).subscribe(() => {
            this.showEditModal = false;
            this.loadTasks();
        });
    }

    // Deactivate
    promptDeactivate(id: number) {
        this.taskToDeactivate = id;
        this.showDeactivateModal = true;
    }

    confirmDeactivate() {
        if (!this.taskToDeactivate) return;
        this.taskService.deactivate(this.taskToDeactivate).subscribe(() => {
            this.taskToDeactivate = null;
            this.showDeactivateModal = false;
            this.loadTasks();
        });
    }

    // Delete
    deleteTask(id: number) {
        this.taskToDelete = id;
        this.showDeleteModal = true;
    }

    confirmDelete() {
        if (!this.taskToDelete) return;
        this.taskService.delete(this.taskToDelete).subscribe(() => {
            this.taskToDelete = null;
            this.showDeleteModal = false;
            this.loadTasks();
        });
    }

    get today(): string {
        return new Date().toISOString().split('T')[0];
    }
}