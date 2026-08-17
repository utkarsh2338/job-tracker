"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { deleteApplication } from "@/app/actions/applications";
import { toast } from "sonner";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string | null;
  companyName: string;
  jobTitle: string;
  onDeleted?: () => void;
}

export function DeleteDialog({
  open,
  onOpenChange,
  applicationId,
  companyName,
  jobTitle,
  onDeleted,
}: DeleteDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleDelete = async () => {
    if (!applicationId) return;
    setIsPending(true);
    try {
      const res = await deleteApplication(applicationId);
      if (res.success) {
        toast.success(`Deleted application for ${companyName}`, {
          description: "The application and all associated activity have been removed.",
        });
        onOpenChange(false);
        if (onDeleted) onDeleted();
      } else {
        toast.error("Failed to delete application", {
          description: res.error || "An unexpected error occurred.",
        });
      }
    } catch (err: any) {
      toast.error("Failed to delete application", {
        description: err.message,
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 mb-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Delete Application</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to delete your application for{" "}
            <span className="font-semibold text-foreground">{jobTitle}</span> at{" "}
            <span className="font-semibold text-foreground">{companyName}</span>?
            This will permanently remove all timeline notes, interviews, and attachments.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete Application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
