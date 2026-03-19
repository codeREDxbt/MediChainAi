import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    let client: PrismaClient | undefined;
    return new Proxy({} as PrismaClient, {
        get(target, prop: keyof PrismaClient) {
            if (!client) {
                client = new PrismaClient();
            }
            return client[prop];
        }
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
