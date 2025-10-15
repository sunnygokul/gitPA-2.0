interface FileContent {
  content: string;
  path: string;
}

// Maximum file size in characters (approximately 50KB)
const MAX_FILE_SIZE = 50000;
// Maximum number of files to include in context
const MAX_FILES_IN_CONTEXT = 3;
// Maximum total context size in characters (approximately 30KB)
const MAX_TOTAL_CONTEXT_SIZE = 30000;

class FileStore {
  private store: Map<string, FileContent>;
  private static instance: FileStore;

  private constructor() {
    this.store = new Map();
  }

  public static getInstance(): FileStore {
    if (!FileStore.instance) {
      FileStore.instance = new FileStore();
    }
    return FileStore.instance;
  }

  public setFile(path: string, content: string): void {
    // Truncate content if it's too large
    const truncatedContent = content.length > MAX_FILE_SIZE 
      ? content.substring(0, MAX_FILE_SIZE) + '\n... (content truncated due to size limits)'
      : content;
    
    this.store.set(path, { content: truncatedContent, path });
  }

  public getFile(path: string): FileContent | undefined {
    return this.store.get(path);
  }

  public getAllFiles(): FileContent[] {
    return Array.from(this.store.values());
  }

  public clear(): void {
    this.store.clear();
  }

  public getRelevantFiles(query: string): FileContent[] {
    // Get all files
    const allFiles = this.getAllFiles();
    
    // If there are too many files, prioritize based on query
    if (allFiles.length > MAX_FILES_IN_CONTEXT) {
      // Simple prioritization: files that contain query terms
      const queryTerms = query.toLowerCase().split(/\s+/);
      const prioritizedFiles = allFiles
        .sort((a, b) => {
          const aContent = typeof a.content === 'string' ? a.content.toLowerCase() : '';
          const bContent = typeof b.content === 'string' ? b.content.toLowerCase() : '';
          
          const aScore = queryTerms.filter(term => 
            a.path.toLowerCase().includes(term) || 
            aContent.includes(term)
          ).length;
          
          const bScore = queryTerms.filter(term => 
            b.path.toLowerCase().includes(term) || 
            bContent.includes(term)
          ).length;
          
          return bScore - aScore;
        })
        .slice(0, MAX_FILES_IN_CONTEXT);

      // Further truncate content if total size is too large
      let totalSize = 0;
      return prioritizedFiles.map(file => {
        if (totalSize >= MAX_TOTAL_CONTEXT_SIZE) {
          return { ...file, content: '(content omitted due to size limits)' };
        }
        
        const content = typeof file.content === 'string' ? file.content : '';
        if (totalSize + content.length > MAX_TOTAL_CONTEXT_SIZE) {
          const remainingSize = MAX_TOTAL_CONTEXT_SIZE - totalSize;
          totalSize = MAX_TOTAL_CONTEXT_SIZE;
          return {
            ...file,
            content: content.substring(0, remainingSize) + '\n... (content truncated due to size limits)'
          };
        }
        
        totalSize += content.length;
        return file;
      });
    }
    
    return allFiles;
  }
}

export const fileStore = FileStore.getInstance(); 