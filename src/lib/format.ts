export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function nextInvoiceNumber(last: string | null): string {
  if (!last) return "INV-0001";
  const n = parseInt(last.replace(/\D/g, ""), 10);
  return `INV-${String(n + 1).padStart(4, "0")}`;
}

export function nextEstimateNumber(last: string | null): string {
  if (!last) return "EST-0001";
  const n = parseInt(last.replace(/\D/g, ""), 10);
  return `EST-${String(n + 1).padStart(4, "0")}`;
}

export function agingLabel(dueDate: Date | string | null, status: string): string | null {
  if (!dueDate || status === "paid") return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0,0,0,0);
  due.setHours(0,0,0,0);
  const days = Math.round((today.getTime() - due.getTime()) / 86400000);
  if (days > 0) return `${days}d overdue`;
  if (days === 0) return "Due today";
  return `Due in ${-days}d`;
}
