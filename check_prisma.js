const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    console.log('Checking Prisma Client...');
    if (prisma.friendship) {
        console.log('✅ prisma.friendship model exists');
    } else {
        console.error('❌ prisma.friendship model is UNDEFINED');
        // List available models
        console.log('Available models:', Object.keys(prisma).filter(k => !k.startsWith('_')));
    }

    try {
        console.log('Attempting to count friendships...');
        const count = await prisma.friendship.count();
        console.log('✅ Friendships count:', count);
    } catch (e) {
        console.error('❌ Database query failed:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
