import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

import { PrismaClient } from "../generated/prisma/client";
import { BarbershopServiceStatus } from "../generated/prisma/enums";

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function seedDatabase() {
    try {
        // Criar usuários de teste
        const adminPassword = await bcrypt.hash("admin123", 10);
        const employeePassword = await bcrypt.hash("employee123", 10);

        // Usuário Admin
        await prisma.user.upsert({
            where: { email: "admin@barbearia.com" },
            update: {},
            create: {
                id: "admin-user-1",
                name: "Admin Barbearia",
                email: "admin@barbearia.com",
                password: adminPassword,
                role: "SUPERADMIN",
            },
        });

        // Usuário Funcionário 1
        await prisma.user.upsert({
            where: { email: "barbeiro1@barbearia.com" },
            update: {},
            create: {
                id: "employee-user-1",
                name: "Carlos Barbeiro",
                email: "barbeiro1@barbearia.com",
                password: employeePassword,
                role: "EMPLOYEE",
            },
        });

        // Usuário Funcionário 2
        await prisma.user.upsert({
            where: { email: "barbeiro2@barbearia.com" },
            update: {},
            create: {
                id: "employee-user-2",
                name: "Pedro Barbeiro",
                email: "barbeiro2@barbearia.com",
                password: employeePassword,
                role: "EMPLOYEE",
            },
        });

        console.log("✅ Usuários criados com sucesso:");
        console.log("   Admin: admin@barbearia.com / admin123");
        console.log("   Funcionário 1: barbeiro1@barbearia.com / employee123");
        console.log("   Funcionário 2: barbeiro2@barbearia.com / employee123");

        const images = [
            "/images/barbershops/salao-modelo-mauricio.png",
            "/images/barbershops/barbearia-vila-serrana.png",
            "/images/barbershops/barbearia-urbis-v.png",
        ];
        // Nomes criativos para as barbearias
        const creativeNames = [
            "Salão modelo - Mauricio",
            "Barbearia Vila Serrana",
            "Barbearia Urbis V"
        ];


        const addresses = [
            "Av. da Urbis V",
            "Vila serrana 1, Avenida Fernando Spínola, 123",
            "Avenida central da Urbis V, 123",

        ];

        const services = [
            {
                name: "Corte de Cabelo",
                description: "Estilo personalizado com as últimas tendências.",
                price: 60.0,
                durationMinutes: 60,
                status: "ACTIVE",
                imageUrl:
                    "/images/services/corte-de-cabelo.png",
            },
            {
                name: "Barba",
                description: "Modelagem completa para destacar sua masculinidade.",
                price: 40.0,
                durationMinutes: 20,
                status: "ACTIVE",
                imageUrl:
                    "/images/services/barba.png",
            },
            {
                name: "Pézinho",
                description: "Acabamento perfeito para um visual renovado.",
                price: 35.0,
                durationMinutes: 30,
                status: "ACTIVE",
                imageUrl:
                    "/images/services/pezinho.png",
            },
            {
                name: "Sobrancelha",
                description: "Expressão acentuada com modelagem precisa.",
                price: 20.0,
                durationMinutes: 15,
                status: "ACTIVE",
                imageUrl:
                    "/images/services/sombrancelha.png",
            },
            {
                name: "Massagem",
                description: "Relaxe com uma massagem revigorante.",
                price: 50.0,
                durationMinutes: 45,
                status: "ACTIVE",
                imageUrl:
                    "/images/services/massagem.png",
            },
        ];

        // Criar as três barbearias configuradas
        const barbershops = [];
        for (let i = 0; i < creativeNames.length; i++) {
            const name = creativeNames[i];
            const address = addresses[i];
            const imageUrl = images[i];

            const barbershop = await prisma.barbershop.create({
                data: {
                    name,
                    address,
                    imageUrl: imageUrl,
                    phones: ["(11) 99999-9999", "(11) 99999-9999"],
                    description:
                        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ac augue ullamcorper, pharetra orci mollis, auctor tellus. Phasellus pharetra erat ac libero efficitur tempus. Donec pretium convallis iaculis. Etiam eu felis sollicitudin, cursus mi vitae, iaculis magna. Nam non erat neque. In hac habitasse platea dictumst. Pellentesque molestie accumsan tellus id laoreet.",
                },
            });

            // Criar usuário específico para a Barbearia Vintage (primeira barbearia)
            if (i === 0) {
                const modeloPassword = await bcrypt.hash("modelo123", 10);
                await prisma.user.upsert({
                    where: { email: "owner@salaomodelo.com" },
                    update: {
                        password: modeloPassword,
                        role: "ADMIN",
                        barbershopId: barbershop.id,
                    },
                    create: {
                        id: "vintage-owner-1",
                        name: "Dono Salão modelo",
                        email: "owner@salaomodelo.com",
                        password: modeloPassword,
                        role: "ADMIN",
                        barbershopId: barbershop.id,
                    },
                });
                console.log("Usuário Salão modelo criado:");
                console.log("Email: owner@salaomodelo.com");
                console.log("Senha: modelo123");
            }

            if (i === 1) {
                const vilaSerranaPassword = await bcrypt.hash("vilaserrana123", 10);
                await prisma.user.upsert({
                    where: { email: "owner@vilaserrana.com" },
                    update: {
                        password: vilaSerranaPassword,
                        role: "ADMIN",
                        barbershopId: barbershop.id,
                    },
                    create: {
                        id: "vila-serrana-owner-1",
                        name: "Dono Barbearia Vila Serrana",
                        email: "owner@vilaserrana.com",
                        password: vilaSerranaPassword,
                        role: "ADMIN",
                        barbershopId: barbershop.id,
                    },
                });

                console.log("Usuário Vila Serrana criado:");
                console.log("Email: owner@vilaserrana.com");
                console.log("Senha: vilaserrana123");
            }

            if (i === 2) {
                const urbisPassword = await bcrypt.hash("urbisv123", 10);
                await prisma.user.upsert({
                    where: { email: "owner@urbisv.com" },
                    update: {
                        password: urbisPassword,
                        role: "ADMIN",
                        barbershopId: barbershop.id,
                    },
                    create: {
                        id: "urbis-v-owner-1",
                        name: "Dono Barbearia Urbis V",
                        email: "owner@urbisv.com",
                        password: urbisPassword,
                        role: "ADMIN",
                        barbershopId: barbershop.id,
                    },
                });

                console.log("Usuário Urbis V criado:");
                console.log("Email: owner@urbisv.com");
                console.log("Senha: urbisv123");
            }

            for (const service of services) {
                await prisma.barbershopService.create({
                    data: {
                        name: service.name,
                        description: service.description,
                        priceInCents: service.price * 100,
                        durationMinutes: service.durationMinutes ?? 60,
                        status: (service.status ?? BarbershopServiceStatus.ACTIVE) as BarbershopServiceStatus,
                        barbershop: {
                            connect: {
                                id: barbershop.id,
                            },
                        },
                        imageUrl: service.imageUrl,
                    },
                });
            }

            barbershops.push(barbershop);
        }

        // Fechar a conexão com o banco de dados
        console.log("Banco de dados populado com sucesso!");
        await prisma.$disconnect();
    } catch (error) {
        console.error("Erro ao criar as barbearias:", error);
    }
}

seedDatabase();