/**
 * Clipboard utility functions
 * Handles copying text to clipboard with fallback support
 */

export interface ClipboardResult {
  success: boolean;
  error?: string;
}

/**
 * Copy text to clipboard using modern Clipboard API with fallback
 */
export async function copyToClipboard(text: string): Promise<ClipboardResult> {
  try {
    // Modern Clipboard API (preferred)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return { success: true };
    }
    
    // Fallback for older browsers or non-secure contexts
    return fallbackCopyToClipboard(text);
  } catch (error) {
    console.error('Clipboard copy failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Fallback clipboard copy method for older browsers
 */
function fallbackCopyToClipboard(text: string): ClipboardResult {
  try {
    // Create temporary textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    
    // Select and copy the text
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textArea);
    
    return { success: successful };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Fallback copy failed' 
    };
  }
}

/**
 * Check if clipboard functionality is available
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard || document.execCommand);
}

/**
 * Export content to various formats
 */
export interface ExportOptions {
  format: 'txt' | 'json' | 'md';
  filename?: string;
}

export function exportContent(content: string, options: ExportOptions): void {
  const { format, filename = 'linkedin-post' } = options;
  
  let fileContent: string;
  let mimeType: string;
  let fileExtension: string;
  
  switch (format) {
    case 'txt':
      fileContent = content;
      mimeType = 'text/plain';
      fileExtension = 'txt';
      break;
    case 'json':
      fileContent = JSON.stringify({ content, exportedAt: new Date().toISOString() }, null, 2);
      mimeType = 'application/json';
      fileExtension = 'json';
      break;
    case 'md':
      fileContent = `# LinkedIn Post\n\n${content}\n\n---\n*Generated with StoryScale*`;
      mimeType = 'text/markdown';
      fileExtension = 'md';
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  // Create and download file
  const blob = new Blob([fileContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = `${filename}.${fileExtension}`;
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}