import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface ChatResponse {
  success: boolean;
  response: string;
  error?: string;
  timestamp?: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  // Now points to YOUR backend, not directly to Google
  private apiUrl = `${environment.apiUrl}/chatbot/message`;

  private conversationHistory: any[] = [];

  constructor(private http: HttpClient) {}

  sendMessage(userMessage: string): Observable<ChatResponse> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      message: userMessage,
      conversationHistory: this.conversationHistory.slice(-10) // Last 10 messages
    };

    return this.http.post<ChatResponse>(this.apiUrl, body, { headers });
  }

  addAssistantMessage(message: string): void {
    this.conversationHistory.push({
      role: 'model',
      parts: [{ text: message }]
    });
  }

  getHistory(): any[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}