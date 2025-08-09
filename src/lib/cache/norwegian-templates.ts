/**
 * Norwegian Business Templates for Cache Warming
 * Pre-defined templates for common Norwegian business content types
 */

import {
  LanguageAwareContentRequest,
  LanguageAwareResponse,
  SupportedLanguage,
  CulturalContext,
} from '../types/language-aware-request';

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: 'email' | 'landing' | 'social' | 'article' | 'ad' | 'blog';
  language: SupportedLanguage;
  priority: 'high' | 'medium' | 'low';
  request: LanguageAwareContentRequest;
  response: LanguageAwareResponse;
  tags: string[];
  usageCount?: number;
}

export class NorwegianTemplates {
  private templates: Map<string, ContentTemplate>;
  private templatesByCategory: Map<string, ContentTemplate[]>;
  private templatesByLanguage: Map<SupportedLanguage, ContentTemplate[]>;

  constructor() {
    this.templates = new Map();
    this.templatesByCategory = new Map();
    this.templatesByLanguage = new Map();
    
    this.initializeTemplates();
  }

  /**
   * Initialize all templates
   */
  private initializeTemplates(): void {
    // Norwegian B2B email templates
    this.addTemplate({
      id: 'no-b2b-email-intro',
      name: 'B2B introduksjons-e-post',
      description: 'Professional introduction email for Norwegian B2B market',
      category: 'email',
      language: 'no',
      priority: 'high',
      request: {
        id: 'template-no-b2b-email-intro',
        type: 'email',
        topic: 'B2B introduksjon',
        outputLanguage: 'no',
        culturalContext: {
          market: 'norway',
          businessType: 'b2b',
          dialectPreference: 'bokmål',
          formalityLevel: 'neutral',
          localReferences: true,
        },
        keywords: ['introduksjon', 'samarbeid', 'partnerskap'],
        tone: 'professional',
        targetAudience: 'Norske bedriftsledere',
        wordCount: 250,
        timestamp: new Date(),
      },
      response: {
        requestId: 'template-no-b2b-email-intro',
        content: `Hei [Navn],

Jeg håper denne e-posten finner deg vel. Mitt navn er [Avsender], og jeg representerer [Selskap], en ledende leverandør av [tjeneste/produkt] i det norske markedet.

Vi har fulgt med på [Mottakers selskap]s imponerende vekst og innovasjon innen [bransje], og vi ser spennende muligheter for samarbeid mellom våre selskaper.

Våre løsninger har hjulpet over 50 norske bedrifter med å:
• Redusere driftskostnader med opptil 30%
• Øke produktiviteten med 25%
• Forbedre kundetilfredsheten betydelig

Jeg vil gjerne invitere deg til et kort møte hvor vi kan diskutere hvordan [Selskap] kan støtte [Mottakers selskap]s vekstambisjoner. Er du tilgjengelig for en 30-minutters samtale i løpet av de neste to ukene?

Med vennlig hilsen,
[Avsender]
[Tittel]
[Selskap]
[Telefon] | [E-post]`,
        metadata: {
          generatedLanguage: 'no',
          wasTranslated: false,
          translationQuality: 'native',
          culturalAdaptations: ['norwegian-business-etiquette', 'local-market-references'],
          processingTime: 150,
          tokenUsage: {
            prompt: 50,
            completion: 200,
            total: 250,
          },
          model: 'gpt-4',
          cost: 0.0075,
          cacheHit: false,
          fallbackUsed: false,
        },
      },
      tags: ['b2b', 'email', 'introduksjon', 'norsk', 'profesjonell'],
    });

    // Norwegian landing page template
    this.addTemplate({
      id: 'no-saas-landing',
      name: 'SaaS landingsside for norsk marked',
      description: 'Landing page content for Norwegian SaaS companies',
      category: 'landing',
      language: 'no',
      priority: 'high',
      request: {
        id: 'template-no-saas-landing',
        type: 'landing',
        topic: 'SaaS løsning for norske bedrifter',
        outputLanguage: 'no',
        culturalContext: {
          market: 'norway',
          businessType: 'b2b',
          dialectPreference: 'bokmål',
          formalityLevel: 'neutral',
          localReferences: true,
          industry: 'teknologi',
        },
        keywords: ['digitalisering', 'effektivitet', 'norsk', 'skyløsning'],
        tone: 'persuasive',
        targetAudience: 'Norske SMB-bedrifter',
        wordCount: 500,
        timestamp: new Date(),
        seoRequirements: {
          primaryKeyword: 'digital løsning Norge',
          secondaryKeywords: ['bedriftssystem', 'skyløsning', 'digitalisering'],
          targetRegion: 'norway',
        },
      },
      response: {
        requestId: 'template-no-saas-landing',
        content: `# Digitaliser din norske bedrift med [Produktnavn]

## Den komplette løsningen for moderne norske bedrifter

Mer enn 500 norske bedrifter har allerede tatt steget inn i fremtiden. Bli med på digitaliseringsreisen og oppnå resultater fra dag én.

### Hvorfor velge [Produktnavn]?

**Skreddersydd for Norge**
Utviklet spesielt for norske bedrifter, med full støtte for norske regnskapsregler, MVA-rapportering og integrasjon med Altinn.

**Enkel implementering**
Kom i gang på under 24 timer. Ingen kompliserte installasjoner eller lange prosjekter. Alt kjører sikkert i skyen.

**Målbare resultater**
• 40% tidsbesparelse på administrative oppgaver
• 30% reduksjon i driftskostnader
• 100% oversikt over bedriftens prosesser

### Tilpasset din bransje

Enten du driver innen handel, tjenesteyting eller produksjon, har vi løsningen som passer. Våre bransjespesifikke moduler sikrer at du får verktøyene du trenger.

### Trygg og sikker

✓ Lagring på norske servere
✓ GDPR-kompatibel
✓ ISO 27001-sertifisert
✓ Bankgrad sikkerhet

### Hva sier våre kunder?

"[Produktnavn] har revolusjonert måten vi driver på. Vi sparer 10 timer i uken på rapportering alene." 
- Anders Olsen, Daglig leder, TechCorp Norge

### Kom i gang i dag

**Prøv gratis i 30 dager** - ingen kredittkort påkrevd
**Personlig onboarding** - vi hjelper deg i gang
**Norsk support** - alltid tilgjengelig når du trenger oss

[Start din gratis prøveperiode]

Eller ring oss på 21 00 00 00 for en uforpliktende samtale.`,
        metadata: {
          generatedLanguage: 'no',
          wasTranslated: false,
          translationQuality: 'native',
          culturalAdaptations: ['norwegian-trust-signals', 'local-compliance', 'norwegian-case-studies'],
          processingTime: 250,
          tokenUsage: {
            prompt: 100,
            completion: 400,
            total: 500,
          },
          model: 'gpt-4',
          cost: 0.015,
          cacheHit: false,
          fallbackUsed: false,
        },
      },
      tags: ['landing', 'saas', 'b2b', 'norsk', 'konvertering'],
    });

    // Norwegian social media template
    this.addTemplate({
      id: 'no-linkedin-post',
      name: 'LinkedIn-innlegg for norsk marked',
      description: 'Professional LinkedIn post for Norwegian audience',
      category: 'social',
      language: 'no',
      priority: 'medium',
      request: {
        id: 'template-no-linkedin-post',
        type: 'social',
        topic: 'Bærekraft i norsk næringsliv',
        outputLanguage: 'no',
        culturalContext: {
          market: 'norway',
          businessType: 'b2b',
          formalityLevel: 'neutral',
          localReferences: true,
        },
        keywords: ['bærekraft', 'grønn omstilling', 'norsk næringsliv'],
        tone: 'informative',
        targetAudience: 'Norske bedriftsledere og beslutningstakere',
        wordCount: 150,
        timestamp: new Date(),
      },
      response: {
        requestId: 'template-no-linkedin-post',
        content: `🌱 Bærekraft er ikke lenger valgfritt for norske bedrifter

Den grønne omstillingen er i full gang i Norge, og bedrifter som ikke tilpasser seg risikerer å bli hengende etter.

Nye tall fra NHO viser:
📊 78% av norske bedrifter har konkrete bærekraftsmål
🎯 65% ser økt lønnsomhet fra bærekraftstiltak
💚 92% opplever økt attraktivitet som arbeidsgiver

Hva gjør din bedrift for å møte fremtidens krav?

Vi hos [Selskap] hjelper norske bedrifter med:
✅ Kartlegging av klimaavtrykk
✅ Utvikling av bærekraftstrategi
✅ Implementering av konkrete tiltak

La oss ta en prat om hvordan din bedrift kan lede an i den grønne omstillingen.

#Bærekraft #GrønnOmstilling #NorskNæringsliv #Klimahandling`,
        metadata: {
          generatedLanguage: 'no',
          wasTranslated: false,
          translationQuality: 'native',
          culturalAdaptations: ['norwegian-business-culture', 'local-statistics'],
          processingTime: 100,
          tokenUsage: {
            prompt: 40,
            completion: 120,
            total: 160,
          },
          model: 'gpt-3.5-turbo',
          cost: 0.0032,
          cacheHit: false,
          fallbackUsed: false,
        },
      },
      tags: ['social', 'linkedin', 'bærekraft', 'norsk', 'b2b'],
    });

    // Norwegian blog article template
    this.addTemplate({
      id: 'no-blog-digitalization',
      name: 'Bloggartikkel om digitalisering',
      description: 'Blog article about digitalization for Norwegian businesses',
      category: 'blog',
      language: 'no',
      priority: 'medium',
      request: {
        id: 'template-no-blog-digitalization',
        type: 'blog',
        topic: 'Digitalisering av norske SMB-bedrifter',
        outputLanguage: 'no',
        culturalContext: {
          market: 'norway',
          businessType: 'b2b',
          dialectPreference: 'bokmål',
          formalityLevel: 'neutral',
          localReferences: true,
          industry: 'teknologi',
        },
        keywords: ['digitalisering', 'SMB', 'teknologi', 'effektivitet'],
        tone: 'informative',
        targetAudience: 'Norske SMB-ledere',
        wordCount: 800,
        timestamp: new Date(),
      },
      response: {
        requestId: 'template-no-blog-digitalization',
        content: `# 5 steg til vellykket digitalisering for norske SMB-bedrifter

Digitalisering er ikke lenger forbeholdt store konsern. I dagens marked må også små og mellomstore bedrifter omfavne teknologi for å forbli konkurransedyktige. Her er en praktisk guide for norske SMB-er som ønsker å lykkes med digital transformasjon.

## Hvorfor digitalisering er kritisk for norske SMB-er

Norge ligger i front når det gjelder digitalisering, men mange SMB-bedrifter sliter fortsatt med å ta steget fullt ut. Ifølge SSBs siste undersøkelse har kun 42% av norske SMB-er en helhetlig digitaliseringsstrategi.

De som har tatt steget, rapporterer imidlertid imponerende resultater:
- 35% økning i produktivitet
- 28% reduksjon i operasjonelle kostnader
- 45% forbedring i kundetilfredshet

## Steg 1: Kartlegg nåsituasjonen

Før du kan digitalisere, må du forstå hvor bedriften står i dag. Gjennomfør en grundig kartlegging av:
- Eksisterende systemer og prosesser
- Medarbeidernes digitale kompetanse
- Kundens forventninger og behov
- Konkurrentenes digitale modenhet

## Steg 2: Definer klare mål

Digitalisering for digitaliseringens skyld gir sjelden resultater. Sett konkrete, målbare mål som:
- "Redusere ordrehåndteringstid med 50% innen Q3"
- "Automatisere 80% av fakturaprosessen innen årsslutt"
- "Øke digital selvbetjening til 60% av kundehenvendelser"

## Steg 3: Velg riktige verktøy

For norske SMB-er er det viktig å velge løsninger som:
- Støtter norske standarder og regelverk
- Integrerer med Altinn og andre norske systemer
- Har norsk support og dokumentasjon
- Skalerer med bedriftens vekst

Populære valg inkluderer skybaserte ERP-systemer, CRM-løsninger og samarbeidsplattformer som Microsoft 365 eller Google Workspace.

## Steg 4: Involver og utdann ansatte

Den største feilen mange gjør er å undervurdere menneskefaktoren. Suksessfull digitalisering krever:
- Tidlig involvering av ansatte i prosessen
- Kontinuerlig opplæring og støtte
- Klare incentiver for å ta i bruk nye løsninger
- Tålmodighet og forståelse for motstand mot endring

## Steg 5: Start smått, tenk stort

Ikke prøv å digitalisere alt på en gang. Start med:
1. Ett pilotprosjekt med høy synlighet og lav risiko
2. Mål resultater og juster kursen
3. Skaler gradvis til andre områder
4. Bygg på suksesser og lær av feil

## Vanlige fallgruver å unngå

- **Manglende ledelsesforankring**: Digitalisering må drives fra toppen
- **Undervurdering av kostnader**: Planlegg for både implementering og løpende drift
- **Ignorering av sikkerhet**: GDPR og cybersikkerhet må inn fra start
- **For rask utrulling**: Gi organisasjonen tid til å tilpasse seg

## Veien videre

Digitalisering er en kontinuerlig reise, ikke en destinasjon. Norske SMB-er som lykkes er de som:
- Ser digitalisering som en strategisk investering
- Bygger en kultur for kontinuerlig forbedring
- Holder seg oppdatert på nye teknologier og trender
- Samarbeider med partnere og leverandører

## Konklusjon

For norske SMB-bedrifter er spørsmålet ikke om de skal digitalisere, men hvordan og hvor raskt. Ved å følge disse fem stegene og unngå de vanligste fallgruvene, kan din bedrift ta steget inn i den digitale fremtiden med selvtillit.

Husk: Den beste tiden å starte var i går. Den nest beste tiden er i dag.

---

*Trenger din bedrift hjelp med digitalisering? Ta kontakt for en uforpliktende samtale om hvordan vi kan støtte deres digitale reise.*`,
        metadata: {
          generatedLanguage: 'no',
          wasTranslated: false,
          translationQuality: 'native',
          culturalAdaptations: ['norwegian-statistics', 'local-systems', 'norwegian-business-culture'],
          processingTime: 350,
          tokenUsage: {
            prompt: 150,
            completion: 650,
            total: 800,
          },
          model: 'gpt-4',
          cost: 0.024,
          cacheHit: false,
          fallbackUsed: false,
        },
      },
      tags: ['blog', 'digitalisering', 'SMB', 'norsk', 'guide'],
    });

    // English templates for Norwegian market
    this.addTemplate({
      id: 'en-norway-market-entry',
      name: 'Norway Market Entry Guide',
      description: 'English content for companies entering Norwegian market',
      category: 'article',
      language: 'en',
      priority: 'low',
      request: {
        id: 'template-en-norway-market',
        type: 'article',
        topic: 'Entering the Norwegian B2B market',
        outputLanguage: 'en',
        culturalContext: {
          market: 'norway',
          businessType: 'b2b',
          formalityLevel: 'formal',
          localReferences: true,
        },
        keywords: ['Norway', 'market entry', 'B2B', 'Nordic'],
        tone: 'informative',
        targetAudience: 'International companies targeting Norway',
        wordCount: 400,
        timestamp: new Date(),
      },
      response: {
        requestId: 'template-en-norway-market',
        content: `# Entering the Norwegian B2B Market: A Strategic Guide

Norway presents unique opportunities for international B2B companies, with its strong economy, high digitalization rate, and openness to innovation. Here's what you need to know to succeed.

## Market Characteristics

**Economic Strength**
Norway boasts one of Europe's strongest economies, with a GDP per capita exceeding $75,000. The country's oil wealth has created a robust business environment with high purchasing power.

**Digital Maturity**
With 98% internet penetration and widespread digital adoption, Norwegian businesses expect sophisticated digital solutions. E-invoicing is mandatory for public sector contracts.

**Business Culture**
- **Egalitarian approach**: Flat organizational structures are the norm
- **Trust-based**: Relationships built on reliability and transparency
- **Direct communication**: Norwegians appreciate straightforward, honest dialogue
- **Work-life balance**: Respect for personal time is crucial

## Key Success Factors

1. **Local Compliance**
   - Register with Brønnøysund Register Centre
   - Understand Norwegian VAT (MVA) regulations
   - Comply with GDPR and local data protection rules

2. **Language Considerations**
   While most Norwegians speak excellent English, providing Norwegian language options demonstrates commitment to the market.

3. **Partnership Approach**
   Local partners can provide invaluable market insights and credibility. Consider joining Innovation Norway's programs for international companies.

4. **Sustainability Focus**
   Norway leads in sustainability. Highlighting your environmental credentials is often essential for B2B success.

## Common Pitfalls to Avoid

- Underestimating the importance of local presence
- Ignoring seasonal business patterns (July is vacation month)
- Overlooking the influence of public sector purchasing
- Neglecting Norwegian payment preferences (invoice and Vipps)

## Next Steps

Success in Norway requires patience, cultural understanding, and genuine commitment to the market. Start with pilot projects, build local relationships, and adapt your offering to Norwegian expectations.

The Norwegian market rewards quality, innovation, and long-term thinking. Companies that invest in understanding local nuances often find Norway becomes one of their most profitable markets.`,
        metadata: {
          generatedLanguage: 'en',
          wasTranslated: false,
          translationQuality: 'native',
          culturalAdaptations: ['norwegian-market-insights', 'cultural-guidance'],
          processingTime: 200,
          tokenUsage: {
            prompt: 80,
            completion: 320,
            total: 400,
          },
          model: 'gpt-4',
          cost: 0.012,
          cacheHit: false,
          fallbackUsed: false,
        },
      },
      tags: ['article', 'market-entry', 'norway', 'english', 'b2b'],
    });

    // Norwegian ad copy template
    this.addTemplate({
      id: 'no-google-ads',
      name: 'Google Ads for norsk marked',
      description: 'Google Ads copy optimized for Norwegian market',
      category: 'ad',
      language: 'no',
      priority: 'high',
      request: {
        id: 'template-no-google-ads',
        type: 'ad',
        topic: 'Regnskapssystem for norske bedrifter',
        outputLanguage: 'no',
        culturalContext: {
          market: 'norway',
          businessType: 'b2b',
          dialectPreference: 'bokmål',
          formalityLevel: 'neutral',
        },
        keywords: ['regnskap', 'økonomi', 'bedrift'],
        tone: 'persuasive',
        targetAudience: 'Norske SMB-bedrifter',
        wordCount: 90,
        timestamp: new Date(),
      },
      response: {
        requestId: 'template-no-google-ads',
        content: `**Overskrift 1:** Moderne Regnskap for Norge
**Overskrift 2:** Spar 10 Timer Hver Uke
**Overskrift 3:** Automatisk MVA-rapportering

**Beskrivelse 1:** Komplett regnskapssystem tilpasset norske bedrifter. Automatisk bokføring, MVA-rapport og Altinn-integrasjon. Start gratis prøveperiode.

**Beskrivelse 2:** Over 500 norske bedrifter bruker allerede vår løsning. Enkel implementering, norsk support og full oversikt fra dag én.`,
        metadata: {
          generatedLanguage: 'no',
          wasTranslated: false,
          translationQuality: 'native',
          culturalAdaptations: ['norwegian-terminology', 'local-compliance-focus'],
          processingTime: 50,
          tokenUsage: {
            prompt: 30,
            completion: 60,
            total: 90,
          },
          model: 'gpt-3.5-turbo',
          cost: 0.0018,
          cacheHit: false,
          fallbackUsed: false,
        },
      },
      tags: ['ad', 'google-ads', 'regnskap', 'norsk', 'konvertering'],
    });
  }

  /**
   * Add a template to the collection
   */
  private addTemplate(template: ContentTemplate): void {
    this.templates.set(template.id, template);
    
    // Add to category index
    if (!this.templatesByCategory.has(template.category)) {
      this.templatesByCategory.set(template.category, []);
    }
    this.templatesByCategory.get(template.category)!.push(template);
    
    // Add to language index
    if (!this.templatesByLanguage.has(template.language)) {
      this.templatesByLanguage.set(template.language, []);
    }
    this.templatesByLanguage.get(template.language)!.push(template);
  }

  /**
   * Get all templates
   */
  public getAllTemplates(): ContentTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template by ID
   */
  public getTemplate(id: string): ContentTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(category: string): ContentTemplate[] {
    return this.templatesByCategory.get(category) || [];
  }

  /**
   * Get templates by language
   */
  public getTemplatesByLanguage(language: SupportedLanguage): ContentTemplate[] {
    return this.templatesByLanguage.get(language) || [];
  }

  /**
   * Get templates by priority
   */
  public getTemplatesByPriority(priority: 'high' | 'medium' | 'low'): ContentTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.priority === priority);
  }

  /**
   * Get templates for cache warming
   */
  public getWarmupTemplates(): ContentTemplate[] {
    // Return high and medium priority templates
    return Array.from(this.templates.values())
      .filter(t => t.priority === 'high' || t.priority === 'medium')
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  /**
   * Search templates by tags
   */
  public searchByTags(tags: string[]): ContentTemplate[] {
    return Array.from(this.templates.values()).filter(template => 
      tags.some(tag => template.tags.includes(tag))
    );
  }

  /**
   * Get Norwegian-specific templates
   */
  public getNorwegianBusinessTemplates(): ContentTemplate[] {
    return Array.from(this.templates.values()).filter(t => 
      t.language === 'no' && 
      t.request.culturalContext?.market === 'norway'
    );
  }

  /**
   * Track template usage
   */
  public trackUsage(templateId: string): void {
    const template = this.templates.get(templateId);
    if (template) {
      template.usageCount = (template.usageCount || 0) + 1;
    }
  }

  /**
   * Get most used templates
   */
  public getMostUsedTemplates(limit: number = 10): ContentTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }

  /**
   * Generate cache warming batch
   */
  public generateWarmupBatch(options?: {
    languages?: SupportedLanguage[];
    categories?: string[];
    maxTemplates?: number;
  }): Array<{ request: LanguageAwareContentRequest; response: LanguageAwareResponse }> {
    let templates = Array.from(this.templates.values());
    
    // Filter by languages
    if (options?.languages) {
      templates = templates.filter(t => options.languages!.includes(t.language));
    }
    
    // Filter by categories
    if (options?.categories) {
      templates = templates.filter(t => options.categories!.includes(t.category));
    }
    
    // Sort by priority and usage
    templates.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      return (b.usageCount || 0) - (a.usageCount || 0);
    });
    
    // Limit number of templates
    if (options?.maxTemplates) {
      templates = templates.slice(0, options.maxTemplates);
    }
    
    return templates.map(t => ({
      request: t.request,
      response: t.response,
    }));
  }
}