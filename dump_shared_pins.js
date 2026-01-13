
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$connect();
        console.log('--- Connected ---');
        const shares = await prisma.sharedPin.findMany({
            include: {
                pin: true,
                fromUser: true,
                toUser: true
            }
        });
        console.log(JSON.stringify(shares, null, 2));

        console.log('--- Users ---');
        const users = await prisma.user.findMany({
            select: { id: true, username: true, email: true }
        });
        users.forEach(u => console.log(`${u.id} - ${u.username} (${u.email})`));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
