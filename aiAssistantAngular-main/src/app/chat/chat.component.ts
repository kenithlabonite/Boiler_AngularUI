import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatService } from '../_services/chat.service';

@Component({ 
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.less']
})
export class ChatComponent implements OnInit, AfterViewChecked {
    @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

    chatHistory: any[] = [];
    userInput: string = '';
    isLoading: boolean = false;
    errorMessage: string = '';

    constructor(private chatService: ChatService) {}

    ngOnInit(): void {
        // Don't add an initial model message
        // Let user start the conversation
    }

    ngAfterViewChecked() {        
        this.scrollToBottom();        
    }

    scrollToBottom(): void {
        try {
            this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        } catch(err) { }                 
    }

    send() {
        if (this.isLoading || !this.userInput.trim()) return;

        const userMessage = this.userInput.trim();

        // Add user message to chat history
        this.chatHistory.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        this.userInput = '';
        this.isLoading = true;
        this.errorMessage = '';

        // Send ONLY the message string, not the entire history
        this.chatService.sendMessage(userMessage).subscribe({
            next: (response) => {
                this.isLoading = false;

                if (response.success && response.response) {
                    // Add AI response to chat history
                    this.chatHistory.push({
                        role: 'model',
                        parts: [{ text: response.response }]
                    });

                    // Update service history
                    this.chatService.addAssistantMessage(response.response);
                } else {
                    // Handle error response
                    this.errorMessage = response.error || 'Failed to get response';
                    console.error('Chat error:', response);
                }
            },
            error: (error) => {
                this.isLoading = false;
                console.error('Chat error:', error);

                // Display user-friendly error message
                if (error.error?.error) {
                    this.errorMessage = error.error.error;
                } else if (error.message) {
                    this.errorMessage = error.message;
                } else {
                    this.errorMessage = 'Failed to send message. Please try again.';
                }

                // Show error in chat
                this.chatHistory.push({
                    role: 'model',
                    parts: [{ text: `⚠️ ${this.errorMessage}` }]
                });
            }
        });
    }

    clearChat(): void {
        // Clear all messages
        this.chatHistory = [];
        this.chatService.clearHistory();
        this.errorMessage = '';
    }
}