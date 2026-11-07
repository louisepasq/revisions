/* Le projet de science d'Henri : son hélicoptère, l'Écureuil H125 (D-23, D-24, D-25).
   Tout le contenu, en français et en anglais (l'enfant choisit au premier lancement, D-24 point 5) :
   les sept étapes, les parties, les trois commandes, les cartes de Leitner, la scène radio, les
   records, le manuel du modèle en papier, l'expérience, la sortie, le carnet de pilote.
   Aucun chiffre de mémoire : chaque fait affiché est listé avec sa source dans README.md.
   Toute phrase dite à voix haute vient d'ici, mot pour mot (commun/outils/phrases.js les collecte
   par toutesLesPhrases ; seul UI, fait d'étiquettes jamais dites, est écarté).
   Script classique, chargé aussi par node. */
(function (racine) {
  'use strict';

  const LANGUES = ['fr', 'en'];

  /* Les sept étapes, dans l'ordre de D-24. `apres` : les étapes à finir avant de l'ouvrir ;
     `objet` : ce qui se colle dans le carnet à la fin de l'étape (D-25) ; `jeu` : faite dans l'app
     (proposée dans le « Today »), sinon hors de l'écran (l'atelier, la sortie). */
  const ETAPES = [
    { id: 'helico', apres: [], objet: 'ecusson', jeu: true, nom: { fr: 'Mon hélicoptère', en: 'My helicopter' } },
    { id: 'vol', apres: ['helico'], objet: 'autocollant', jeu: true, nom: { fr: 'Comment il vole', en: 'How it flies' } },
    { id: 'cockpit', apres: ['vol'], objet: 'ailes', jeu: true, nom: { fr: 'Le cockpit', en: 'The cockpit' } },
    { id: 'atelier', apres: ['helico', 'vol', 'cockpit'], objet: 'trombone', jeu: false, nom: { fr: "L'atelier", en: 'The workshop' } },
    { id: 'radio', apres: ['cockpit'], objet: 'casque', jeu: true, nom: { fr: 'Qui décide où on vole', en: 'Who says where we fly' } },
    { id: 'records', apres: ['radio'], objet: 'medaille', jeu: true, nom: { fr: 'Records et drones', en: 'Records and drones' } },
    { id: 'sortie', apres: ['records'], objet: 'billet', jeu: false, nom: { fr: 'La sortie au musée', en: 'The museum trip' } },
  ];

  /* Les objets du carnet : on les reçoit en finissant une étape, jamais sur un score ; ils
     n'ouvrent rien et ne s'échangent contre rien (D-25). */
  const OBJETS = {
    ecusson: { fr: "L'écusson de ta mission", en: 'Your mission patch' },
    autocollant: { fr: "L'autocollant de l'Écureuil", en: 'The Écureuil sticker' },
    ailes: { fr: 'Les ailes de pilote', en: 'Pilot wings' },
    trombone: { fr: 'Le trombone doré', en: 'The golden paper clip' },
    casque: { fr: 'Le casque radio', en: 'The radio headset' },
    medaille: { fr: "La médaille de l'Everest", en: 'The Everest medal' },
    billet: { fr: 'Le billet du musée', en: 'The museum ticket' },
  };

  /* Les parties de l'appareil, et à quoi chacune sert. */
  const PARTIES = [
    { id: 'pales', nom: { fr: 'Les pales', en: 'The blades' },
      dit: { fr: "Les pales. Elles tournent et poussent l'air vers le bas : alors l'air pousse l'hélicoptère vers le haut.", en: 'The blades. They spin and push the air down, so the air pushes the helicopter up.' } },
    { id: 'queue', nom: { fr: 'Le rotor de queue', en: 'The tail rotor' },
      dit: { fr: 'Le rotor de queue. Il empêche la cabine de tourner sur elle-même, et il fait tourner le nez à gauche ou à droite.', en: 'The tail rotor. It stops the cabin from spinning round, and it turns the nose left or right.' } },
    { id: 'patins', nom: { fr: 'Les patins', en: 'The skids' },
      dit: { fr: "Les patins. L'hélicoptère se pose dessus, un peu comme sur des skis.", en: 'The skids. The helicopter lands on them, a bit like skis.' } },
    { id: 'cabine', nom: { fr: 'La cabine', en: 'The cabin' },
      dit: { fr: "La cabine. Le pilote et les passagers s'y assoient : sept personnes au plus.", en: 'The cabin. The pilot and the passengers sit here: up to seven people.' } },
    { id: 'poutre', nom: { fr: 'La poutre de queue', en: 'The tail boom' },
      dit: { fr: 'La poutre de queue. Elle porte le rotor de queue, loin derrière la cabine.', en: 'The tail boom. It holds the tail rotor, far behind the cabin.' } },
  ];

  /* Les trois commandes, à leur vraie place (D-24, point 6) ; le nom anglais s'affiche sous le
     nom français (point 5). La couleur de la commande est celle de ses flèches. */
  const COMMANDES = [
    { id: 'collectif', place: 'gauche',
      nom: { fr: 'Le collectif', en: 'The collective lever' },
      ou: { fr: 'Le levier à ta main gauche.', en: 'The lever in your left hand.' },
      effet: { fr: "Le collectif : l'hélicoptère monte ou descend. Les trois pales s'inclinent toutes ensemble.", en: 'The collective lever: the helicopter goes up or down. All three blades tilt together.' } },
    { id: 'manche', place: 'droite',
      nom: { fr: 'Le manche', en: 'The cyclic stick' },
      ou: { fr: 'Le manche, devant toi, dans ta main droite.', en: 'The stick in front of you, in your right hand.' },
      effet: { fr: "Le manche : les pales penchent, et l'hélicoptère avance, recule ou glisse sur le côté.", en: 'The cyclic stick: the spinning blades tilt, and the helicopter goes forward, back or sideways.' } },
    { id: 'pedales', place: 'bas',
      nom: { fr: 'Les pédales', en: 'The pedals' },
      ou: { fr: 'Les deux pédales, sous tes pieds.', en: 'The two pedals, under your feet.' },
      effet: { fr: 'Les pédales : le rotor de queue pousse plus ou moins, et le nez tourne à gauche ou à droite.', en: 'The pedals: the tail rotor pushes more or less, and the nose turns left or right.' } },
  ];

  /* Les missions de l'H125 d'après Airbus (page du constructeur), et leur couleur proposée. */
  const MISSIONS = [
    { id: 'secours', couleur: 'jaune', nom: { fr: 'Secours', en: 'Rescue' },
      dit: { fr: 'Secours : tu emmènes un malade ou un blessé vite à l\'hôpital.', en: 'Rescue: you fly someone who is ill or hurt quickly to hospital.' } },
    { id: 'police', couleur: 'bleu', nom: { fr: 'Police', en: 'Police' },
      dit: { fr: 'Police : tu surveilles d\'en haut et tu aides à retrouver des gens.', en: 'Police: you watch from above and help to find people.' } },
    { id: 'feux', couleur: 'orange', nom: { fr: 'Feux de forêt', en: 'Firefighting' },
      dit: { fr: 'Feux de forêt : tu portes un grand seau d\'eau sous l\'hélicoptère.', en: 'Firefighting: you carry a big bucket of water under the helicopter.' } },
    { id: 'tourisme', couleur: 'vert', nom: { fr: 'Tourisme', en: 'Sightseeing' },
      dit: { fr: 'Tourisme : tu emmènes des passagers voir le paysage d\'en haut.', en: 'Sightseeing: you take passengers to see the view from above.' } },
  ];
  /* Peintures de la cabine : pas de rouge (le rouge reste hors de l'app, CLAUDE.md). */
  const COULEURS = {
    jaune: { teinte: '#F2C230', nom: { fr: 'Jaune', en: 'Yellow' } },
    orange: { teinte: '#F08A24', nom: { fr: 'Orange', en: 'Orange' } },
    bleu: { teinte: '#3C7BD9', nom: { fr: 'Bleu', en: 'Blue' } },
    vert: { teinte: '#3FA864', nom: { fr: 'Vert', en: 'Green' } },
    violet: { teinte: '#8A63D2', nom: { fr: 'Violet', en: 'Purple' } },
    blanc: { teinte: '#F2F1EC', nom: { fr: 'Blanc', en: 'White' } },
  };

  /* ---------- Les écrans de découverte, étape par étape (texte affiché et dit) ---------- */
  const HELICO = {
    intro: { fr: "Voici ton hélicoptère : l'H125, de la famille Écureuil. Il est fabriqué à Marignane, près de Marseille.", en: "Here is your helicopter: the H125, from the Écureuil family. It is made in Marignane, near Marseille." },
    parties: { fr: 'Touche chaque partie pour savoir à quoi elle sert.', en: 'Touch each part to find out what it does.' },
    mission: { fr: 'Choisis la mission de ton Écureuil.', en: 'Choose a mission for your Écureuil.' },
    couleur: { fr: 'Et maintenant, choisis sa couleur.', en: 'Now choose its colour.' },
    fin: { fr: "Ton Écureuil est prêt ! Voici l'écusson de ta mission pour ton carnet de pilote.", en: 'Your Écureuil is ready! Here is your mission patch for your pilot logbook.' },
  };

  const VOL = {
    question: { fr: 'Avant de commencer, une question : pour monter, le rotor tourne-t-il plus vite ?', en: 'First, a question: to go up, does the rotor spin faster?' },
    reponses: [
      { id: 'oui', nom: { fr: 'Oui', en: 'Yes' } },
      { id: 'non', nom: { fr: 'Non', en: 'No' } },
      { id: 'sais-pas', nom: { fr: 'Je ne sais pas', en: "I'm not sure" } },
    ],
    garde: { fr: "Je garde ta réponse. On y reviendra à la fin !", en: "I'll keep your answer. We'll come back to it at the end!" },
    ecrans: [
      { id: 'air', fr: "Les pales poussent l'air vers le bas. Alors l'air pousse l'hélicoptère vers le haut.", en: 'The blades push the air down, so the air pushes the helicopter up.' },
      { id: 'tours', fr: 'Le rotor de ton Écureuil tourne toujours presque à la même vitesse : de 375 à 405 tours par minute. Plus de 6 tours chaque seconde !', en: "Your Écureuil's rotor always turns at almost the same speed: 375 to 405 turns a minute. More than 6 turns every second!" },
      { id: 'pas', fr: "Alors comment monter ? Le pilote incline les pales. Une pale plus inclinée pousse plus d'air vers le bas.", en: 'So how does it go up? The pilot tilts the blades. A more tilted blade pushes more air down.' },
      { id: 'main', fr: "Essaie avec ta main, par la fenêtre d'une voiture avec un adulte, ou en courant : à plat, elle fend l'air ; penchée, tu sens l'air pousser.", en: 'Try it with your hand, out of a car window with a grown-up, or while running: flat, it slices the air; tilted, you feel the air push.' },
      { id: 'trois', fr: "Ton Écureuil a trois pales. Le collectif les incline toutes les trois en même temps : c'est pour ça qu'il s'appelle le collectif.", en: "Your Écureuil has three blades. The collective lever tilts all three at once: that's why it's called the collective." },
      { id: 'queue', fr: "Quand le grand rotor tourne, la cabine voudrait tourner dans l'autre sens. Le petit rotor de queue pousse pour l'en empêcher.", en: 'When the big rotor turns, the cabin wants to spin the other way. The little tail rotor pushes to stop it.' },
      { id: 'chaise', fr: "Essaie sur une chaise de bureau qui tourne, avec un adulte : fais tourner tes bras d'un côté, et la chaise part de l'autre.", en: 'Try it on a spinning office chair, with a grown-up: swing your arms one way, and the chair turns the other way.' },
      { id: 'avancer', fr: "Pour avancer, le pilote penche les pales vers l'avant, avec le manche. L'hélicoptère suit.", en: 'To go forward, the pilot tilts the spinning blades forward with the cyclic stick. The helicopter follows.' },
    ],
    retour: {
      oui: { fr: 'Tu pensais que le rotor tourne plus vite. En fait, non : il garde sa vitesse, ce sont les pales qui s\'inclinent. Les scientifiques sont souvent surpris !', en: 'You thought the rotor spins faster. In fact, it does not: it keeps its speed, and the blades tilt. Scientists are often surprised!' },
      non: { fr: "Tu avais raison : le rotor garde sa vitesse, ce sont les pales qui s'inclinent.", en: 'You were right: the rotor keeps its speed, and the blades tilt.' },
      'sais-pas': { fr: "Maintenant tu sais : le rotor garde sa vitesse, ce sont les pales qui s'inclinent.", en: 'Now you know: the rotor keeps its speed, and the blades tilt.' },
    },
    fin: { fr: "Bravo ! Voici l'autocollant de l'Écureuil pour ton carnet.", en: 'Well done! Here is the Écureuil sticker for your logbook.' },
  };

  /* Le cockpit : un guidage commande par commande, puis Henri apprend à Moussi (D-25), puis le vol libre. */
  const COCKPIT = {
    intro: { fr: 'Voici le cockpit. Le collectif à ta main gauche, le manche à ta main droite, les pédales sous tes pieds.', en: 'Here is the cockpit. The collective lever in your left hand, the cyclic stick in your right hand, the pedals under your feet.' },
    tours: { fr: 'Regarde le compteur de tours : il ne bouge pas. Le rotor garde toujours sa vitesse.', en: 'Look at the rotor counter: it does not move. The rotor always keeps its speed.' },
    guide: {
      collectif: { fr: 'Garde le doigt sur la flèche du haut du collectif.', en: 'Hold the top arrow of the collective lever.' },
      manche: { fr: 'Maintenant, pousse le manche vers l\'avant et garde le doigt dessus.', en: 'Now push the cyclic stick forward and hold it.' },
      pedales: { fr: 'Et maintenant, appuie sur une pédale et garde le pied dessus.', en: 'And now, press a pedal and hold it.' },
    },
    lache: { fr: "Quand tu lâches, l'hélicoptère s'arrête et reste en l'air. C'est plus simple que dans le vrai !", en: "When you let go, the helicopter stops and stays in the air. It's simpler than the real thing!" },
    enseigner: {
      collectif: {
        demande: { fr: 'À moi ! Je veux monter... Ce sont les pédales, non ? Montre-moi !', en: 'My turn! I want to go up... Is it the pedals? Show me!' },
        merci: { fr: 'Merci, instructeur ! Le collectif fait monter.', en: 'Thank you, instructor! The collective lever takes us up.' },
      },
      manche: {
        demande: { fr: 'Je veux avancer... Je pousse le collectif ? Montre-moi !', en: 'I want to go forward... Do I push the collective lever? Show me!' },
        merci: { fr: 'Merci, instructeur ! Le manche fait avancer.', en: 'Thank you, instructor! The cyclic stick takes us forward.' },
      },
      pedales: {
        demande: { fr: 'Je veux tourner le nez... C\'est le manche ? Montre-moi !', en: 'I want to turn the nose... Is it the cyclic stick? Show me!' },
        merci: { fr: 'Merci, instructeur ! Les pédales font tourner le nez.', en: 'Thank you, instructor! The pedals turn the nose.' },
      },
    },
    encore: { fr: 'Hum, regardons encore. Celle qui brille !', en: "Hmm, let's look again. The shiny one!" },
    libre: { fr: 'À toi de voler librement ! Le sol arrête toujours la descente.', en: 'Now fly freely! The ground always stops you going down.' },
    sol: { fr: "D'abord, monte avec le collectif !", en: 'First, go up with the collective lever!' },
    vrai: { fr: 'Dans un vrai hélicoptère, le pilote bouge souvent plusieurs commandes en même temps. Ici, on les apprend une par une.', en: 'In a real helicopter, the pilot often moves several controls at once. Here we learn them one by one.' },
    fin: { fr: 'Bravo, pilote ! Voici tes ailes pour ton carnet.', en: 'Well done, pilot! Here are your wings for your logbook.' },
  };

  /* L'atelier : le manuel illustré, puis l'expérience (D-24, point 2). */
  const ATELIER = {
    ouvert: { fr: "Tu as exploré ton hélicoptère. À toi d'en fabriquer un !", en: "You've explored your helicopter. Time to build one!" },
    manuel: [
      { fr: "Imprime le gabarit sur une feuille A4, avec un adulte. Il y a trois modèles : pales courtes, moyennes et longues.", en: 'Print the template on an A4 sheet, with a grown-up. There are three models: short, medium and long blades.' },
      { fr: 'Découpe chaque modèle le long des traits pleins.', en: 'Cut out each model along the solid lines.' },
      { fr: "Coupe entre les deux pales, jusqu'au bout du trait.", en: 'Cut between the two blades, to the end of the line.' },
      { fr: "Plie une pale vers l'avant et l'autre vers l'arrière, sur les pointillés.", en: 'Fold one blade forwards and the other backwards, on the dotted lines.' },
      { fr: 'Plie les deux côtés du corps vers le milieu.', en: 'Fold both sides of the body into the middle.' },
      { fr: 'Replie le bas vers le haut et fixe-le avec un trombone.', en: 'Fold up the bottom and hold it with a paper clip.' },
      { fr: 'Lâche-le de haut : il tourne en tombant !', en: 'Drop it from up high: it spins as it falls!' },
    ],
    question: { fr: "Des pales plus longues font-elles tomber l'hélicoptère en papier plus lentement ?", en: 'Do longer blades make the paper helicopter fall more slowly?' },
    hypotheses: [
      { id: 'lent', nom: { fr: 'Plus lentement', en: 'More slowly' } },
      { id: 'vite', nom: { fr: 'Plus vite', en: 'Faster' } },
      { id: 'pareil', nom: { fr: 'Pareil', en: 'The same' } },
    ],
    pourquoi: { fr: 'Dis pourquoi à voix haute, à quelqu\'un ou à Moussi.', en: 'Say why out loud, to someone or to Moussi.' },
    verifs: [
      { id: 'papier', fr: 'Le même papier', en: 'The same paper' },
      { id: 'trombone', fr: 'Le même trombone', en: 'The same paper clip' },
      { id: 'hauteur', fr: 'La même hauteur', en: 'The same height' },
      { id: 'facon', fr: 'La même façon de lâcher', en: 'The same way of dropping' },
    ],
    une_chose: { fr: 'Une seule chose change : la longueur des pales. Tout le reste est pareil.', en: 'Only one thing changes: the length of the blades. Everything else stays the same.' },
    essai: { fr: 'Premier essai : lâche deux modèles en même temps, un dans chaque main. Lequel touche le sol en premier ?', en: 'First try: drop two models at the same time, one in each hand. Which one lands first?' },
    mesurer: { fr: "Maintenant on mesure. Une personne lâche, l'autre chronomètre : trois fois pour chaque modèle.", en: 'Now we measure. One person drops it, the other times it: three times for each model.' },
    modeles: [
      { id: 'court', cm: 6, nom: { fr: 'Pales courtes', en: 'Short blades' } },
      { id: 'moyen', cm: 8, nom: { fr: 'Pales moyennes', en: 'Medium blades' } },
      { id: 'long', cm: 10, nom: { fr: 'Pales longues', en: 'Long blades' } },
    ],
    varient: { fr: "Les trois mesures ne sont jamais tout à fait pareilles : c'est normal. C'est pour ça qu'on mesure trois fois.", en: "The three measurements are never exactly the same: that's normal. That's why we measure three times." },
    rappel: {
      lent: { fr: 'Tu avais pensé : plus lentement. Qu\'en dis-tu maintenant ?', en: 'You thought: more slowly. What do you think now?' },
      vite: { fr: 'Tu avais pensé : plus vite. Qu\'en dis-tu maintenant ?', en: 'You thought: faster. What do you think now?' },
      pareil: { fr: 'Tu avais pensé : pareil. Qu\'en dis-tu maintenant ?', en: 'You thought: the same. What do you think now?' },
    },
    conclusions: [
      { id: 'raison', nom: { fr: "J'avais raison", en: 'I was right' } },
      { id: 'surpris', nom: { fr: "J'ai été surpris", en: 'I was surprised' } },
    ],
    surpris: { fr: 'Les scientifiques sont souvent surpris ! Une hypothèse fausse, c\'est une découverte.', en: 'Scientists are often surprised! A wrong guess is a discovery.' },
    raison: { fr: 'Bien vu ! Les mesures le montrent.', en: 'Well spotted! The measurements show it.' },
    cahier: { fr: 'Écris ta conclusion sur ton cahier, avec un dessin de ton modèle.', en: 'Write your conclusion in your notebook, with a drawing of your model.' },
    autorotation: { fr: "Ton modèle en papier ne vole pas : il tombe doucement parce que l'air qui monte fait tourner ses pales. Un vrai hélicoptère dont le moteur s'arrête peut faire pareil : l'air fait tourner le rotor. Ça s'appelle l'autorotation.", en: "Your paper model doesn't fly: it falls gently because the air rushing up turns its blades. A real helicopter whose engine stops can do the same: the air turns the rotor. It's called autorotation." },
    fin: { fr: 'Bravo, scientifique ! Voici le trombone doré pour ton carnet.', en: 'Well done, scientist! Here is the golden paper clip for your logbook.' },
  };

  /* Qui décide où on vole : trois idées jouées en scène radio (D-24, point 3). Henri joue la tour. */
  const RADIO = {
    intro: { fr: "Moussi pilote l'Écureuil, et toi, tu es dans la tour de contrôle de l'aéroport.", en: "Moussi is flying the Écureuil, and you are in the airport's control tower." },
    scenes: [
      { id: 'tour',
        demande: { fr: 'Tour, ici Moussi dans l\'Écureuil. Je peux décoller ?', en: 'Tower, this is Moussi in the Écureuil. May I take off?' },
        choix: [
          { id: 'oui', bon: true, nom: { fr: 'Autorisé à décoller', en: 'Cleared for take-off' } },
          { id: 'attends', bon: true, nom: { fr: 'Attendez', en: 'Please wait' } },
        ],
        reponses: {
          oui: { fr: 'Merci, la tour ! Je décolle.', en: 'Thank you, tower! Taking off.' },
          attends: { fr: "D'accord, j'attends que la tour me dise oui.", en: "All right, I'll wait until the tower says yes." },
        },
        idee: { fr: "À un aéroport avec une tour de contrôle, c'est le contrôleur qui dit oui ou non, par radio, pour décoller et pour atterrir.", en: 'At an airport with a control tower, the controller says yes or no by radio, to take off and to land.' } },
      { id: 'champ',
        demande: { fr: 'Je voudrais me poser dans ce champ. Qui doit être d\'accord ?', en: "I'd like to land in this field. Who has to agree?" },
        choix: [
          { id: 'proprio', bon: true, nom: { fr: 'Le propriétaire du champ', en: 'The owner of the field' } },
          { id: 'personne', bon: false, nom: { fr: 'Personne', en: 'Nobody' } },
          { id: 'passant', bon: false, nom: { fr: 'Le premier passant', en: 'Anyone walking by' } },
        ],
        reponses: {
          proprio: { fr: 'Bien sûr ! Je demande au propriétaire.', en: 'Of course! I will ask the owner.' },
          aide: { fr: "Presque ! C'est le propriétaire du champ qui doit être d'accord.", en: 'Nearly! The owner of the field has to agree.' },
        },
        idee: { fr: "Loin des aéroports, un hélicoptère peut se poser sur un terrain si celui à qui il appartient est d'accord. Pour un sauvetage, pas besoin de demander avant.", en: "Away from airports, a helicopter can land on a piece of land if its owner agrees. For a rescue, there's no need to ask first." } },
      { id: 'brevet',
        demande: { fr: 'Est-ce que les enfants peuvent piloter un vrai hélicoptère ?', en: 'Can children fly a real helicopter?' },
        choix: [
          { id: 'pas-encore', bon: true, nom: { fr: 'Pas encore : à 17 ans', en: 'Not yet: at 17' } },
          { id: 'tout-de-suite', bon: false, nom: { fr: 'Oui, tout de suite', en: 'Yes, right now' } },
        ],
        reponses: {
          'pas-encore': { fr: "C'est ça ! Il faut attendre 17 ans.", en: "That's right! You have to wait until 17." },
          aide: { fr: 'Presque ! Il faut avoir au moins 17 ans.', en: 'Nearly! You must be at least 17.' },
        },
        idee: { fr: 'Pour avoir son brevet de pilote, il faut prendre des leçons avec un instructeur, réussir un examen, et avoir au moins 17 ans.', en: "To get a pilot's licence, you take lessons with an instructor, pass an exam, and you must be at least 17." } },
    ],
    fin: { fr: 'Bravo, contrôleur ! Voici le casque radio pour ton carnet.', en: 'Well done, controller! Here is the radio headset for your logbook.' },
  };

  /* Les records et faits étonnants, en comparaisons (D-24) ; sources dans README.md. */
  const RECORDS = {
    ecrans: [
      { id: 'altitude', fr: "Le plus haut qu'un hélicoptère soit jamais monté : 12 442 mètres, en 1972, avec le pilote Jean Boulet, sur un Lama français. C'est plus haut que l'Everest, la plus haute montagne du monde : 8 848 mètres !", en: 'The highest a helicopter has ever flown: 12,442 metres, in 1972, with pilot Jean Boulet in a French Lama. That is higher than Everest, the highest mountain in the world: 8,848 metres!' },
      { id: 'everest', fr: "En 2005, le pilote Didier Delsalle a posé un Écureuil tout en haut de l'Everest, puis il a redécollé. Personne n'a fait mieux depuis !", en: 'In 2005, pilot Didier Delsalle landed an Écureuil right on top of Everest, then took off again. Nobody has done better since!' },
      { id: 'vitesse', fr: "L'hélicoptère le plus rapide : plus de 400 km/h, en 1986, un Lynx britannique. C'est plus de trois fois la vitesse d'une voiture sur l'autoroute, 130 km/h.", en: 'The fastest helicopter: more than 400 km/h, in 1986, a British Lynx. That is more than three times as fast as a car on the motorway in France, 130 km/h.' },
      { id: 'croisiere', fr: "Ton Écureuil vole jusqu'à 252 km/h : presque deux fois plus vite qu'une voiture sur l'autoroute.", en: 'Your Écureuil cruises at up to 252 km/h: almost twice as fast as a car on the motorway.' },
      { id: 'famille', fr: 'Plus de 7 200 hélicoptères de la famille Écureuil ont été livrés dans le monde.', en: 'More than 7,200 helicopters of the Écureuil family have been delivered around the world.' },
      { id: 'drone', fr: "Et un drone ? Personne n'est à bord : un pilote le dirige depuis le sol, en le regardant voler. Les petits drones doivent rester à moins de 120 mètres du sol. Un hélicoptère emporte son pilote, et il peut monter bien plus haut.", en: 'And a drone? Nobody is on board: a pilot flies it from the ground, watching it fly. Small drones must stay less than 120 metres above the ground. A helicopter carries its pilot, and it can go much higher.' },
    ],
    fin: { fr: "Bravo ! Voici la médaille de l'Everest pour ton carnet.", en: 'Well done! Here is the Everest medal for your logbook.' },
  };

  /* La sortie : présentée comme une sortie à faire en famille, sans horaires (D-24). */
  const SORTIE = {
    intro: { fr: "Une sortie à faire en famille : le Musée de l'Aviation de Saint-Victoret, près de Marignane. On y voit un Écureuil AS 350 B3, le grand frère de ton H125, et aussi des Alouette, des Gazelle et un Dauphin.", en: "A trip to make with your family: the Aviation Museum in Saint-Victoret, near Marignane. You can see an Écureuil AS 350 B3, your H125's big brother, and also Alouettes, Gazelles and a Dauphin." },
    parents: { fr: 'Demande à tes parents de préparer la visite.', en: 'Ask your parents to plan the visit.' },
    chercher: { fr: "Ta mission au musée : trouve ces parties sur l'Écureuil. Un parent coche sur place.", en: 'Your mission at the museum: find these parts on the Écureuil. A grown-up ticks them on the spot.' },
    fin: { fr: 'Quelle sortie ! Voici le billet du musée pour ton carnet.', en: 'What a trip! Here is the museum ticket for your logbook.' },
  };

  /* Le carnet de pilote (D-25) : deux pages, celle d'Henri et celle de Moussi, un tampon par
     commande maîtrisée sur chacune ; on passe le brevet ensemble. */
  const CARNET = {
    titre: { fr: 'Notre carnet de pilote', en: 'Our pilot logbook' },
    ensemble: { fr: 'Moussi et toi passez votre brevet ensemble. Un tampon par commande que vous savez bien.', en: 'Moussi and you are getting your licence together. One stamp for each control you know well.' },
    nouveau: { fr: 'Un nouveau tampon ! On l\'a eu ensemble !', en: 'A new stamp! We got it together!' },
    objet: { fr: 'Un nouvel objet pour ton carnet !', en: 'Something new for your logbook!' },
  };

  /* ---------- Le prototype 3D (D-26) : un vol d'Écureuil en cinq missions ----------
     Aucun chiffre : chaque phrase redit une idée déjà sourcée dans README.md (le rotor garde sa vitesse,
     les pales inclinées poussent l'air vers le bas, le manche penche le disque, les pédales et le rotor de
     queue, la tour dit oui par radio). `nom` : le titre d'une mission, écrit, jamais dit. Moussi demande à
     Henri de lui montrer avec les phrases de COCKPIT.enseigner (D-25). */
  const VOL3D = {
    bienvenue: { fr: 'Bienvenue à bord ! Je suis ton copilote. Touche le gros bouton pour démarrer le moteur.', en: "Welcome aboard! I'm your co-pilot. Touch the big button to start the engine." },
    demarrage: { fr: 'Le moteur démarre. Regarde le rotor prendre sa vitesse...', en: 'The engine is starting. Watch the rotor speed up...' },
    pret: { fr: 'Le rotor a pris sa vitesse. Regarde le compteur de tours : maintenant, il ne bougera plus !', en: "The rotor is up to speed. Look at the rotor counter: now it won't move any more!" },
    missions: {
      decoller: {
        nom: { fr: 'Décoller', en: 'Take off' },
        consigne: { fr: 'Première mission : décolle ! Monte doucement le collectif, le levier bleu à ta main gauche.', en: 'First mission: take off! Slowly raise the collective lever, the blue lever in your left hand.' },
        aide: { fr: 'Pose ton doigt sur le levier bleu et fais-le glisser vers le haut.', en: 'Put your finger on the blue lever and slide it up.' },
        bravo: { fr: "On monte ! Tu as levé le collectif : les pales s'inclinent et poussent plus d'air vers le bas. Et le compteur de tours n'a pas bougé !", en: "We're going up! You raised the collective lever: the blades tilt and push more air down. And the rotor counter didn't move!" },
      },
      stationnaire: {
        nom: { fr: 'Rester au-dessus du H', en: 'Hover over the H' },
        consigne: { fr: "Deuxième mission : reste en l'air, juste au-dessus du H. Le levier au milieu, et on ne bouge plus.", en: 'Second mission: stay in the air, right above the H. Lever in the middle, and keep still.' },
        aide: { fr: "Mets le levier bleu au milieu, sur la bande claire, et lâche le manche : l'hélicoptère s'arrête tout seul.", en: 'Put the blue lever in the middle, on the light band, and let go of the stick: the helicopter stops by itself.' },
        bravo: { fr: "Bravo ! Tu restes sur place, en l'air : c'est le vol stationnaire. Les pales poussent l'air vers le bas juste assez pour nous porter.", en: "Well done! You're staying still in the air: that's hovering. The blades push the air down just enough to hold us up." },
      },
      tour: {
        nom: { fr: 'Aller à la tour', en: 'Fly to the tower' },
        consigne: { fr: "Troisième mission : avance jusqu'à la tour de contrôle avec le manche, à ta main droite. Puis appelle la tour à la radio.", en: 'Third mission: fly to the control tower with the cyclic stick, in your right hand. Then call the tower on the radio.' },
        aide: { fr: "Pousse le manche violet vers le haut : le disque des pales penche vers l'avant, et l'hélicoptère avance.", en: 'Push the purple stick up: the spinning blades tilt forward, and the helicopter moves forward.' },
        radio: { fr: 'On est près de la tour. Touche le bouton radio pour demander la permission !', en: "We're near the tower. Touch the radio button to ask permission!" },
        bravo: { fr: "La tour a dit oui, par radio. À un aéroport, c'est le contrôleur qui décide !", en: 'The tower said yes, by radio. At an airport, the controller decides!' },
      },
      tourner: {
        nom: { fr: 'Tourner sur place', en: 'Turn on the spot' },
        consigne: { fr: 'Quatrième mission : tourne sur place avec les pédales, pour regarder vers le H.', en: 'Fourth mission: turn on the spot with the pedals, to face the H.' },
        aide: { fr: 'Garde le doigt sur une pédale orange : le rotor de queue pousse, et le nez tourne.', en: 'Hold an orange pedal: the tail rotor pushes, and the nose turns.' },
        bravo: { fr: 'Les pédales changent la poussée du rotor de queue : le nez tourne, sans avancer. Le H est devant nous !', en: 'The pedals change how hard the tail rotor pushes: the nose turns without moving forward. The H is in front of us!' },
      },
      poser: {
        nom: { fr: 'Se poser sur le H', en: 'Land on the H' },
        consigne: { fr: 'Dernière mission : reviens au-dessus du H avec le manche, puis baisse doucement le collectif pour te poser.', en: 'Last mission: fly back over the H with the stick, then slowly lower the collective lever to land.' },
        aide: { fr: "Avance jusqu'au cercle doré, puis fais glisser le levier bleu vers le bas.", en: 'Fly to the golden ring, then slide the blue lever down.' },
        bravo: { fr: 'Posé tout en douceur ! Tu as baissé le collectif : les pales poussent moins, et on descend.', en: 'A soft landing! You lowered the collective lever: the blades push less, and down we go.' },
      },
    },
    radio: {
      moussi: { fr: "Tour, ici Moussi dans l'Écureuil. Je peux me poser sur le H ?", en: 'Tower, this is Moussi in the Écureuil. May I land on the H?' },
      tour: { fr: 'Écureuil, ici la tour : autorisé à atterrir sur le H.', en: 'Écureuil, this is the tower: cleared to land on the H.' },
      merci: { fr: 'Merci, la tour !', en: 'Thank you, tower!' },
    },
    coupe: { fr: 'On coupe le moteur. Regarde le rotor ralentir : tu vois ses trois pales ?', en: 'Engine off. Watch the rotor slow down: can you see its three blades?' },
    fin: { fr: 'Bravo, pilote ! Toutes nos missions sont dans le carnet. On refait un vol ?', en: 'Well done, pilot! All our missions are in the logbook. Shall we fly again?' },
    libre: { fr: 'Vol libre ! Va où tu veux : le sol arrête toujours la descente.', en: 'Free flight! Go wherever you like: the ground always stops you going down.' },
    air: { fr: "Tu vois l'air poussé vers le bas ? C'est lui qui nous porte !", en: "See the air being pushed down? That's what holds us up!" },
    haut: { fr: 'Waouh, regarde comme on est haut ! On voit la montagne, tout là-bas.', en: 'Wow, look how high we are! We can see the mountain, far away.' },
    montrer: { fr: 'Regarde, je te montre où toucher.', en: "Look, I'll show you where to touch." },
    tampon: { fr: 'Un tampon pour notre carnet de pilote !', en: 'A stamp for our pilot logbook!' },
    deja: { fr: 'Encore réussi ! Ce tampon est déjà dans notre carnet.', en: 'Done again! This stamp is already in our logbook.' },
    rigolo: {
      wiii: { fr: 'Wiiiiii !', en: 'Wheeeee!' },
      vert: { fr: 'Oh là là, ça tourne... je suis tout vert !', en: "Oh dear, it's spinning... I've gone all green!" },
      casque: { fr: 'Oups, mon casque ! Rattrapé !', en: 'Oops, my headset! Got it!' },
      mouette: { fr: 'Oh, une mouette ! Salut, la mouette !', en: 'Oh, a seagull! Hello, seagull!' },
      atchoum: { fr: 'Atchoum ! Que de poussière !', en: 'Atchoo! So much dust!' },
      tour: { fr: 'Oups, la tour ! On recule un peu.', en: "Oops, the tower! Let's back off a little." },
      bord: { fr: 'On va trop loin ! Faisons demi-tour.', en: "We're going too far! Let's turn back." },
    },
  };

  /* ---------- Les cartes de Leitner : une vingtaine (D-24) ----------
     type : partie (une partie montrée sur le dessin), choix (trois réponses écrites), commande
     (Moussi veut faire quelque chose et demande à Henri de lui montrer la bonne commande, D-25).
     Chaque carte appartient à une étape et ne revient qu'une fois l'étape faite. */
  const P = id => PARTIES.find(p => p.id === id).nom;
  const C = id => COMMANDES.find(c => c.id === id).nom;
  const QUELLE_PARTIE = { fr: 'Comment s\'appelle cette partie ?', en: 'What is this part called?' };
  const CARTES = [
    { id: 'p-pales', etape: 'helico', type: 'partie', partie: 'pales', q: QUELLE_PARTIE, bon: 'a',
      choix: { a: P('pales'), b: P('patins'), c: P('poutre') }, aide: PARTIES[0].dit },
    { id: 'p-queue', etape: 'helico', type: 'partie', partie: 'queue', q: QUELLE_PARTIE, bon: 'a',
      choix: { a: P('queue'), b: P('pales'), c: P('cabine') }, aide: PARTIES[1].dit },
    { id: 'p-patins', etape: 'helico', type: 'partie', partie: 'patins', q: QUELLE_PARTIE, bon: 'a',
      choix: { a: P('patins'), b: P('poutre'), c: P('queue') }, aide: PARTIES[2].dit },
    { id: 'p-cabine', etape: 'helico', type: 'partie', partie: 'cabine', q: QUELLE_PARTIE, bon: 'a',
      choix: { a: P('cabine'), b: P('patins'), c: P('pales') }, aide: PARTIES[3].dit },
    { id: 'p-poutre', etape: 'helico', type: 'partie', partie: 'poutre', q: QUELLE_PARTIE, bon: 'a',
      choix: { a: P('poutre'), b: P('cabine'), c: P('queue') }, aide: PARTIES[4].dit },

    { id: 'f-pales', etape: 'vol', type: 'choix', q: { fr: 'À quoi servent les pales ?', en: 'What do the blades do?' }, bon: 'a',
      choix: { a: { fr: "Pousser l'air vers le bas", en: 'Push the air down' }, b: { fr: 'Freiner', en: 'Slow it down' }, c: { fr: 'Éclairer la nuit', en: 'Light up the night' } },
      aide: VOL.ecrans[0] },
    { id: 'f-queue', etape: 'vol', type: 'choix', q: { fr: 'À quoi sert le rotor de queue ?', en: 'What does the tail rotor do?' }, bon: 'a',
      choix: { a: { fr: 'Empêcher la cabine de tourner', en: 'Stop the cabin spinning' }, b: { fr: 'Pousser vers l\'avant', en: 'Push it forward' }, c: { fr: 'Faire monter', en: 'Make it go up' } },
      aide: VOL.ecrans[5] },
    { id: 'f-nb-pales', etape: 'vol', type: 'choix', q: { fr: 'Combien de pales a ton Écureuil ?', en: 'How many blades does your Écureuil have?' }, bon: 'b',
      choix: { a: { fr: '2', en: '2' }, b: { fr: '3', en: '3' }, c: { fr: '5', en: '5' } },
      aide: VOL.ecrans[4] },
    { id: 'f-monter', etape: 'vol', type: 'choix', q: { fr: 'Pour monter, que fait le pilote ?', en: 'To go up, what does the pilot do?' }, bon: 'a',
      choix: { a: { fr: 'Il incline les pales', en: 'Tilts the blades' }, b: { fr: 'Il fait tourner le rotor plus vite', en: 'Spins the rotor faster' }, c: { fr: 'Il ouvre les portes', en: 'Opens the doors' } },
      aide: VOL.ecrans[2] },

    { id: 'c-collectif', etape: 'cockpit', type: 'choix', commande: 'collectif', q: { fr: 'Que fait le collectif ?', en: 'What does the collective lever do?' }, bon: 'a',
      choix: { a: { fr: 'Monter ou descendre', en: 'Go up or down' }, b: { fr: 'Avancer', en: 'Go forward' }, c: { fr: 'Tourner le nez', en: 'Turn the nose' } },
      aide: COMMANDES[0].effet },
    { id: 'c-manche', etape: 'cockpit', type: 'choix', commande: 'manche', q: { fr: 'Que fait le manche ?', en: 'What does the cyclic stick do?' }, bon: 'b',
      choix: { a: { fr: 'Monter ou descendre', en: 'Go up or down' }, b: { fr: 'Avancer, reculer, glisser', en: 'Go forward, back, sideways' }, c: { fr: 'Tourner le nez', en: 'Turn the nose' } },
      aide: COMMANDES[1].effet },
    { id: 'c-pedales', etape: 'cockpit', type: 'choix', commande: 'pedales', q: { fr: 'Que font les pédales ?', en: 'What do the pedals do?' }, bon: 'c',
      choix: { a: { fr: 'Monter ou descendre', en: 'Go up or down' }, b: { fr: 'Avancer', en: 'Go forward' }, c: { fr: 'Tourner le nez', en: 'Turn the nose' } },
      aide: COMMANDES[2].effet },
    { id: 'c-monter', etape: 'cockpit', type: 'commande', commande: 'collectif', bon: 'collectif',
      q: { fr: 'Moussi veut monter. Il hésite : les pédales ? Montre-lui la bonne commande !', en: 'Moussi wants to go up. He is not sure: the pedals? Show him the right control!' },
      aide: COMMANDES[0].effet, merci: COCKPIT.enseigner.collectif.merci },
    { id: 'c-avancer', etape: 'cockpit', type: 'commande', commande: 'manche', bon: 'manche',
      q: { fr: 'Moussi veut avancer. Il hésite : le collectif ? Montre-lui la bonne commande !', en: 'Moussi wants to go forward. He is not sure: the collective lever? Show him the right control!' },
      aide: COMMANDES[1].effet, merci: COCKPIT.enseigner.manche.merci },
    { id: 'c-tourner', etape: 'cockpit', type: 'commande', commande: 'pedales', bon: 'pedales',
      q: { fr: 'Moussi veut tourner le nez. Il hésite : le manche ? Montre-lui la bonne commande !', en: 'Moussi wants to turn the nose. He is not sure: the cyclic stick? Show him the right control!' },
      aide: COMMANDES[2].effet, merci: COCKPIT.enseigner.pedales.merci },

    { id: 'r-tour', etape: 'radio', type: 'choix', q: { fr: "À l'aéroport, qui dit oui pour décoller ?", en: 'At the airport, who says yes to take off?' }, bon: 'b',
      choix: { a: { fr: 'Le pilote tout seul', en: 'The pilot alone' }, b: { fr: 'La tour de contrôle', en: 'The control tower' }, c: { fr: 'Les passagers', en: 'The passengers' } },
      aide: RADIO.scenes[0].idee },
    { id: 'r-champ', etape: 'radio', type: 'choix', q: { fr: 'Pour se poser dans un champ, qui doit être d\'accord ?', en: 'To land in a field, who has to agree?' }, bon: 'a',
      choix: { a: RADIO.scenes[1].choix[0].nom, b: RADIO.scenes[1].choix[1].nom, c: RADIO.scenes[1].choix[2].nom },
      aide: RADIO.scenes[1].idee },
    { id: 'r-age', etape: 'radio', type: 'choix', q: { fr: 'À quel âge peut-on avoir son brevet de pilote, au plus tôt ?', en: "What is the youngest age to get a pilot's licence?" }, bon: 'b',
      choix: { a: { fr: '10 ans', en: '10' }, b: { fr: '17 ans', en: '17' }, c: { fr: '30 ans', en: '30' } },
      aide: RADIO.scenes[2].idee },

    { id: 'x-altitude', etape: 'records', type: 'choix', q: { fr: "Le record de hauteur en hélicoptère : plus haut ou plus bas que l'Everest ?", en: 'The helicopter height record: higher or lower than Everest?' }, bon: 'a',
      choix: { a: { fr: 'Plus haut', en: 'Higher' }, b: { fr: 'Plus bas', en: 'Lower' }, c: { fr: 'Pareil', en: 'The same' } },
      aide: RECORDS.ecrans[0] },
    { id: 'x-everest', etape: 'records', type: 'choix', q: { fr: "Où un Écureuil s'est-il posé en 2005 ?", en: 'Where did an Écureuil land in 2005?' }, bon: 'a',
      choix: { a: { fr: "En haut de l'Everest", en: 'On top of Everest' }, b: { fr: 'Sur un bateau', en: 'On a boat' }, c: { fr: 'Sur la tour Eiffel', en: 'On the Eiffel Tower' } },
      aide: RECORDS.ecrans[1] },
    { id: 'x-vitesse', etape: 'records', type: 'choix', q: { fr: "L'hélicoptère le plus rapide va combien de fois plus vite qu'une voiture sur l'autoroute ?", en: 'How many times faster than a car on the motorway is the fastest helicopter?' }, bon: 'b',
      choix: { a: { fr: '2 fois', en: '2 times' }, b: { fr: 'Plus de 3 fois', en: 'More than 3 times' }, c: { fr: '10 fois', en: '10 times' } },
      aide: RECORDS.ecrans[2] },
    { id: 'x-drone', etape: 'records', type: 'choix', q: { fr: "Où est le pilote d'un drone ?", en: "Where is a drone's pilot?" }, bon: 'a',
      choix: { a: { fr: 'Au sol', en: 'On the ground' }, b: { fr: 'À bord', en: 'On board' }, c: { fr: 'Dans la tour', en: 'In the tower' } },
      aide: RECORDS.ecrans[5] },
  ];

  /* Étiquettes d'interface du module, jamais dites à voix haute. */
  const UI = {
    fr: {
      titre: 'Mon hélicoptère', etapes: 'Mes étapes', plus_tard: 'Plus tard', fait: 'Fait', carnet: 'Mon carnet de pilote',
      revoir: 'Revoir', suivant: 'Suite', terminer: 'Terminer', cartes: 'Cartes du jour', rien: 'Aucune carte aujourd\'hui',
      cartes_n: 'cartes', parties_vues: 'Parties', imprimer: 'Imprimer le gabarit', gabarit: 'Le gabarit',
      atelier_ferme: "S'ouvre après les trois premières étapes", mesure: 'Mesure', partez: 'Partez !', au_sol: 'Au sol !',
      taper: 'Taper la durée', valider: 'Garder', refaire: 'Refaire', secondes: 's', milieu: 'Durée du milieu',
      on_y_est_alle: 'Nous y sommes allés !', libre: 'Vol libre', collectif_haut: 'Monter', collectif_bas: 'Descendre',
      avant: 'Avant', arriere: 'Arrière', gauche: 'Gauche', droite: 'Droite', tours: 'Tours du rotor', inclinaison: 'Les pales',
      nom_pilote: 'Nom du pilote', pilote_moussi: 'Moussi, copilote', vue_dessus: 'Vu de dessus', manuel: 'Le manuel',
      experience: "L'expérience", objets: 'Mes objets', apprends: 'Apprends à Moussi', choix_mission: 'Mission', choix_couleur: 'Couleur',
      plier: 'pointillés : plier', couper: 'traits pleins : couper', trombone: 'trombone', fichier: 'Le fichier',
      demarrer: 'Démarrer', radio: 'Appeler la tour', encore: 'Encore un vol', vols: 'Nos vols', version2d: 'La version 2D',
      pas3d: 'Cet appareil ne sait pas afficher la 3D.', continuer: 'Continuer', mission: 'Mission',
    },
    en: {
      titre: 'My helicopter', etapes: 'My steps', plus_tard: 'Later', fait: 'Done', carnet: 'My pilot logbook',
      revoir: 'Again', suivant: 'Next', terminer: 'Finish', cartes: "Today's cards", rien: 'No cards today',
      cartes_n: 'cards', parties_vues: 'Parts', imprimer: 'Print the template', gabarit: 'The template',
      atelier_ferme: 'Opens after the first three steps', mesure: 'Measurement', partez: 'Go!', au_sol: 'Landed!',
      taper: 'Type the time', valider: 'Keep', refaire: 'Redo', secondes: 's', milieu: 'Middle time',
      on_y_est_alle: 'We went!', libre: 'Free flight', collectif_haut: 'Up', collectif_bas: 'Down',
      avant: 'Forward', arriere: 'Back', gauche: 'Left', droite: 'Right', tours: 'Rotor turns', inclinaison: 'The blades',
      nom_pilote: "Pilot's name", pilote_moussi: 'Moussi, co-pilot', vue_dessus: 'Seen from above', manuel: 'The manual',
      experience: 'The experiment', objets: 'My things', apprends: 'Teach Moussi', choix_mission: 'Mission', choix_couleur: 'Colour',
      plier: 'dotted lines: fold', couper: 'solid lines: cut', trombone: 'paper clip', fichier: 'The file',
      demarrer: 'Start', radio: 'Call the tower', encore: 'Fly again', vols: 'Our flights', version2d: 'The 2D version',
      pas3d: "This device can't show 3D.", continuer: 'Carry on', mission: 'Mission',
    },
  };

  /* Le compteur de tours : il ne bouge pas (D-24, point 1). Écrit, pas dit (COCKPIT.tours le dit). */
  const COMPTEUR = { fr: 'plus de 6 tours chaque seconde', en: 'more than 6 turns every second' };

  /* Un champ { fr, en } dans la langue choisie. */
  const champ = (o, lg) => (o ? (lg === 'en' ? o.en : o.fr) : '');
  const etape = id => ETAPES.find(e => e.id === id);
  const carte = id => CARTES.find(c => c.id === id);
  const commande = id => COMMANDES.find(c => c.id === id);
  const partie = id => PARTIES.find(p => p.id === id);

  /* Toutes les phrases que le module peut dire, dans une langue, pour fabriquer les voix. Parcourt
     tout le contenu sauf les étiquettes (UI, COMPTEUR, noms des couleurs, des objets et des choix),
     qui ne se disent jamais. */
  function toutesLesPhrases(lg) {
    const l = [];
    const SANS = new Set(['nom', 'choix']);
    const visiter = (o, cle) => {
      if (!o || typeof o !== 'object' || SANS.has(cle)) return;
      if (Array.isArray(o)) { o.forEach(x => visiter(x, cle)); return; }
      if (typeof o[lg] === 'string') l.push(o[lg]);
      Object.keys(o).forEach(k => { if (k !== 'fr' && k !== 'en') visiter(o[k], k); });
    };
    [ETAPES.map(e => ({ dit: e.nom })), PARTIES, COMMANDES, MISSIONS, HELICO, VOL, COCKPIT, ATELIER, RADIO, RECORDS, SORTIE, CARNET, CARTES, VOL3D]
      .forEach(o => visiter(o, ''));
    return Array.from(new Set(l.filter(s => s && !s.includes('{'))));
  }

  racine.HeliContenu = {
    LANGUES, ETAPES, OBJETS, PARTIES, COMMANDES, MISSIONS, COULEURS, HELICO, VOL, COCKPIT, ATELIER, RADIO, RECORDS,
    SORTIE, CARNET, CARTES, VOL3D, UI, COMPTEUR, champ, etape, carte, commande, partie, toutesLesPhrases,
  };
})(typeof window !== 'undefined' ? window : globalThis);
