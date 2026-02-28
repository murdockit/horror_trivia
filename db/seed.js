require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { getDb, initialize } = require('./init');

initialize();
const db = getDb();

// Create default admin
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || 'horroradmin';
const hash = bcrypt.hashSync(password, 10);

const upsertAdmin = db.prepare(`
  INSERT INTO admins (username, password_hash) VALUES (?, ?)
  ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash
`);
upsertAdmin.run(username, hash);
console.log(`Admin user "${username}" created.`);

// Seed categories
const categories = [
  'Classic Horror',
  'Slasher Films',
  'Supernatural',
  'Zombies & Creatures',
  'Modern Horror',
  'Horror Directors',
];

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name) VALUES (?)
`);
for (const cat of categories) {
  insertCategory.run(cat);
}
console.log(`${categories.length} categories seeded.`);

// Helper to get category id
function catId(name) {
  return db.prepare('SELECT id FROM categories WHERE name = ?').get(name).id;
}

// Seed questions
const questions = [
  // Classic Horror
  {
    category: 'Classic Horror',
    question_text: 'What year was the original "Halloween" released?',
    option_a: '1974',
    option_b: '1978',
    option_c: '1980',
    option_d: '1982',
    correct_option: 'B',
    difficulty: 'easy',
  },
  {
    category: 'Classic Horror',
    question_text: 'What is the name of the hotel in "The Shining"?',
    option_a: 'The Blackwood Hotel',
    option_b: 'The Stanley Hotel',
    option_c: 'The Overlook Hotel',
    option_d: 'The Bates Motel',
    correct_option: 'C',
    difficulty: 'easy',
  },
  {
    category: 'Classic Horror',
    question_text: 'In "The Exorcist", what is the name of the possessed girl?',
    option_a: 'Carrie',
    option_b: 'Regan',
    option_c: 'Samara',
    option_d: 'Tiffany',
    correct_option: 'B',
    difficulty: 'easy',
  },
  {
    category: 'Classic Horror',
    question_text: 'In "Jaws", what is the name of the shark-hunting boat?',
    option_a: 'The Pequod',
    option_b: 'The Jenny',
    option_c: 'The Orca',
    option_d: 'The Black Pearl',
    correct_option: 'C',
    difficulty: 'medium',
  },
  // Slasher Films
  {
    category: 'Slasher Films',
    question_text: 'In "Scream", what is the first question Ghostface asks on the phone?',
    option_a: 'Do you like horror movies?',
    option_b: 'What\'s your favorite scary movie?',
    option_c: 'Are you alone?',
    option_d: 'Do you want to play a game?',
    correct_option: 'B',
    difficulty: 'easy',
  },
  {
    category: 'Slasher Films',
    question_text: 'What is the name of the summer camp in "Friday the 13th"?',
    option_a: 'Camp Blackfoot',
    option_b: 'Camp Nightwing',
    option_c: 'Camp Crystal Lake',
    option_d: 'Camp Redwood',
    correct_option: 'C',
    difficulty: 'easy',
  },
  {
    category: 'Slasher Films',
    question_text: 'What is Freddy Krueger\'s signature weapon?',
    option_a: 'A machete',
    option_b: 'A chainsaw',
    option_c: 'A bladed glove',
    option_d: 'A meat hook',
    correct_option: 'C',
    difficulty: 'easy',
  },
  {
    category: 'Slasher Films',
    question_text: 'In "The Texas Chain Saw Massacre" (1974), what is Leatherface\'s real family name?',
    option_a: 'Sawyer',
    option_b: 'Hewitt',
    option_c: 'Voorhees',
    option_d: 'Myers',
    correct_option: 'A',
    difficulty: 'hard',
  },
  // Supernatural
  {
    category: 'Supernatural',
    question_text: 'What is the name of the possessed doll in "The Conjuring" universe?',
    option_a: 'Chucky',
    option_b: 'Brahms',
    option_c: 'Annabelle',
    option_d: 'Tiffany',
    correct_option: 'C',
    difficulty: 'easy',
  },
  {
    category: 'Supernatural',
    question_text: 'In "The Ring", how many days do you have to live after watching the cursed videotape?',
    option_a: '3 days',
    option_b: '5 days',
    option_c: '7 days',
    option_d: '10 days',
    correct_option: 'C',
    difficulty: 'easy',
  },
  {
    category: 'Supernatural',
    question_text: 'What is the name of the demon in "Insidious"?',
    option_a: 'Pazuzu',
    option_b: 'The Lipstick-Face Demon',
    option_c: 'Valak',
    option_d: 'Bagul',
    correct_option: 'B',
    difficulty: 'hard',
  },
  {
    category: 'Supernatural',
    question_text: 'In "Poltergeist" (1982), what does Carol Anne say to announce the spirits?',
    option_a: 'They\'re here.',
    option_b: 'I see dead people.',
    option_c: 'It\'s coming.',
    option_d: 'Don\'t go in there.',
    correct_option: 'A',
    difficulty: 'medium',
  },
  // Zombies & Creatures
  {
    category: 'Zombies & Creatures',
    question_text: 'What 1968 film is credited with creating the modern zombie genre?',
    option_a: 'White Zombie',
    option_b: 'Dawn of the Dead',
    option_c: 'Night of the Living Dead',
    option_d: 'I Walked with a Zombie',
    correct_option: 'C',
    difficulty: 'medium',
  },
  {
    category: 'Zombies & Creatures',
    question_text: 'What is the name of the creature in "Alien" (1979)?',
    option_a: 'Predator',
    option_b: 'Xenomorph',
    option_c: 'Necromorph',
    option_d: 'Demogorgon',
    correct_option: 'B',
    difficulty: 'easy',
  },
  {
    category: 'Zombies & Creatures',
    question_text: 'In "The Thing" (1982), where is the research station located?',
    option_a: 'The Arctic',
    option_b: 'Siberia',
    option_c: 'Antarctica',
    option_d: 'Alaska',
    correct_option: 'C',
    difficulty: 'medium',
  },
  {
    category: 'Zombies & Creatures',
    question_text: 'What is the name of the clown in Stephen King\'s "It"?',
    option_a: 'Twisty',
    option_b: 'Art',
    option_c: 'Captain Spaulding',
    option_d: 'Pennywise',
    correct_option: 'D',
    difficulty: 'easy',
  },
  // Modern Horror
  {
    category: 'Modern Horror',
    question_text: 'In "Get Out" (2017), what does the Armitage family use to hypnotize people?',
    option_a: 'A pocket watch',
    option_b: 'A teacup and spoon',
    option_c: 'A music box',
    option_d: 'A candle',
    correct_option: 'B',
    difficulty: 'medium',
  },
  {
    category: 'Modern Horror',
    question_text: 'What are the rules for surviving in "A Quiet Place"?',
    option_a: 'Don\'t look at them',
    option_b: 'Don\'t go outside',
    option_c: 'Don\'t make a sound',
    option_d: 'Don\'t fall asleep',
    correct_option: 'C',
    difficulty: 'easy',
  },
  {
    category: 'Modern Horror',
    question_text: 'In "Hereditary" (2018), what word is repeatedly found carved into surfaces?',
    option_a: 'HAIL',
    option_b: 'SATONY',
    option_c: 'ZAZAS',
    option_d: 'PAIMON',
    correct_option: 'B',
    difficulty: 'hard',
  },
  {
    category: 'Modern Horror',
    question_text: 'What horror film features a family discovering their doppelgängers?',
    option_a: 'Midsommar',
    option_b: 'Us',
    option_c: 'Nope',
    option_d: 'The Witch',
    correct_option: 'B',
    difficulty: 'easy',
  },
  // Horror Directors
  {
    category: 'Horror Directors',
    question_text: 'Who directed "Psycho" (1960)?',
    option_a: 'Stanley Kubrick',
    option_b: 'Alfred Hitchcock',
    option_c: 'Wes Craven',
    option_d: 'John Carpenter',
    correct_option: 'B',
    difficulty: 'easy',
  },
  {
    category: 'Horror Directors',
    question_text: 'Which director is known for both "Get Out" and "Nope"?',
    option_a: 'Ari Aster',
    option_b: 'Robert Eggers',
    option_c: 'Jordan Peele',
    option_d: 'James Wan',
    correct_option: 'C',
    difficulty: 'easy',
  },
  {
    category: 'Horror Directors',
    question_text: 'Who directed "The Witch" (2015) and "The Lighthouse" (2019)?',
    option_a: 'Mike Flanagan',
    option_b: 'Robert Eggers',
    option_c: 'Ti West',
    option_d: 'David Robert Mitchell',
    correct_option: 'B',
    difficulty: 'medium',
  },
  {
    category: 'Horror Directors',
    question_text: 'Which director created the "Saw" franchise?',
    option_a: 'Eli Roth',
    option_b: 'Rob Zombie',
    option_c: 'James Wan',
    option_d: 'Alexandre Aja',
    correct_option: 'C',
    difficulty: 'medium',
  },
];

const insertQuestion = db.prepare(`
  INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const existingCount = db.prepare('SELECT COUNT(*) as count FROM questions').get().count;
if (existingCount === 0) {
  const insertMany = db.transaction((qs) => {
    for (const q of qs) {
      insertQuestion.run(
        catId(q.category),
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_option,
        q.difficulty
      );
    }
  });
  insertMany(questions);
  console.log(`${questions.length} questions seeded.`);
} else {
  console.log(`Questions already exist (${existingCount}), skipping seed.`);
}

db.close();
console.log('Seed complete.');
