"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocationArgs {
  command?: string;
  path?: string;
  new_path?: string;
  [key: string]: unknown;
}

interface ToolInvocationDisplayProps {
  toolName: string;
  args: ToolInvocationArgs;
  isDone: boolean;
}

function getFileName(path?: string): string {
  if (!path) return "";
  return path.split("/").pop() ?? path;
}

export function getToolLabel(toolName: string, args: ToolInvocationArgs): string {
  const fileName = getFileName(args.path);

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return `Creating ${fileName}`;
      case "str_replace":
        return `Editing ${fileName}`;
      case "insert":
        return `Inserting into ${fileName}`;
      case "view":
        return `Reading ${fileName}`;
      case "undo_edit":
        return `Reverting changes in ${fileName}`;
      default:
        return fileName ? `Editing ${fileName}` : "Editing file";
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": {
        const newFileName = getFileName(args.new_path);
        return newFileName ? `Renaming ${fileName} to ${newFileName}` : `Renaming ${fileName}`;
      }
      case "delete":
        return `Deleting ${fileName}`;
      default:
        return fileName ? `Managing ${fileName}` : "Managing file";
    }
  }

  return toolName;
}

export function ToolInvocationDisplay({ toolName, args, isDone }: ToolInvocationDisplayProps) {
  const label = getToolLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
