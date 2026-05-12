require('dotenv').config({ path: '../.env' });
const { initializeFirebase, getFirestore } = require('../src/config/firebase');

async function seed() {
  try {
    initializeFirebase();
    const db = getFirestore();

    console.log('Seeding database...');

    const sampleHashtags = [
      { tag: 'comedy', count: 1250 },
      { tag: 'music', count: 980 },
      { tag: 'dance', count: 870 },
      { tag: 'food', count: 650 },
      { tag: 'sports', count: 540 },
      { tag: 'tech', count: 420 },
      { tag: 'fashion', count: 380 },
      { tag: 'travel', count: 310 },
      { tag: 'pets', count: 290 },
      { tag: 'art', count: 250 },
      { tag: 'fitness', count: 230 },
      { tag: 'gaming', count: 210 },
      { tag: 'beauty', count: 190 },
      { tag: 'diy', count: 170 },
      { tag: 'education', count: 150 },
    ];

    const batch = db.batch();
    for (const hashtag of sampleHashtags) {
      const ref = db.collection('hashtags').doc(hashtag.tag);
      batch.set(ref, {
        ...hashtag,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      });
    }
    await batch.commit();

    console.log(`Seeded ${sampleHashtags.length} hashtags`);
    console.log('Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
