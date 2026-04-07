export function canCancelByPolicy(
    bookingDate: Date | string,
    cancellationNoticeHours: number,
): boolean {
    const bookingDateObj = bookingDate instanceof Date ? bookingDate : new Date(bookingDate);
    const now = new Date();
    const diffMs = bookingDateObj.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours >= cancellationNoticeHours;
}

export function getCancellationPolicyMessage(cancellationNoticeHours: number): string {
    return `Cancelamento permitido apenas com ${cancellationNoticeHours}h de antecedencia.`;
}
