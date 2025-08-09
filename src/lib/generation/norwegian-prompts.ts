/**
 * Norwegian Prompt Templates for Content Generation
 * Native Norwegian AI prompts with cultural context and business communication patterns
 */

import { ResearchResult } from '../functions/research-function';

/**
 * Norwegian cultural guidelines for content generation
 */
export const NORWEGIAN_CULTURAL_GUIDELINES = {
  // Jantelov principles for Norwegian business communication
  jantelov: {
    avoid: [
      'overdreven selvskryt',
      'direkte sammenligning med konkurrenter', 
      'superlative påstander uten dokumentasjon',
      'individuell fremheving på bekostning av team',
      'arrogant eller overlegen tone'
    ],
    embrace: [
      'ydmyk selvtillit',
      'faktabasert kommunikasjon',
      'kollektiv suksess',
      'samarbeidsfokus',
      'balansert fremstilling'
    ]
  },

  // Norwegian business communication style
  businessStyle: {
    formality: 'moderat', // Not too formal, not too casual
    directness: 'balansert', // Direct but polite
    structure: 'klar og logisk',
    tone: 'profesjonell men vennlig',
    consensus: 'viktig å inkludere alle perspektiver'
  },

  // Language preferences
  languagePreferences: {
    activeVoice: true,
    shortSentences: true,
    concreteExamples: true,
    avoidAnglicisms: true,
    preferNorwegianTerms: true
  }
};

/**
 * System prompts for Norwegian content generation
 */
export const NORWEGIAN_SYSTEM_PROMPTS = {
  base: `Du er en ekspert på norsk forretningskommunikasjon med dyp forståelse for norsk kultur og forretningstradisjon.

KULTURELLE PRINSIPPER:
- Følg Janteloven: Vær ydmyk, faktabasert og balanser selvtillit med beskjedenhet
- Bruk konsensusbyggende språk som inkluderer alle parter
- Vektlegg samarbeid og kollektive prestasjoner fremfor individuelle
- Unngå overdrivelser og udokumenterte påstander
- Bygg tillit gjennom transparens og ærlighet

SPRÅKSTIL:
- Skriv på klart og korrekt norsk bokmål
- Bruk aktiv stemme og konkrete eksempler
- Hold setninger korte og presise
- Unngå unødvendige anglisismer
- Tilpass formalitetsnivå til norsk forretningskultur (moderat formelt)

KOMMUNIKASJONSPRINSIPPER:
- Vær direkte men høflig
- Bygg argumenter logisk og strukturert
- Inkluder relevante fakta og tall
- Vis respekt for alle interessenter
- Fokuser på praktiske løsninger`,

  contentGeneration: `Som norsk innholdsgenerator skal du:

1. KULTURELL TILPASNING:
   - Respekter Janteloven i all kommunikasjon
   - Balancer selvtillit med ydmykhet
   - Fremhev teamarbeid og samarbeid
   - Unngå skryt og overdrivelser

2. FORRETNINGSTILPASNING:
   - Bruk norsk forretningsterminologi
   - Tilpass til norske markedsforhold
   - Referer til norske standarder og praksis
   - Inkluder relevante norske eksempler

3. KVALITETSKRAV:
   - Grammatisk korrekt norsk bokmål
   - Naturlig flyt og rytme
   - Kulturelt passende metaforer
   - Profesjonell men tilgjengelig tone`,

  researchIntegration: `Integrer forskningsresultater på en naturlig måte:

1. KILDEBRUK:
   - Prioriter norske kilder og eksempler
   - Sitér relevante norske bedrifter og case-studier
   - Bruk lokal statistikk og markedsdata
   - Referer til norske bransjestandarder

2. FAKTAINTEGRASJON:
   - Innarbeid fakta naturlig i teksten
   - Bruk tall og statistikk for å støtte argumenter
   - Balanser data med narrativ
   - Gi kontekst til all informasjon

3. KILDEHENVISNING:
   - Vær transparent om kilder
   - Bruk norsk henvisningsformat
   - Inkluder relevante lenker diskret
   - Bygg troverdighet gjennom dokumentasjon`
};

/**
 * Content type specific prompts in Norwegian
 */
export const NORWEGIAN_CONTENT_PROMPTS = {
  // Blog post generation
  blogPost: {
    system: NORWEGIAN_SYSTEM_PROMPTS.base,
    template: `Skriv en engasjerende bloggartikkel om {topic} for {audience}.

KONTEKST:
- Bedrift: {company}
- Bransje: {industry}
- Målgruppe: {targetAudience}
- Tone: {tone}

FORSKNINGSDATA:
{researchContext}

STRUKTUR:
1. Fengende ingress som etablerer relevans
2. Klar problemstilling eller mulighet
3. Logisk oppbygde hovedpoenger med norske eksempler
4. Praktiske råd og konkrete tiltak
5. Balansert konklusjon med handlingsoppfordring

KULTURELLE HENSYN:
- Unngå selvskryt, fokuser på verdi for leseren
- Bruk "vi" og "oss" fremfor "jeg" og "meg"
- Inkluder flere perspektiver
- Vær ydmyk men kunnskapsrik
- Bygg tillit gjennom fakta

LENGDE: {length} ord
STIL: Profesjonell men tilgjengelig, tilpasset norsk forretningskultur`
  },

  // Social media content
  socialMedia: {
    system: NORWEGIAN_SYSTEM_PROMPTS.base,
    template: `Lag engasjerende innhold for {platform} om {topic}.

PLATTFORMKRAV:
- LinkedIn: Profesjonell, innsiktsfull, nettverksbyggende
- Facebook: Vennlig, inkluderende, samtalefremmende
- Instagram: Visuelt fokusert, inspirerende, autentisk

KONTEKST:
- Bedrift: {company}
- Målgruppe: {audience}
- Formål: {purpose}

NORSK TILPASNING:
- Bruk uformell men respektfull tone
- Inkluder relevante emneknagger på norsk
- Vær genuint interessert i dialog
- Unngå aggressiv markedsføring
- Fokuser på fellesskap og verdi

FORSKNINGSGRUNNLAG:
{researchContext}

LENGDE: {characterLimit} tegn
INKLUDER: Relevante emneknagger og call-to-action`
  },

  // Email campaigns
  emailCampaign: {
    system: NORWEGIAN_SYSTEM_PROMPTS.base,
    template: `Skriv en effektiv e-postkampanje om {topic} for {audience}.

KAMPANJEMÅL:
{campaignGoal}

E-POSTSTRUKTUR:
1. Emne: Kort, relevant, ikke clickbait
2. Personlig hilsen (norsk standard)
3. Verdiproposisjon tidlig
4. Støttende argumenter med fakta
5. Klar handlingsoppfordring
6. Profesjonell avslutning

NORSKE E-POSTNORMER:
- Respekter mottakers tid
- Vær direkte men høflig
- Unngå overdreven markedsføring
- Fokuser på gjensidig nytte
- Inkluder enkel avmeldingsmulighet

PERSONALISERING:
- Bruk fornavn når passende
- Referer til relevant kontekst
- Tilpass til mottakers bransje
- Vis forståelse for deres behov

FORSKNINGSDATA:
{researchContext}`
  },

  // Website copy
  websiteCopy: {
    system: NORWEGIAN_SYSTEM_PROMPTS.base,
    template: `Skriv overbevisende nettsideinnhold for {pageType} om {topic}.

SIDEFORMÅL:
{pageGoal}

BESØKENDE:
- Primær målgruppe: {primaryAudience}
- Sekundær målgruppe: {secondaryAudience}
- Brukerreise-fase: {userJourneyStage}

INNHOLDSSTRUKTUR:
1. Klar verdiproposisjon
2. Tillitsbyggende elementer
3. Fordeler fremfor funksjoner
4. Sosiale bevis (norske referanser)
5. Tydelig neste steg

NORSK NETTKULTUR:
- Rask tilgang til informasjon
- Transparens om priser og vilkår
- Lokal relevans og eksempler
- Mobiloptimalisert innhold
- Tillitsbyggende design

SEO-HENSYN:
- Norske søkeord: {keywords}
- Lokal SEO-optimalisering
- Naturlig keyword-integrering

FORSKNINGSGRUNNLAG:
{researchContext}`
  },

  // Case studies
  caseStudy: {
    system: NORWEGIAN_SYSTEM_PROMPTS.base,
    template: `Skriv en overbevisende case-studie om {project} for {client}.

PROSJEKTDETALJER:
- Kunde: {clientName}
- Bransje: {industry}
- Utfordring: {challenge}
- Løsning: {solution}
- Resultater: {results}

CASE-STRUKTUR:
1. Kort sammendrag
2. Kundens utgangspunkt
3. Utfordringer (ærlig og balansert)
4. Samarbeidsprosessen
5. Implementert løsning
6. Målbare resultater
7. Kundens tilbakemelding
8. Læringspunkter

NORSK PRESENTASJON:
- Fremhev samarbeid, ikke egen fortreffelighet
- Inkluder kundens perspektiv
- Vær ærlig om utfordringer
- Del læring og innsikt
- Fokuser på gjensidig suksess
- Bruk konkrete norske måleparametere

TROVERDIGHET:
- Inkluder faktiske tall og resultater
- Bruk kundesitater
- Vis prosess, ikke bare resultat
- Vær transparent om metode

FORSKNINGSDATA:
{researchContext}`
  },

  // Press releases
  pressRelease: {
    system: NORWEGIAN_SYSTEM_PROMPTS.base,
    template: `Skriv en profesjonell pressemelding om {announcement}.

NYHETSVINKEL:
{newsAngle}

PRESSEMELDING-STRUKTUR:
1. Overskrift (faktabasert, ikke sensasjonell)
2. Ingress med alle hovedelementer
3. Sitat fra relevant leder
4. Bakgrunn og kontekst
5. Betydning for markedet/samfunnet
6. Om selskapet
7. Kontaktinformasjon

NORSKE PRESSESTANDARDER:
- Følg Vær Varsom-plakaten
- Faktabasert og etterprøvbar
- Balansert fremstilling
- Relevant for norske medier
- Tydelig nyhetsverdi

TONE OG STIL:
- Saklig og profesjonell
- Unngå markedsføringsspråk
- Fokuser på samfunnsnytte
- Inkluder norsk kontekst
- Respekter journalistisk integritet

SITATER:
- Autentiske og relevante
- Fra norske ledere/eksperter
- Verdiskapende innsikt
- Ikke selvskryt

FAKTAGRUNNLAG:
{researchContext}`
  }
};

/**
 * Generate prompt with research integration
 */
export function generateNorwegianPrompt(
  contentType: keyof typeof NORWEGIAN_CONTENT_PROMPTS,
  variables: Record<string, any>,
  research?: ResearchResult[]
): { system: string; user: string } {
  const promptConfig = NORWEGIAN_CONTENT_PROMPTS[contentType];
  
  // Format research context
  const researchContext = formatResearchContext(research);
  
  // Replace variables in template
  let userPrompt = promptConfig.template;
  const allVariables = {
    ...variables,
    researchContext
  };
  
  for (const [key, value] of Object.entries(allVariables)) {
    userPrompt = userPrompt.replace(
      new RegExp(`{${key}}`, 'g'),
      String(value)
    );
  }
  
  return {
    system: `${promptConfig.system}\n\n${NORWEGIAN_SYSTEM_PROMPTS.contentGeneration}`,
    user: userPrompt
  };
}

/**
 * Format research results for prompt context
 */
function formatResearchContext(research?: ResearchResult[]): string {
  if (!research || research.length === 0) {
    return 'Ingen spesifikk forskningsdata tilgjengelig.';
  }
  
  const sections = research.map(r => {
    const facts = r.keyFacts.slice(0, 3).join('\n- ');
    const terminology = r.terminology.slice(0, 5).map(t => t.term).join(', ');
    
    return `KILDE: ${r.source}
RELEVANS: ${r.relevanceScore}/10
NØKKELFAKTA:
- ${facts}
NORSK TERMINOLOGI: ${terminology}
KULTURELL KONTEKST: ${r.culturalContext || 'Standard norsk forretningskultur'}`;
  });
  
  return sections.join('\n\n---\n\n');
}

/**
 * Validation rules for Norwegian content
 */
export const NORWEGIAN_VALIDATION_RULES = {
  // Jantelov compliance check
  checkJantelovCompliance(content: string): {
    compliant: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Check for excessive self-promotion
    const selfPromotionPhrases = [
      'markedsledende',
      'best i',
      'nummer én',
      'overlegen',
      'uslåelig'
    ];
    
    for (const phrase of selfPromotionPhrases) {
      if (content.toLowerCase().includes(phrase)) {
        issues.push(`Unngå "${phrase}" - strider mot Janteloven`);
      }
    }
    
    // Check for comparative claims
    if (/bedre enn alle|bedre enn konkurrent/i.test(content)) {
      issues.push('Unngå direkte sammenligning med konkurrenter');
    }
    
    // Check for undocumented superlatives
    if (/alltid|aldri|garantert|100%/i.test(content)) {
      issues.push('Vær forsiktig med absolutte påstander');
    }
    
    return {
      compliant: issues.length === 0,
      issues
    };
  },
  
  // Business terminology check
  checkBusinessTerminology(content: string): {
    score: number;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    const anglicisms = {
      'meeting': 'møte',
      'deadline': 'frist',
      'feedback': 'tilbakemelding',
      'workshop': 'arbeidsøkt',
      'brainstorming': 'idédugnad'
    };
    
    let anglicismCount = 0;
    for (const [english, norwegian] of Object.entries(anglicisms)) {
      if (content.toLowerCase().includes(english)) {
        suggestions.push(`Vurder å bruke "${norwegian}" i stedet for "${english}"`);
        anglicismCount++;
      }
    }
    
    const score = Math.max(0, 100 - (anglicismCount * 10));
    return { score, suggestions };
  },
  
  // Consensus language check
  checkConsensusLanguage(content: string): {
    score: number;
    improvements: string[];
  } {
    const improvements: string[] = [];
    let score = 100;
    
    // Check for inclusive language
    const inclusivePhrases = ['vi', 'oss', 'sammen', 'felles', 'samarbeid'];
    const inclusiveCount = inclusivePhrases.filter(
      phrase => content.toLowerCase().includes(phrase)
    ).length;
    
    if (inclusiveCount < 2) {
      improvements.push('Inkluder mer inkluderende språk (vi, oss, sammen)');
      score -= 20;
    }
    
    // Check for individual focus
    const individualPhrases = ['jeg', 'min', 'mitt'];
    const individualCount = individualPhrases.filter(
      phrase => content.toLowerCase().includes(phrase)
    ).length;
    
    if (individualCount > 2) {
      improvements.push('Reduser individuelt fokus, øk teamfokus');
      score -= 15;
    }
    
    return { score, improvements };
  }
};

/**
 * Prompt enhancement with Norwegian business context
 */
export function enhanceWithNorwegianContext(
  prompt: string,
  industryContext?: string,
  companySize?: 'startup' | 'SMB' | 'enterprise'
): string {
  const contextAdditions: string[] = [];
  
  // Add industry-specific Norwegian context
  if (industryContext) {
    const industryContexts: Record<string, string> = {
      'technology': 'Tilpass til norsk teknologisektor med fokus på bærekraft og etisk teknologi.',
      'finance': 'Følg norske finansreguleringer og Finanstilsynets retningslinjer.',
      'healthcare': 'Respekter norsk helselovgivning og pasientrettigheter.',
      'retail': 'Tilpass til norske forbrukervaner og handelstradisjon.',
      'energy': 'Inkluder perspektiver på grønn omstilling og norsk energipolitikk.'
    };
    
    const context = industryContexts[industryContext];
    if (context) {
      contextAdditions.push(context);
    }
  }
  
  // Add company size considerations
  if (companySize) {
    const sizeContexts = {
      'startup': 'Bruk en innovativ men ydmyk tone passende for norske oppstartsbedrifter.',
      'SMB': 'Balanser profesjonalitet med personlig touch for norske SMB-er.',
      'enterprise': 'Oppretthold høy profesjonalitet passende for etablerte norske selskaper.'
    };
    
    contextAdditions.push(sizeContexts[companySize]);
  }
  
  // Always add seasonal/temporal context
  const month = new Date().getMonth();
  if (month >= 5 && month <= 7) {
    contextAdditions.push('Husk at dette er sommermåneder i Norge med potensielt redusert aktivitet.');
  } else if (month === 11 || month === 0) {
    contextAdditions.push('Ta hensyn til norsk juletradisjon og høytidsperiode.');
  }
  
  return contextAdditions.length > 0
    ? `${prompt}\n\nEKSTRA KONTEKST:\n${contextAdditions.join('\n')}`
    : prompt;
}

/**
 * Content length specifications for Norwegian
 */
export const NORWEGIAN_CONTENT_LENGTHS = {
  // Norwegian typically uses fewer words than English
  blogPost: {
    short: { min: 300, max: 500, target: 400 },
    medium: { min: 600, max: 900, target: 750 },
    long: { min: 1000, max: 1500, target: 1200 }
  },
  socialMedia: {
    linkedIn: { max: 1300, optimal: 800 },
    facebook: { max: 500, optimal: 250 },
    instagram: { max: 2200, optimal: 150 }
  },
  email: {
    subject: { max: 50, optimal: 30 },
    preview: { max: 90, optimal: 60 },
    body: { max: 500, optimal: 250 }
  },
  websiteCopy: {
    headline: { max: 60, optimal: 40 },
    subheading: { max: 120, optimal: 80 },
    paragraph: { max: 150, optimal: 100 },
    cta: { max: 20, optimal: 10 }
  }
};