// Relocation guide content for English-speaking tech job seekers moving to Berlin.
// Facts checked against official sources in September 2026 — see `sources` on each topic.

export const relocationTopics = [
  {
    id: 'visas',
    icon: 'Stamp',
    en: {
      title: 'Visas & work permits',
      tagline: 'How non-EU citizens get the right to work in Germany',
      sections: [
        {
          heading: 'EU Blue Card — the standard tech route',
          bullets: [
            'For university graduates with a German job offer of at least 6 months that matches their degree.',
            '2026 salary thresholds: €50,700 gross/year standard, or €45,934.20 for shortage occupations (IT, engineering, natural sciences, medicine) and for recent graduates (degree less than 3 years old). Shortage-occupation cases need Federal Employment Agency approval.',
            'No degree? IT specialists qualify with at least 3 years of relevant experience in the last 7 years, at the lower €45,934.20 threshold.',
            'Apply online via the Consular Services Portal, then attend your visa appointment at the German mission in your country.',
          ],
        },
        {
          heading: 'Chancenkarte (Opportunity Card) — job-seeker visa',
          bullets: [
            'Lets non-EU nationals stay in Germany for up to 12 months to look for a job, without a job offer in hand.',
            'Two pathways: a fully recognized German-equivalent degree or vocational qualification qualifies you directly; otherwise you need at least 6 points (language skills, experience, age, ties to Germany).',
            'Minimum language requirement: German A1 or English B2 (CEFR).',
            'You may work part-time up to 20 hours/week and do two-week job trials while searching.',
            'Proof of funds required — typically a blocked account (Sperrkonto), €1,091/month in 2026.',
          ],
        },
        {
          heading: 'Good to know',
          bullets: [
            'EU/EEA/Swiss citizens need no visa or work permit — just register your address.',
            'Check early whether your degree counts as recognized: it decides which route is open to you (see Degree recognition).',
            'Visa appointments at German embassies can have long waits — book as soon as your documents are ready.',
          ],
        },
      ],
      sources: [
        { label: 'Make it in Germany — EU Blue Card', url: 'https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card' },
        { label: 'Federal Foreign Office — Chancenkarte', url: 'https://uk.diplo.de/uk-en/02/chancenkarte-2659588' },
        { label: 'Consular Services Portal — online visa application', url: 'https://digital.diplo.de/Blaue-Karte' },
      ],
    },
    de: {
      title: 'Visa & Arbeitserlaubnis',
      tagline: 'Wie Nicht-EU-Bürger:innen die Arbeitserlaubnis bekommen',
      sections: [
        {
          heading: 'Blaue Karte EU — der Standardweg für Tech',
          bullets: [
            'Für Hochschulabsolvent:innen mit einem deutschen Jobangebot von mindestens 6 Monaten, das zum Abschluss passt.',
            'Gehaltsgrenzen 2026: 50.700 € brutto/Jahr regulär, 45.934,20 € für Engpassberufe (IT, Ingenieurwesen, Naturwissenschaften, Medizin) und Berufseinsteiger:innen (Abschluss vor weniger als 3 Jahren). Bei Engpassberufen ist die Zustimmung der Bundesagentur für Arbeit nötig.',
            'Ohne Abschluss: IT-Fachkräfte mit mindestens 3 Jahren einschlägiger Erfahrung in den letzten 7 Jahren qualifizieren sich zur niedrigeren Grenze von 45.934,20 €.',
            'Online-Antrag über das Konsularportal, dann Termin bei der deutschen Auslandsvertretung.',
          ],
        },
        {
          heading: 'Chancenkarte — Visum zur Jobsuche',
          bullets: [
            'Ermöglicht Nicht-EU-Bürger:innen bis zu 12 Monate Aufenthalt in Deutschland zur Jobsuche — ohne Jobangebot.',
            'Zwei Wege: ein voll anerkannter Abschluss qualifiziert direkt; sonst sind mindestens 6 Punkte nötig (Sprache, Erfahrung, Alter, Bezug zu Deutschland).',
            'Sprachminimum: Deutsch A1 oder Englisch B2 (GER).',
            'Nebenjobs bis 20 Stunden/Woche und zweiwöchige Probearbeiten sind erlaubt.',
            'Finanzierungsnachweis nötig — meist ein Sperrkonto, 1.091 €/Monat (2026).',
          ],
        },
        {
          heading: 'Gut zu wissen',
          bullets: [
            'EU/EWR/Schweizer Staatsbürger:innen brauchen kein Visum — nur die Adresse anmelden.',
            'Früh prüfen, ob der Abschluss als anerkannt gilt — das entscheidet über den Weg (siehe Abschluss-Anerkennung).',
            'Visumstermine bei Botschaften haben oft lange Wartezeiten — buchen, sobald die Unterlagen fertig sind.',
          ],
        },
      ],
      sources: [
        { label: 'Make it in Germany — Blaue Karte EU', url: 'https://www.make-it-in-germany.com/en/visa-residence/types/eu-blue-card' },
        { label: 'Auswärtiges Amt — Chancenkarte', url: 'https://uk.diplo.de/uk-en/02/chancenkarte-2659588' },
        { label: 'Konsularportal — Online-Visumantrag', url: 'https://digital.diplo.de/Blaue-Karte' },
      ],
    },
  },
  {
    id: 'anmeldung',
    icon: 'MapPin',
    en: {
      title: 'City registration (Anmeldung)',
      tagline: 'The first bureaucratic step after you land',
      sections: [
        {
          heading: 'What it is',
          bullets: [
            'Anmeldung = registering your home address at the local citizens\' office (Bürgeramt). It is mandatory by law (Bundesmeldegesetz).',
            'You should register within 14 days of moving in (§54 BMG). In practice Berlin is tolerant when appointments are scarce — but book immediately and keep proof of your attempts.',
            'You get a registration certificate (Meldebescheinigung) — keep it safe, you need it constantly.',
          ],
        },
        {
          heading: 'How it works in Berlin',
          bullets: [
            'Book an appointment online — any Bürgeramt in Berlin works, not just your district. New slots drop early in the morning.',
            'Bring: passport, the landlord confirmation form (Wohnungsgeberbestätigung), and the filled registration form. The visit itself takes 10–15 minutes.',
            'Berlin\'s central hotline 115 can help find appointments.',
          ],
        },
        {
          heading: 'Why it unlocks everything',
          bullets: [
            'Your tax ID (Steuer-ID) is mailed to you automatically after your first registration.',
            'Banks, mobile contracts, residence permits and health insurance sign-ups all ask for the Meldebescheinigung.',
            'Red flag: a landlord who refuses to give you a Wohnungsgeberbestätigung — without it you cannot register.',
          ],
        },
      ],
      sources: [
        { label: 'Berlin.de — register your residence (appointment booking)', url: 'https://service.berlin.de/dienstleistung/120686/' },
        { label: 'Willkommenszentrum Berlin — Anmeldung help', url: 'https://willkommenszentrum.berlin.de/' },
        { label: 'Simple Berlin — Anmeldung guide', url: 'https://www.simpleberlin.com/blog/anmeldung-berlin-register-your-address' },
      ],
    },
    de: {
      title: 'Anmeldung (Wohnsitz)',
      tagline: 'Der erste Behördenschritt nach der Ankunft',
      sections: [
        {
          heading: 'Was das ist',
          bullets: [
            'Anmeldung = die Wohnadresse beim Bürgeramt registrieren. Gesetzlich Pflicht (Bundesmeldegesetz).',
            'Frist: innerhalb von 14 Tagen nach Einzug (§54 BMG). Berlin ist tolerant, wenn Termine fehlen — trotzdem sofort buchen und Versuche dokumentieren.',
            'Man erhält eine Meldebescheinigung — gut aufbewahren, sie wird ständig gebraucht.',
          ],
        },
        {
          heading: 'So läuft es in Berlin',
          bullets: [
            'Termin online buchen — jedes Bürgeramt in Berlin geht, nicht nur das im eigenen Bezirk. Neue Slots erscheinen früh morgens.',
            'Mitbringen: Reisepass, Wohnungsgeberbestätigung, ausgefülltes Anmeldeformular. Der Termin dauert 10–15 Minuten.',
            'Die Berliner Hotline 115 hilft bei der Terminsuche.',
          ],
        },
        {
          heading: 'Warum sie alles freischaltet',
          bullets: [
            'Die Steuer-ID kommt nach der ersten Anmeldung automatisch per Post.',
            'Banken, Handyverträge, Aufenthaltstitel und Krankenkassen fragen die Meldebescheinigung ab.',
            'Warnsignal: ein Vermieter, der keine Wohnungsgeberbestätigung ausstellt — ohne sie ist keine Anmeldung möglich.',
          ],
        },
      ],
      sources: [
        { label: 'Berlin.de — Wohnsitz anmelden (Terminbuchung)', url: 'https://service.berlin.de/dienstleistung/120686/' },
        { label: 'Willkommenszentrum Berlin — Hilfe zur Anmeldung', url: 'https://willkommenszentrum.berlin.de/' },
        { label: 'Simple Berlin — Anmeldung-Guide', url: 'https://www.simpleberlin.com/blog/anmeldung-berlin-register-your-address' },
      ],
    },
  },
  {
    id: 'health',
    icon: 'HeartPulse',
    en: {
      title: 'Health insurance',
      tagline: 'Mandatory from day one — public or private',
      sections: [
        {
          heading: 'Statutory insurance (GKV) — the default',
          bullets: [
            'Most employees are insured in the statutory system (TK, AOK, Barmer and ~90 others).',
            'Contribution: 14.6% of gross salary plus an insurer-specific supplement (Zusatzbeitrag), 2.9% on average in 2026 — split equally between you and your employer.',
            'Family members without income are co-insured free of charge.',
            'TK is a popular expat choice with full English support.',
          ],
        },
        {
          heading: 'Private insurance (PKV)',
          bullets: [
            'An option only if you earn above the 2026 threshold of €77,400/year, or are self-employed.',
            'Often cheaper when young and healthy, but premiums rise with age and switching back to GKV is hard — decide carefully.',
          ],
        },
        {
          heading: 'Practical tips',
          bullets: [
            'You can pick any statutory insurer — coverage is ~95% identical, service and extras differ.',
            'Your employer registers you; you just choose the insurer and give them your membership confirmation.',
            'Job seekers without income can often stay covered via EU transfer (EHIC/PDA S1) for a limited time, or join voluntarily.',
          ],
        },
      ],
      sources: [
        { label: 'TK — English health insurance service', url: 'https://www.tk.de/en' },
        { label: '2026 contribution rates overview (German)', url: 'https://lohn-info.de/krankenversicherung_zusatzbeitrag_2026.html' },
        { label: '2026 income thresholds (Federal Law Gazette, PDF)', url: 'https://www.recht.bund.de/bgbl/1/2025/278/regelungstext.pdf' },
      ],
    },
    de: {
      title: 'Krankenversicherung',
      tagline: 'Pflicht ab Tag eins — gesetzlich oder privat',
      sections: [
        {
          heading: 'Gesetzliche Versicherung (GKV) — der Standard',
          bullets: [
            'Die meisten Angestellten sind gesetzlich versichert (TK, AOK, Barmer und ~90 weitere).',
            'Beitrag: 14,6% vom Brutto plus kassenindividueller Zusatzbeitrag (2026 im Schnitt 2,9%) — je zur Hälfte von dir und dem Arbeitgeber.',
            'Nicht erwerbstätige Familienmitglieder sind kostenlos mitversichert.',
            'Die TK ist bei Expats beliebt und bietet kompletten englischen Service.',
          ],
        },
        {
          heading: 'Private Versicherung (PKV)',
          bullets: [
            'Nur möglich ab einem Einkommen über der Grenze von 77.400 €/Jahr (2026) oder bei Selbstständigkeit.',
            'Oft günstiger in jungen Jahren, aber Beiträge steigen mit dem Alter — und der Wechsel zurück in die GKV ist schwer.',
          ],
        },
        {
          heading: 'Praktische Tipps',
          bullets: [
            'Jede gesetzliche Kasse ist wählbar — die Leistungen sind zu ~95% identisch, Service und Extras unterscheiden sich.',
            'Der Arbeitgeber meldet dich an; du wählst nur die Kasse und reichst die Mitgliedsbescheinigung ein.',
            'Jobsuchende ohne Einkommen können oft zeitweise über die EU (EHIC/S1) versichert bleiben oder sich freiwillig versichern.',
          ],
        },
      ],
      sources: [
        { label: 'TK — englischer Krankenkassen-Service', url: 'https://www.tk.de/en' },
        { label: 'Beitragssätze 2026 im Überblick', url: 'https://lohn-info.de/krankenversicherung_zusatzbeitrag_2026.html' },
        { label: 'Einkommensgrenzen 2026 (Bundesgesetzblatt, PDF)', url: 'https://www.recht.bund.de/bgbl/1/2025/278/regelungstext.pdf' },
      ],
    },
  },
  {
    id: 'banking',
    icon: 'Landmark',
    en: {
      title: 'Banking',
      tagline: 'Getting a German IBAN for salary and rent',
      sections: [
        {
          heading: 'The fast option: app-based banks',
          bullets: [
            'Neobanks like N26 open an account in minutes with just a passport and video identification — often possible before you have your Anmeldung.',
            'Good English apps and support; free tiers cover everyday needs.',
          ],
        },
        {
          heading: 'Traditional banks',
          bullets: [
            'Deutsche Bank, Commerzbank or local Sparkasse branches usually require the Meldebescheinigung (registration certificate) plus passport.',
            'Worth it if you want cash services, a branch, or products like a Schufa-friendly credit card later.',
          ],
        },
        {
          heading: 'What the account is for',
          bullets: [
            'Your salary, rent and almost all bills run on a German/EU IBAN — landlords and employers expect it.',
            'Rent deposits (Kaution) typically go into a separate escrow-style account (Mietkautionskonto).',
            'SCHUFA, the German credit record, builds with your bank and contract history — landlords ask for it when you apply for flats.',
          ],
        },
      ],
      sources: [
        { label: 'N26 — the mobile bank (Germany)', url: 'https://www.n26.com/en-de' },
        { label: 'Willkommenszentrum Berlin — arrival topics', url: 'https://willkommenszentrum.berlin.de/' },
      ],
    },
    de: {
      title: 'Bankkonto',
      tagline: 'Eine deutsche IBAN für Gehalt und Miete',
      sections: [
        {
          heading: 'Die schnelle Option: App-Banken',
          bullets: [
            'Neobanken wie N26 eröffnen ein Konto in Minuten — nur mit Pass und Videoident, oft schon vor der Anmeldung.',
            'Gute englische Apps und Support; kostenlose Tarife reichen für den Alltag.',
          ],
        },
        {
          heading: 'Klassische Banken',
          bullets: [
            'Deutsche Bank, Commerzbank oder die Sparkasse verlangen meist die Meldebescheinigung plus Pass.',
            'Lohnt sich für Bargeld-Service, Filialen und spätere Produkte wie Kreditkarten.',
          ],
        },
        {
          heading: 'Wofür das Konto gebraucht wird',
          bullets: [
            'Gehalt, Miete und fast alle Rechnungen laufen über eine deutsche/EU-IBAN — Vermieter und Arbeitgeber erwarten sie.',
            'Die Mietkaution liegt typischerweise auf einem separaten Mietkautionskonto.',
            'Die SCHUFA, Deutschlands Bonitätsakte, wächst mit Konto- und Vertragshistorie — Vermieter fragen sie bei der Wohnungsbewerbung ab.',
          ],
        },
      ],
      sources: [
        { label: 'N26 — die mobile Bank', url: 'https://www.n26.com/en-de' },
        { label: 'Willkommenszentrum Berlin — Ankunftsthemen', url: 'https://willkommenszentrum.berlin.de/' },
      ],
    },
  },
  {
    id: 'housing',
    icon: 'KeyRound',
    en: {
      title: 'Housing search',
      tagline: 'Berlin\'s hardest boss fight — plan for it',
      sections: [
        {
          heading: 'The reality',
          bullets: [
            'Berlin\'s rental market is extremely competitive — desirable flats get hundreds of applicants. Plan weeks to months, not days.',
            'Common strategy: book temporary furnished housing for the first 1–3 months, then search from inside the city.',
            'Flatshares (WG) via WG-Gesucht are the fastest way to a registered address on a budget.',
          ],
        },
        {
          heading: 'Where to search',
          bullets: [
            'Immobilienscout24 and Immowelt for whole flats, WG-Gesucht for rooms, Kleinanzeigen for everything (watch for scams).',
            'Set up alerts and reply within minutes — with a short, complete application message in German if possible.',
          ],
        },
        {
          heading: 'Money & paperwork',
          bullets: [
            'Kaltmiete = base rent, Warmmiete = rent incl. utilities. Compare on Warmmiete.',
            'The deposit (Kaution) is capped at 3× the monthly Kaltmiete (§551 BGB) and can be paid in three instalments.',
            'Typical application pack: SCHUFA credit report, last 3 payslips, ID, and a landlord reference (Mietschuldenfreiheitsbescheinigung).',
            'Scam red flags: paying anything before a viewing, "landlord is abroad" stories, keys sent by post.',
          ],
        },
      ],
      sources: [
        { label: 'Willkommenszentrum Berlin — housing search', url: 'https://willkommenszentrum.berlin.de/en/housing/housing-search' },
        { label: 'Immobilienscout24', url: 'https://www.immobilienscout24.de/' },
        { label: 'WG-Gesucht — flatshares', url: 'https://www.wg-gesucht.de/' },
      ],
    },
    de: {
      title: 'Wohnungssuche',
      tagline: 'Berlins härtester Bossfight — einplanen',
      sections: [
        {
          heading: 'Die Realität',
          bullets: [
            'Berlins Mietmarkt ist extrem umkämpft — begehrte Wohnungen bekommen hunderte Bewerbungen. In Wochen bis Monaten denken, nicht Tagen.',
            'Bewährte Strategie: erst 1–3 Monate möbliert auf Zeit wohnen, dann vor Ort suchen.',
            'WG-Zimmer über WG-Gesucht sind der schnellste Weg zu einer anmeldbaren Adresse mit kleinem Budget.',
          ],
        },
        {
          heading: 'Wo suchen',
          bullets: [
            'Immobilienscout24 und Immowelt für ganze Wohnungen, WG-Gesucht für Zimmer, Kleinanzeigen für alles (Vorsicht vor Betrug).',
            'Alerts einrichten und innerhalb von Minuten antworten — mit kurzer, vollständiger Bewerbungsnachricht, wenn möglich auf Deutsch.',
          ],
        },
        {
          heading: 'Geld & Unterlagen',
          bullets: [
            'Kaltmiete = Grundmiete, Warmmiete = inkl. Nebenkosten. Immer auf die Warmmiete vergleichen.',
            'Die Kaution ist auf 3 Monats-Kaltmieten gedeckelt (§551 BGB) und kann in drei Raten gezahlt werden.',
            'Typische Bewerbungsmappe: SCHUFA-Auskunft, letzte 3 Gehaltsabrechnungen, Ausweis, Mietschuldenfreiheitsbescheinigung.',
            'Betrugs-Warnsignale: Geld vor der Besichtigung, „Vermieter ist im Ausland"-Geschichten, Schlüssel per Post.',
          ],
        },
      ],
      sources: [
        { label: 'Willkommenszentrum Berlin — Wohnungssuche', url: 'https://willkommenszentrum.berlin.de/en/housing/housing-search' },
        { label: 'Immobilienscout24', url: 'https://www.immobilienscout24.de/' },
        { label: 'WG-Gesucht — WG-Zimmer', url: 'https://www.wg-gesucht.de/' },
      ],
    },
  },
  {
    id: 'taxes',
    icon: 'Receipt',
    en: {
      title: 'Taxes — the basics',
      tagline: 'What comes out of your payslip, and your tax ID',
      sections: [
        {
          heading: 'Your tax ID (Steuer-ID)',
          bullets: [
            'An 11-digit identification number issued by the Federal Central Tax Office (BZSt). It arrives automatically by post ~2–4 weeks after your first Anmeldung.',
            'Your employer needs it (plus your date of birth) to pull your electronic wage-tax details (ELStAM). Lost it? You can request it again from the BZSt.',
          ],
        },
        {
          heading: 'What gets deducted',
          bullets: [
            'Wage tax (Lohnsteuer) is withheld by your employer each month — rates are progressive, roughly 14% up to 45% at the top.',
            'Plus social insurance: pension (18.6%), health (~17.5% incl. supplement), unemployment (2.6%), long-term care (3.6–4.2%) — each split about half employer/half you (2026 rates).',
            'Church tax (8–9% of income tax) applies only if you register as a member of a church.',
            'Tax class I applies to most single newcomers; married couples choose III/IV/V combinations.',
          ],
        },
        {
          heading: 'The good news: the tax return',
          bullets: [
            'Employees automatically get a €1,230 annual flat allowance for work costs.',
            'Filing a voluntary return often pays off (relocation costs, work equipment, commuting). File via the official ELSTER portal — free.',
          ],
        },
      ],
      sources: [
        { label: 'BZSt — Tax identification number', url: 'https://www.bzst.de/EN/Private_individuals/Tax_identification_number/tax_identification_number_node.html' },
        { label: 'ELSTER — official online tax portal', url: 'https://www.elster.de/eportal/start' },
        { label: 'Digital Tax Office — registration & ELStAM explained', url: 'https://gofrankfurttax.hessen.de/tax-faq/tax-registration' },
      ],
    },
    de: {
      title: 'Steuern — die Basics',
      tagline: 'Was von der Abrechnung abgeht, und die Steuer-ID',
      sections: [
        {
          heading: 'Die Steuer-ID',
          bullets: [
            'Eine 11-stellige Nummer vom Bundeszentralamt für Steuern (BZSt). Sie kommt automatisch per Post ~2–4 Wochen nach der ersten Anmeldung.',
            'Der Arbeitgeber braucht sie (plus Geburtsdatum), um die elektronischen Lohnsteuerabzugsmerkmale (ELStAM) abzurufen. Verloren? Beim BZSt erneut anfordern.',
          ],
        },
        {
          heading: 'Was abgezogen wird',
          bullets: [
            'Die Lohnsteuer wird monatlich vom Arbeitgeber einbehalten — progressiver Satz, grob 14% bis 45% am oberen Ende.',
            'Dazu Sozialversicherung: Rente (18,6%), Kranken (~17,5% inkl. Zusatzbeitrag), Arbeitslosen (2,6%), Pflege (3,6–4,2%) — jeweils etwa hälftig Arbeitgeber/du (Sätze 2026).',
            'Kirchensteuer (8–9% der Einkommensteuer) fällt nur an, wenn man als Mitglied einer Kirche registriert ist.',
            'Steuerklasse I gilt für die meisten alleinstehenden Neuankömmlinge; Verheiratete wählen III/IV/V.',
          ],
        },
        {
          heading: 'Die gute Nachricht: die Steuererklärung',
          bullets: [
            'Arbeitnehmer:innen bekommen automatisch 1.230 € jährliche Werbungskostenpauschale.',
            'Eine freiwillige Erklärung lohnt sich oft (Umzugskosten, Arbeitsmittel, Pendeln). Kostenlos über das offizielle ELSTER-Portal.',
          ],
        },
      ],
      sources: [
        { label: 'BZSt — Steueridentifikationsnummer', url: 'https://www.bzst.de/EN/Private_individuals/Tax_identification_number/tax_identification_number_node.html' },
        { label: 'ELSTER — offizielles Online-Finanzamt', url: 'https://www.elster.de/eportal/start' },
        { label: 'Digitales Finanzamt — Registrierung & ELStAM erklärt', url: 'https://gofrankfurttax.hessen.de/tax-faq/tax-registration' },
      ],
    },
  },
  {
    id: 'recognition',
    icon: 'GraduationCap',
    en: {
      title: 'Degree recognition',
      tagline: 'Proving your foreign qualification counts in Germany',
      sections: [
        {
          heading: 'Step 1: check anabin',
          bullets: [
            'The official anabin database shows whether your university (rating H+) and your specific degree count as equivalent to a German one.',
            'If both are listed as equivalent, print the results — that is often already enough for visa purposes.',
          ],
        },
        {
          heading: 'Step 2: Statement of Comparability (if needed)',
          bullets: [
            'Issued by the Central Office for Foreign Education (ZAB) for degrees not fully covered in anabin.',
            'Costs €208, takes about 3 months (2 months in the skilled-worker fast track), and never expires.',
            'A "conditionally comparable" (bedingt vergleichbar) result is already enough for the Chancenkarte points pathway.',
          ],
        },
        {
          heading: 'Why it matters',
          bullets: [
            'Blue Card, Chancenkarte and skilled-worker visas all hinge on recognition — start this check before anything else.',
            'Regulated professions (medicine, law, engineering titles) need full professional recognition, a separate process.',
          ],
        },
      ],
      sources: [
        { label: 'anabin — official recognition database', url: 'https://anabin.kmk.org/anabin.html' },
        { label: 'ZAB — Statement of Comparability', url: 'https://zab.kmk.org/en/statement-of-comparability' },
        { label: 'ZAB — FAQ (fees, processing times)', url: 'https://zab.kmk.org/en/statement-of-comparability/faq' },
      ],
    },
    de: {
      title: 'Abschluss-Anerkennung',
      tagline: 'Nachweisen, dass der ausländische Abschluss in Deutschland zählt',
      sections: [
        {
          heading: 'Schritt 1: anabin prüfen',
          bullets: [
            'Die offizielle anabin-Datenbank zeigt, ob die Hochschule (Rating H+) und der konkrete Abschluss einem deutschen Abschluss entsprechen.',
            'Wenn beides als gleichwertig gelistet ist, das Ergebnis ausdrucken — für Visa oft schon ausreichend.',
          ],
        },
        {
          heading: 'Schritt 2: Zeugnisbewertung (falls nötig)',
          bullets: [
            'Wird von der Zentralstelle für ausländisches Bildungswesen (ZAB) für Abschlüsse ausgestellt, die anabin nicht voll abbildet.',
            'Kostet 208 €, dauert etwa 3 Monate (2 Monate im beschleunigten Fachkräfteverfahren) und läuft nie ab.',
            'Ein „bedingt vergleichbar"-Ergebnis reicht bereits für den Punkte-Weg der Chancenkarte.',
          ],
        },
        {
          heading: 'Warum das wichtig ist',
          bullets: [
            'Blaue Karte, Chancenkarte und Fachkräftevisum hängen alle an der Anerkennung — diese Prüfung zuerst starten.',
            'Reglementierte Berufe (Medizin, Jura, Ingenieurtitel) brauchen eine volle Berufsanerkennung — ein separater Prozess.',
          ],
        },
      ],
      sources: [
        { label: 'anabin — offizielle Anerkennungs-Datenbank', url: 'https://anabin.kmk.org/anabin.html' },
        { label: 'ZAB — Zeugnisbewertung', url: 'https://zab.kmk.org/en/statement-of-comparability' },
        { label: 'ZAB — FAQ (Gebühren, Bearbeitungszeiten)', url: 'https://zab.kmk.org/en/statement-of-comparability/faq' },
      ],
    },
  },
];
