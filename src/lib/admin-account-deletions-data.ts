export type DeletionStatus = "submitted" | "processing" | "rejected" | "deleted";

export const DELETION_STATUS_LABEL: Record<DeletionStatus, string> = {
  submitted: "Submitted",
  processing: "Processing",
  rejected: "Rejected",
  deleted: "Deleted",
};

export const DELETION_STATUS_TONE: Record<DeletionStatus, string> = {
  submitted: "bg-gold/20 text-gold-foreground",
  processing: "bg-brand/10 text-brand",
  rejected: "bg-destructive/10 text-destructive",
  deleted: "bg-muted text-muted-foreground",
};

export function mapDeletionStatus(api: string): DeletionStatus {
  const u = api.toUpperCase();
  if (u === "PROCESSING") return "processing";
  if (u === "REJECTED") return "rejected";
  if (u === "DELETED") return "deleted";
  return "submitted";
}
