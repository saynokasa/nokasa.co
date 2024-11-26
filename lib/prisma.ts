import { PrismaClient, Prisma } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma || new PrismaClient({
  log: ['error']
})

prisma.$use(async (params, next) => {
  const start = performance.now()
  const result = await next(params)
  const duration = performance.now() - start

  if (duration > 100) {
    console.warn('Slow query detected:', {
      model: params.model,
      action: params.action,
      duration: `${duration.toFixed(2)}ms`
    })
  }

  return result
})

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma