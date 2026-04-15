import "dotenv/config"
import { Role, Gender } from '@prisma/client'
import prisma from '../lib/prisma'

async function main() {
  console.log('--- シード開始 ---')
  console.log('接続先を確認中...')
  console.log('シードデータの投入を開始します...')

  const DEFAULT_PASSWORD = 'password123'

  // --- 1. ワンピース企業 ---
  const onePiece = await prisma.company.upsert({
    where: { id: 'company-one-piece' },
    update: {},
    create: {
      id: 'company-one-piece',
      name: 'ワンピース',
      stores: {
        create: [
          {
            id: 'store-mugiwara',
            name: '麦わら海賊団',
          },
          {
            id: 'store-navy',
            name: '海軍',
          },
        ],
      },
    },
  })

  // 麦わら海賊団のスタッフ
  const mugiwaraPirates = [
    { id: 'user-luffy', name: 'ルフィ', role: Role.ADMIN, gender: Gender.MALE },
    { id: 'user-zoro', name: 'ゾロ', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-nami', name: 'ナミ', role: Role.STAFF, gender: Gender.FEMALE },
    { id: 'user-sanji', name: 'サンジ', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-usopp', name: 'ウソップ', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-chopper', name: 'チョッパー', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-robin', name: 'ロビン', role: Role.STAFF, gender: Gender.FEMALE },
    { id: 'user-franky', name: 'フランキー', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-jinbe', name: 'ジンベエ', role: Role.STAFF, gender: Gender.MALE },
  ]

  for (const staff of mugiwaraPirates) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
      },
      create: {
        ...staff,
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
        storeId: 'store-mugiwara',
      },
    })
  }

  // 海軍のスタッフ
  const navyStaff = [
    { id: 'user-akainu', name: '赤犬', role: Role.OWNER, gender: Gender.MALE },
    { id: 'user-kizaru', name: '黄猿', role: Role.ADMIN, gender: Gender.MALE },
    { id: 'user-ryokugyu', name: '緑牛', role: Role.ADMIN, gender: Gender.MALE },
    { id: 'user-fujitora', name: '藤虎', role: Role.ADMIN, gender: Gender.MALE },
    { id: 'user-garp', name: 'ガープ', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-otsuru', name: 'おつる', role: Role.STAFF, gender: Gender.FEMALE },
    { id: 'user-smoker', name: 'スモーカー', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-tashigi', name: 'たしぎ', role: Role.STAFF, gender: Gender.FEMALE },
    { id: 'user-coby', name: 'コビー', role: Role.STAFF, gender: Gender.MALE },
  ]

  for (const staff of navyStaff) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
      },
      create: {
        ...staff,
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
        storeId: 'store-navy',
      },
    })
  }

  // --- 2. ナルト企業 ---
  const naruto = await prisma.company.upsert({
    where: { id: 'company-naruto' },
    update: {},
    create: {
      id: 'company-naruto',
      name: 'ナルト',
      stores: {
        create: [
          { id: 'store-konoha', name: '木の葉' },
          { id: 'store-akatsuki', name: '暁' },
          { id: 'store-suna', name: '砂' },
        ],
      },
    },
  })

  // 木の葉のスタッフ
  const konohaStaff = [
    { id: 'user-naruto', name: 'ナルト', role: Role.OWNER, gender: Gender.MALE },
    { id: 'user-kakashi', name: 'カカシ', role: Role.ADMIN, gender: Gender.MALE },
    { id: 'user-sakura', name: 'サクラ', role: Role.STAFF, gender: Gender.FEMALE },
    { id: 'user-sasuke', name: 'サスケ', role: Role.STAFF, gender: Gender.MALE },
  ]

  for (const staff of konohaStaff) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
      },
      create: {
        ...staff,
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
        storeId: 'store-konoha',
      },
    })
  }

  // 暁のスタッフ
  const akatsukiStaff = [
    { id: 'user-pain', name: 'ペイン', role: Role.ADMIN, gender: Gender.MALE },
    { id: 'user-itachi', name: 'イタチ', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-sasori', name: 'サソリ', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-hidan', name: '飛段', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-kakuzu', name: '角都', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-deidara', name: 'デイダラ', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-kisame', name: '鬼鮫', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-tobi', name: 'トビ', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-konan', name: '小南', role: Role.STAFF, gender: Gender.FEMALE },
  ]

  for (const staff of akatsukiStaff) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
      },
      create: {
        ...staff,
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
        storeId: 'store-akatsuki',
      },
    })
  }

  // 砂のスタッフ
  const sunaStaff = [
    { id: 'user-gaara', name: '我愛羅', role: Role.ADMIN, gender: Gender.MALE },
    { id: 'user-temari', name: 'テマリ', role: Role.STAFF, gender: Gender.FEMALE },
    { id: 'user-kankuro', name: 'カンクロウ', role: Role.STAFF, gender: Gender.MALE },
    { id: 'user-chiyo', name: 'チヨ', role: Role.STAFF, gender: Gender.FEMALE },
  ]

  for (const staff of sunaStaff) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
      },
      create: {
        ...staff,
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
        storeId: 'store-suna',
      },
    })
  }

  console.log('シードデータの投入が完了しました！')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
