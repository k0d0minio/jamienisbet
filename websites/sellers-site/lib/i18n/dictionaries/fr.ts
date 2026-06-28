// French dictionary. Mirrors the structure of en.ts — the `Dictionary` type
// guarantees every key is present. Voice: plain and warm. The seller-facing copy
// uses informal "tu" (the seller is a partner); the customer pitch page uses
// polite "vous" (it's addressed to a prospect). Prices and the 10% are facts —
// kept identical.

import type { Dictionary } from "./en"

export const fr: Dictionary = {
  ogLocale: "fr_FR",

  role: "Programme d'affiliation",

  meta: {
    description:
      "Gagne 10 % en m'envoyant des projets web et logiciels dont tu parles déjà. Tu fais la mise en relation ; je cadre, je construis et je livre. Tu es payé quand le client paie.",
  },

  language: {
    label: "Changer de langue",
  },

  nav: {
    how: "Comment ça marche",
    sell: "Ce que tu vends",
    kit: "Kit du vendeur",
    faq: "FAQ",
  },

  header: {
    refer: "Recommander un client",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
  },

  footer: {
    tagline:
      "Recommande des projets web et logiciels, gagne 10 % sur ce qui est construit — payé quand le client paie. Géré depuis {location}.",
    getInTouch: "Me contacter",
  },

  themeToggle: "Basculer le thème clair ou sombre",

  copy: {
    copy: "Copier le message",
    copied: "Copié",
  },

  print: "Enregistrer en PDF",

  hero: {
    title: "Gagne 10 % en m'envoyant des projets dont tu parles déjà.",
    intro:
      "Quelqu'un que tu connais a besoin d'un site ? Fais la mise en relation. Je cadre, je construis et je livre — tu gagnes 10 % de ce que je facture, payé quand le client paie. Aucune compétence technique requise, aucun risque pour toi.",
    refer: "Recommander un client",
    how: "Comment ça marche",
  },

  howItWorks: {
    eyebrow: "Comment ça marche",
    title: "Quatre étapes, de la mise en relation à ton paiement.",
    intro:
      "Tu apportes la relation. Je fais le reste — et ton code de parrainage garantit que les 10 % sont, sans ambiguïté, à toi.",
    steps: [
      {
        key: "refer",
        title: "Tu recommandes",
        description:
          "Quelqu'un que tu connais a besoin d'un site ou d'un logiciel. Tu fais la mise en relation ici avec ton code de parrainage — c'est ce code qui rattache le paiement à toi.",
      },
      {
        key: "build",
        title: "Je cadre et je construis",
        description:
          "Je prends le relais : je parle au client, je définis un périmètre et un prix clairs, et je construis. Tu n'es responsable d'aucune partie de la livraison.",
      },
      {
        key: "pay",
        title: "Le client paie",
        description:
          "Le client paie ma facture pour le travail. Les landing pages simples démarrent à 200 € ; les projets plus importants sont devisés sur mesure.",
      },
      {
        key: "payout",
        title: "Tu reçois 10 %",
        description:
          "Tu reçois 10 % de ce que je facture, payé une fois le paiement du client encaissé — pas avant. Un relevé clair par parrain, sans avoir à relancer.",
      },
    ],
  },

  whatYouSell: {
    eyebrow: "Ce que tu vends",
    title: "Vends le simple. Le reste, passe-le-moi.",
    intro:
      "Des landing pages que tu peux deviser toi-même, à partir de 200 €. Pour tout ce qui est plus gros, présente-moi — tu gagnes toujours tes 10 %.",
    points: [
      {
        key: "landing",
        title: "Landing page + formulaire de contact",
        description:
          "La vente facile : un site d'une page, propre et rapide, avec un formulaire de contact, à partir de 200 €. Tu peux deviser toi-même n'importe quel montant à partir de 200 € — sans validation.",
      },
      {
        key: "bigger",
        title: "Quelque chose de plus gros ? Présente-moi",
        description:
          "Sites multi-pages, applications web, fonctionnalités d'IA, intégrations — ceux-là, c'est moi qui les devise. Fais simplement la mise en relation avec ton code et je reprends la conversation à partir de là. Tu gagnes toujours tes 10 %.",
      },
    ],
  },

  salesKit: {
    eyebrow: "Ton kit de vendeur",
    title: "Tout ce qu'il te faut pour faire la mise en relation.",
    intro:
      "Copie un message, envoie-le, enregistre le contact. Aucun argumentaire à mémoriser, aucune technique à expliquer — cette partie, c'est moi.",
    pitchCard: {
      title: "La page de présentation client",
      body: "Une page nette qui vend le travail, pas le programme — montre-la sur ton téléphone ou envoie le lien. Elle s'imprime aussi en une page.",
      cta: "Ouvrir la présentation",
    },
    readyEyebrow: "Messages prêts à envoyer",
    readyNoteWithCode:
      "Chaque message renvoie vers {site} — la page que voient les clients. Enregistre le contact ci-dessous avec ton code {code} pour que les 10 % restent à toi.",
    readyNote:
      "Chaque message renvoie vers {site} — la page que voient les clients. Enregistre le contact ci-dessous avec ton code de parrainage pour que les 10 % restent à toi.",
    followEyebrow: "Relance — là où la plupart des recommandations se concluent",
    followNote:
      "Trois relances légères, puis on s'arrête. Un « plus tard » chaleureux vaut mieux qu'un « non » forcé.",
    objectionsEyebrow: "S'ils hésitent",
    packagesEyebrow: "Ce que tu peux deviser — et ce que tu me passes",
    leadsEyebrow: "Ce qui fait qu'un contact vaut la peine d'être envoyé",
    earningsEyebrow: "À quoi ressemblent tes 10 %",
    table: {
      work: "Le travail",
      pays: "Le client paie",
      earn: "Tu gagnes",
    },
    earningsNote:
      "Exemples seulement — tes 10 % sont toujours 10 % de ce que le client paie réellement, réglés une fois son paiement encaissé.",
  },

  pitchScripts: [
    {
      key: "whatsapp",
      channel: "WhatsApp",
      title: "Mise en relation rapide par WhatsApp",
      body: "Salut ! Tu disais avoir besoin d'un site pour ton activité — je connais la bonne personne. Jamie fait des sites propres et rapides à partir de 200 € et s'occupe de tout pour toi. Tu veux que je te le présente ? Voici sa page : {link}",
    },
    {
      key: "email",
      channel: "Email",
      title: "Mise en relation chaleureuse par email",
      body: "Bonjour [nom],\n\nPour faire suite à ce que tu disais sur ton besoin d'un site — je travaille avec Jamie Nisbet, un ingénieur logiciel près de Lisbonne qui réalise des sites rapides et professionnels et s'occupe de tout. Les sites d'une page démarrent à 200 € ; les projets plus importants sont devisés sur mesure.\n\nTu peux en savoir plus et le contacter ici : {link}\n\nJe te le présente volontiers directement — tu n'as qu'un mot à dire.",
    },
    {
      key: "inperson",
      channel: "En personne",
      title: "En face à face, puis on relance",
      body: "« Tu sais quoi — je connais exactement la bonne personne pour ça. Jamie fait des sites et des logiciels, super simple à gérer, et il te fait un devis honnête. Laisse-moi t'envoyer son lien. » Puis envoie-lui : {link}",
    },
  ],

  followUps: [
    {
      key: "sameday",
      when: "Le jour même",
      context: "Une fois le contact enregistré",
      body: "Je viens de transmettre tes coordonnées à Jamie — il te contactera d'ici un jour ou deux. Y a-t-il quelque chose que tu veux qu'il sache d'abord ? Dis-le-moi et je lui transmets.",
    },
    {
      key: "day3",
      when: "Au bout de ~3 jours",
      context: "S'ils sont restés silencieux",
      body: "Jamie a réussi à te joindre ? Pas d'urgence — je veux juste m'assurer que son message n'a pas atterri dans les spams. Voici de nouveau sa page si c'est plus simple : {link}",
    },
    {
      key: "week1",
      when: "Au bout de ~1 semaine",
      context: "La conclusion en douceur",
      body: "Aucune pression — si ce n'est pas le bon moment pour le site, dis-le-moi et je laisse tomber. Si ça l'est, Jamie peut généralement en mettre un simple en ligne en quelques semaines.",
    },
  ],

  objections: [
    {
      objection: "« C'est trop cher. »",
      answer:
        "Un site d'une page démarre à 200 €, une seule fois, et fonctionne pendant des années. Compare ça aux clients qu'une activité perd sans site — ou avec un site cassé. Si 200 € reste trop, ce n'est sans doute pas le bon moment, et c'est très bien comme ça.",
    },
    {
      objection: "« Je le ferai moi-même sur Wix. »",
      answer:
        "Ils le peuvent, et parfois c'est le bon choix. La différence, ce sont les week-ends passés à se battre avec un modèle qui ressemble toujours à un modèle. Je le fais bien, une bonne fois, et ils récupèrent leur temps. S'ils aiment le faire eux-mêmes, n'insiste pas.",
    },
    {
      objection: "« Je connais déjà quelqu'un. »",
      answer:
        "Pas de vente forcée. Mentionne simplement que je suis un ingénieur senior qui s'occupe de tout pour un prix fixe et clair — pratique si leur contact se fait silencieux ou si ça devient technique. Laisse le lien ; on s'en souvient quand la première option tombe à l'eau.",
    },
    {
      objection: "« Pas maintenant / peut-être plus tard. »",
      answer:
        "Très bien — ne relance pas. Demande ce qui rendrait le moment opportun (un lancement, une saison forte, une refonte) et reviens-y à ce moment-là. Un simple « tu veux le lien pour le moment venu ? » garde la porte ouverte sans pression.",
    },
    {
      objection: "« Et si ça tourne mal ? Je ne suis pas technique. »",
      answer:
        "C'est justement ça — ils ne touchent jamais à la partie technique. Je cadre, je construis et j'assure le suivi ; ils ont affaire à une seule personne, pas à une agence. Et toi non plus, tu n'es responsable de rien.",
    },
  ],

  packages: [
    {
      key: "landing",
      name: "Landing page + formulaire de contact",
      price: "à partir de 200 €",
      blurb: "La première vente facile — une page propre et rapide qui fait son travail.",
      includes: [
        "Se charge vite, s'affiche bien sur un téléphone",
        "Un formulaire de contact qui envoie chaque demande par email",
        "Leur logo, leurs couleurs et leurs textes, mis en place comme il faut",
        "En ligne sur leur domaine, prêt à partager",
      ],
      sellerNote: "Devise-la toi-même à 200 € ou plus — sans validation.",
    },
    {
      key: "multipage",
      name: "Site multi-pages",
      price: "devisé sur mesure",
      blurb: "Quelques pages — à propos, services, contact — pour une activité qui grandit.",
      includes: [
        "Plusieurs pages avec un même design cohérent et à la marque",
        "Formulaire de contact et gestion basique des demandes",
        "Préparé pour être trouvé sur Google",
        "Une brève prise en main pour qu'ils sachent comment ça marche",
      ],
      sellerNote: "Présente-moi — je cadre et je devise. Tu gagnes toujours 10 %.",
    },
    {
      key: "app",
      name: "Application, réservation ou automatisation",
      price: "devisé sur mesure",
      blurb: "Les projets plus importants, tarifés selon le résultat, à 120 €/heure.",
      includes: [
        "Construit autour du flux de travail réel du client",
        "Connecté aux outils qu'ils utilisent déjà",
        "Un système de réservation, une application web, une fonctionnalité d'IA ou une automatisation",
        "Un suivi continu s'ils le souhaitent",
      ],
      sellerNote: "Fais simplement la mise en relation — je prends le relais. Tes 10 % s'appliquent toujours.",
    },
  ],

  goodLeadSigns: [
    "Ils ont vraiment dit avoir besoin d'un site, de réservations en ligne ou d'un logiciel — pas juste « peut-être un jour ».",
    "Tu peux nommer qui décide et paie — le propriétaire ou un responsable, pas un vague « l'entreprise ».",
    "Il y a une raison que ce soit maintenant : un lancement, une refonte, une saison forte ou un concurrent qui vient de passer en ligne.",
    "Ils ont un budget approximatif en tête, même si c'est seulement « quelques centaines d'euros ».",
    "Tu peux donner un nom et un moyen de les joindre — un email ou un numéro de téléphone.",
  ],

  earningExamples: [
    { work: "Site d'une page + formulaire de contact", invoice: "200 €", youEarn: "20 €" },
    { work: "Site de petite entreprise, quelques pages", invoice: "800 €", youEarn: "80 €" },
    { work: "Système de réservation ou application web", invoice: "3 000 €", youEarn: "300 €" },
  ],

  faqs: [
    {
      q: "Quand suis-je payé ?",
      a: "Quand le paiement du client me parvient — pas quand j'envoie la facture. Tu reçois 10 % de ce que je facture sur ce projet, réglés via un relevé clair par parrain.",
    },
    {
      q: "Qu'est-ce qui empêche deux personnes de réclamer le même contact ?",
      a: "Ton code de parrainage. Le premier code valide enregistré pour un nouveau client l'emporte. Si deux codes tombent sur le même client, cela remonte pour que je tranche équitablement — alors enregistre toujours le contact ici en premier.",
    },
    {
      q: "Que puis-je deviser moi-même ?",
      a: "Les landing pages avec formulaire de contact, à 200 € ou plus — devise-les librement. Pour tout ce qui est plus complexe (plusieurs pages, une application, de l'IA, des intégrations), présente-moi simplement et je m'en charge.",
    },
    {
      q: "Dois-je comprendre la technique ?",
      a: "Non. Ton rôle, c'est la mise en relation chaleureuse et la vente simple de la landing page. Je m'occupe du périmètre, du prix, de la construction et du suivi. Si un client pose une question technique, oriente-le vers moi.",
    },
  ],

  faqTitle: "Les questions qui reviennent en premier.",

  refer: {
    eyebrow: "Recommander",
    title: "Enregistre un contact. Garde-le pour toi.",
    intro:
      "Indique ton code de parrainage et les coordonnées du contact — je réponds d'ici un jour ou deux.",
    firstWins:
      "Le premier code de parrainage valide sur un nouveau client l'emporte — alors enregistre-le ici avant tout le monde.",
    questions: "Une question d'abord ?",
  },

  form: {
    success: {
      title: "Contact enregistré",
      message:
        "Merci — le contact est enregistré avec ton code. Je prends le relais et je reviens vers toi.",
    },
    botSuccess: "Merci — c'est enregistré.",
    errorBanner: "Merci de corriger les champs signalés.",
    referralCode: {
      label: "Ton code de parrainage",
      hint: "Le code que je t'ai donné — c'est par lui que les 10 % te reviennent.",
    },
    customerName: "Nom du client",
    customerPhone: {
      label: "Téléphone du contact",
      hint: "Le meilleur numéro pour les joindre.",
    },
    customerEmail: "Email du contact (facultatif)",
    need: {
      label: "De quoi ont-ils besoin ?",
      placeholder:
        "Une ligne — ex. : un site d'une page avec formulaire de contact pour un nouveau café.",
    },
    budget: {
      label: "Budget approximatif (facultatif)",
      placeholder: "Choisis une tranche, ou laisse-moi faire",
    },
    callTime: {
      label: "Meilleur moment pour appeler (facultatif)",
      hint: "Jours ouvrés, de 9h à 17h — choisis un créneau qui convient au client.",
      pickDay: "Choisis un jour",
      pickTime: "Choisis une heure",
    },
    submit: "Envoyer le contact",
    submitting: "Envoi…",
    budgetOptions: {
      "Not sure yet": "Pas encore sûr",
      "~€200 — landing page": "~200 € — landing page",
      "€500–€1,000": "500 €–1 000 €",
      "€1,000–€5,000": "1 000 €–5 000 €",
      "€5,000+": "5 000 €+",
    },
    errors: {
      referralCodeMin: "Ton code de parrainage — c'est lui qui rattache le paiement à toi.",
      customerNameMin: "Le nom du client, s'il te plaît.",
      phoneMin: "Un numéro de téléphone pour que je puisse les joindre.",
      phoneInvalid: "Ce numéro de téléphone semble incorrect.",
      emailInvalid: "Cet email semble incorrect.",
      needMin: "Une ligne sur ce dont ils ont besoin, s'il te plaît.",
      needMax: "C'est beaucoup — réduis à l'essentiel.",
      slotInvalid: "Choisis un créneau dans la liste — jours ouvrés, de 9h à 17h.",
    },
  },

  pitch: {
    metaTitle: "Votre site, fait dans les règles",
    metaDescription:
      "Une landing page ou une application web réalisée par un ingénieur senior — périmètre clair, prix clair, en ligne en quelques semaines.",
    eyebrow: "Sites web et logiciels",
    title: "Un site qui fonctionne — périmètre clair, prix clair, en ligne en quelques semaines.",
    intro:
      "La plupart des petites entreprises perdent des clients à cause d'un site absent, lent ou bloqué dans un modèle inachevé. Vous n'avez pas besoin d'une grande agence ni d'un projet d'un an — juste d'une bonne page qui fonctionne sur un téléphone, se charge vite et permet aux gens de vous joindre. Faite dans les règles, une bonne fois.",
    startCta: "Démarrer la conversation",
    mailSubject: "Demande de site web",
    getEyebrow: "Ce que vous obtenez",
    getTitle: "Commencez simple. Développez quand ça en vaut la peine.",
    getIntro:
      "Une landing page nette pour commencer, avec la possibilité d'ajouter des pages, un système de réservation ou une fonctionnalité d'IA plus tard — seulement quand ça le mérite.",
    whyEyebrow: "Pourquoi moi",
    whyTitle: "Pourquoi travailler avec moi",
    why: [
      {
        title: "Un ingénieur senior, en relation directe avec vous",
        description:
          "Pas de couches d'agence, pas de chargés de compte — vous parlez à la personne qui le construit.",
      },
      {
        title: "Périmètre clair, prix clair, aucune surprise",
        description:
          "Vous savez ce que vous obtenez et ce que ça coûte avant de commencer. Les changements sont une conversation, pas une ligne cachée sur la facture.",
      },
      {
        title: "Petite structure, livraison sérieuse",
        description:
          "Une personne joignable, avec des prestataires en renfort pour les projets plus importants — pour la réactivité et la capacité.",
      },
    ],
    stepsEyebrow: "Comment ça marche",
    stepsTitle: "Comment ça marche",
    steps: [
      { title: "On échange", description: "Dix minutes sur ce dont vous avez besoin et pour qui." },
      {
        title: "Je cadre et je chiffre",
        description: "Un prix fixe pour une landing page ; un devis clair pour tout ce qui est plus gros.",
      },
      {
        title: "Je construis",
        description: "Vous le voyez prendre forme — vous ne touchez pas à la partie technique.",
      },
      {
        title: "Vous êtes en ligne, et accompagné",
        description: "Il est mis en ligne sur votre domaine, et je suis là s'il faut une modification.",
      },
    ],
    ctaTitle: "Quand vous voulez",
    ctaHeading: "Mettons votre site en ligne.",
    ctaBody:
      "Une prochaine étape simple : répondez à la personne qui vous a partagé ceci, ou envoyez-moi un email directement. Je reviens vers vous d'ici un jour ou deux.",
  },

  notFound: {
    eyebrow: "Introuvable",
    title: "Cette page s'est égarée.",
    body: "Le lien est peut-être ancien ou mal saisi. Remettons-toi sur la bonne voie.",
    cta: "Retour à l'accueil",
  },
}
