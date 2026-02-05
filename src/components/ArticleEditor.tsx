import { useState, useCallback, useMemo, useRef } from "react";
import {
  EditorRoot,
  EditorContent,
  EditorCommand,
  EditorCommandItem,
  EditorCommandList,
  EditorCommandEmpty,
  EditorBubble,
  EditorBubbleItem,
  useEditor,
  type JSONContent,
  StarterKit,
  TiptapLink,
  TiptapUnderline,
  TaskList,
  TaskItem,
  TiptapImage,
  CodeBlockLowlight,
  TextStyle,
  Color,
} from "novel";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  CheckSquare,
  Code2,
  Save,
  Undo,
  Redo,
  Loader2,
  Text,
  Unlink,
  Sparkles,
  Wand2,
  SpellCheck,
  Minimize2,
  Maximize2,
  FileText,
  Briefcase,
  MessageCircle,
  Languages,
  ListChecks,
  HelpCircle,
  ChevronRight,
  Send,
  Table2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { common, createLowlight } from "lowlight";
import { api } from "@/lib/api";
import { FlagIcon } from "@/components/ui/flag-icon";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

// Create lowlight instance for code highlighting
const lowlight = createLowlight(common);

// Slash command suggestions
const suggestionItems = [
  {
    title: "Text",
    description: "Plain paragraph text",
    icon: Text,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleNode("paragraph", "paragraph").run();
    },
  },
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bullet list",
    icon: List,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    icon: ListOrdered,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Task List",
    description: "Create a checklist",
    icon: CheckSquare,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Quote",
    description: "Add a blockquote",
    icon: Quote,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Code Block",
    description: "Add a code snippet (auto-detect)",
    icon: Code2,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "JavaScript",
    description: "JavaScript/TypeScript code",
    icon: Code2,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setCodeBlock({ language: 'javascript' }).run();
    },
  },
  {
    title: "Python",
    description: "Python code",
    icon: Code2,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setCodeBlock({ language: 'python' }).run();
    },
  },
  {
    title: "Bash",
    description: "Shell/Bash commands",
    icon: Code2,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setCodeBlock({ language: 'bash' }).run();
    },
  },
  {
    title: "SQL",
    description: "SQL queries",
    icon: Code2,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setCodeBlock({ language: 'sql' }).run();
    },
  },
  {
    title: "YAML",
    description: "YAML/Docker config",
    icon: Code2,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setCodeBlock({ language: 'yaml' }).run();
    },
  },
  {
    title: "JSON",
    description: "JSON data",
    icon: Code2,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setCodeBlock({ language: 'json' }).run();
    },
  },
  {
    title: "Table",
    description: "Insert a data table",
    icon: Table2,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
  {
    title: "Divider",
    description: "Add a horizontal divider",
    icon: Minus,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

interface ArticleEditorProps {
  initialContent: string;
  onSave: (content: string, html: string) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

// Convert markdown table to HTML table
function markdownTableToHTML(tableContent: string): string {
  const lines = tableContent.trim().split('\n').filter(line => line.trim());
  if (lines.length < 2) return tableContent;

  // Check if this looks like a table (has pipes)
  if (!lines[0].includes('|')) return tableContent;

  const parseRow = (row: string): string[] => {
    return row
      .split('|')
      .map(cell => cell.trim())
      .filter((cell, idx, arr) => idx > 0 && idx < arr.length); // Remove empty first/last from | split
  };

  const headerCells = parseRow(lines[0]);
  if (headerCells.length === 0) return tableContent;

  // Skip separator row (the --- row)
  const separatorIdx = lines.findIndex(line => /^\|?\s*[-:]+\s*\|/.test(line));
  const dataStartIdx = separatorIdx >= 0 ? separatorIdx + 1 : 1;

  let html = '<table><thead><tr>';
  headerCells.forEach(cell => {
    // Convert markdown links in cells
    const cellContent = cell
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    html += `<th>${cellContent}</th>`;
  });
  html += '</tr></thead><tbody>';

  for (let i = dataStartIdx; i < lines.length; i++) {
    const cells = parseRow(lines[i]);
    if (cells.length > 0) {
      html += '<tr>';
      cells.forEach(cell => {
        // Convert markdown links in cells
        const cellContent = cell
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`([^`]+)`/g, '<code>$1</code>');
        html += `<td>${cellContent}</td>`;
      });
      html += '</tr>';
    }
  }

  html += '</tbody></table>';
  return html;
}

// Convert plain text or markdown to HTML
function contentToHTML(content: string): string {
  if (!content) return "<p></p>";

  // If content already has HTML tags, return as-is
  if (content.includes("<p>") || content.includes("<h1>") || content.includes("<div>") || content.includes("<table>")) {
    return content;
  }

  // First, extract and convert markdown tables
  // Tables are blocks of lines starting with |
  const tableRegex = /(?:^|\n)((?:\|[^\n]+\|\n?)+)/g;
  let html = content.replace(tableRegex, (match, tableContent) => {
    // Check if it's actually a table (has header separator row)
    if (/\|[\s-:]+\|/.test(tableContent)) {
      return '\n' + markdownTableToHTML(tableContent) + '\n';
    }
    return match;
  });

  // Simple markdown to HTML conversion
  html = html
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  // Split into paragraphs
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map(p => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<table')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    })
    .filter(p => p)
    .join('\n');

  return html || "<p></p>";
}

// Toolbar button component
function ToolbarButton({
  onClick,
  isActive,
  icon: Icon,
  tooltip,
  shortcut,
  disabled,
}: {
  onClick: () => void;
  isActive?: boolean;
  icon: any;
  tooltip: string;
  shortcut?: string;
  disabled?: boolean;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "h-8 w-8 p-0",
              isActive && "bg-muted text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-2">
          <span>{tooltip}</span>
          {shortcut && (
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// AI Actions configuration
const aiActions = [
  { id: 'improve', label: 'Improve writing', icon: Wand2, description: 'Make text clearer and more engaging' },
  { id: 'fix-grammar', label: 'Fix grammar & spelling', icon: SpellCheck, description: 'Correct errors' },
  { id: 'make-shorter', label: 'Make shorter', icon: Minimize2, description: 'Condense the text' },
  { id: 'make-longer', label: 'Make longer', icon: Maximize2, description: 'Expand with more details' },
  { id: 'simplify', label: 'Simplify language', icon: FileText, description: 'Use simpler words' },
  { id: 'professional', label: 'Professional tone', icon: Briefcase, description: 'Formal business style' },
  { id: 'casual', label: 'Casual tone', icon: MessageCircle, description: 'Friendly and relaxed' },
  { id: 'summarize', label: 'Summarize', icon: ListChecks, description: 'Key points summary' },
  { id: 'bullet-points', label: 'Convert to bullets', icon: List, description: 'Turn into bullet points' },
  { id: 'explain', label: 'Explain this', icon: HelpCircle, description: 'Explain in simple terms' },
  { id: 'to-code', label: 'Format as code', icon: Code2, description: 'Convert to code snippet' },
];

const translateActions = [
  { id: 'translate-en', label: 'English', code: 'en' },
  { id: 'translate-fr', label: 'Francais', code: 'fr' },
  { id: 'translate-es', label: 'Espanol', code: 'es' },
  { id: 'translate-de', label: 'Deutsch', code: 'de' },
];

// AI Menu Component for bubble selection
function AIMenu({
  onAction,
  isLoading
}: {
  onAction: (action: string, customPrompt?: string) => Promise<void>;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAction = async (actionId: string) => {
    setIsOpen(false);
    setShowTranslate(false);
    setShowCustom(false);
    await onAction(actionId);
  };

  const handleCustomSubmit = async () => {
    if (!customPrompt.trim()) return;
    setIsOpen(false);
    setShowCustom(false);
    await onAction('custom', customPrompt);
    setCustomPrompt("");
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "h-8 gap-1.5 px-2 rounded-none text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950",
            isLoading && "opacity-50"
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span className="text-xs font-medium">AI</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        side="top"
        align="start"
        onOpenAutoFocus={(e) => {
          if (showCustom && inputRef.current) {
            e.preventDefault();
            inputRef.current.focus();
          }
        }}
      >
        {showCustom ? (
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowCustom(false)}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
              <span className="text-sm font-medium">Custom prompt</span>
            </div>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="What should AI do?"
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomSubmit();
                  }
                }}
              />
              <Button
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
                onClick={handleCustomSubmit}
                disabled={!customPrompt.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Describe how to transform the selected text
            </p>
          </div>
        ) : showTranslate ? (
          <div className="py-1">
            <div className="flex items-center gap-2 px-2 py-1 border-b mb-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowTranslate(false)}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
              <span className="text-sm font-medium">Translate to</span>
            </div>
            {translateActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left"
              >
                <FlagIcon code={action.code} size="sm" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-1">
            <div className="px-3 py-2 border-b">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Actions</span>
            </div>
            {aiActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left group"
              >
                <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{action.description}</div>
                </div>
              </button>
            ))}
            <div className="border-t mt-1 pt-1">
              <button
                onClick={() => setShowTranslate(true)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left group"
              >
                <Languages className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                <div className="flex-1">
                  <div className="font-medium">Translate</div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => setShowCustom(true)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent text-left group"
              >
                <Sparkles className="h-4 w-4 text-violet-500" />
                <div className="flex-1">
                  <div className="font-medium text-violet-600 dark:text-violet-400">Custom prompt...</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Main editor toolbar
function EditorToolbar({
  onSave,
  isSaving,
  hasChanges,
}: {
  onSave: () => void;
  isSaving: boolean;
  hasChanges: boolean;
}) {
  const { editor } = useEditor();

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/30 sticky top-0 z-10 flex-wrap">
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        icon={Undo}
        tooltip="Undo"
        shortcut="⌘Z"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        icon={Redo}
        tooltip="Redo"
        shortcut="⌘⇧Z"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        icon={Bold}
        tooltip="Bold"
        shortcut="⌘B"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        icon={Italic}
        tooltip="Italic"
        shortcut="⌘I"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        icon={Underline}
        tooltip="Underline"
        shortcut="⌘U"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        icon={Strikethrough}
        tooltip="Strikethrough"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        icon={Code}
        tooltip="Inline Code"
        shortcut="⌘E"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        icon={Heading1}
        tooltip="Heading 1"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        icon={Heading2}
        tooltip="Heading 2"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        icon={Heading3}
        tooltip="Heading 3"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        icon={List}
        tooltip="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        icon={ListOrdered}
        tooltip="Numbered List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive("taskList")}
        icon={CheckSquare}
        tooltip="Task List"
      />

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Quote & Code */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        icon={Quote}
        tooltip="Quote"
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-2 gap-1",
              editor.isActive("codeBlock") && "bg-muted text-foreground"
            )}
          >
            <Code2 className="h-4 w-4" />
            <span className="text-xs">Code</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1" side="bottom" align="start">
          <div className="text-xs font-medium text-muted-foreground px-2 py-1">Insert Code Block</div>
          {[
            { lang: '', label: 'Auto-detect' },
            { lang: 'javascript', label: 'JavaScript' },
            { lang: 'typescript', label: 'TypeScript' },
            { lang: 'python', label: 'Python' },
            { lang: 'bash', label: 'Bash/Shell' },
            { lang: 'sql', label: 'SQL' },
            { lang: 'yaml', label: 'YAML' },
            { lang: 'json', label: 'JSON' },
            { lang: 'html', label: 'HTML' },
            { lang: 'css', label: 'CSS' },
            { lang: 'php', label: 'PHP' },
            { lang: 'go', label: 'Go' },
            { lang: 'rust', label: 'Rust' },
          ].map(({ lang, label }) => (
            <button
              key={lang || 'auto'}
              onClick={() => {
                if (lang) {
                  editor.chain().focus().setCodeBlock({ language: lang }).run();
                } else {
                  editor.chain().focus().toggleCodeBlock().run();
                }
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded text-left"
            >
              <Code2 className="h-3 w-3 text-muted-foreground" />
              {label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {/* Link */}
      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive("link")}
        icon={Link2}
        tooltip="Add Link"
        shortcut="⌘K"
      />
      {editor.isActive("link") && (
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          icon={Unlink}
          tooltip="Remove Link"
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status indicator */}
      {hasChanges && (
        <Badge variant="secondary" className="mr-2 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          Unsaved changes
        </Badge>
      )}

      {/* Save button */}
      <Button
        size="sm"
        onClick={onSave}
        disabled={isSaving || !hasChanges}
        className="gap-2"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Save
      </Button>
    </div>
  );
}

// Bubble menu for selection formatting with AI
function SelectionBubbleMenu() {
  const { editor } = useEditor();
  const [isAILoading, setIsAILoading] = useState(false);

  const handleAIAction = useCallback(async (action: string, customPrompt?: string) => {
    if (!editor) return;

    // Get selected text
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    if (!selectedText.trim()) {
      toast.error("Please select some text first");
      return;
    }

    // Get some context around the selection
    const docText = editor.state.doc.textContent;
    const contextStart = Math.max(0, from - 200);
    const contextEnd = Math.min(docText.length, to + 200);
    const context = docText.slice(contextStart, contextEnd);

    setIsAILoading(true);
    try {
      const response = await api.transformText({
        text: selectedText,
        action: customPrompt ? undefined : action,
        customPrompt: customPrompt,
        context: context !== selectedText ? context : undefined,
      });

      if (response.success && response.result) {
        // Replace the selected text with the AI result
        editor
          .chain()
          .focus()
          .deleteRange({ from, to })
          .insertContent(response.result)
          .run();

        toast.success(`Text ${action === 'custom' ? 'transformed' : action.replace(/-/g, ' ')} successfully`);
      } else {
        throw new Error('No result from AI');
      }
    } catch (error) {
      console.error('AI transform error:', error);
      toast.error("AI transformation failed. Please try again.");
    } finally {
      setIsAILoading(false);
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <EditorBubble
      tippyOptions={{
        placement: "top",
      }}
      className="flex w-fit max-w-[90vw] overflow-hidden rounded-md border border-muted bg-background shadow-xl"
    >
      {/* AI Menu - First position for prominence */}
      <AIMenu onAction={handleAIAction} isLoading={isAILoading} />
      <Separator orientation="vertical" className="h-8" />

      {/* Text formatting */}
      <EditorBubbleItem onSelect={() => editor.chain().focus().toggleBold().run()}>
        <Button
          size="sm"
          variant="ghost"
          className={cn("h-8 w-8 p-0 rounded-none", editor.isActive("bold") && "bg-muted")}
        >
          <Bold className="h-4 w-4" />
        </Button>
      </EditorBubbleItem>
      <EditorBubbleItem onSelect={() => editor.chain().focus().toggleItalic().run()}>
        <Button
          size="sm"
          variant="ghost"
          className={cn("h-8 w-8 p-0 rounded-none", editor.isActive("italic") && "bg-muted")}
        >
          <Italic className="h-4 w-4" />
        </Button>
      </EditorBubbleItem>
      <EditorBubbleItem onSelect={() => editor.chain().focus().toggleUnderline().run()}>
        <Button
          size="sm"
          variant="ghost"
          className={cn("h-8 w-8 p-0 rounded-none", editor.isActive("underline") && "bg-muted")}
        >
          <Underline className="h-4 w-4" />
        </Button>
      </EditorBubbleItem>
      <EditorBubbleItem onSelect={() => editor.chain().focus().toggleStrike().run()}>
        <Button
          size="sm"
          variant="ghost"
          className={cn("h-8 w-8 p-0 rounded-none", editor.isActive("strike") && "bg-muted")}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
      </EditorBubbleItem>
      <Separator orientation="vertical" className="h-8" />
      <EditorBubbleItem onSelect={() => editor.chain().focus().toggleCode().run()}>
        <Button
          size="sm"
          variant="ghost"
          className={cn("h-8 w-8 p-0 rounded-none", editor.isActive("code") && "bg-muted")}
        >
          <Code className="h-4 w-4" />
        </Button>
      </EditorBubbleItem>
      <EditorBubbleItem
        onSelect={() => {
          const url = window.prompt("Enter URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
      >
        <Button
          size="sm"
          variant="ghost"
          className={cn("h-8 w-8 p-0 rounded-none", editor.isActive("link") && "bg-muted")}
        >
          <Link2 className="h-4 w-4" />
        </Button>
      </EditorBubbleItem>
    </EditorBubble>
  );
}

// Slash command menu
function SlashCommandMenu() {
  return (
    <EditorCommand className="z-50 h-auto max-h-[330px] overflow-y-auto rounded-md border border-muted bg-background px-1 py-2 shadow-md transition-all">
      <EditorCommandEmpty className="px-2 text-muted-foreground">No results</EditorCommandEmpty>
      <EditorCommandList>
        {suggestionItems.map((item) => (
          <EditorCommandItem
            key={item.title}
            value={item.title}
            onCommand={item.command}
            className="flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm hover:bg-accent aria-selected:bg-accent cursor-pointer"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-muted bg-background">
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </EditorCommandItem>
        ))}
      </EditorCommandList>
    </EditorCommand>
  );
}

export function ArticleEditor({
  initialContent,
  onSave,
  readOnly = false,
  className,
}: ArticleEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [currentHTML, setCurrentHTML] = useState("");

  // Configure extensions
  const extensions = useMemo(() => [
    StarterKit.configure({
      bulletList: {
        HTMLAttributes: {
          class: "list-disc list-outside leading-3 ml-4",
        },
      },
      orderedList: {
        HTMLAttributes: {
          class: "list-decimal list-outside leading-3 ml-4",
        },
      },
      listItem: {
        HTMLAttributes: {
          class: "leading-normal",
        },
      },
      blockquote: {
        HTMLAttributes: {
          class: "border-l-4 border-primary pl-4 italic",
        },
      },
      codeBlock: false, // Use CodeBlockLowlight instead
      code: {
        HTMLAttributes: {
          class: "rounded-md bg-muted px-1.5 py-1 font-mono text-sm",
        },
      },
      horizontalRule: {
        HTMLAttributes: {
          class: "my-4 border-muted-foreground/30",
        },
      },
      heading: {
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: "font-bold",
        },
      },
    }),
    TiptapLink.configure({
      HTMLAttributes: {
        class: "text-primary underline underline-offset-4 hover:text-primary/80 cursor-pointer",
      },
      openOnClick: false,
    }),
    TiptapUnderline,
    TextStyle,
    Color,
    TaskList.configure({
      HTMLAttributes: {
        class: "not-prose pl-2",
      },
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: "flex items-start gap-2",
      },
      nested: true,
    }),
    TiptapImage.configure({
      HTMLAttributes: {
        class: "rounded-lg border max-w-full",
      },
    }),
    CodeBlockLowlight.configure({
      lowlight,
      HTMLAttributes: {
        class: "rounded-md bg-muted p-4 font-mono text-sm overflow-x-auto",
      },
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: "border-collapse table-auto w-full my-4",
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: "border-b border-border",
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class: "border border-border bg-muted px-4 py-2 text-left font-semibold",
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: "border border-border px-4 py-2",
      },
    }),
  ], []);

  const handleSave = useCallback(async () => {
    if (!currentHTML) return;

    setIsSaving(true);
    try {
      await onSave(currentHTML, currentHTML);
      setHasChanges(false);
      toast.success("Article saved successfully");
    } catch (error) {
      toast.error("Failed to save article");
    } finally {
      setIsSaving(false);
    }
  }, [currentHTML, onSave]);

  // Convert initial content to HTML for editor initialization
  const htmlContent = useMemo(() => contentToHTML(initialContent), [initialContent]);

  // Default empty JSON content for initial render
  const defaultContent: JSONContent = useMemo(() => ({
    type: "doc",
    content: [{ type: "paragraph" }],
  }), []);

  // Handle editor creation - set HTML content
  const handleEditorCreate = useCallback(({ editor }: { editor: any }) => {
    if (htmlContent) {
      editor.commands.setContent(htmlContent);
      setCurrentHTML(editor.getHTML());
    }
  }, [htmlContent]);

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-background", className)}>
      <EditorRoot>
        <EditorContent
          initialContent={defaultContent}
          extensions={extensions}
          className="relative min-h-[500px] w-full"
          editable={!readOnly}
          onCreate={handleEditorCreate}
          editorProps={{
            handleDOMEvents: {
              keydown: (_view, event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === "s") {
                  event.preventDefault();
                  handleSave();
                  return true;
                }
                return false;
              },
            },
            attributes: {
              class: cn(
                "prose prose-lg dark:prose-invert prose-headings:font-bold font-default focus:outline-none max-w-full p-8",
                // Improved spacing for paragraphs and headings
                "prose-p:my-4 prose-p:leading-7",
                // Headings with generous spacing
                "prose-h1:text-4xl prose-h1:mt-10 prose-h1:mb-6 prose-h1:leading-tight",
                "prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-5 prose-h2:leading-snug",
                "prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:leading-snug",
                "prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-3",
                // First child headings don't need top margin
                "[&>h1:first-child]:mt-0 [&>h2:first-child]:mt-0 [&>h3:first-child]:mt-0",
                // Links
                "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
                // Code
                "prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none",
                "prose-pre:bg-muted prose-pre:rounded-lg prose-pre:my-6",
                // Blockquote
                "prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:rounded-r prose-blockquote:not-italic prose-blockquote:my-6 prose-blockquote:py-2",
                // Lists
                "prose-li:my-2 prose-ul:my-4 prose-ol:my-4",
                // Images and other elements
                "prose-img:my-6 prose-hr:my-8",
                // Tables
                "prose-table:border-collapse prose-table:w-full prose-table:my-4",
                "prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold",
                "prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2",
                "min-h-[400px]"
              ),
            },
          }}
          onUpdate={({ editor }) => {
            const html = editor.getHTML();
            setCurrentHTML(html);
            setHasChanges(true);
          }}
          slotBefore={
            !readOnly && (
              <EditorToolbar
                onSave={handleSave}
                isSaving={isSaving}
                hasChanges={hasChanges}
              />
            )
          }
        >
          <SlashCommandMenu />
          <SelectionBubbleMenu />
        </EditorContent>
      </EditorRoot>

      {/* Help footer */}
      <div className="px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>
            Type <kbd className="px-1 py-0.5 rounded bg-muted font-mono">/</kbd> for commands
          </span>
          <span className="inline-flex items-center gap-1">Select text for <Sparkles className="inline h-3 w-3 text-violet-500" /><span className="text-violet-600 dark:text-violet-400">AI</span> &amp; formatting</span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono">⌘S</kbd> to save
          </span>
        </div>
        {hasChanges && (
          <span className="text-yellow-600 dark:text-yellow-400">● Unsaved changes</span>
        )}
      </div>
    </div>
  );
}

export default ArticleEditor;
