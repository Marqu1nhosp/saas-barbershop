export const queryKeys = {
    getDateAvailableTimeSlots: (barbershopId: string, date?: Date) => [
        "available-time-slots",
        barbershopId,
        date,
    ],
    getAvailableEmployees: (barbershopId: string, dateTime?: Date) => [
        "available-employees",
        barbershopId,
        dateTime,
    ],
}
