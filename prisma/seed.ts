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
            openingTime: '09:00',
            closingTime: '21:00',
          },
          {
            id: 'store-navy',
            name: '海軍',
            openingTime: '08:00',
            closingTime: '20:00',
          },
        ],
      },
    },
  })

  // 麦わら海賊団のスタッフ
  const mugiwaraPirates = [
    { id: 'user-luffy', name: 'ルフィ', role: Role.ADMIN, gender: Gender.MALE, birthday: new Date('1997-05-05') },
    { id: 'user-zoro', name: 'ゾロ', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1999-11-11') },
    { id: 'user-nami', name: 'ナミ', role: Role.STAFF, gender: Gender.FEMALE, birthday: new Date('2001-07-03') },
    { id: 'user-sanji', name: 'サンジ', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('2000-03-02') },
    { id: 'user-usopp', name: 'ウソップ', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('2000-04-01') },
    { id: 'user-chopper', name: 'チョッパー', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('2001-12-24') },
    { id: 'user-robin', name: 'ロビン', role: Role.STAFF, gender: Gender.FEMALE, birthday: new Date('1990-02-06') },
    { id: 'user-franky', name: 'フランキー', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1988-03-09') },
    { id: 'user-jinbe', name: 'ジンベエ', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1976-04-02') },
  ]

  for (const staff of mugiwaraPirates) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {
        name: staff.name,
        role: staff.role,
        gender: staff.gender,
        birthday: staff.birthday,
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
        storeId: 'store-mugiwara',
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
    { id: 'user-akainu', name: '赤犬', role: Role.OWNER, gender: Gender.MALE, birthday: new Date('1970-08-16') },
    { id: 'user-kizaru', name: '黄猿', role: Role.ADMIN, gender: Gender.MALE, birthday: new Date('1966-11-23') },
    { id: 'user-ryokugyu', name: '緑牛', role: Role.ADMIN, gender: Gender.MALE, birthday: new Date('1975-01-01') },
    { id: 'user-fujitora', name: '藤虎', role: Role.ADMIN, gender: Gender.MALE, birthday: new Date('1969-06-16') },
    { id: 'user-garp', name: 'ガープ', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1946-05-02') },
    { id: 'user-otsuru', name: 'おつる', role: Role.STAFF, gender: Gender.FEMALE, birthday: new Date('1948-10-23') },
    { id: 'user-smoker', name: 'スモーカー', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1988-03-14') },
    { id: 'user-tashigi', name: 'たしぎ', role: Role.STAFF, gender: Gender.FEMALE, birthday: new Date('2001-10-06') },
    { id: 'user-coby', name: 'コビー', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('2005-05-13') },
  ]

  for (const staff of navyStaff) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {
        name: staff.name,
        role: staff.role,
        gender: staff.gender,
        birthday: staff.birthday,
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
        storeId: 'store-navy',
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
          { id: 'store-konoha', name: '木の葉', openingTime: '09:00', closingTime: '18:00' },
          { id: 'store-akatsuki', name: '暁', openingTime: '00:00', closingTime: '23:59' },
          { id: 'store-suna', name: '砂', openingTime: '10:00', closingTime: '19:00' },
        ],
      },
    },
  })

  // 木の葉のスタッフ
  const konohaStaff = [
    { id: 'user-naruto', name: 'ナルト', role: Role.OWNER, gender: Gender.MALE, birthday: new Date('2000-10-10') },
    { id: 'user-kakashi', name: 'カカシ', role: Role.ADMIN, gender: Gender.MALE, birthday: new Date('1985-09-15') },
    { id: 'user-sakura', name: 'サクラ', role: Role.STAFF, gender: Gender.FEMALE, birthday: new Date('2001-03-28') },
    { id: 'user-sasuke', name: 'サスケ', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('2000-07-23') },
  ]

  for (const staff of konohaStaff) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {
        name: staff.name,
        role: staff.role,
        gender: staff.gender,
        birthday: staff.birthday,
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
        storeId: 'store-konoha',
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
    { id: 'user-pain', name: 'ペイン', role: Role.ADMIN, gender: Gender.MALE, birthday: new Date('1980-02-20') },
    { id: 'user-itachi', name: 'イタチ', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1983-06-09') },
    { id: 'user-sasori', name: 'サソリ', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1985-11-08') },
    { id: 'user-hidan', name: '飛段', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1982-04-02') },
    { id: 'user-kakuzu', name: '角都', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1910-08-15') },
    { id: 'user-deidara', name: 'デイダラ', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1986-05-05') },
    { id: 'user-kisame', name: '鬼鮫', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1979-03-18') },
    { id: 'user-tobi', name: 'トビ', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1980-12-24') },
    { id: 'user-konan', name: '小南', role: Role.STAFF, gender: Gender.FEMALE, birthday: new Date('1980-02-20') },
  ]

  for (const staff of akatsukiStaff) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {
        name: staff.name,
        role: staff.role,
        gender: staff.gender,
        birthday: staff.birthday,
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
        storeId: 'store-akatsuki',
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
    { id: 'user-gaara', name: '我愛羅', role: Role.ADMIN, gender: Gender.MALE, birthday: new Date('2001-01-19') },
    { id: 'user-temari', name: 'テマリ', role: Role.STAFF, gender: Gender.FEMALE, birthday: new Date('1998-08-23') },
    { id: 'user-kankuro', name: 'カンクロウ', role: Role.STAFF, gender: Gender.MALE, birthday: new Date('1999-05-15') },
    { id: 'user-chiyo', name: 'チヨ', role: Role.STAFF, gender: Gender.FEMALE, birthday: new Date('1920-10-15') },
  ]

  for (const staff of sunaStaff) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {
        name: staff.name,
        role: staff.role,
        gender: staff.gender,
        birthday: staff.birthday,
        email: `${staff.id}@example.com`,
        password: DEFAULT_PASSWORD,
        storeId: 'store-suna',
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
