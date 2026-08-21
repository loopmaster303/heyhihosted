import {
  getPreferredDeepResearchModel,
  getPreferredLiveSearchModel,
} from '@/config/chat-options';

/**
 * Smart Router for Pollinations.AI
 * 
 * Analyzes user prompts to detect "Live Data" intent.
 * If detected, routes the request to a search-capable model (perplexity-fast)
 * regardless of the user's selected model.
 */

export class SmartRouter {
  // Past-tense narrative patterns that suppress search routing
  // When the user is telling a story (not asking for info), don't trigger search
  private static readonly NARRATIVE_SUPPRESSORS = [
    // German past-tense with location/event words
    /\b(war|waren|hatte|ging|besuchte|gesehen|gewesen)\b.{0,40}\b(kino|museum|konzert|theater|restaurant|oper|club|bar|café|cafe|ausstellung|galerie)\b/i,
    /\b(kino|museum|konzert|theater|restaurant|oper|club|bar|café|cafe|ausstellung|galerie)\b.{0,40}\b(war|waren|besucht|gesehen|gewesen)\b/i,
    // English past-tense with location/event words
    /\b(went|visited|saw|been|attended|watched)\b.{0,40}\b(cinema|museum|concert|theater|theatre|restaurant|club|bar|exhibition|gallery|movie|show)\b/i,
    /\b(cinema|museum|concert|theater|theatre|restaurant|club|bar|exhibition|gallery|movie|show)\b.{0,40}\b(went|visited|saw|been|attended|watched)\b/i,
  ];

  /**
   * Trigger, die fuer sich allein eine Suche rechtfertigen. Alles hier drin
   * muss so spezifisch sein, dass ein Treffer in normaler Prosa oder in einer
   * Code-Frage praktisch ausgeschlossen ist.
   */
  private static readonly STRONG_TRIGGERS = [
    // Temporal (German)
    /\bheute\b/i, /\bmorgen\b/i, /\bgestern\b/i, /\baktuell/i, /\bgerade eben\b/i,
    /\bneueste/i, /\bdiese woche\b/i, /\bdieses wochenende\b/i, /\bheute abend\b/i,
    // Temporal (English)
    /\btoday\b/i, /\btomorrow\b/i, /\byesterday\b/i, /\bcurrent/i, /\blatest\b/i,
    /\bthis week\b/i, /\bthis weekend\b/i, /\bright now\b/i, /\btonight\b/i,
    // News / Events (German)
    /\bnews\b/i, /\bnachrichten\b/i, /\bwetter\b/i, /\bbörse\b/i,
    /\bspielstand\b/i, /\bveranstaltung/i, /\beröffnung/i,
    /\bkino\b/i, /\bfernsehen\b/i, /\btv-programm\b/i,
    /\bverkehrslage\b/i, /\bstau\b/i,
    /\bwas ist los\b/i, /\bwas passiert\b/i, /\bwas geht\b/i, /\bwas läuft\b/i,
    // Explicit Search/Research Intents (German)
    /\bdurchsuche\b/i, /\bsuche nach\b/i, /\brecherchiere\b/i, /\brecherche\b/i,
    /\bgoogle\b/i, /\bim internet\b/i,
    // Explicit Search/Research Intents (English)
    /\bsearch for\b/i, /\bsearch the web\b/i, /\bweb search\b/i, /\bresearch\b/i,
    /\blook up\b/i, /\bon the internet\b/i,
    // Situational Awareness / Status
    /\bkrieg\b/i, /\bwahl\b/i, /\bpolitik\b/i, /\bcrypto/i, /\baktien/i,
    // People / Entities
    /\bkennst du\b/i, /\bwer war\b/i, /\bsteckbrief\b/i, /\bbiografie\b/i, /\blebenslauf\b/i,
    /\bdo you know\b/i, /\bwho was\b/i,
    /\berzähl mir von\b/i, /\btell me about\b/i,
    // Recommendations / Tips
    /\bempfehlung/i, /\bempfehlen\b/i, /\bwohin\b/i, /\bwo kann man\b/i,
    /\brecommend/i, /\bwhat to do\b/i, /\bwhere to go\b/i,
    // Culture / Nightlife / Events
    /\bkonzert/i, /\bconcert/i, /\bfestival/i, /\bfeiern gehen\b/i,
    /\bausstellung/i, /\bexhibition\b/i, /\bmuseum\b/i, /\btheater\b/i, /\btheatre\b/i,
    // News / Events (English)
    /\bweather\b/i, /\bstock price\b/i, /\bexchange rate\b/i,
    /\bwho is\b/i, /\bwhat's happening\b/i, /\bwhat is happening\b/i,
    // Factual Queries
    /\bwer ist\b/i, /\bwann ist\b/i, /\bwann war\b/i, /\bwhen is\b/i, /\bwhen was\b/i,
  ];

  /**
   * Zu breit, um allein zu zaehlen. "Show me a matching function now" traf
   * frueher vier davon und kostete eine echte Suchanfrage. Sie brauchen jetzt
   * einen QUALIFIER im selben Satz.
   *
   * Das bleibt Heuristik: manches Echte faellt hier durch ("where can I watch
   * the game"). Der Ausweg ist nicht die naechste Ausnahme-Regex, sondern das
   * Modell entscheiden zu lassen — siehe D3.2 im Plan.
   */
  private static readonly WEAK_TRIGGERS = [
    /\bnow\b/i, /\bjetzt\b/i, /\bgerade\b/i,
    /\bpreis/i, /\bkurs\b/i, /\bprice/i, /\bstock/i,
    /\bergebnis/i, /\bspiel\b/i, /\bgame\b/i, /\bscore\b/i, /\bmatch\b/i, /\bresult/i,
    /\bfilm/i, /\bmovie/i, /\bcinema\b/i, /\bshow\b/i,
    /\bclub\b/i, /\bparty\b/i, /\bgalerie/i, /\bgallery/i,
    /\bverkehr/i, /\btraffic/i, /\bopening\b/i, /\bevent/i, /\böffnung/i,
    /\blage\b/i, /\bsituation\b/i, /\bstatus\b/i, /\bentwicklung\b/i, /\btrend/i,
    /\bbio\b/i, /\bprofile\b/i, /\btipp/i, /\btip\b/i,
    /\bsearch\b/i, /\binternet\b/i,
  ];

  /**
   * Woerter, die einem schwachen Treffer Live-Charakter geben: Aktualitaet oder
   * Ortsbezug. Bewusst OHNE die Fragewoerter "when"/"where"/"was" — die stehen
   * in Code-Fragen genauso oft wie in echten Suchanfragen.
   */
  private static readonly QUALIFIERS = [
    /\bheute\b/i, /\bmorgen\b/i, /\bgestern\b/i, /\baktuell/i, /\bneueste/i,
    /\bdiese woche\b/i, /\bdieses wochenende\b/i, /\bheute abend\b/i,
    /\btoday\b/i, /\btomorrow\b/i, /\byesterday\b/i, /\bcurrent/i, /\blatest\b/i,
    /\bthis week\b/i, /\bthis weekend\b/i, /\bright now\b/i, /\btonight\b/i,
    /\bin der nähe\b/i, /\bhier in\b/i, /\bnearby\b/i, /\bnear me\b/i,
    /\blive\b/i, /\bgerade läuft\b/i,
  ];

  /**
   * Determines if a prompt requires internet access.
   */
  static shouldRouteToSearch(prompt: string): boolean {
    if (!prompt) return false;
    // Suppress search for past-tense narratives (user is telling a story, not asking for info)
    if (this.NARRATIVE_SUPPRESSORS.some(pattern => pattern.test(prompt))) return false;
    if (this.STRONG_TRIGGERS.some(trigger => trigger.test(prompt))) return true;
    return (
      this.WEAK_TRIGGERS.some(trigger => trigger.test(prompt))
      && this.QUALIFIERS.some(qualifier => qualifier.test(prompt))
    );
  }

  /**
   * Returns the best search model for "Live" requests.
   * Prefers the visible live-search capable models in the curated order.
   */
  static getLiveSearchModel(fallbackModelId?: string): string | undefined {
    return getPreferredLiveSearchModel(fallbackModelId);
  }

  /**
   * Returns the best model for "Deep Research" (Explicit Toggle).
   * Prefers the visible deep-research capable models in the curated order.
   */
  static getDeepResearchModel(fallbackModelId?: string): string | undefined {
    return getPreferredDeepResearchModel(fallbackModelId);
  }
}
