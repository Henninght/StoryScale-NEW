/**
 * Norwegian-Specific Validation Rules
 * Comprehensive rule set for Norwegian business content validation
 */

/**
 * Validation rule application request
 */
export interface ValidationRuleRequest {
  content: string;
  contentType: string;
  strictness: 'strict' | 'moderate' | 'relaxed';
}

/**
 * Validation rule result
 */
export interface ValidationRuleResult {
  rulesApplied: number;
  rulesPassed: number;
  rulesFailed: number;
  violations: RuleViolation[];
  warnings: RuleWarning[];
  score: number;
}

/**
 * Rule violation detail
 */
export interface RuleViolation {
  ruleId: string;
  ruleName: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  location?: string;
  suggestion?: string;
}

/**
 * Rule warning
 */
export interface RuleWarning {
  ruleId: string;
  message: string;
  suggestion?: string;
}

/**
 * Norwegian Validation Rules
 */
export class ValidationRules {
  // Comprehensive rule definitions
  private readonly RULES = {
    // Jantelov compliance rules
    jantelov: {
      J001: {
        name: 'No excessive self-promotion',
        pattern: /\b(markedsledende|best i|nummer én|overlegen|uslåelig)\b/gi,
        severity: 'high' as const,
        message: 'Unngå overdreven selvskryt'
      },
      J002: {
        name: 'No direct competitor comparison',
        pattern: /\b(bedre enn|slår alle|ingen kan måle seg)\b/gi,
        severity: 'medium' as const,
        message: 'Unngå direkte sammenligning med konkurrenter'
      },
      J003: {
        name: 'No absolute claims',
        pattern: /\b(alltid best|aldri feil|garantert|100%)\b/gi,
        severity: 'medium' as const,
        message: 'Moderer absolutte påstander'
      },
      J004: {
        name: 'Team over individual',
        pattern: /\b(jeg alene|min suksess|takket være meg)\b/gi,
        severity: 'high' as const,
        message: 'Fremhev team fremfor individ'
      }
    },

    // Business communication rules
    business: {
      B001: {
        name: 'Professional tone',
        pattern: /\b(lol|haha|wtf|omg)\b/gi,
        severity: 'critical' as const,
        message: 'Uprofesjonelt språk oppdaget'
      },
      B002: {
        name: 'Avoid excessive anglicisms',
        maxCount: 5,
        terms: ['meeting', 'deadline', 'workshop', 'feedback', 'brainstorming'],
        severity: 'low' as const,
        message: 'For mange anglisismer'
      },
      B003: {
        name: 'Include action words',
        required: ['kontakt', 'bestill', 'prøv', 'les mer', 'finn ut'],
        severity: 'medium' as const,
        message: 'Mangler handlingsoppfordring'
      },
      B004: {
        name: 'Evidence-based claims',
        requiresEvidence: /\b(beste|førende|raskeste|billigste)\b/gi,
        evidenceMarkers: ['ifølge', 'viser', 'dokumentert', 'forskning'],
        severity: 'high' as const,
        message: 'Påstander mangler dokumentasjon'
      }
    },

    // Language quality rules
    language: {
      L001: {
        name: 'Proper compound words',
        compounds: {
          incorrect: ['for øvrig', 'i mellom', 'for di'],
          correct: ['forøvrig', 'imellom', 'fordi']
        },
        severity: 'medium' as const,
        message: 'Feil sammensetning av ord'
      },
      L002: {
        name: 'No double negation',
        pattern: /\b(ikke ingen|ikke aldri|ikke ingenting)\b/gi,
        severity: 'high' as const,
        message: 'Dobbel nektelse'
      },
      L003: {
        name: 'Consistent gender usage',
        checkConsistency: true,
        severity: 'low' as const,
        message: 'Inkonsekvent kjønnsbruk'
      },
      L004: {
        name: 'Avoid redundancy',
        pattern: /\b(kun bare|begge to|helt og holdent)\b/gi,
        severity: 'low' as const,
        message: 'Overflødig uttrykk'
      }
    },

    // Formatting rules
    formatting: {
      F001: {
        name: 'Proper punctuation spacing',
        pattern: /\s+[.,!?;:]|\w[.,!?;:]\w/g,
        severity: 'low' as const,
        message: 'Feil tegnsetting'
      },
      F002: {
        name: 'Paragraph structure',
        minParagraphLength: 50,
        maxParagraphLength: 500,
        severity: 'low' as const,
        message: 'Upassende avsnittslengde'
      },
      F003: {
        name: 'Sentence variety',
        checkVariety: true,
        severity: 'low' as const,
        message: 'Lite variasjon i setningsstruktur'
      }
    },

    // Content structure rules
    structure: {
      S001: {
        name: 'Has introduction',
        requiresIntro: true,
        minIntroLength: 50,
        severity: 'medium' as const,
        message: 'Mangler introduksjon'
      },
      S002: {
        name: 'Has conclusion',
        requiresConclusion: true,
        minConclusionLength: 40,
        severity: 'medium' as const,
        message: 'Mangler konklusjon'
      },
      S003: {
        name: 'Logical flow markers',
        flowMarkers: ['først', 'deretter', 'videre', 'dessuten', 'avslutningsvis'],
        minMarkers: 2,
        severity: 'low' as const,
        message: 'Mangler strukturmarkører'
      }
    },

    // SEO and digital rules
    digital: {
      D001: {
        name: 'SEO-friendly title',
        maxTitleLength: 60,
        requiresKeyword: true,
        severity: 'medium' as const,
        message: 'Tittel ikke SEO-optimalisert'
      },
      D002: {
        name: 'Meta description',
        maxDescriptionLength: 160,
        severity: 'low' as const,
        message: 'Meta-beskrivelse for lang'
      },
      D003: {
        name: 'Keyword density',
        minDensity: 1,
        maxDensity: 3,
        severity: 'low' as const,
        message: 'Upassende nøkkelordtetthet'
      }
    },

    // Cultural sensitivity rules
    cultural: {
      C001: {
        name: 'Inclusive language',
        inclusiveTerms: ['vi', 'oss', 'sammen', 'felles'],
        minOccurrences: 2,
        severity: 'medium' as const,
        message: 'Mangler inkluderende språk'
      },
      C002: {
        name: 'Norwegian cultural references',
        positiveReferences: ['dugnad', 'fellesskap', 'bærekraft', 'likestilling'],
        severity: 'low' as const,
        message: 'Få norske kulturelle referanser'
      },
      C003: {
        name: 'Seasonal awareness',
        checkSeasonal: true,
        severity: 'low' as const,
        message: 'Vurder sesongbaserte referanser'
      }
    }
  };

  // Content type specific rule sets
  private readonly CONTENT_TYPE_RULES: Record<string, string[]> = {
    blogPost: ['J001', 'J002', 'B002', 'B004', 'L001', 'L002', 'S001', 'S002', 'S003', 'D001', 'C001'],
    email: ['J001', 'B001', 'B003', 'L001', 'L002', 'F001'],
    socialMedia: ['J001', 'J004', 'B001', 'L001', 'C001', 'D003'],
    websiteCopy: ['J001', 'J002', 'B002', 'B003', 'B004', 'L001', 'S001', 'D001', 'D002'],
    caseStudy: ['J002', 'B004', 'L001', 'L002', 'S001', 'S002', 'S003', 'C001'],
    pressRelease: ['J001', 'B001', 'B004', 'L001', 'L002', 'F001', 'S001', 'S002']
  };

  /**
   * Apply validation rules
   */
  async apply(request: ValidationRuleRequest): Promise<ValidationRuleResult> {
    const violations: RuleViolation[] = [];
    const warnings: RuleWarning[] = [];
    let rulesApplied = 0;
    let rulesPassed = 0;
    let rulesFailed = 0;

    // Get applicable rules for content type
    const applicableRules = this.getApplicableRules(request.contentType, request.strictness);

    // Apply each rule
    for (const ruleId of applicableRules) {
      const rule = this.getRuleById(ruleId);
      if (!rule) continue;

      rulesApplied++;
      const result = this.applyRule(rule, ruleId, request.content);
      
      if (result.passed) {
        rulesPassed++;
      } else {
        rulesFailed++;
        if (result.violation) {
          violations.push(result.violation);
        }
        if (result.warning) {
          warnings.push(result.warning);
        }
      }
    }

    // Calculate score
    const score = this.calculateRuleScore(rulesApplied, rulesPassed, violations);

    return {
      rulesApplied,
      rulesPassed,
      rulesFailed,
      violations,
      warnings,
      score
    };
  }

  /**
   * Apply individual rule
   */
  private applyRule(
    rule: any,
    ruleId: string,
    content: string
  ): { passed: boolean; violation?: RuleViolation; warning?: RuleWarning } {
    const lowerContent = content.toLowerCase();

    // Pattern-based rules
    if (rule.pattern) {
      const matches = content.match(rule.pattern);
      if (matches && matches.length > 0) {
        return {
          passed: false,
          violation: {
            ruleId,
            ruleName: rule.name,
            category: this.getCategoryFromRuleId(ruleId),
            severity: rule.severity,
            message: rule.message,
            location: matches[0],
            suggestion: this.getSuggestionForRule(ruleId, matches[0])
          }
        };
      }
    }

    // Term count rules
    if (rule.maxCount && rule.terms) {
      let count = 0;
      for (const term of rule.terms) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) count += matches.length;
      }
      
      if (count > rule.maxCount) {
        return {
          passed: false,
          violation: {
            ruleId,
            ruleName: rule.name,
            category: this.getCategoryFromRuleId(ruleId),
            severity: rule.severity,
            message: `${rule.message} (${count} funnet, maks ${rule.maxCount})`
          }
        };
      }
    }

    // Required terms rules
    if (rule.required) {
      const hasRequired = rule.required.some((term: string) => 
        lowerContent.includes(term)
      );
      
      if (!hasRequired) {
        return {
          passed: false,
          violation: {
            ruleId,
            ruleName: rule.name,
            category: this.getCategoryFromRuleId(ruleId),
            severity: rule.severity,
            message: rule.message,
            suggestion: `Inkluder minst ett av: ${rule.required.join(', ')}`
          }
        };
      }
    }

    // Evidence-based claim rules
    if (rule.requiresEvidence) {
      const hasClaims = rule.requiresEvidence.test(content);
      if (hasClaims) {
        const hasEvidence = rule.evidenceMarkers.some((marker: string) => 
          lowerContent.includes(marker)
        );
        
        if (!hasEvidence) {
          return {
            passed: false,
            violation: {
              ruleId,
              ruleName: rule.name,
              category: this.getCategoryFromRuleId(ruleId),
              severity: rule.severity,
              message: rule.message,
              suggestion: 'Underbygg påstander med kilder eller data'
            }
          };
        }
      }
    }

    // Compound word rules
    if (rule.compounds) {
      for (let i = 0; i < rule.compounds.incorrect.length; i++) {
        const incorrect = rule.compounds.incorrect[i];
        const correct = rule.compounds.correct[i];
        
        if (lowerContent.includes(incorrect)) {
          return {
            passed: false,
            violation: {
              ruleId,
              ruleName: rule.name,
              category: this.getCategoryFromRuleId(ruleId),
              severity: rule.severity,
              message: rule.message,
              location: incorrect,
              suggestion: `Skriv "${incorrect}" som "${correct}"`
            }
          };
        }
      }
    }

    // Paragraph structure rules
    if (rule.minParagraphLength || rule.maxParagraphLength) {
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
      for (const paragraph of paragraphs) {
        if (rule.minParagraphLength && paragraph.length < rule.minParagraphLength) {
          return {
            passed: false,
            warning: {
              ruleId,
              message: 'Avsnitt er for kort',
              suggestion: `Utvid avsnitt til minst ${rule.minParagraphLength} tegn`
            }
          };
        }
        if (rule.maxParagraphLength && paragraph.length > rule.maxParagraphLength) {
          return {
            passed: false,
            warning: {
              ruleId,
              message: 'Avsnitt er for langt',
              suggestion: `Del opp avsnitt over ${rule.maxParagraphLength} tegn`
            }
          };
        }
      }
    }

    // Introduction/conclusion rules
    if (rule.requiresIntro) {
      const firstParagraph = content.split(/\n\n+/)[0];
      if (!firstParagraph || firstParagraph.length < rule.minIntroLength) {
        return {
          passed: false,
          violation: {
            ruleId,
            ruleName: rule.name,
            category: this.getCategoryFromRuleId(ruleId),
            severity: rule.severity,
            message: rule.message
          }
        };
      }
    }

    if (rule.requiresConclusion) {
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
      const lastParagraph = paragraphs[paragraphs.length - 1];
      if (!lastParagraph || lastParagraph.length < rule.minConclusionLength) {
        return {
          passed: false,
          violation: {
            ruleId,
            ruleName: rule.name,
            category: this.getCategoryFromRuleId(ruleId),
            severity: rule.severity,
            message: rule.message
          }
        };
      }
    }

    // Flow markers rule
    if (rule.flowMarkers && rule.minMarkers) {
      let markerCount = 0;
      for (const marker of rule.flowMarkers) {
        if (lowerContent.includes(marker)) {
          markerCount++;
        }
      }
      
      if (markerCount < rule.minMarkers) {
        return {
          passed: false,
          warning: {
            ruleId,
            message: rule.message,
            suggestion: `Legg til strukturmarkører: ${rule.flowMarkers.join(', ')}`
          }
        };
      }
    }

    // Inclusive language rule
    if (rule.inclusiveTerms && rule.minOccurrences) {
      let occurrences = 0;
      for (const term of rule.inclusiveTerms) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) occurrences += matches.length;
      }
      
      if (occurrences < rule.minOccurrences) {
        return {
          passed: false,
          violation: {
            ruleId,
            ruleName: rule.name,
            category: this.getCategoryFromRuleId(ruleId),
            severity: rule.severity,
            message: rule.message,
            suggestion: 'Øk bruken av inkluderende språk'
          }
        };
      }
    }

    return { passed: true };
  }

  /**
   * Get applicable rules based on content type and strictness
   */
  private getApplicableRules(contentType: string, strictness: string): string[] {
    const baseRules = this.CONTENT_TYPE_RULES[contentType] || 
      this.CONTENT_TYPE_RULES.blogPost;
    
    if (strictness === 'strict') {
      // Add all rules in strict mode
      return [
        ...baseRules,
        ...Object.keys(this.RULES.jantelov),
        ...Object.keys(this.RULES.language),
        ...Object.keys(this.RULES.formatting)
      ].filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
    } else if (strictness === 'relaxed') {
      // Only critical and high severity rules
      return baseRules.filter(ruleId => {
        const rule = this.getRuleById(ruleId);
        return rule && (rule.severity === 'critical' || rule.severity === 'high');
      });
    }
    
    return baseRules; // Moderate - use default set
  }

  /**
   * Get rule by ID
   */
  private getRuleById(ruleId: string): any {
    for (const category of Object.values(this.RULES)) {
      if (category[ruleId]) {
        return category[ruleId];
      }
    }
    return null;
  }

  /**
   * Get category from rule ID
   */
  private getCategoryFromRuleId(ruleId: string): string {
    const prefix = ruleId[0];
    const categoryMap: Record<string, string> = {
      'J': 'jantelov',
      'B': 'business',
      'L': 'language',
      'F': 'formatting',
      'S': 'structure',
      'D': 'digital',
      'C': 'cultural'
    };
    return categoryMap[prefix] || 'general';
  }

  /**
   * Get suggestion for rule violation
   */
  private getSuggestionForRule(ruleId: string, match: string): string {
    const suggestions: Record<string, string> = {
      'J001': 'Bruk mer ydmyke formuleringer',
      'J002': 'Fokuser på egne styrker uten sammenligning',
      'J003': 'Bruk kvalifiserte påstander med bevis',
      'J004': 'Fremhev teamets bidrag',
      'B001': 'Fjern uprofesjonelt språk',
      'B002': 'Erstatt med norske termer',
      'L001': 'Korriger ordsammensetning',
      'L002': 'Fjern dobbel nektelse'
    };
    
    return suggestions[ruleId] || 'Juster i henhold til norske skriveregler';
  }

  /**
   * Calculate rule-based score
   */
  private calculateRuleScore(
    rulesApplied: number,
    rulesPassed: number,
    violations: RuleViolation[]
  ): number {
    if (rulesApplied === 0) return 100;
    
    // Base score from pass rate
    let score = (rulesPassed / rulesApplied) * 100;
    
    // Apply severity penalties
    for (const violation of violations) {
      switch (violation.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Get rule summary
   */
  getRuleSummary(): {
    totalRules: number;
    categories: string[];
    severityLevels: string[];
  } {
    let totalRules = 0;
    const categories = Object.keys(this.RULES);
    
    for (const category of Object.values(this.RULES)) {
      totalRules += Object.keys(category).length;
    }
    
    return {
      totalRules,
      categories,
      severityLevels: ['critical', 'high', 'medium', 'low']
    };
  }

  /**
   * Export rules for documentation
   */
  exportRules(): any {
    return this.RULES;
  }
}