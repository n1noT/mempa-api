import prisma from './client'
import bcrypt from 'bcrypt'

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

  // --- Tracks Rock ---
  const tracksRock = await Promise.all([
    prisma.track.upsert({
      where: { id: 1 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
      create: { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera', durationSeconds: 354, styleId: rock.id, audioUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
    }),
    prisma.track.upsert({
      where: { id: 2 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=QkF3oxziUI4' },
      create: { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV', durationSeconds: 482, styleId: rock.id, audioUrl: 'https://www.youtube.com/watch?v=QkF3oxziUI4' },
    }),
    prisma.track.upsert({
      where: { id: 3 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=lDwWOzRGuFY' },
      create: { title: 'Hotel California', artist: 'Eagles', album: 'Hotel California', durationSeconds: 391, styleId: rock.id, audioUrl: 'https://www.youtube.com/watch?v=lDwWOzRGuFY' },
    }),
    prisma.track.upsert({
      where: { id: 4 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=wr9gUr-eWdA' },
      create: { title: 'Wake Up', artist: 'Rage Against the Machine', album: 'Rage Against the Machine', durationSeconds: 270, styleId: rock.id, audioUrl: 'https://www.youtube.com/watch?v=wr9gUr-eWdA' },
    }),
    prisma.track.upsert({
      where: { id: 13 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=_FrOQC-zEog' },
      create: { title: 'Comfortably Numb', artist: 'Pink Floyd', album: 'The Wall', durationSeconds: 382, styleId: rock.id, audioUrl: 'https://www.youtube.com/watch?v=_FrOQC-zEog' },
    }),
    prisma.track.upsert({
      where: { id: 14 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=YR5ApYxkU-U' },
      create: { title: 'Another Brick in the Wall', artist: 'Pink Floyd', album: 'The Wall', durationSeconds: 231, styleId: rock.id, audioUrl: 'https://www.youtube.com/watch?v=YR5ApYxkU-U' },
    }),
    prisma.track.upsert({
      where: { id: 15 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=hjpF8ukSrvk' },
      create: { title: 'Wish You Were Here', artist: 'Pink Floyd', album: 'Wish You Were Here', durationSeconds: 334, styleId: rock.id, audioUrl: 'https://www.youtube.com/watch?v=hjpF8ukSrvk' },
    }),
    prisma.track.upsert({
      where: { id: 16 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=A_MjCqQoLLA' },
      create: { title: 'Hey Jude', artist: 'The Beatles', album: 'Past Masters', durationSeconds: 431, styleId: rock.id, audioUrl: 'https://www.youtube.com/watch?v=A_MjCqQoLLA' },
    }),
    prisma.track.upsert({
      where: { id: 17 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=45cYwDMibGo' },
      create: { title: 'Come Together', artist: 'The Beatles', album: 'Abbey Road', durationSeconds: 259, styleId: rock.id, audioUrl: 'https://www.youtube.com/watch?v=45cYwDMibGo' },
    }),
    prisma.track.upsert({
      where: { id: 18 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=mQER0A0ej0M' },
      create: { title: 'Let It Be', artist: 'The Beatles', album: 'Let It Be', durationSeconds: 243, styleId: rock.id, audioUrl: 'https://www.youtube.com/watch?v=mQER0A0ej0M' },
    }),
  ])

  // --- Tracks Jazz ---
  const tracksJazz = await Promise.all([
    prisma.track.upsert({
      where: { id: 5 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=ylXk1LBvIqU' },
      create: { title: 'So What', artist: 'Miles Davis', album: 'Kind of Blue', durationSeconds: 562, styleId: jazz.id, audioUrl: 'https://www.youtube.com/watch?v=ylXk1LBvIqU' },
    }),
    prisma.track.upsert({
      where: { id: 6 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=vmDDOFXSgAs' },
      create: { title: 'Take Five', artist: 'Dave Brubeck', album: 'Time Out', durationSeconds: 324, styleId: jazz.id, audioUrl: 'https://www.youtube.com/watch?v=vmDDOFXSgAs' },
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
    prisma.track.upsert({
      where: { id: 19 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=PNKB9tBnQog' },
      create: { title: "All Blues", artist: 'Miles Davis', album: 'Kind of Blue', durationSeconds: 694, styleId: jazz.id, audioUrl: 'https://www.youtube.com/watch?v=PNKB9tBnQog' },
    }),
    prisma.track.upsert({
      where: { id: 20 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=zqNTltOGh5c' },
      create: { title: 'Autumn Leaves', artist: 'Miles Davis', album: 'Cannonball Adderley', durationSeconds: 409, styleId: jazz.id, audioUrl: 'https://www.youtube.com/watch?v=zqNTltOGh5c' },
    }),
    prisma.track.upsert({
      where: { id: 21 },
      update: {},
      create: { title: 'A Love Supreme', artist: 'John Coltrane', album: 'A Love Supreme', durationSeconds: 971, styleId: jazz.id },
    }),
    prisma.track.upsert({
      where: { id: 22 },
      update: {},
      create: { title: 'Round Midnight', artist: 'Thelonious Monk', album: 'Brilliant Corners', durationSeconds: 332, styleId: jazz.id },
    }),
  ])

  // --- Tracks Electro ---
  const tracksElectro = await Promise.all([
    prisma.track.upsert({
      where: { id: 9 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=yku_bRDHMgE' },
      create: { title: 'Around the World', artist: 'Daft Punk', album: 'Homework', durationSeconds: 429, styleId: electro.id, audioUrl: 'https://www.youtube.com/watch?v=yku_bRDHMgE' },
    }),
    prisma.track.upsert({
      where: { id: 10 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=FGBhQbmPwH8' },
      create: { title: 'One More Time', artist: 'Daft Punk', album: 'Discovery', durationSeconds: 320, styleId: electro.id, audioUrl: 'https://www.youtube.com/watch?v=FGBhQbmPwH8' },
    }),
    prisma.track.upsert({
      where: { id: 11 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=PXYeARRyDWk' },
      create: { title: 'Harder, Better, Faster, Stronger', artist: 'Daft Punk', album: 'Discovery', durationSeconds: 224, styleId: electro.id, audioUrl: 'https://www.youtube.com/watch?v=PXYeARRyDWk' },
    }),
    prisma.track.upsert({
      where: { id: 12 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=5NV6Rdv1a3I' },
      create: { title: 'Get Lucky', artist: 'Daft Punk', album: 'Random Access Memories', durationSeconds: 369, styleId: electro.id, audioUrl: 'https://www.youtube.com/watch?v=5NV6Rdv1a3I' },
    }),
    prisma.track.upsert({
      where: { id: 23 },
      update: { audioUrl: 'https://www.youtube.com/watch?v=GDBkILTglq0' },
      create: { title: 'Da Funk', artist: 'Daft Punk', album: 'Homework', durationSeconds: 329, styleId: electro.id, audioUrl: 'https://www.youtube.com/watch?v=GDBkILTglq0' },
    }),
    prisma.track.upsert({
      where: { id: 24 },
      update: {},
      create: { title: 'Blue (Da Ba Dee)', artist: 'Eiffel 65', album: 'Europop', durationSeconds: 235, styleId: electro.id },
    }),
  ])

  // --- Playlists ---
  const playlist1 = await prisma.playlist.upsert({
    where: { id: 1 },
    update: {},
    create: { name: 'The Rock Playlist', creatorId: user1.id, styleId: rock.id },
  })

  const playlist2 = await prisma.playlist.upsert({
    where: { id: 2 },
    update: {},
    create: { name: 'Jazz Vibes', creatorId: user2.id, styleId: jazz.id },
  })

  const playlist3 = await prisma.playlist.upsert({
    where: { id: 3 },
    update: {},
    create: { name: 'Electro Hits', creatorId: user3.id, styleId: electro.id },
  })

  // --- PlaylistTracks ---
  const rockTracks = tracksRock.slice(0, 4)
  for (let i = 0; i < rockTracks.length; i++) {
    const contributorId = i % 2 === 0 ? user1.id : user2.id
    await prisma.playlistTrack.upsert({
      where: { id: i + 1 },
      update: {},
      create: { playlistId: playlist1.id, trackId: rockTracks[i].id, order: i + 1, addedById: contributorId },
    })
  }

  const jazzTracks = tracksJazz.slice(0, 4)
  for (let i = 0; i < jazzTracks.length; i++) {
    const contributorId = i % 2 === 0 ? user2.id : user3.id
    await prisma.playlistTrack.upsert({
      where: { id: i + 5 },
      update: {},
      create: { playlistId: playlist2.id, trackId: jazzTracks[i].id, order: i + 1, addedById: contributorId },
    })
  }

  const electroTracks = tracksElectro.slice(0, 4)
  for (let i = 0; i < electroTracks.length; i++) {
    const contributorId = i % 2 === 0 ? user3.id : user1.id
    await prisma.playlistTrack.upsert({
      where: { id: i + 9 },
      update: {},
      create: { playlistId: playlist3.id, trackId: electroTracks[i].id, order: i + 1, addedById: contributorId },
    })
  }

  console.log('Seed ended.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
