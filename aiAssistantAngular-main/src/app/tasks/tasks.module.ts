import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TasksRoutingModule } from './tasks-routing.module';
import { ListComponent } from './list.component';

@NgModule({
    declarations: [ListComponent],
    imports: [CommonModule, FormsModule, TasksRoutingModule]
})
export class TasksModule {}