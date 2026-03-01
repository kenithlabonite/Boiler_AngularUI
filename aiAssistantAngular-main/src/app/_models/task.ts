export class Task {
    id!: number;
    userId!: number;
    title!: string;
    description!: string;
    priority!: 'Low' | 'Medium' | 'High';
    deadline!: string;
    status!: string;
    isActive!: boolean;
    created_at!: string;
    // Populated for Admin views
    creator?: {
        AccountId: number;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export interface AdminUser {
    AccountId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
}