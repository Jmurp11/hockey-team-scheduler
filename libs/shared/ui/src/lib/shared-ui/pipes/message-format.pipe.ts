import { Pipe, PipeTransform } from '@angular/core';

/**
 * Transforms message content with basic markdown-like styling to HTML.
 * Supports:
 * - Bold text: **text** → <strong>text</strong>
 * - Line breaks: \n → <br>
 * - Lists: - item → <li>item</li> wrapped in <ul>
 */
@Pipe({
  name: 'messageFormat',
  standalone: true,
})
export class MessageFormatPipe implements PipeTransform {
  transform(content: string | null | undefined): string {
    if (!content) return '';

    let formatted = content;

    // Convert markdown-style bold to HTML
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert markdown-style line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    // Convert markdown-style lists
    formatted = formatted.replace(/^- (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    return formatted;
  }
}
