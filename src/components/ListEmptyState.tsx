import { FaInbox } from "react-icons/fa";
import { FaPlus } from "react-icons/fa6";

type ListEmptyStateProps = {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
};

export default function ListEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: ListEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-neutral-600 bg-neutral-900/50 px-6 py-16 text-center">
      <FaInbox className="size-12 text-neutral-600" aria-hidden />
      <div className="max-w-md space-y-2">
        <p className="text-lg font-medium text-neutral-100">{title}</p>
        <p className="text-sm leading-relaxed text-neutral-500">{description}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onAction}
          className="flex items-center justify-center gap-2 rounded-md bg-orange-300 px-5 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-orange-200"
        >
          <FaPlus className="size-4" />
          {actionLabel}
        </button>
        {secondaryActionLabel && onSecondaryAction ? (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="rounded-md border border-neutral-600 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-500 hover:bg-neutral-800"
          >
            {secondaryActionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
