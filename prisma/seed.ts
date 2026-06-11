import prisma from './client'
import bcrypt from 'bcrypt'

/**
 * Script de seed avec des données de démo pour la base de données. 
 * Il utilise la méthode `upsert` de Prisma pour éviter les doublons lors de l'exécution multiple du script.
 */
async function main() {
  // --- Music styles ---
  const [rock, jazz, electro] = await Promise.all([
    prisma.musicStyle.upsert({ where: { id: 1 },    update: {}, create: { name: 'Rock' } }),
    prisma.musicStyle.upsert({ where: { id: 2 },    update: {}, create: { name: 'Jazz' } }),
    prisma.musicStyle.upsert({ where: { id: 3 }, update: {}, create: { name: 'Electro' } }),
  ])

  // --- Users ---
  const hashedPassword = await bcrypt.hash('password123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mempa.dev' },
    update: {},
    create: { email: 'admin@mempa.dev', username: 'admin', password: hashedPassword, role: 'ADMIN' },
  })

  const user1 = await prisma.user.upsert({
    where: { email: 'nino@mempa.dev' },
    update: {},
    create: { email: 'nino@mempa.dev', username: 'nino', password: hashedPassword },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'clement@mempa.dev' },
    update: {},
    create: { email: 'clement@mempa.dev', username: 'clement', password: hashedPassword },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'antoine@mempa.dev' },
    update: {},
    create: { email: 'antoine@mempa.dev', username: 'antoine', password: hashedPassword },
  })

  // --- Tracks ---
  const tracks1 = await Promise.all([
    prisma.track.upsert({
      where: { id: 1 },
      update: {},
      create: { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', durationSeconds: 354, styleId: rock.id },
    }),
    prisma.track.upsert({
      where: { id: 2 },
      update: {},
      create: { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', durationSeconds: 482, styleId: rock.id },
    }),
    prisma.track.upsert({
      where: { id: 3 },
      update: {},
      create: { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', durationSeconds: 391, styleId: rock.id },
    }),
    prisma.track.upsert({
      where: { id: 4 },
      update: {},
      create: { title: 'Wake up', artist: 'Rage Against the Machine', album: 'Rage Against the Machine', durationSeconds: 270, styleId: rock.id },
    }),
  ])

  const tracks2 = await Promise.all([
    prisma.track.upsert({
      where: { id: 5 },
      update: {},
      create: { title: 'So What', artist: 'Miles Davis', album: 'Kind of Blue', durationSeconds: 562, styleId: jazz.id },
    }),
    prisma.track.upsert({
      where: { id: 6 },
      update: {},
      create: { title: 'Take Five', artist: 'Dave Brubeck', album: 'Time Out', durationSeconds: 324, styleId: jazz.id },
    }),
    prisma.track.upsert({
      where: { id: 7 },
      update: {},
      create: { title: 'My Favorite Things', artist: 'John Coltrane', album: 'My Favorite Things', durationSeconds: 800, styleId: jazz.id },
    }),
    prisma.track.upsert({
      where: { id: 8 },
      update: {},
      create: { title: 'Sing, Sing, Sing', artist: 'Benny Goodman', album: 'Sing, Sing, Sing', durationSeconds: 520, styleId: jazz.id },
    }),
  ])

  const tracks3 = await Promise.all([
    prisma.track.upsert({
      where: { id: 9 },
      update: {},
      create: { title: 'Around the World', artist: 'Daft Punk', album: 'Homework', durationSeconds: 429, styleId: electro.id },
    }),
    prisma.track.upsert({
      where: { id: 10 },
      update: {},
      create: { title: 'One More Time', artist: 'Daft Punk', album: 'Discovery', durationSeconds: 320, styleId: electro.id },
    }),
   prisma.track.upsert({
      where: { id: 11 },
      update: {},
      create: { title: 'Harder, Better, Faster, Stronger', artist: 'Daft Punk', album: 'Discovery', durationSeconds: 224, styleId: electro.id },
    }),
    prisma.track.upsert({
      where: { id: 12 },
      update: {},
      create: { title: 'Get Lucky', artist: 'Daft Punk', album: 'Random Access Memories', durationSeconds: 369, styleId: electro.id },
    }),
  ])

  // --- Playlist ---
  const playlist1 = await prisma.playlist.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'The Rock playlist', creatorId: user1.id, styleId: rock.id },
  })

  const playlist2 = await prisma.playlist.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Jazz vibes', creatorId: user2.id, styleId: jazz.id },
  })

  const playlist3 = await prisma.playlist.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Electro hits', creatorId: user3.id, styleId: electro.id },
  })

  // --- PlaylistTrack ---
  for (let i = 0; i < tracks1.length; i++) {
    const contributorId = i % 2 === 0 ? user1.id : user2.id
    await prisma.playlistTrack.upsert({
      where: { id: i + 1 },
      update: {},
      create: { playlistId: playlist1.id, trackId: tracks1[i].id, order: i + 1, addedById: contributorId },
    })
  }

  for (let i = 0; i < tracks2.length; i++) {
    const contributorId = i % 2 === 0 ? user2.id : user3.id
    await prisma.playlistTrack.upsert({
      where: { id: i + 5 },
      update: {},
      create: { playlistId: playlist2.id, trackId: tracks2[i].id, order: i + 1, addedById: contributorId },
    })
  }

  for (let i = 0; i < tracks3.length; i++) {
    const contributorId = i % 2 === 0 ? user3.id : user1.id
    await prisma.playlistTrack.upsert({
      where: { id: i + 9 },
      update: {},
      create: { playlistId: playlist3.id, trackId: tracks3[i].id, order: i + 1, addedById: contributorId },
    })
  }

  console.log('Seed ended.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
