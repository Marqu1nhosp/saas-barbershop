//Data Access Layer
import { prisma } from "@/lib/prisma";

export async function getBarberShops() {
  try {
    const barbershop = await prisma.barbershop.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        imageUrl: true,
      },
    });
    return barbershop;
  } catch (error) {
    console.error('Error fetching barbershops', error)
    return []
  }
}

export async function getBarbershopById(id: string) {
  try {
    const barbershop = await prisma.barbershop.findUnique({
      where: { id, isActive: true },
      include: { services: true },
    });
    return barbershop;
  } catch (error) {
    console.error('Error fetching barbershop by id', error)
    return null;
  }
}
export async function getPopularBarbershops() {
  try {
    const barbershop = await prisma.barbershop.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        imageUrl: true,
      },
      orderBy: {
        name: "desc"
      }
    });
    return barbershop;
  } catch (error) {
    console.error('Error fetching popular barbershops', error)
    return []
  }
}

export async function searchBarbershops(search?: string) {
  if (!search) {
    return prisma.barbershop.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        address: true,
        imageUrl: true,
      },
    });
  }

  return prisma.barbershop.findMany({
    where: {
      AND: [
        { isActive: true },
        {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              address: {
                contains: search,
                mode: "insensitive",
              },
            },

            {
              services: {
                some: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            },
          ]
        },
      ],
    },
    select: {
      id: true,
      name: true,
      address: true,
      imageUrl: true,
    },
  });
}