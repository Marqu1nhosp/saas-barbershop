import Image from "next/image";

import { BookingsSection } from "@/app/_components/bookings-section";
import BarbershopItem from "@/components/barbershop-item";
import Header from "@/components/header";
import QuickSearch from "@/components/quick-search";
import { PageContainer, PageSectionContent, PageSectionScroller, PageSectionTitle } from "@/components/ui/page";
import { getBarberShops, getPopularBarbershops } from "@/data/barbershops";
import { getUserBookings } from "@/data/bookings";
import banner from "@/public/banner.png";


export default async function Home() {
  const barbershops = await getBarberShops();
  const popularBarbershops = await getPopularBarbershops();
  const bookings = await getUserBookings();

  const now = new Date();
  const confirmedBookings = bookings.filter(
    (booking) => !booking.cancelledAt && new Date(booking.date) >= now,
  );

  return (
    <div>
      <Header />
      <PageContainer>
        <QuickSearch />
        <Image src={banner} alt="Agende nos melhores com a Barbershop" sizes="100vw" className="h-auto w-full rounded-3xl" />

        {confirmedBookings.length > 0 && (
          <PageSectionContent>
            <PageSectionTitle>
              Agendamentos
            </PageSectionTitle>
            <BookingsSection bookings={confirmedBookings} />
          </PageSectionContent>
        )}

        <PageSectionContent>
          <PageSectionTitle>
            Barbearias
          </PageSectionTitle>
          <PageSectionScroller>
            {barbershops.map((barbershop) => (
              <BarbershopItem key={barbershop.id} barbershop={barbershop} />
            ))}
          </PageSectionScroller>
        </PageSectionContent>

        <PageSectionContent>
          <PageSectionTitle>
            Barbearias Populares
          </PageSectionTitle>
          <PageSectionScroller>
            {popularBarbershops.map((popularBarbershop) => (
              <BarbershopItem key={popularBarbershop.id} barbershop={popularBarbershop} />
            ))}
          </PageSectionScroller>
        </PageSectionContent>
      </PageContainer>
    </div>
  );
}
