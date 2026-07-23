import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Comment } from '../../../core/models/models';

@Component({
  selector: 'app-comment-thread',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './comment-thread.component.html'
})
export class CommentThreadComponent {
  @Input() comments: Comment[] = [];
  @Input() posting = false;
  @Output() addComment = new EventEmitter<string>();

  draft = '';

  submit(): void {
    const text = this.draft.trim();
    if (!text) return;
    this.addComment.emit(text);
    this.draft = '';
  }
}
