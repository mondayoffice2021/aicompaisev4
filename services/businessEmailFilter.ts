import { isPublicDomain } from '../constants/domains';

export type NonBusinessCategory = 
  | 'bank' 
  | 'government' 
  | 'education' 
  | 'news' 
  | 'webmaster_bot' 
  | 'computer_generated'
  | 'public_webmail'
  | 'invalid'
  | 'dead_mx';

export interface BusinessFilterOptions {
  filterBank?: boolean;
  filterGovernment?: boolean;
  filterEducation?: boolean;
  filterNews?: boolean;
  filterWebmasterBot?: boolean;
  filterComputerGenerated?: boolean;
  filterPublicWebmail?: boolean;
  filterBadSyntax?: boolean;
  filterDisposable?: boolean;
}

export const DEFAULT_BUSINESS_FILTER_OPTIONS: BusinessFilterOptions = {
  filterBank: true,
  filterGovernment: true,
  filterEducation: true,
  filterNews: true,
  filterWebmasterBot: true,
  filterComputerGenerated: true,
  filterPublicWebmail: true, // Clean public emails like Gmail by default in sender hygiene
  filterBadSyntax: true,
  filterDisposable: true,
};

export interface BusinessFilterResult {
  isBusiness: boolean;
  category: 'business' | NonBusinessCategory;
  reason?: string;
  matchedRule?: string;
}

// 1. Bank & Financial institutions
const BANK_KEYWORDS = [
  'bank', 'banco', 'banque', 'banca', 'banking', 'creditunion', 'credit-union',
  'capital', 'finance', 'financial', 'invest', 'investment', 'chase', 'wellsfargo',
  'citi', 'citigroup', 'hsbc', 'barclays', 'santander', 'ubs', 'deutschebank',
  'standardchartered', 'pnc', 'usbank', 'truist', 'schwab', 'fidelity',
  'vanguard', 'paypal', 'stripe', 'visa', 'mastercard', 'amex', 'americanexpress',
  'klarna', 'revolut', 'wise.com', 'monzo', 'n26', 'crypto', 'binance', 'coinbase',
  'kraken', 'blockchain', 'wallet', 'treasury', 'lending', 'mortgage', 'wealth',
  'goldmansachs', 'morganstanley', 'blackrock', 'bofa', 'bankofamerica'
];

const EXACT_BANK_DOMAINS = new Set([
  'chase.com', 'wellsfargo.com', 'citi.com', 'citigroup.com', 'hsbc.com',
  'barclays.com', 'santander.com', 'ubs.com', 'db.com', 'sc.com',
  'pnc.com', 'usbank.com', 'truist.com', 'schwab.com', 'fidelity.com',
  'vanguard.com', 'paypal.com', 'stripe.com', 'visa.com', 'mastercard.com',
  'americanexpress.com', 'revolut.com', 'wise.com', 'binance.com', 'coinbase.com',
  'bankofamerica.com', 'goldmansachs.com', 'morganstanley.com', 'blackrock.com'
]);

// 2. Government & Military
const GOV_TLD_SUBSTRINGS = [
  '.gov', '.mil', '.gouv.', '.gob.', '.go.jp', '.go.kr', '.go.id', '.go.th',
  '.gv.at', '.admin.ch', '.gov.uk', '.gov.in', '.gov.cn', '.gov.au', '.gov.br',
  '.gov.it', '.gov.za', '.europa.eu', '.belgium.be', '.etat.', '.bund.',
  '.gc.ca', '.gob.mx', '.gov.sg', '.gov.my', '.govt.nz'
];

const GOV_KEYWORDS = [
  'parliament', 'ministry', 'senate', 'congress', 'embassy', 'consulate',
  'police', 'customs', 'irs.gov', 'fbi.gov', 'cia.gov', 'bundeswehr',
  'bundestag', 'prefecture', 'municipality', 'cityhall', 'state.gov',
  'governance', 'department-of-', 'dept-of-', 'gov-', 'whitehouse', 'pentagon'
];

// 3. Education & Academic
const EDU_TLD_SUBSTRINGS = [
  '.edu', '.ac.uk', '.ac.in', '.ac.jp', '.ac.kr', '.ac.nz', '.ac.za',
  '.ac.at', '.ac.be', '.edu.cn', '.edu.au', '.edu.sg', '.edu.hk',
  '.edu.my', '.edu.tw', '.edu.tr', '.edu.eg', '.edu.ng', '.edu.pk',
  '.edu.ph', '.edu.co', '.edu.ar', '.edu.br', '.edu.mx', '.school.nz',
  '.edu.ca', '.k12.', '.school.'
];

const EDU_KEYWORDS = [
  'university', 'universitaet', 'universidad', 'universite', 'universite',
  'college', 'harvard', 'stanford', 'oxford', 'cambridge', 'mit.edu',
  'school', 'academy', 'campus', 'alumni', 'student', 'faculty',
  'professor', 'k12', 'highschool', 'polytechnic', 'kindergarten',
  'yale.edu', 'princeton.edu', 'columbia.edu', 'berkeley.edu'
];

// 4. News & Media
const NEWS_DOMAINS = new Set([
  'cnn.com', 'bbc.com', 'bbc.co.uk', 'reuters.com', 'bloomberg.com', 'nytimes.com',
  'wsj.com', 'washingtonpost.com', 'theguardian.com', 'apnews.com', 'forbes.com',
  'ft.com', 'spiegel.de', 'lefigaro.fr', 'lemonde.fr', 'corriere.it', 'asahi.com',
  'yomiuri.co.jp', 'xinhuanet.com', 'chinadaily.com.cn', 'huffpost.com', 'buzzfeed.com',
  'foxnews.com', 'nbcnews.com', 'cbsnews.com', 'economist.com', 'politico.com',
  'aljazeera.com', 'dw.com', 'zeit.de', 'faz.net', 'bild.de', 'elpais.com'
]);

const NEWS_DOMAIN_KEYWORDS = [
  'news', 'press', 'gazette', 'tribune', 'media', 'journal', 'times', 'post',
  'herald', 'broadcast', 'chronicle', 'daily', 'magazine', 'reporters',
  'editorial', 'journalism', 'pressrelease', 'wire', 'broadcasting', 'tvnews',
  'radiostation', 'newspaper', 'pubblica'
];

const NEWS_USERNAMES = new Set([
  'press', 'media', 'news', 'editor', 'editorial', 'journalism', 'reporters',
  'journalist', 'newsroom', 'anchors', 'desk', 'breakingnews'
]);

// 5. Webmaster & Automated Bot / Technical Mailboxes
const FORBIDDEN_USERNAMES = new Set([
  'webmaster', 'postmaster', 'hostmaster', 'root', 'abuse', 'noc', 'security',
  'admin', 'administrator', 'helpdesk', 'mailer-daemon', 'mailerdaemon', 'daemon',
  'system', 'sysadmin', 'network', 'dns', 'server', 'ssl', 'cert', 'whois',
  'contact-form', 'donotreply', 'do-not-reply', 'no-reply', 'noreply', 'bounce',
  'bounces', 'bouncing', 'bounced', 'mailer', 'notification', 'notifications',
  'alert', 'alerts', 'newsletter', 'newsletters', 'marketing-automation',
  'auto-confirm', 'autoconfirm', 'support-tickets', 'tickets', 'zendesk',
  'jira', 'gitlab', 'github', 'bitbucket', 'tracking', 'spam', 'bulk',
  'unsubscribe', 'optout', 'automatic', 'reply-to', 'null', 'devnull'
]);

const JUNK_USER_PATTERNS = [
  /^image\d+/i,
  /^part\d+/i,
  /^attachment\d+/i,
  /^frame\d+/i,
  /^thumb\d+/i,
  /^clip\d+/i,
  /^img\d+/i,
  /^file\d+/i,
  /^document\d+/i,
  /^scan\d+/i,
  /^button\d+/i,
  /^icon\d+/i,
  /^logo\d+/i,
  /^asset\d+/i
];

// 6. Disposable Domains
const DISPOSABLE_DOMAINS = new Set([
  'temp-mail.org', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'sharklasers.com', 'dispostable.com', 'yopmail.com', 'throwawaymail.com',
  'fakeinbox.com', 'trashmail.com', 'trashmail.net', 'tempmail.net',
  'generator.email', 'crazymailing.com', 'inboxbear.com', 'emailondeck.com',
  'burnermail.io', 'getnada.com', 'maildrop.cc', 'mohmal.com', 'getairmail.com',
  'mytemp.email', 'tempail.com', 'trash-mail.com', 'trashinbox.com'
]);

// 7. Common Webmail Typos (Malformed Domains)
const WEBMAIL_TYPOS = new Set([
  'gamil.com', 'gmal.com', 'gmaill.com', 'gamil.co', 'gmaill.co', 'gamail.com',
  'hotmial.com', 'hotmial.co', 'hotmaill.com', 'hotmil.com', 'hormail.com',
  'outlok.com', 'outloo.com', 'outlock.com', 'outlok.co',
  'yaho.com', 'yahou.com', 'yhaoo.com', 'yahooo.com', 'yhoo.com',
  'icoud.com', 'iclud.com', 'prtonmail.com', 'prton.me'
]);

/**
 * Validates whether an email is a legitimate commercial/business email
 * or falls into excluded non-business categories (Bank, Gov, Edu, News, Webmaster/Bot, Computer Generated, Public Webmail, Invalid).
 */
export function classifyBusinessEmail(
  email: string, 
  options: BusinessFilterOptions = DEFAULT_BUSINESS_FILTER_OPTIONS
): BusinessFilterResult {
  const trimmed = (email || '').trim().replace(/^[<"']+|[>"']+$/g, '');
  
  // Syntax check
  if (!trimmed || !trimmed.includes('@')) {
    return { isBusiness: false, category: 'invalid', reason: 'Missing @ symbol' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isBusiness: false, category: 'invalid', reason: 'Multiple @ symbols' };
  }

  const user = parts[0].trim().toLowerCase();
  const domain = parts[1].trim().toLowerCase();

  if (!user || !domain) {
    return { isBusiness: false, category: 'invalid', reason: 'Empty username or domain' };
  }

  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return { isBusiness: false, category: 'invalid', reason: 'Invalid or missing domain TLD' };
  }

  // Check email syntax regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { isBusiness: false, category: 'invalid', reason: 'Malformed email syntax characters' };
  }

  // 1. Webmail Typos & Disposable Email Filter
  if (options.filterDisposable !== false) {
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return { 
        isBusiness: false, 
        category: 'invalid', 
        reason: 'Temporary / disposable throwaway email service', 
        matchedRule: `Disposable domain ${domain}` 
      };
    }
  }

  if (options.filterBadSyntax !== false) {
    if (WEBMAIL_TYPOS.has(domain)) {
      return { 
        isBusiness: false, 
        category: 'invalid', 
        reason: `Misspelled webmail domain (@${domain})`, 
        matchedRule: `Typo domain` 
      };
    }
  }

  // 2. Webmaster, Technical & Bot Filter
  if (options.filterWebmasterBot !== false) {
    if (FORBIDDEN_USERNAMES.has(user)) {
      return { 
        isBusiness: false, 
        category: 'webmaster_bot', 
        reason: 'Technical or automated system mailbox', 
        matchedRule: `Username "${user}"` 
      };
    }

    if (
      user.includes('noreply') || 
      user.includes('no-reply') || 
      user.includes('donotreply') || 
      user.includes('do-not-reply') || 
      user.includes('newsletter') ||
      user.includes('bounce') ||
      user.startsWith('daemon')
    ) {
      return { 
        isBusiness: false, 
        category: 'webmaster_bot', 
        reason: 'Automated notification mailbox', 
        matchedRule: `Contains automated marker "${user}"` 
      };
    }
  }

  // 3. Computer-Generated / Scraping Artifact / Hash Filter
  if (options.filterComputerGenerated !== false) {
    // Check junk / file attachments / scrap artifacts
    const isJunkPattern = JUNK_USER_PATTERNS.some(re => re.test(user));
    const hasFileExt = /\.(gif|jpg|jpeg|png|bmp|svg|pdf|doc|docx|zip|rar|exe|dll|bin|ico|webp)$/i.test(user);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user);
    const numDigits = (user.match(/\d/g) || []).length;
    
    // Too many consecutive digits or high digit ratio (>50%)
    const isOverlyNumeric = user.length >= 7 && (numDigits / user.length) >= 0.5;
    const hasTooManyDigits = numDigits >= 6;

    // Alphanumeric hash-like string: long (>= 12), no dots/hyphens, very few vowels
    const vowelCount = (user.match(/[aeiou]/gi) || []).length;
    const isHashLike = user.length >= 10 && /^[a-z0-9]+$/i.test(user) && !user.includes('.') && !user.includes('_') && vowelCount <= 1;

    // Dummy test accounts
    const isDummyAccount = /^(test|demo|sample|asdf|qwerty|123456|testing|fake|foo|bar|null|none)$/i.test(user);

    if (isJunkPattern || hasFileExt || isUUID || isOverlyNumeric || hasTooManyDigits || isHashLike || isDummyAccount) {
      return { 
        isBusiness: false, 
        category: 'computer_generated', 
        reason: 'Machine-generated, automated hash, or scrap artifact', 
        matchedRule: isUUID ? 'UUID pattern' : isJunkPattern ? 'Attachment/scrap artifact' : isHashLike ? 'Hash string' : 'Numeric bot pattern' 
      };
    }
  }

  // 4. Public Webmail Filter (Gmail, Yahoo, Outlook, Hotmail, etc.)
  if (options.filterPublicWebmail === true) {
    if (isPublicDomain(domain)) {
      return { 
        isBusiness: false, 
        category: 'public_webmail', 
        reason: 'Free consumer public webmail provider (Gmail/Yahoo/Outlook/etc.)', 
        matchedRule: `Public domain ${domain}` 
      };
    }
  }

  // 5. Government & Military Filter
  if (options.filterGovernment !== false) {
    const isGovTLD = GOV_TLD_SUBSTRINGS.some(tld => domain.endsWith(tld) || domain.includes(tld));
    if (isGovTLD) {
      return { 
        isBusiness: false, 
        category: 'government', 
        reason: 'Government or military agency domain (.gov/.mil)', 
        matchedRule: 'Gov TLD' 
      };
    }

    const isGovKeyword = GOV_KEYWORDS.some(kw => domain.includes(kw));
    if (isGovKeyword) {
      return { 
        isBusiness: false, 
        category: 'government', 
        reason: 'Government organization keyword', 
        matchedRule: 'Gov domain keyword' 
      };
    }
  }

  // 6. Education & Academic Filter
  if (options.filterEducation !== false) {
    const isEduTLD = EDU_TLD_SUBSTRINGS.some(tld => domain.endsWith(tld) || domain.includes(tld));
    if (isEduTLD) {
      return { 
        isBusiness: false, 
        category: 'education', 
        reason: 'Educational or academic institution domain (.edu/.ac)', 
        matchedRule: 'Edu TLD' 
      };
    }

    const isEduKeyword = EDU_KEYWORDS.some(kw => domain.includes(kw) || user.includes(kw));
    if (isEduKeyword) {
      return { 
        isBusiness: false, 
        category: 'education', 
        reason: 'Academic institution or university keyword', 
        matchedRule: 'Edu keyword' 
      };
    }
  }

  // 7. Bank & Financial Institutions Filter
  if (options.filterBank !== false) {
    if (EXACT_BANK_DOMAINS.has(domain)) {
      return { 
        isBusiness: false, 
        category: 'bank', 
        reason: 'Banking or financial service institution', 
        matchedRule: `Financial domain ${domain}` 
      };
    }

    const isBankKeyword = BANK_KEYWORDS.some(kw => domain.includes(kw));
    if (isBankKeyword) {
      return { 
        isBusiness: false, 
        category: 'bank', 
        reason: 'Bank or financial institution keyword', 
        matchedRule: `Bank keyword in ${domain}` 
      };
    }
  }

  // 8. News & Media Outlets Filter
  if (options.filterNews !== false) {
    if (NEWS_DOMAINS.has(domain)) {
      return { 
        isBusiness: false, 
        category: 'news', 
        reason: 'News or media outlet domain', 
        matchedRule: `News publication ${domain}` 
      };
    }

    if (NEWS_USERNAMES.has(user)) {
      return { 
        isBusiness: false, 
        category: 'news', 
        reason: 'Press/media desk mailbox', 
        matchedRule: `Press mailbox "${user}@"` 
      };
    }

    const isNewsDomainKeyword = NEWS_DOMAIN_KEYWORDS.some(kw => domain.includes(kw));
    if (isNewsDomainKeyword) {
      return { 
        isBusiness: false, 
        category: 'news', 
        reason: 'News, media, or press agency', 
        matchedRule: `Media keyword in ${domain}` 
      };
    }
  }

  // Passed all filters -> Genuine business email
  return { 
    isBusiness: true, 
    category: 'business' 
  };
}

/**
 * Checks DNS MX records for multiple domains via the server batch endpoint.
 */
export async function checkDomainsMxBatch(
  domains: string[]
): Promise<Record<string, { isLive: boolean; hasMx: boolean; mxHost?: string; error?: string }>> {
  if (!domains || domains.length === 0) return {};
  
  try {
    const res = await fetch('/api/verify-mx-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains })
    });

    if (!res.ok) {
      console.warn('[MX Batch Check] Server returned non-200:', res.status);
      return {};
    }

    const data = await res.json();
    return data.results || {};
  } catch (err) {
    console.error('[MX Batch Check] Error contacting MX verification API:', err);
    return {};
  }
}

export interface AdvancedHygieneSummary {
  cleanEmails: string[];
  removedEmails: {
    email: string;
    category: NonBusinessCategory;
    reason?: string;
    matchedRule?: string;
  }[];
  counts: {
    total: number;
    clean: number;
    publicWebmail: number;
    bank: number;
    government: number;
    education: number;
    news: number;
    webmasterBot: number;
    computerGenerated: number;
    invalidSyntax: number;
    deadMx: number;
  };
}

/**
 * High-performance full queue hygiene scanner:
 * Checks public webmails, gov, edu, bank, junk, computer generated, syntax, AND live DNS MX records.
 */
export async function runFullQueueHygiene(
  emails: string[],
  options: BusinessFilterOptions & { checkLiveMx?: boolean },
  onProgress?: (progress: number, stage: string) => void
): Promise<AdvancedHygieneSummary> {
  const cleanEmails: string[] = [];
  const removedEmails: AdvancedHygieneSummary['removedEmails'] = [];

  const counts: AdvancedHygieneSummary['counts'] = {
    total: emails.length,
    clean: 0,
    publicWebmail: 0,
    bank: 0,
    government: 0,
    education: 0,
    news: 0,
    webmasterBot: 0,
    computerGenerated: 0,
    invalidSyntax: 0,
    deadMx: 0,
  };

  onProgress?.(15, 'Scanning syntax, public webmails, gov, edu, bank, junk & bot patterns...');

  // Phase 1: Client heuristics
  const survivingCandidates: string[] = [];

  for (const email of emails) {
    const res = classifyBusinessEmail(email, options);
    if (res.isBusiness) {
      survivingCandidates.push(email);
    } else {
      removedEmails.push({
        email,
        category: res.category as NonBusinessCategory,
        reason: res.reason,
        matchedRule: res.matchedRule,
      });

      switch (res.category) {
        case 'public_webmail': counts.publicWebmail++; break;
        case 'bank': counts.bank++; break;
        case 'government': counts.government++; break;
        case 'education': counts.education++; break;
        case 'news': counts.news++; break;
        case 'webmaster_bot': counts.webmasterBot++; break;
        case 'computer_generated': counts.computerGenerated++; break;
        case 'invalid': counts.invalidSyntax++; break;
        default: counts.invalidSyntax++; break;
      }
    }
  }

  // Phase 2: Live DNS MX Resolution (if requested)
  if (options.checkLiveMx !== false && survivingCandidates.length > 0) {
    onProgress?.(45, `Verifying live DNS MX records for ${survivingCandidates.length} domains...`);

    // Extract unique domains
    const domainToEmails = new Map<string, string[]>();
    for (const email of survivingCandidates) {
      const parts = email.split('@');
      if (parts[1]) {
        const d = parts[1].toLowerCase().trim();
        const existing = domainToEmails.get(d) || [];
        existing.push(email);
        domainToEmails.set(d, existing);
      }
    }

    const uniqueDomains = Array.from(domainToEmails.keys());
    
    // Batch query server in chunks of 50 domains
    const CHUNK_SIZE = 50;
    const mxResultsMap: Record<string, { isLive: boolean; hasMx: boolean; mxHost?: string; error?: string }> = {};

    for (let i = 0; i < uniqueDomains.length; i += CHUNK_SIZE) {
      const slice = uniqueDomains.slice(i, i + CHUNK_SIZE);
      const percent = Math.min(90, Math.round(45 + (i / uniqueDomains.length) * 45));
      onProgress?.(percent, `DNS MX queries in flight: ${i}/${uniqueDomains.length} domains checked...`);
      
      const batchResult = await checkDomainsMxBatch(slice);
      Object.assign(mxResultsMap, batchResult);
    }

    // Now evaluate surviving candidates against MX results
    for (const email of survivingCandidates) {
      const d = email.split('@')[1]?.toLowerCase().trim();
      const mxInfo = mxResultsMap[d];

      // If MX check explicitly failed (domain is dead / has no MX records)
      if (mxInfo && !mxInfo.isLive) {
        removedEmails.push({
          email,
          category: 'dead_mx',
          reason: mxInfo.error || 'No active DNS MX mail servers (Domain is dead/unresponsive)',
          matchedRule: `Dead MX: ${d}`,
        });
        counts.deadMx++;
      } else {
        cleanEmails.push(email);
        counts.clean++;
      }
    }
  } else {
    // No MX check requested, surviving candidates are clean
    for (const email of survivingCandidates) {
      cleanEmails.push(email);
      counts.clean++;
    }
  }

  onProgress?.(100, 'Queue hygiene audit complete.');

  return {
    cleanEmails,
    removedEmails,
    counts,
  };
}

export interface BusinessBatchFilterSummary {
  businessEmails: string[];
  excludedEmails: {
    email: string;
    category: NonBusinessCategory;
    reason?: string;
  }[];
  counts: {
    total: number;
    business: number;
    bank: number;
    government: number;
    education: number;
    news: number;
    webmaster_bot: number;
    public_webmail: number;
    invalid: number;
  };
}

/**
 * Filters a list of emails in bulk, separating business contacts from non-relevant emails.
 */
export function filterBusinessEmailsBulk(
  emails: string[], 
  options: BusinessFilterOptions = DEFAULT_BUSINESS_FILTER_OPTIONS
): BusinessBatchFilterSummary {
  const businessEmails: string[] = [];
  const excludedEmails: BusinessBatchFilterSummary['excludedEmails'] = [];

  const counts = {
    total: emails.length,
    business: 0,
    bank: 0,
    government: 0,
    education: 0,
    news: 0,
    webmaster_bot: 0,
    public_webmail: 0,
    invalid: 0
  };

  emails.forEach(email => {
    const res = classifyBusinessEmail(email, options);
    if (res.isBusiness) {
      businessEmails.push(email);
      counts.business++;
    } else {
      excludedEmails.push({
        email,
        category: res.category as NonBusinessCategory,
        reason: res.reason
      });
      if (res.category in counts) {
        (counts as any)[res.category]++;
      }
    }
  });

  return {
    businessEmails,
    excludedEmails,
    counts
  };
}
