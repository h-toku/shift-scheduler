import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  // PostgreSQL 用のコネクションプールを作成
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  // Prisma 用のアダプターに変換
  const adapter = new PrismaPg(pool)
  
  // アダプターを使用して Prisma Client を初期化
  return new PrismaClient({ adapter })
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
