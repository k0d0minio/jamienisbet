-- Seed the cold pool — the 2026-07-23 Mafra/Lisbon prospect list, all 101 of it.
--
-- Sequence 4 of the lead-engine epic built the door this list was meant to walk
-- through (`leads-import`, a repo script run against `DATABASE_URL`). This is the
-- same batch coming in through CI instead: the list is compiled, it is not going
-- to change, and a migration is the one path that needs nobody to hold a
-- production connection string. It writes what the script would have written —
-- `insertProspects` in packages/services/src/queries/prospects.ts is the
-- reference, and every column below is stamped the way that function stamps it.
--
-- Business state lives in Neon and not in git, which this file bends by holding
-- the pool's facts as SQL. It bends it once, for a batch with a fixed date on it:
-- nothing here is read back, and every later fact about these businesses — a
-- touch, a tier, a website grade — is written in the database and never mirrored
-- back to this file. Re-running the import to pick up a *second* list is the
-- script's job, not this migration's.
--
-- What the rows carry, and why they carry nothing else:
--
--   status = 'prospect'   Not the table's default 'lead'. The cold pool sits on
--                         its own rung, out of the open-lead views and out of
--                         the staleness nag, until somebody engages.
--   source = 'import'     With `source_detail` naming the batch in words. The
--                         first message out has to be able to say where the data
--                         came from — that is what the LIA (.icm/docs/
--                         lia-cold-outreach.md §1) commits to, not a nicety.
--   last_touched_at NULL  Nothing has happened with these relationships yet.
--                         Stamping the import as a touch would be a lie the
--                         whole engine then reads: the list sorts on it and the
--                         cadence measures from it.
--   next_action NULL      Deliberate. `leads-crack` is what surfaces a prospect
--                         with nothing owed on it; enforcement here is gentle
--                         (the epic's decision 7).
--   fit_tier NULL         Never migrated. The A/B/C letter is arithmetic over
--                         stored facts — `deriveFitTier` in
--                         packages/services/src/tiering.ts — so re-tiering the
--                         pool is `leads-enrich --retier`, a re-run of a pure
--                         function. Migration 0021 says the same thing.
--   website_grade         Set only where the list actually assessed the site
--                         ("Facebook only", "thin site", "dated .php"). Null is
--                         "nobody has looked", which is the honest answer for a
--                         row whose website column was only ever a domain, and
--                         the enrichment pass is what fills it in.
--   company = name        The list names the business, never a person, so both
--                         columns say the same thing — exactly what
--                         `normalizeProspect` does with a row like this.
--
-- Contact points arrive already normalized the way `normalizeSuppressionValue`
-- normalizes them (lowercased email, E.164 phone, bare lowercase handle), because
-- a number stored one way and suppressed another is a suppression that silently
-- does nothing. `whatsapp` is left null throughout: the list carries one line per
-- business and that column exists only for the businesses whose chat is a
-- *different* number.
--
-- Two guards make this safe to apply to a table somebody has already worked:
--
--   1. **Dedupe.** A business already in `biz.clients` under the same name and
--      town is skipped, not merged and never overwritten — the import script's
--      "report, don't overwrite" rule, which exists because the row in the table
--      has been worked and a list's guess is not better evidence than a call
--      that was already made. The key is name + town flattened, mirroring
--      `flatten` in packages/services/src/import.ts: accents off (a hand-typed
--      list has "Café" and "Cafe" in it), punctuation and case gone, whitespace
--      collapsed, and the usual company suffixes dropped. Archived rows count.
--   2. **Suppressions.** A row carrying an opted-out email, phone or Instagram
--      handle is skipped entirely — the whole business, not just that channel
--      (LIA §4). The check is an indexed equality because both sides are stored
--      normalized.
--
-- Transcribed from the list verbatim where it had a fact and left null where it
-- did not: the list's own caveat is that a blank cell means "could not confirm
-- from an official source", never "does not exist", and guessing here would put
-- a wrong number in front of a stranger. Its verification caveats — the two
-- numbers circulating for Golfe do Estoril, the truncated Atlântico number, the
-- chain-vs-SMB flags, the businesses near the edge of a 40 km radius — are on the
-- rows they belong to, in `notes`.

INSERT INTO "biz"."clients" (
  "name", "company", "sector", "town", "language",
  "email", "phone", "instagram", "website_url", "website_grade",
  "review_count", "hook", "notes",
  "status", "source", "source_detail"
)
SELECT
  incoming."name", incoming."name", incoming."sector", incoming."town", incoming."language",
  incoming."email", incoming."phone", incoming."instagram", incoming."website_url", incoming."website_grade",
  incoming."review_count", incoming."hook", incoming."notes",
  'prospect', 'import', '2026-07-23 Mafra/Lisbon prospect list'
FROM (VALUES
    ('Ericeira Surf Camp & Hostel', 'Surf camp/hostel', 'Ericeira', 'en', 'info@ericeirasurfcamp.com', '+351912148306', NULL, 'https://ericeirasurfcamp.com', NULL, NULL, 'Bookings coordinated by email/WhatsApp with owner Nuno; multi-package (rooms, lessons, rentals, transfers) begs a unified booking/ops system + automated guest comms', NULL),
    ('Ericeira Surf School', 'Surf school', 'Ericeira', 'en', NULL, NULL, NULL, 'https://ericeirasurfschool.pt', NULL, NULL, 'Lesson scheduling + photo/video upsell manual; automate booking, waivers, media delivery', NULL),
    ('Ericeira SurfSolutions', 'Surf school', 'Ericeira', 'en', 'info@surfsolutions.pt', '+351968555744', NULL, 'https://ericeirasurfsolutions.com', NULL, NULL, '"Book your class" via contact only — no self-serve calendar/payment', NULL),
    ('West Coast Surf School', 'Surf school', 'Ericeira', 'en', NULL, NULL, NULL, 'https://westcoastsurfschool.pt', NULL, NULL, 'Contact-form booking only; capacity/instructor scheduling by hand', NULL),
    ('Ericeira Waves Surf School', 'Surf school', 'Ericeira', 'en', NULL, NULL, NULL, 'https://ericeirawaves.com', NULL, NULL, 'Bookings by contact form; heavy repeat-lesson pack admin', NULL),
    ('Surf Riders & Co', 'Surf school/camp', 'Ericeira', 'en', NULL, NULL, NULL, 'https://surfriders.pt', NULL, NULL, 'Shop + villas + school + yoga = multi-unit ops with no unified system', NULL),
    ('Surf in Ericeira', 'Surf/surfskate school', 'Ericeira', 'en', NULL, NULL, NULL, 'https://surfinericeira.com', NULL, NULL, '"Book Experience"/social DMs; no integrated calendar', NULL),
    ('NaOnda Surf School', 'Surf school/rental', 'Foz do Lizandro', 'en', 'info@ericeirasurf.com', '+351961414249', NULL, 'https://ericeirasurf.com', NULL, NULL, 'Longest-running school; rentals + lessons booked by phone/email', NULL),
    ('Progress Surf School', 'Surf school', 'Ericeira', 'en', 'booking.progress.surf@gmail.com', '+351935333704', NULL, 'https://progresssurfschool.com', NULL, NULL, 'Uses gmail + contact page; no online payment/booking engine', NULL),
    ('Sunset Surf Lodge (Wonder Season)', 'Surf camp', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Sells mainly via OTA aggregators; direct-booking site to cut commissions', 'Listed on puresurfcamps.com; no own site confirmed.'),
    ('Laneez Ericeira Surf House', 'Surf house', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Boutique surf lodging booked via OTAs; direct-booking + automation angle', NULL),
    ('Magic Quiver Surf Lodge', 'Surf lodge', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'OTA-dependent; direct-booking site opportunity', NULL),
    ('Chill In Ericeira Surfhouse', 'Surf house', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'OTA-dependent surf lodging', NULL),
    ('WOT Ericeira (Surf Social/Lodge)', 'Surf lodge/social', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Multi-venue lodge/bar; ops + events system fit', NULL),
    ('Lapoint Surf Camp Ericeira', 'Surf camp + cowork', 'Carvoeira/Ericeira', 'en', NULL, NULL, NULL, 'https://lapointcamps.com', NULL, NULL, 'Camp + restaurant + coworking; multi-revenue-stream ops', NULL),
    ('Kelp Coworking', 'Coworking', 'Ericeira', 'en', NULL, NULL, NULL, 'https://kelpcowork.com', NULL, NULL, 'Membership + events + meeting-room bookings — member management/booking automation', NULL),
    ('Coastal Cowork', 'Coworking', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Community events + desk plans managed manually', 'Listed via Google.'),
    ('Mother Cowork', 'Café + coworking', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Café + cowork day passes; POS + booking integration', 'Listed via Google.'),
    ('Ericeira Business Factory', 'Incubator/coworking', 'Ericeira', 'en-pt', NULL, NULL, NULL, NULL, NULL, NULL, 'Municipal incubator; application + member workflows', 'Listed via cm-mafra.pt.'),
    ('Salt Studio Cowork', 'Coworking', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'First dedicated cowork; membership admin', 'Listed via Google.'),
    ('The Base Cowork', 'Coworking', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, '24/7 access + weekly events; access + booking automation', 'Listed via Google.'),
    ('Sãone Boutique Guesthouse (cowork)', 'Coliving/coworking', 'Carvoeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Guesthouse + cowork hybrid; unified booking', 'Listed via Google.'),
    ('Aethos Ericeira', 'Boutique hotel', 'Ericeira', 'en', NULL, NULL, NULL, 'https://aethos.com', NULL, NULL, 'Hotel + ONDA restaurant + events/weddings (up to 100 guests) — events booking + ops automation', '50 rooms and suites; one of seven Aethos hotels.'),
    ('Immerso Hotel', 'Boutique hotel', 'Ericeira', 'en', NULL, NULL, NULL, 'https://immerso.pt', NULL, NULL, 'Hotel + Emme restaurant + spa/yoga bookings; AI concierge/ops fit', '5-star, 37 rooms.'),
    ('You and the Sea', 'Aparthotel', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Restaurant + spa + apartments; multi-service booking', 'Listed via Google.'),
    ('Ericeira Soul Guesthouse', 'Guesthouse', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Small adults-only property; direct-booking + guest automation', 'Listed via Google.'),
    ('Vila Galé Ericeira', 'Hotel', 'Ericeira', 'en-pt', NULL, NULL, NULL, 'https://vilagale.com', NULL, NULL, 'Chain property; less likely SMB fit but local events/F&B', 'Chain with corporate IT — likelier as a specific local F&B or events unit.'),
    ('Reserva/Praia FLH Hotels Ericeira', 'Hotel', 'Ericeira', 'en', NULL, NULL, NULL, 'https://flh-hotels.com', NULL, NULL, 'Small hotel group; direct-booking + ops', '27 rooms.'),
    ('Boutique Hotel O House Ericeira Hills', 'B&B', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Small B&B; likely OTA-dependent', 'Listed via Google.'),
    ('Sandhi House', 'Yoga guesthouse/retreats', 'Ericeira', 'en', NULL, NULL, NULL, 'https://sandhihouse.com', NULL, NULL, 'Retreats + classes + treatments + shop — retreat booking + payments', NULL),
    ('Ericeira Yoga Studio', 'Yoga/wellness', 'Ericeira', 'en-pt', NULL, NULL, NULL, 'https://ericeirayoga.com', NULL, NULL, 'Has class-booking page but 10+ massage/therapy services — upsell automation/CRM', NULL),
    ('Espaço Yoga by Maphalda Sophia', 'Yoga', 'Ericeira (São Sebastião)', 'en-pt', NULL, NULL, NULL, 'https://espacoyogaby.wixsite.com', 'dated', NULL, 'Wix site, no real booking; classes booked by message', NULL),
    ('A Casa das Casas / The Ericeira Real Estate', 'Real estate', 'Ericeira', 'pt', NULL, '+351215564419', NULL, 'https://acasadascasas.pt', NULL, NULL, 'Large local brokerage on eGO CRM; AI lead-qualification/blog/valuation tooling (mirrors Jamie''s real-estate ChatGPT deployment)', '50+ staff. Also trades as ericeirarealestate.pt.'),
    ('Atlântico Real Estate (Isabel & Franco)', 'Real estate', 'Ericeira/Mafra', 'pt', NULL, NULL, NULL, 'https://mediadoraatlantico.com', NULL, NULL, '40-year agency explicitly positioning against "big brands with scale/tech" — receptive to affordable custom tech', 'Directory number truncated (215 561 …) — confirm before dialling.'),
    ('Inside Ericeira', 'Real estate', 'Ericeira', 'en', NULL, NULL, NULL, 'https://insideericeira.com', NULL, NULL, 'Markets a "modern/virtual" approach + in-house media — natural AI/automation adopter', NULL),
    ('Chaves d''Aldeia', 'Real estate', 'Ericeira/Mafra', 'pt', NULL, NULL, NULL, 'https://chavesdaldeia.com', NULL, NULL, 'Local agency; listing automation + lead capture', NULL),
    ('HB Luxury Real Estate', 'Luxury real estate', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Luxury listings; premium buyer CRM/AI concierge', 'Listed via idealista.'),
    ('Vill''Amaro', 'Real estate', 'Mafra', 'pt', NULL, '+351215561241', NULL, NULL, NULL, NULL, '72 listings; listing/lead automation', 'Listed via casa.sapo.'),
    ('Reservice', 'Real estate', 'Mafra', 'pt', NULL, '+351215564991', NULL, NULL, 'dated', NULL, '36 listings; CRM/website modernization', 'Listed via casa.sapo.'),
    ('Feels Like Home', 'STR/Airbnb management', 'Ericeira', 'en', NULL, NULL, NULL, 'https://feelslikehome.pt', NULL, NULL, 'Multi-property STR manager juggling channel managers, cleaning, guest comms — automation dashboard fit', NULL),
    ('Ericeira Property Management', 'STR management', 'Ericeira', 'en', NULL, NULL, NULL, NULL, 'social_only', NULL, 'No website — needs booking site + owner reporting automation', 'Facebook only.'),
    ('Clínica Veterinária de Mafra', 'Veterinary', 'Mafra', 'pt', 'geral@clinicaveterinariademafra.com', '+351261812934', NULL, 'https://clinicaveterinariademafra.com', NULL, NULL, 'Appointment booking + reminders automation', NULL),
    ('Hospital Veterinário do Atlântico (AniCura)', 'Veterinary hospital', 'Mafra', 'pt', NULL, '+351261810060', NULL, 'https://anicura.pt', NULL, 949, 'High volume (949 reviews); appointment + records automation', NULL),
    ('Beclinique Mafra', 'Dental clinic', 'Mafra', 'pt', NULL, NULL, NULL, NULL, NULL, NULL, 'Appointment scheduling + recall reminders', 'Listed via Google.'),
    ('Esphera Clínica', 'Dental/general', 'Mafra', 'pt', NULL, NULL, NULL, 'https://espheraclinica.com', 'dated', NULL, 'Thin site; booking + patient comms automation', NULL),
    ('Clínica Médica Dentária Narciso', 'Dental', 'Mafra', 'pt', NULL, NULL, NULL, NULL, 'social_only', NULL, 'No website — web + booking', 'Facebook only.'),
    ('Centro Médico Dentário Mafra', 'Dental', 'Mafra', 'pt', NULL, NULL, NULL, NULL, 'social_only', NULL, 'Facebook-only; web + scheduling', 'Facebook only.'),
    ('DENTEAM', 'Dental', 'Mafra', 'pt', NULL, NULL, NULL, NULL, NULL, NULL, 'Booking + recall automation', 'Listed via directory.'),
    ('Balagan Ericeira', 'Restaurant/café/bar', 'Ericeira', 'en', NULL, NULL, 'balagan.ericeira', NULL, 'social_only', NULL, '21k Instagram followers, runs events (Salsa Na Praia) — no online reservation/event ticketing', NULL),
    ('Mar das Latas', 'Fine-dining + wine bar', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'High-end sharing plates + separate wine bar; reservation + two-venue ops', 'Listed via Google.'),
    ('Avó Restaurante', 'Family restaurant', 'Ericeira', 'en-pt', NULL, NULL, NULL, NULL, NULL, NULL, 'Popular, reservation-driven; booking system', 'Listed via Google.'),
    ('Onegai Sushi Bar', 'Sushi', 'Ericeira', 'en-pt', NULL, NULL, NULL, NULL, NULL, NULL, 'High-volume; reservations + delivery automation', 'Listed via Google.'),
    ('Tik Tapas', 'Tapas', 'Ericeira', 'en', NULL, NULL, NULL, NULL, 'social_only', NULL, 'Reservations required, Instagram DM only, two time slots, no website/phone — textbook booking-system pitch', 'Instagram only; handle not recorded on the list.'),
    ('Calavera Mexican Food', 'Restaurant', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Reservation + takeaway automation', 'Listed via Google.'),
    ('Boardriders Quiksilver Ericeira', 'Retail + café/bar + gym + school', 'Ericeira', 'en', NULL, NULL, 'boardridersericeira', NULL, 'social_only', NULL, 'Flagship store + bar + skatepark + gym + surf/skate lessons + live events — multi-vertical ops with no unifying system', NULL),
    ('Emme (at Immerso)', 'Restaurant/events', 'Ericeira', 'en', NULL, NULL, NULL, 'https://immerso.pt', NULL, NULL, '"Emme on Fire" event series; event booking + ticketing', 'The restaurant inside Immerso Hotel — same building, separate operation.'),
    ('Adega do Convento', 'Portuguese restaurant', 'Mafra', 'pt', 'geral@adegadoconvento.pt', '+351261814185', NULL, 'https://adegadoconvento.pt', NULL, NULL, 'Already on CoverManager — upsell: loyalty/CRM/AI review-response, not base booking', 'Already runs CoverManager — pitch the layer on top, not a replacement.'),
    ('Taberna D. João V', 'Restaurant', 'Mafra', 'pt', NULL, '+351961856553', NULL, NULL, 'none', NULL, 'Mobile-phone-only, no website — web + reservations', NULL),
    ('Quinta da Cerca Restaurante & Garden Bar', 'Restaurant/bar', 'Mafra', 'pt', NULL, '+351261814154', NULL, NULL, 'none', NULL, 'No website; event/garden-bar bookings by phone', NULL),
    ('Restaurante Escondidinho', 'Restaurant', 'Mafra', 'pt', NULL, '+351261814983', NULL, NULL, 'none', NULL, 'No online presence beyond directories', NULL),
    ('REP CF Ericeira', 'CrossFit/gym', 'Ericeira', 'en-pt', NULL, NULL, NULL, 'https://rep-cf-ericeira.com', NULL, NULL, 'Class booking + membership management automation', NULL),
    ('Cool Gym Cool Padel Ericeira', 'Gym + 4 padel courts', 'Ericeira', 'en-pt', NULL, '+351964718655', NULL, NULL, NULL, NULL, 'Court hire + padel school + gym classes booked by phone — booking engine fit', 'Listed via ericeiramarket.pt.'),
    ('Outdoor Crosstraining Ericeira', 'Fitness', 'Ericeira', 'en', NULL, NULL, NULL, NULL, 'social_only', NULL, 'Uses a generic booking app; custom-branded booking/payments', 'Instagram plus a third-party booking app.'),
    ('My Padel Center Mafra', 'Indoor padel', 'Mafra', 'pt', NULL, '+351699636875', NULL, 'https://mypadelcenter.pt', NULL, NULL, 'Court booking by phone/email — no self-serve court reservation', NULL),
    ('Time2Padel', 'Outdoor padel (3 courts)', 'Malveira', 'pt', NULL, NULL, NULL, NULL, NULL, NULL, '"Get in touch to reserve" — no online court booking', 'Listed on padellog.'),
    ('MaisFitness Malveira', 'Gym chain (multi-location)', 'Malveira', 'pt', NULL, '+351930414471', NULL, NULL, NULL, NULL, 'Multi-branch member management + class scheduling', 'Listed via directory.'),
    ('Manzwine', 'Winery + experiences', 'Mafra (Cheleiros)', 'en', NULL, NULL, NULL, 'https://manzwine.com', NULL, NULL, 'Multiple tour/tasting/bike experiences booked manually — experience booking + payments', NULL),
    ('Quinta de Sant''Ana', 'Winery + events + stay', 'Gradil, Mafra', 'en', NULL, NULL, NULL, 'https://quintadesantana.com', NULL, NULL, 'English/German-owned; weddings + tastings + accommodation — event/booking system', NULL),
    ('Taste Ericeira Food Tours', 'Food tour operator', 'Ericeira', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Solo operator (Angelo) selling via Peek/Viator commissions — direct-booking site to cut OTA fees', 'Sells through Peek and Viator.'),
    ('Ericeira Surf & Skate', 'Retail chain + e-commerce', 'Ericeira', 'pt', NULL, '+351261862504', NULL, 'https://ericeirasurfskate.pt', NULL, NULL, 'Own brand + 23 stores + online — inventory/e-commerce automation, AI product/SEO', '23 stores; Ericeira is the HQ.'),
    ('Wavegliders', 'Surfboard factory + shop', 'Ericeira/Mafra', 'pt', NULL, NULL, NULL, NULL, NULL, NULL, 'Own factory in Mafra; e-commerce + custom-order workflow', 'Listed via Google.'),
    ('Agência da Marca', 'Marketing/design agency', 'Mafra', 'pt', NULL, NULL, NULL, 'https://agenciadamarca.com', NULL, NULL, 'Better approached as a white-label dev/AI partner (subcontracting) than a client', 'A partner, not a client — the list flags them as a subcontracting route.'),
    ('Escola de Condução A Capote', 'Driving school', 'Malveira', 'pt', NULL, '+351219862723', NULL, 'https://educacao-rodoviaria.pt', 'dated', NULL, 'Free sapo.pt email + template site — booking/CRM + web modernization', NULL),
    ('Escola de Condução Mafrense', 'Driving school', 'Mafra', 'pt', NULL, '+351261815329', NULL, NULL, 'dated', NULL, 'sapo.pt email, dated presence', NULL),
    ('Escola de Condução Convento', 'Driving school', 'Mafra', 'pt', NULL, '+351261814708', NULL, 'https://ecconvento.pt', NULL, NULL, 'Own site but sapo.pt email; lesson scheduling automation', NULL),
    ('Loja da Amélia', 'Supermarket', 'Mafra', 'pt', NULL, '+351261853994', NULL, 'https://lojadaamelia.pt', NULL, NULL, 'Local grocery; e-commerce/ordering + loyalty', NULL),
    ('Universo de Palavras', 'Language school', 'Mafra', 'pt', NULL, NULL, NULL, NULL, NULL, NULL, 'Private language school; enrollment + class scheduling', 'Listed via directory.'),
    ('Lisbon Sports Club', 'Golf club', 'Belas', 'en', 'geral@lisbonclub.com', '+351214310077', NULL, 'https://lisbonclub.com', 'dated', NULL, 'Dated .php website, no online tee-time booking — direct fit for Jamie''s golf-ops experience', 'Established 1922.'),
    ('Clube de Golfe do Estoril', 'Golf club (27 holes)', 'Estoril/Cascais', 'en', NULL, '+351214680176', NULL, 'https://clubegolfestoril.com', NULL, NULL, 'Contact-form/phone tee-time booking, no self-serve engine', 'Two numbers circulating (214 680 176 and 21 431 00 77) — confirm on Google Business before dialling.'),
    ('Vimeiro Golf (Hotel Golf Mar)', '9-hole golf + hotel', 'Maceira, Torres Vedras', 'en', 'hotelgolfmar@ohotelsandresorts.com', '+351261980800', NULL, 'https://golfvimeiro.com', NULL, NULL, 'Small oceanfront op, phone-only booking; hotel + tennis + riding = multi-activity ops', NULL),
    ('Beloura Golf (Pestana)', 'Golf + hotel', 'Sintra', 'en', 'info@pestanagolf.com', '+351219106350', NULL, 'https://pestanagolf.com', NULL, NULL, 'Group-level phone booking; weak native tee-time engine', 'Pestana group — corporate IT; likelier as a specific local unit.'),
    ('Belas Clube de Campo', 'Golf + estate', 'Belas', 'en-pt', 'golfe@belasclubedecampo.pt', '+351219626640', NULL, 'https://belasclubedecampo.pt', NULL, NULL, 'Golf + restaurant + academy + residents + shuttle + events — many operational units to integrate', NULL),
    ('Penha Longa Golf (Ritz-Carlton)', 'Resort golf (27 holes)', 'Sintra (Linhó)', 'en', 'reservas.golf@penhalonga.com', '+351219249031', NULL, 'https://penhalonga.com/en/golf', NULL, NULL, 'Resort with spa/restaurants/events; premium ops + AI concierge fit', 'Ritz-Carlton — corporate IT; likelier as a specific local F&B or events unit.'),
    ('Oitavos Dunes', 'Championship links + hotel', 'Cascais', 'en', 'info@oitavosdunes.pt', '+351214860600', NULL, 'https://oitavosdunes.com', NULL, NULL, 'Top-ranked course + 5-star hotel; events/tournaments admin', NULL),
    ('Dolce CampoReal Lisboa (Wyndham)', 'Golf resort + MICE', 'Turcifal, Torres Vedras', 'en', 'reservations@dolcecamporeal.com', '+351261960900', NULL, 'https://dolcecamporeal.com', NULL, NULL, '5-star resort: 18 holes + footgolf + spa + 3 restaurants + gym + 2,150m² of events space + equestrian — heavy MICE/events ops', 'Wyndham-branded — corporate IT.'),
    ('Praia D''El Rey / West Cliffs', 'Two 18-hole courses + Marriott', 'Óbidos', 'en', 'golf.reservations@praia-del-rey.com', '+351262905005', NULL, 'https://praia-del-rey.com', NULL, NULL, 'Confirmed "first golf courses in Portugal to have Tagmarshal Technology" — pitch an AI/automation layer on top, not base booking', 'Also westcliffs.com. Marriott-branded — corporate IT. Near or beyond a strict 40 km radius from Mafra.'),
    ('Noah Surf House', 'Surf house/hotel + restaurant', 'Santa Cruz', 'en', NULL, NULL, NULL, 'https://noahsurfhouse.com', NULL, NULL, '13 bungalows + 8 rooms + restaurant + rooftop pool + surf store — multi-unit resort ops', NULL),
    ('Cliff Surf House', 'Boutique surf house + horse farm', 'Santa Cruz, Torres Vedras', 'en', NULL, NULL, 'cliff_surfhouse', NULL, 'social_only', NULL, 'Surf house + own horse farm (two brands) — unified booking/ops', NULL),
    ('Stoke Portugal Surf House', 'Surf house', 'Torres Vedras', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'OTA-dependent; direct booking site', 'Sold through Stoke Travel.'),
    ('Santa Cruz Surf Lodge', 'Surf camp', 'Silveira, Torres Vedras', 'en', NULL, NULL, NULL, 'https://surflodgesantacruz.com', NULL, NULL, 'School + guiding + yoga + accommodation packages booked manually', NULL),
    ('Sizandro Beach Lodge', 'Surf lodge', 'Torres Vedras', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Small lodge; direct-booking + automation', 'Listed via Tripadvisor.'),
    ('CoworkCascais', 'Coworking', 'Cascais (Alcabideche)', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Member management + events + room booking automation', 'Listed via onecoworking.'),
    ('Yayem', 'Coworking/community', 'Malveira da Serra, Cascais', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Community hub; membership + events platform', 'Listed via directory.'),
    ('Karma Surf Retreat', 'Coliving/cowork + surf school', 'Guincho, Cascais', 'en', NULL, NULL, NULL, 'https://karmasurfretreat.com', NULL, NULL, 'Villa + in-house surf school + tours — package booking + payments', NULL),
    ('Surf Cascais', 'Surf school/villa', 'Cascais', 'en', NULL, NULL, NULL, 'https://surfcascais.com', NULL, NULL, 'Villa + house + lessons + transfers; multi-service ops', NULL),
    ('Salty Souls Surf School', 'Surf school', 'Cascais', 'en', NULL, NULL, NULL, NULL, NULL, NULL, 'Lessons sold via OTAs; direct-booking site', 'Sold via Expedia and their own site.'),
    ('GuestReady', 'STR management (multi-market)', 'Lisbon', 'en', NULL, NULL, NULL, 'https://guestready.com', NULL, NULL, 'Enterprise-scale but local team; automation/integration + AL-compliance tooling', 'Covers Lisbon, Cascais, Sintra, Ericeira and Oeiras.'),
    ('Curated Property', 'Short-let management', 'Lisbon', 'en', NULL, NULL, NULL, 'https://curated-property.com', NULL, NULL, 'Full-service manager (AL registration through to tax statements) — owner-reporting + workflow automation', 'Covers Lisbon, Cascais and Ericeira.'),
    ('Pass the Keys', 'STR management', NULL, 'en', NULL, NULL, NULL, 'https://passthekeys.com', NULL, NULL, 'Franchise ops; local partner may need custom tooling', 'Franchise model, regional coverage — approach the local partner.'),
    ('AdegaMãe', 'Winery + tourism', 'Torres Vedras', 'en-pt', NULL, NULL, NULL, 'https://adegamae.pt', NULL, NULL, 'Top wine-tourism destination; tasting/event booking + e-commerce', NULL),
    ('Quinta da Boa Esperança', 'Winery + restaurant + picnics', 'Torres Vedras', 'en-pt', NULL, NULL, NULL, NULL, NULL, NULL, 'Multiple experiences + restaurant; booking + payments', 'Listed via directory.')) AS incoming (
  "name", "sector", "town", "language", "email", "phone", "instagram",
  "website_url", "website_grade", "review_count", "hook", "notes"
)
-- Guard 1 — already in the table under this name and town, on any rung,
-- archived or not. Skipped, never merged.
WHERE NOT EXISTS (
  SELECT 1
    FROM "biz"."clients" AS known
   WHERE btrim(regexp_replace(regexp_replace(regexp_replace(lower(translate(
           coalesce(known."name", ''),
           'ÁÀÂÃÄÅÇÉÈÊËÍÌÎÏÑÓÒÔÕÖÚÙÛÜÝáàâãäåçéèêëíìîïñóòôõöúùûüý',
           'AAAAAACEEEEIIIINOOOOOUUUUYaaaaaaceeeeiiiinooooouuuuy')),
           '[^a-z0-9]+', ' ', 'g'),
           '\y(lda|sa|unipessoal|ltd|ltda|limited|sarl|eirl)\y', ' ', 'g'),
           '\s+', ' ', 'g'))
       = btrim(regexp_replace(regexp_replace(regexp_replace(lower(translate(
           coalesce(incoming."name", ''),
           'ÁÀÂÃÄÅÇÉÈÊËÍÌÎÏÑÓÒÔÕÖÚÙÛÜÝáàâãäåçéèêëíìîïñóòôõöúùûüý',
           'AAAAAACEEEEIIIINOOOOOUUUUYaaaaaaceeeeiiiinooooouuuuy')),
           '[^a-z0-9]+', ' ', 'g'),
           '\y(lda|sa|unipessoal|ltd|ltda|limited|sarl|eirl)\y', ' ', 'g'),
           '\s+', ' ', 'g'))
     AND btrim(regexp_replace(regexp_replace(regexp_replace(lower(translate(
           coalesce(known."town", ''),
           'ÁÀÂÃÄÅÇÉÈÊËÍÌÎÏÑÓÒÔÕÖÚÙÛÜÝáàâãäåçéèêëíìîïñóòôõöúùûüý',
           'AAAAAACEEEEIIIINOOOOOUUUUYaaaaaaceeeeiiiinooooouuuuy')),
           '[^a-z0-9]+', ' ', 'g'),
           '\y(lda|sa|unipessoal|ltd|ltda|limited|sarl|eirl)\y', ' ', 'g'),
           '\s+', ' ', 'g'))
       = btrim(regexp_replace(regexp_replace(regexp_replace(lower(translate(
           coalesce(incoming."town", ''),
           'ÁÀÂÃÄÅÇÉÈÊËÍÌÎÏÑÓÒÔÕÖÚÙÛÜÝáàâãäåçéèêëíìîïñóòôõöúùûüý',
           'AAAAAACEEEEIIIINOOOOOUUUUYaaaaaaceeeeiiiinooooouuuuy')),
           '[^a-z0-9]+', ' ', 'g'),
           '\y(lda|sa|unipessoal|ltd|ltda|limited|sarl|eirl)\y', ' ', 'g'),
           '\s+', ' ', 'g'))
)
-- Guard 2 — somebody who asked to be left alone stays left alone, and the whole
-- business is skipped rather than the one channel they opted out of.
  AND NOT EXISTS (
  SELECT 1
    FROM "biz"."suppressions" AS opted_out
   WHERE (opted_out."kind" = 'email'     AND opted_out."value" = incoming."email")
      OR (opted_out."kind" = 'phone'     AND opted_out."value" = incoming."phone")
      OR (opted_out."kind" = 'instagram' AND opted_out."value" = incoming."instagram")
);
