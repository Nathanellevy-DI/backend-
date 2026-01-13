
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error']
});

async function main() {
    try {
        console.log("Connecting...");
        console.log("DATABASE_URL:", process.env.DATABASE_URL?.substring(0, 20) + "..."); // Mask secret
        await prisma.$connect();
        console.log("✅ Connected!");
        const count = await prisma.user.count();
        console.log("User count:", count);
        await prisma.$disconnect();
    } catch (e) {
        console.error("❌ Error:", e);
        process.exit(1);
    }
}
main();
