import BarbershopItem from "@/components/barbershop-item";
import Header from "@/components/header";
import {
    PageContainer,
    PageSectionContent,
    PageSectionTitle,
} from "@/components/ui/page";
import { getBarbershopsByServiceName } from "@/data/barbershops";

interface BarbershopsPageProps {
    searchParams: {
        search?: string;
    };
}

const BarbershopsPage = async ({ searchParams }: BarbershopsPageProps) => {
    const { search } = searchParams;
    const barbershops = search ? await getBarbershopsByServiceName(search) : [];

    return (
        <div>
            <Header />
            <PageContainer>
                <PageSectionContent>
                    <PageSectionTitle>
                        Resultados para &quot;{search || ""}&quot;
                    </PageSectionTitle>

                    {barbershops.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            Nenhuma barbearia encontrada.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {barbershops.map((barbershop) => (
                                <BarbershopItem
                                    key={barbershop.id}
                                    barbershop={barbershop}
                                />
                            ))}
                        </div>
                    )}
                </PageSectionContent>
            </PageContainer>
        </div>
    );
};

export default BarbershopsPage;
