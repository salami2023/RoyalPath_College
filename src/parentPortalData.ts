/**
 * Parent Portal - Seeding structures for CBT & Academic Resources
 */

export interface CBTQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
}

export interface CBTItem {
  id: string;
  classId: string;
  subjectName: string;
  type: 'quiz' | 'assignment' | 'test' | 'exam';
  title: string;
  dueDate: string;
  estimatedTime: string;
  questions?: CBTQuestion[];
  instructions?: string;
  maxScore: number;
}

export interface ResourceItem {
  id: string;
  classId: string;
  subjectName: string;
  type: 'notes' | 'video_link' | 'mp3' | 'video' | 'pdf' | 'image';
  title: string;
  description: string;
  url: string;
  fileName?: string;
  fileSize?: string;
  // Extra detailed mock text representation for doc and page simulation
  documentContent?: string;
}

// -------------------------------------------------------------
// SEED MOCK MCQ QUESTIONS BY TOPIC
// -------------------------------------------------------------
export const subjectMCQs: Record<string, CBTQuestion[]> = {
  'Algebra I': [
    {
      id: 'alg-q1',
      questionText: 'Given the equation 2x + 10 = 24. Solve for x.',
      options: ['x = 5', 'x = 7', 'x = 12', 'x = 14'],
      correctIndex: 1
    },
    {
      id: 'alg-q2',
      questionText: 'What is the principal degree of any quadratic equation?',
      options: ['1', '2', '3', '0'],
      correctIndex: 1
    },
    {
      id: 'alg-q3',
      questionText: 'Which algebraic rule states that a(b + c) = ab + ac?',
      options: ['Commutative Property', 'Associative Property', 'Distributive Property', 'Identity Property'],
      correctIndex: 2
    }
  ],
  'AP Physics': [
    {
      id: 'phy-q1',
      questionText: 'What is the standard gravitational constant g calibrated on the Earth surface?',
      options: ['5.4 m/s²', '9.8 m/s²', '11.2 m/s²', '9.8 cm/s²'],
      correctIndex: 1
    },
    {
      id: 'phy-q2',
      questionText: 'Which of the following is a pure scalar scalar quantity (has magnitude but no direction vectors)?',
      options: ['Velocity', 'Displacement', 'Speed', 'Force'],
      correctIndex: 2
    },
    {
      id: 'phy-q3',
      questionText: 'Newton\'s Second Law is fundamentally outlined as:',
      options: ['F = mv', 'F = ma', 'E = mc²', 'W = Fd'],
      correctIndex: 1
    }
  ],
  'Calculus AB': [
    {
      id: 'calc-q1',
      questionText: 'What is the derivative of f(x) = x³ with respect to x?',
      options: ['3x', '3x²', '2x³', 'x²/3'],
      correctIndex: 1
    },
    {
      id: 'calc-q2',
      questionText: 'If a limit approaches a value where f(x) yields 0/0, what is this state called?',
      options: ['Undefined limit', 'Determinant form', 'Indeterminate form', 'Infinite asymptote'],
      correctIndex: 2
    },
    {
      id: 'calc-q3',
      questionText: 'Which theorem connects the derivative of an integral directly to the original function?',
      options: ['Mean Value Theorem', 'Extreme Value Theorem', 'Fundamental Theorem of Calculus', 'Squeeze Theorem'],
      correctIndex: 2
    }
  ],
  'Biology': [
    {
      id: 'bio-q1',
      questionText: 'Which organelle is universally dubbed reference of "powerhouse of the cell" due to ATP synthesis?',
      options: ['Ribosome', 'Nucleus', 'Mitochondria', 'Golgi Apparatus'],
      correctIndex: 2
    },
    {
      id: 'bio-q2',
      questionText: 'What is the phase of cell mitosis where sister chromatids separate to opposite poles?',
      options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'],
      correctIndex: 2
    },
    {
      id: 'bio-q3',
      questionText: 'Which chemical pigment gives plants their green coloration and captures light energy?',
      options: ['Carotenoid', 'Chlorophyll', 'Hemoglobin', 'Melanin'],
      correctIndex: 1
    }
  ],
  'English Literature II': [
    {
      id: 'eng-q1',
      questionText: 'Which play by William Shakespeare contains the iconic line "Double, double toil and trouble"?',
      options: ['Hamlet', 'Romeo and Juliet', 'Othello', 'Macbeth'],
      correctIndex: 3
    },
    {
      id: 'eng-q2',
      questionText: 'In Freytag\'s narrative pyramid, what is the stage representing the climax immediate descent?',
      options: ['Exposition', 'Inclusion Conflict', 'Falling Action', 'Resolution'],
      correctIndex: 2
    },
    {
      id: 'eng-q3',
      questionText: 'A direct literary comparison between two objects without using "like" or "as" is classified as:',
      options: ['Simile', 'Metaphor', 'Hyperbole', 'Onomatopoeia'],
      correctIndex: 1
    }
  ]
};

// -------------------------------------------------------------
// SEED MOCK CBT ITEMS LIST (QUIZ, ASSIGNMENT, TEST, EXAM)
// -------------------------------------------------------------
export const seedCBTItems = (studentClasses: { id: string; name: string }[]): CBTItem[] => {
  const list: CBTItem[] = [];

  studentClasses.forEach(cls => {
    const questions = subjectMCQs[cls.name] || [
      {
        id: `mock-q-${cls.id}-1`,
        questionText: 'Identify the principal application of this field of study.',
        options: ['Analytical theory', 'Practical computation', 'Historical observation', 'All of the above'],
        correctIndex: 3
      },
      {
        id: `mock-q-${cls.id}-2`,
        questionText: 'Continuous evaluation remains vital key metrics in which assessment stage?',
        options: ['Diagnostic', 'Formative', 'Summative', 'All stages'],
        correctIndex: 3
      }
    ];

    // 1. Quizzes
    list.push({
      id: `cbt-quiz-${cls.id}`,
      classId: cls.id,
      subjectName: cls.name,
      type: 'quiz',
      title: `${cls.name} Continuous Diagnostics Quiz`,
      dueDate: 'Jun 10, 2026',
      estimatedTime: '15 mins',
      questions,
      instructions: 'Complete this quick conceptual test. You have unlimited retries to secure a perfect score.',
      maxScore: 100
    });

    // 2. Assignments
    list.push({
      id: `cbt-assign-${cls.id}`,
      classId: cls.id,
      subjectName: cls.name,
      type: 'assignment',
      title: `${cls.name} Practical Worksheet solver`,
      dueDate: 'Jun 15, 2026',
      estimatedTime: '45 mins',
      instructions: 'Submit a PDF or type your solutions detailed steps below. Double check your rounding rules!',
      maxScore: 100
    });

    // 3. Tests
    list.push({
      id: `cbt-test-${cls.id}`,
      classId: cls.id,
      subjectName: cls.name,
      type: 'test',
      title: `${cls.name} Mid-Term Assessment Test`,
      dueDate: 'Jun 22, 2026',
      estimatedTime: '30 mins',
      questions,
      instructions: 'This represents a graded continuous evaluation test counting 20% toward your final student grade average.',
      maxScore: 100
    });

    // 4. Exams
    list.push({
      id: `cbt-exam-${cls.id}`,
      classId: cls.id,
      subjectName: cls.name,
      type: 'exam',
      title: `Annual ${cls.name} Terminal Exam`,
      dueDate: 'Jul 05, 2026',
      estimatedTime: '2 hours',
      instructions: 'Annual comprehensive terminal exam covering all elements of the syllabus in strict conditions.',
      maxScore: 100
    });
  });

  return list;
};

// -------------------------------------------------------------
// SEED MOCK EDUCATIONAL RESOURCES
// -------------------------------------------------------------
export const seedResourcesList = (studentClasses: { id: string; name: string }[]): ResourceItem[] => {
  const list: ResourceItem[] = [];

  studentClasses.forEach(cls => {
    // Determine content descriptions
    let notesText = `Classnotes of ${cls.name}: \n\nSession Focus: Fundamental Concepts and Applied Rules.\n\nKey Formulas & Postulates:\n1. Keep precise worksheets of variable limits.\n2. Incline values must support accurate error estimations.\n3. Make sure to consult formulas tables.`;
    let docTitle = `${cls.name} Master Formulas Booklet`;
    let mp3Title = `${cls.name} Historical Roots Podcast`;
    let videoTitle = `${cls.name} Complete Concept Video Guide`;

    if (cls.name === 'Algebra I') {
      notesText = `ALGEBRA I BASIC PRINCIPLES NOTES\n\nTopic: Quadratic Equations & Polynomial degree curves.\n\nImportant Postulates:\n- A quadratic equation takes form: ax² + bx + c = 0.\n- Standard solving utilizes the Quadratic Formula:\n  x = (-b ± √(b² - 4ac)) / 2a.\n- The discriminant value (b² - 4ac) dictates root characters:\n  • > 0: Two distinct real roots.\n  • = 0: One real repeated root.\n  • < 0: Complex conjugate roots.\n\nPractice exercises outline clear steps to isolate factoring structures! Always double verify algebraic transfers.`;
    } else if (cls.name === 'AP Physics') {
      notesText = `AP PHYSICS UNIT 1 COMPENDIUM\n\nTopic: Kinematics vectors, Force arrays & Newtonian motion.\n\nImportant Vectors Formulas:\n- Velocity (v) = s / t.\n- Acceleration (a) = (v - u) / t.\n- Newton Force balance: F = ma.\n- Kinetic Friction force: F_f = μ * F_N.\n- Projectile motion coordinates:\n  • Horizontal: x = u * cos(θ) * t\n  • Vertical: y = u * sin(θ) * t - 0.5 * g * t².\n\nBe highly analytical with reference systems. Force vectors diagrams are non-negotiable for grade evaluation!`;
    } else if (cls.name === 'Calculus AB') {
      notesText = `AP CALCULUS AB LIMITS CONCEPTS\n\nTopic: Limits definition, Continuity metrics & Epsilon-delta.\n\nCore Formulas:\n- Let f(x) be continuous at point c if: lim(x->c) f(x) = f(c).\n- If limit yields 0/0 indeterminacy:\n  1. Try factoring and cancellation.\n  2. Apply L'Hôpital's Rule: differentiate numerator and denominator independently.\n- Tangent curve slope definition: m = lim(h->0) (f(x+h) - f(x))/h.\n\nEnsure perfect proof listings when documenting homework portfolios.`;
    } else if (cls.name === 'Biology') {
      notesText = `CELL BIOLOGY LAB SYLLABUS\n\nTopic: Cellular structures, Mitosis phases & Mitochondria.\n\nKey Organelle Profiles:\n- Mitochondria: Powerhouse. Synthesizes vital adenosine triphosphate (ATP).\n- Ribosomes: Site of cell protein translation.\n- Metaphase: Chromosomes line up neatly at the cell equator plate.\n- Anaphase: Rapid pulling of chromatids toward opposite poles.\n\nAlways sketch cell cross-sections in high resolution inside notebooks! Let colors represent organelle groupings clearly.`;
    } else if (cls.name === 'English Literature II') {
      notesText = `SHAKESPEAREAN TRAGEDY THEME STUDY\n\nTopic: Macbeth, Motifs of Macbeth & plot structure layers.\n\nLiterary Motifs:\n1. Blood & Stain: Repression of moral guilt.\n2. Restless Sleep & Nightmares: The disruption of sovereign national covenants.\n3. The Weird Sisters: Catalyst forces of ambitious temptation.\n\nFreytag Narrative Map:\n- Exposition → Inciting Incident → Rising Action → Climax (Act III) → Falling Action → Catastrophe / Resolution.\n\nFocus on Macbeth character motivations and the exact syntax used in key monologues.`;
    }

    // 1. Class notes (Text representation)
    list.push({
      id: `res-notes-${cls.id}`,
      classId: cls.id,
      subjectName: cls.name,
      type: 'notes',
      title: `${cls.name} Essential Class Study Notes`,
      description: `Comprehensive teacher study guide summarizing core topics and exam formulas.`,
      url: '#notes-view',
      documentContent: notesText
    });

    // 2. Video Link
    list.push({
      id: `res-vidlink-${cls.id}`,
      classId: cls.id,
      subjectName: cls.name,
      type: 'video_link',
      title: `${cls.name} Interactive Khan Academy Lectures`,
      description: `High-fidelity video playlists illustrating master steps of problem-solving.`,
      url: 'https://vimeo.com/705469440'
    });

    // 3. Uploaded MP3s
    list.push({
      id: `res-mp3-${cls.id}`,
      classId: cls.id,
      subjectName: cls.name,
      type: 'mp3',
      title: `${mp3Title}`,
      description: `Radio educational audio podcast summarizing background trivia and core objectives.`,
      url: `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3`,
      fileName: `${cls.name.toLowerCase().replace(' ', '_')}_lessons_audio.mp3`,
      fileSize: '4.8 MB'
    });

    // 4. Videos
    list.push({
      id: `res-video-${cls.id}`,
      classId: cls.id,
      subjectName: cls.name,
      type: 'video',
      title: `${videoTitle}`,
      description: `Animated video lesson highlighting tricky problems and visual charts.`,
      url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      fileName: 'animation_lessons.mp4',
      fileSize: '1.2 MB'
    });

    // 5. PDFs
    list.push({
      id: `res-pdf-${cls.id}`,
      classId: cls.id,
      subjectName: cls.name,
      type: 'pdf',
      title: `${docTitle}.pdf`,
      description: `Official printable institutional PDF syllabus guidelines.`,
      url: '#pdf',
      fileName: `${cls.name.replace(' ', '_')}_formula_syllabus.pdf`,
      fileSize: '840 KB',
      documentContent: notesText // Repurpose this to be displayed nicely:
    });

    // 6. Images (Gallery representation)
    list.push({
      id: `res-img-${cls.id}`,
      classId: cls.id,
      subjectName: cls.name,
      type: 'image',
      title: `${cls.name} High Resolution Cheat-Sheet Map`,
      description: `Infographic flow diagram outlining steps, properties, and definitions.`,
      url: `https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=600`, // Educational test image
      fileName: `${cls.name.toLowerCase().replace(' ', '_')}_infographic.png`,
      fileSize: '1.4 MB'
    });
  });

  return list;
};
