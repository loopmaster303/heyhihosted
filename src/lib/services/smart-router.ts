
/**
 * Smart Router for Pollinations.AI
 * 
 * Analyzes user prompts to detect "Live Data" intent.
 * If detected, routes the request to a search-capable model (perplexity-fast)
 * regardless of the user's selected model.
 */

export class SmartRouter {
  // Triggers for "Live Data" / Search intent
  // Uses word boundaries (\b) to avoid false positives
  private static readonly SEARCH_TRIGGERS = [
    // Temporal (German)
    /\bheute\b/i, /\bmorgen\b/i, /\bgestern\b/i, /\baktuell/i, /\bjetzt\b/i, /\bgerade\b/i,
    /\bneueste/i, /\bdiese woche\b/i, /\bdieses wochenende\b/i,
    // Temporal (English)
    /\btoday\b/i, /\btomorrow\b/i, /\byesterday\b/i, /\bcurrent/i, /\blatest\b/i, /\bnow\b/i,
    /\bthis week\b/i, /\bthis weekend\b/i,
    // News / Events (German)
    /\bnews\b/i, /\bnachrichten\b/i, /\bwetter\b/i, /\bpreis/i, /\bkurs/i, /\bbörse/i,
    /\bergebnis/i, /\bspielstand/i, /\bspiel\b/i,
    /\bevent/i, /\bveranstaltung/i, /\böffnung/i, /\beröffnung/i, /\bgalerie/i,
    /\bkino\b/i, /\bfilm/i, /\bfernsehen\b/i, /\btv\b/i, /\bshow\b/i,
    /\bverkehr/i, /\bstau\b/i, /\bwas ist los\b/i, /\bwas passiert\b/i,
    // News / Events (English)
    /\bweather\b/i, /\bprice/i, /\bstock/i,
    /\bresult/i, /\bscore\b/i, /\bgame\b/i, /\bmatch\b/i,
    /\bopening\b/i, /\bexhibition\b/i, /\bgallery/i, /\bconcert/i,
    /\bcinema\b/i, /\bmovie/i, /\btraffic/i,
    /\bwho is\b/i, /\bwhat's happening\b/i, /\bwhat is happening\b/i,
    // Factual Queries
    /\bwer ist\b/i, /\bwann ist\b/i, /\bwann war\b/i, /\bwhen is\b/i, /\bwhen was\b/i,
  ];

  /**
   * Determines if a prompt requires internet access.
   */
  static shouldRouteToSearch(prompt: string): boolean {
    if (!prompt) return false;
    return this.SEARCH_TRIGGERS.some(trigger => trigger.test(prompt));
  }

  /**
   * Returns the best search model for "Live" requests.
   * Currently defaults to 'perplexity-fast' (Sonar) for speed.
   */
  static getLiveSearchModel(): string {
    return 'perplexity-fast';
  }

  /**
   * Returns the best model for "Deep Research" (Explicit Toggle).
   * Currently 'nomnom' or 'perplexity-reasoning'.
   */
  static getDeepResearchModel(): string {
    return 'perplexity-reasoning'; // Or 'nomnom'
  }
}
