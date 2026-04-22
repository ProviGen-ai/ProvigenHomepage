"use client";

import { useState } from "react";
import type { TaskDef } from "./index";

interface Props {
  task: TaskDef;
  loading: boolean;
  editingPrompt: string | undefined;
  onEditPrompt: (prompt: string) => void;
  onRun: () => void;
}

export default function TaskCard({ task, loading, editingPrompt, onEditPrompt, onRun }: Props) {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-bold text-black dark:text-white mb-2">
        {task.title}
      </h3>
      <p className="text-sm text-body-color mb-4">{task.description}</p>

      {showEditor && (
        <textarea
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-3 text-xs text-black dark:text-white focus:border-primary focus:outline-none mb-3 min-h-[100px]"
          value={editingPrompt ?? task.prompt}
          onChange={(e) => onEditPrompt(e.target.value)}
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={onRun}
          disabled={loading}
          className="flex-1 rounded-md bg-primary py-2.5 px-4 text-sm font-semibold text-white duration-300 ease-in-out hover:bg-primary/80 disabled:opacity-50"
        >
          {loading ? "Running..." : "Run Example"}
        </button>
        <button
          onClick={() => setShowEditor(!showEditor)}
          className="rounded-md border border-gray-300 dark:border-gray-600 py-2.5 px-3 text-sm text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {showEditor ? "Hide" : "Edit"}
        </button>
      </div>
    </div>
  );
}
