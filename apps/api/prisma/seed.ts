import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create Super Admin
    const adminEmail = 'admin@borderrelief.org';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('Admin@123', 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                fullName: 'Super Admin',
                passwordHash,
                role: UserRole.SUPER_ADMIN,
                orgName: 'Border Relief HQ'
            }
        });
        console.log('Admin user created.');
    }

    // 2. Create Main Warehouse
    const whName = 'Central Warehouse (Mae Sot)';
    const existingWh = await prisma.warehouse.findFirst({ where: { name: whName } });

    if (!existingWh) {
        await prisma.warehouse.create({
            data: {
                name: whName,
                locationStr: 'Mae Sot, Tak, Thailand',
                lat: 16.7115,
                lng: 98.5723 // Approximate
            }
        });
        console.log('Central Warehouse created.');
    }

    console.log('Seeding completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
