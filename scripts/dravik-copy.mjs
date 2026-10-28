/**
 * Spécifications et accroches des références Dravik, en français et en
 * allemand.
 *
 * Séparé du générateur pour que la rédaction se relise seule, sans la
 * mécanique de construction autour.
 *
 * Les prix et les stocks ne sont PAS ici : ils vivent dans dravik-prix.csv,
 * qui se modifie sans toucher au code.
 */

export const COPY = {
  // ------------------------------------------------------------- STIHL
  'DRV-001': {
    specs: [['Cylindrée', '50,2 cm³'], ['Puissance', '3,0 kW'], ['Guide', '40 cm'], ['Poids à vide', '4,9 kg']],
    specsDe: [['Hubraum', '50,2 cm³'], ['Leistung', '3,0 kW'], ['Schiene', '40 cm'], ['Leergewicht', '4,9 kg']],
    fr: "M-Tronic règle l'allumage et le mélange tout seul : même démarrage par temps froid, en altitude ou après un changement de carburant.",
    de: 'M-Tronic regelt Zündung und Gemisch selbsttätig — gleicher Start bei Kälte, in Höhenlagen oder nach einem Kraftstoffwechsel.',
  },
  'DRV-002': {
    specs: [['Cylindrée', '45,6 cm³'], ['Puissance', '2,2 kW'], ['Système', 'M-Tronic'], ['Poids', '8,8 kg']],
    specsDe: [['Hubraum', '45,6 cm³'], ['Leistung', '2,2 kW'], ['System', 'M-Tronic'], ['Gewicht', '8,8 kg']],
    fr: "La plus puissante des débroussailleuses STIHL : ronces, taillis et friches épaisses sans caler.",
    de: 'Der stärkste STIHL-Freischneider: Brombeeren, Jungwuchs und dichtes Gestrüpp ohne Abwürgen.',
  },
  'DRV-003': {
    specs: [['Cylindrée', '22,7 cm³'], ['Longueur de coupe', '60 cm'], ['Tête', 'Pivotante 180°'], ['Poids', '6,3 kg']],
    specsDe: [['Hubraum', '22,7 cm³'], ['Schnittlänge', '60 cm'], ['Kopf', 'Schwenkbar 180°'], ['Gewicht', '6,3 kg']],
    fr: 'Tête pivotante sur 180° : les tailles au sol comme en hauteur se font sans tordre les poignets.',
    de: 'Um 180° schwenkbarer Kopf: Schnitte am Boden wie über Kopf, ohne die Handgelenke zu verdrehen.',
  },
  'DRV-004': {
    specs: [['Alimentation', 'Batterie AP (vendue à part)'], ['Débit', "780 m³/h"], ['Vitesse d’air', '69 m/s'], ['Poids', '3,2 kg']],
    specsDe: [['Versorgung', 'Akku AP (separat)'], ['Luftdurchsatz', '780 m³/h'], ['Luftgeschwindigkeit', '69 m/s'], ['Gewicht', '3,2 kg']],
    fr: "Le souffleur de la gamme professionnelle : la puissance d'un thermique, sans bruit ni gaz d'échappement.",
    de: 'Das Blasgerät der Profilinie: die Kraft eines Benziners, ohne Lärm und Abgase.',
  },
  'DRV-005': {
    specs: [['Alimentation', 'Batterie AK (vendue à part)'], ['Largeur de coupe', '41 cm'], ['Bac', '55 L'], ['Poids', '24 kg']],
    specsDe: [['Versorgung', 'Akku AK (separat)'], ['Schnittbreite', '41 cm'], ['Fangkorb', '55 L'], ['Gewicht', '24 kg']],
    fr: "Tondeuse à batterie pour terrains jusqu'à 600 m² : on tond tôt le matin sans réveiller personne.",
    de: 'Akku-Rasenmäher für Flächen bis 600 m²: früh morgens mähen, ohne jemanden zu wecken.',
  },
  'DRV-006': {
    specs: [['Type', 'Batterie 36 V + chargeur AL 101'], ['Capacité', '12,5 Ah / 180 Wh'], ['Système', 'AK'], ['Poids', '1,9 kg']],
    specsDe: [['Typ', 'Akku 36 V + Ladegerät AL 101'], ['Kapazität', '12,5 Ah / 180 Wh'], ['System', 'AK'], ['Gewicht', '1,9 kg']],
    fr: 'Kit de démarrage du système AK : la batterie et son chargeur, compatibles avec toute la gamme domestique STIHL.',
    de: 'Einstiegsset des AK-Systems: Akku und Ladegerät, kompatibel mit der gesamten STIHL-Hausgerätelinie.',
  },

  // ----------------------------------------------------------- Festool
  'DRV-007': {
    specs: [['Puissance', '1 200 W'], ['Lame', 'Ø 160 mm'], ['Profondeur de coupe', '0–55 mm'], ['Inclinaison', '-1° à 47°']],
    specsDe: [['Leistung', '1 200 W'], ['Sägeblatt', 'Ø 160 mm'], ['Schnitttiefe', '0–55 mm'], ['Neigung', '-1° bis 47°']],
    fr: 'Coupe plongeante sur rail : le trait sort net des deux côtés, sans éclat à reprendre.',
    de: 'Tauchschnitt auf der Führungsschiene: beidseitig sauberer Schnitt, ohne Ausrisse zum Nacharbeiten.',
  },
  'DRV-008': {
    specs: [['Tension', '18 V'], ['Couple', '50 Nm'], ['Mandrin', 'FastFix interchangeable'], ['Poids', '1,8 kg']],
    specsDe: [['Spannung', '18 V'], ['Drehmoment', '50 Nm'], ['Bohrfutter', 'FastFix wechselbar'], ['Gewicht', '1,8 kg']],
    fr: "Le mandrin FastFix se change d'une main : renvoi d'angle, excentrique ou porte-embout en trois secondes.",
    de: 'Das FastFix-Futter wechselt einhändig: Winkelvorsatz, Exzenter oder Bitaufnahme in drei Sekunden.',
  },
  'DRV-009': {
    specs: [['Puissance', '310 W'], ['Plateau', 'Ø 150 mm'], ['Course', '5 mm'], ['Poids', '1,8 kg']],
    specsDe: [['Leistung', '310 W'], ['Schleifteller', 'Ø 150 mm'], ['Hub', '5 mm'], ['Gewicht', '1,8 kg']],
    fr: 'Course de 5 mm : le compromis Festool entre débit de ponçage et finition, sur la même machine.',
    de: '5 mm Hub: der Festool-Kompromiss zwischen Abtragsleistung und Finish, auf einer Maschine.',
  },
  'DRV-010': {
    specs: [['Cuve', '26 L'], ['Dépression', '24 000 Pa'], ['Classe', "L"], ['Prise outil', 'Démarrage automatique']],
    specsDe: [['Behälter', '26 L'], ['Unterdruck', '24 000 Pa'], ['Klasse', 'L'], ['Gerätesteckdose', 'Einschaltautomatik']],
    fr: "L'outil branché démarre l'aspirateur : plus de poussière en suspension dans l'atelier.",
    de: 'Das angeschlossene Werkzeug startet den Sauger: kein Staub mehr in der Werkstattluft.',
  },
  'DRV-011': {
    specs: [['Puissance', '1 400 W'], ['Pince', '8 / 12 mm'], ['Course', '70 mm'], ['Poids', '4,5 kg']],
    specsDe: [['Leistung', '1 400 W'], ['Spannzange', '8 / 12 mm'], ['Hub', '70 mm'], ['Gewicht', '4,5 kg']],
    fr: 'Défonceuse de 1 400 W compatible rail : rainures et feuillures se tracent droit du premier coup.',
    de: 'Oberfräse mit 1 400 W, schienengeführt: Nuten und Fälze sitzen im ersten Durchgang gerade.',
  },
  'DRV-012': {
    specs: [['Longueur', '1 400 mm'], ['Usage', 'Scies, défonceuses, ponceuses Festool'], ['Semelle', 'Bande antidérapante'], ['Poids', '2,4 kg']],
    specsDe: [['Länge', '1 400 mm'], ['Einsatz', 'Festool Sägen, Fräsen, Schleifer'], ['Unterseite', 'Haftbelag'], ['Gewicht', '2,4 kg']],
    fr: "Le rail de 1 400 mm couvre la largeur d'un panneau standard en une seule passe.",
    de: 'Die 1 400-mm-Schiene deckt die Breite einer Standardplatte in einem Durchgang ab.',
  },

  // ------------------------------------------------------------ Tormek
  'DRV-013': {
    specs: [['Meule', 'Ø 250 mm'], ['Vitesse', '90 tr/min'], ['Entraînement', 'Zinc moulé, usage continu'], ['Puissance', '200 W']],
    specsDe: [['Schleifstein', 'Ø 250 mm'], ['Drehzahl', '90 U/min'], ['Antrieb', 'Zinkdruckguss, Dauerbetrieb'], ['Leistung', '200 W']],
    fr: "Affûtage à l'eau à 90 tr/min : le fil ne chauffe jamais, donc l'acier ne perd pas sa trempe.",
    de: 'Nassschliff bei 90 U/min: Die Schneide erhitzt sich nie, der Stahl verliert seine Härte nicht.',
  },
  'DRV-014': {
    specs: [['Diamètre', '250 mm'], ['Grain', 'Pierre à eau 220'], ['Compatibilité', 'T-8, T-7, T-4'], ['Matière', 'Oxyde d’aluminium']],
    specsDe: [['Durchmesser', '250 mm'], ['Körnung', 'Wasserstein 220'], ['Passend für', 'T-8, T-7, T-4'], ['Material', 'Aluminiumoxid']],
    fr: 'Meule de rechange d’origine : le grain se régénère au Stone Grader plutôt que de se remplacer.',
    de: 'Original-Ersatzstein: Die Körnung wird mit dem Stone Grader aufgefrischt statt ersetzt.',
  },
  'DRV-015': {
    specs: [['Contenance', '70 g'], ['Usage', 'Disque de cuir'], ['Fonction', 'Polissage du fil'], ['Compatibilité', 'Toute la gamme Tormek']],
    specsDe: [['Inhalt', '70 g'], ['Einsatz', 'Lederabziehscheibe'], ['Funktion', 'Polieren der Schneide'], ['Passend für', 'Gesamte Tormek-Reihe']],
    fr: 'Pâte à affiler pour le disque de cuir : c’est elle qui transforme un fil correct en fil rasoir.',
    de: 'Honpaste für die Lederscheibe: Sie macht aus einer brauchbaren Schneide eine rasiermesserscharfe.',
  },
  'DRV-016': {
    specs: [['Fonction', 'Mesure et report d’angle'], ['Plage', '10° à 75°'], ['Lecture', 'Directe sur la meule'], ['Compatibilité', 'Toute la gamme Tormek']],
    specsDe: [['Funktion', 'Winkel messen und übertragen'], ['Bereich', '10° bis 75°'], ['Ablesung', 'Direkt am Stein'], ['Passend für', 'Gesamte Tormek-Reihe']],
    fr: 'L’AngleMaster relève l’angle existant d’une lame et le reproduit : on réaffûte sans changer la géométrie d’origine.',
    de: 'Der AngleMaster nimmt den vorhandenen Winkel ab und überträgt ihn: Nachschärfen ohne die ursprüngliche Geometrie zu verändern.',
  },
  'DRV-017': {
    specs: [['Usage', 'Couteaux à lame large'], ['Capacité', 'Jusqu’à 70 mm de largeur'], ['Maintien', 'Serrage par molette'], ['Compatibilité', 'T-8, T-7, T-4']],
    specsDe: [['Einsatz', 'Messer mit breiter Klinge'], ['Kapazität', 'Bis 70 mm Klingenbreite'], ['Halterung', 'Rändelschraube'], ['Passend für', 'T-8, T-7, T-4']],
    fr: 'Gabarit pour couteaux larges : couperets et couteaux de chef gardent un angle constant sur toute la lame.',
    de: 'Vorrichtung für breite Klingen: Hackmesser und Kochmesser behalten über die ganze Klinge denselben Winkel.',
  },
  'DRV-018': {
    specs: [['Fonction', 'Régénère la surface de la meule'], ['Deux faces', 'Grain 220 et grain 1000'], ['Usage', 'Avant chaque affûtage fin'], ['Compatibilité', 'Meules à eau Tormek']],
    specsDe: [['Funktion', 'Frischt die Steinoberfläche auf'], ['Zwei Seiten', 'Körnung 220 und 1000'], ['Einsatz', 'Vor jedem Feinschliff'], ['Passend für', 'Tormek-Wassersteine']],
    fr: 'Le Stone Grader passe la meule du grain 220 au grain 1000 en quelques secondes, puis revient en arrière.',
    de: 'Der Stone Grader bringt den Stein in Sekunden von Körnung 220 auf 1000 — und wieder zurück.',
  },

  // ------------------------------------------------------------ Makita
  'DRV-019': {
    specs: [['Tension', '18 V'], ['Couple', '130 Nm'], ['Moteur', 'Sans charbon'], ['Livraison', 'Machine nue']],
    specsDe: [['Spannung', '18 V'], ['Drehmoment', '130 Nm'], ['Motor', 'Bürstenlos'], ['Lieferung', 'Solo-Gerät']],
    fr: '130 Nm en perçage à percussion : la machine passe dans le béton sans passer au perforateur.',
    de: '130 Nm mit Schlagbohrfunktion: Die Maschine geht in Beton, ohne zum Bohrhammer zu wechseln.',
  },
  'DRV-020': {
    specs: [['Puissance', '720 W'], ['Disque', 'Ø 125 mm'], ['Vitesse', '11 000 tr/min'], ['Poids', '1,8 kg']],
    specsDe: [['Leistung', '720 W'], ['Scheibe', 'Ø 125 mm'], ['Drehzahl', '11 000 U/min'], ['Gewicht', '1,8 kg']],
    fr: 'Meuleuse filaire de 125 mm : le format qui ne tombe jamais en panne de batterie sur un chantier long.',
    de: 'Netzbetriebener 125-mm-Winkelschleifer: das Format, dem auf langen Baustellen nie der Akku ausgeht.',
  },
  'DRV-021': {
    specs: [['Tension', '18 V'], ['Lame', 'Ø 165 mm'], ['Profondeur à 90°', '57 mm'], ['Livraison', 'Machine nue']],
    specsDe: [['Spannung', '18 V'], ['Sägeblatt', 'Ø 165 mm'], ['Schnitttiefe bei 90°', '57 mm'], ['Lieferung', 'Solo-Gerät']],
    fr: '57 mm de profondeur : la scie passe le bastaing de 2 po en une seule passe.',
    de: '57 mm Schnitttiefe: Die Säge trennt den Balken in einem Durchgang.',
  },
  'DRV-022': {
    specs: [['Puissance', '650 W'], ['Course', '26 mm'], ['Coupe bois', '90 mm'], ['Pendulaire', '3 positions']],
    specsDe: [['Leistung', '650 W'], ['Hub', '26 mm'], ['Schnitttiefe Holz', '90 mm'], ['Pendelhub', '3 Stufen']],
    fr: 'Scie sauteuse filaire à 3 positions pendulaires : découpes fines dans le stratifié, débit rapide dans le résineux.',
    de: 'Netz-Stichsäge mit 3 Pendelstufen: feine Schnitte in Laminat, schneller Vorschub in Nadelholz.',
  },
  'DRV-023': {
    specs: [['Tension', '18 V'], ['Débit', '2,6 m³/min'], ['Vitesse variable', 'Oui'], ['Livraison', 'Machine nue']],
    specsDe: [['Spannung', '18 V'], ['Luftdurchsatz', '2,6 m³/min'], ['Drehzahlregelung', 'Ja'], ['Lieferung', 'Solo-Gerät']],
    fr: "Souffleur compact pour l'atelier et les abords : un seul bras suffit, la gâchette se verrouille.",
    de: 'Kompaktes Blasgerät für Werkstatt und Umgebung: Ein Arm genügt, der Schalter rastet ein.',
  },
  'DRV-024': {
    specs: [['Puissance', '800 W'], ['Énergie de frappe', '2,4 J'], ['Mandrin', 'SDS-Plus'], ['Modes', '3 (perçage, percussion, burinage)']],
    specsDe: [['Leistung', '800 W'], ['Schlagenergie', '2,4 J'], ['Aufnahme', 'SDS-Plus'], ['Betriebsarten', '3 (Bohren, Hammerbohren, Meißeln)']],
    fr: 'Trois modes dont burinage seul : le perforateur sert aussi à déposer un carrelage.',
    de: 'Drei Betriebsarten inklusive Meißeln: Der Bohrhammer nimmt auch Fliesen ab.',
  },

  // ----------------------------------------------- Bosch Professional
  'DRV-025': {
    specs: [['Tension', '18 V'], ['Couple', '55 Nm'], ['Moteur', 'Sans charbon'], ['Livraison', 'Machine nue']],
    specsDe: [['Spannung', '18 V'], ['Drehmoment', '55 Nm'], ['Motor', 'Bürstenlos'], ['Lieferung', 'Solo-Gerät']],
    fr: 'La visseuse bleue de référence : compacte, 55 Nm, et compatible avec tout le parc 18 V Professional.',
    de: 'Der blaue Standard-Schrauber: kompakt, 55 Nm, kompatibel mit dem gesamten 18-V-Professional-Park.',
  },
  'DRV-026': {
    specs: [['Tension', '18 V'], ['Disque', 'Ø 125 mm'], ['Frein', 'Arrêt en 1 s'], ['Livraison', 'Machine nue']],
    specsDe: [['Spannung', '18 V'], ['Scheibe', 'Ø 125 mm'], ['Bremse', 'Stopp in 1 s'], ['Lieferung', 'Solo-Gerät']],
    fr: "Frein de disque : la meule s'arrête en une seconde au relâchement, pas en dix.",
    de: 'Scheibenbremse: Die Scheibe steht beim Loslassen in einer Sekunde, nicht in zehn.',
  },
  'DRV-027': {
    specs: [['Puissance', '1 400 W'], ['Lame', 'Ø 190 mm'], ['Profondeur à 90°', '70 mm'], ['Inclinaison', "0 à 56°"]],
    specsDe: [['Leistung', '1 400 W'], ['Sägeblatt', 'Ø 190 mm'], ['Schnitttiefe bei 90°', '70 mm'], ['Neigung', '0 bis 56°']],
    fr: '70 mm de profondeur et 1 400 W : la scie de charpente qui ne ralentit pas dans le bois vert.',
    de: '70 mm Schnitttiefe und 1 400 W: die Zimmerer-Säge, die in frischem Holz nicht einbricht.',
  },
  'DRV-028': {
    specs: [['Puissance', '880 W'], ['Énergie de frappe', '3,2 J'], ['Mandrin', 'SDS-Plus'], ['Débrayage', 'Oui']],
    specsDe: [['Leistung', '880 W'], ['Schlagenergie', '3,2 J'], ['Aufnahme', 'SDS-Plus'], ['Sicherheitskupplung', 'Ja']],
    fr: "3,2 joules avec débrayage de sécurité : si la mèche bloque, c'est elle qui cède, pas le poignet.",
    de: '3,2 Joule mit Sicherheitskupplung: Blockiert der Bohrer, gibt die Kupplung nach, nicht das Handgelenk.',
  },
  'DRV-029': {
    specs: [['Cuve', '35 L'], ['Classe', 'L'], ['Nettoyage filtre', 'AFC automatique'], ['Dépression', '254 mbar']],
    specsDe: [['Behälter', '35 L'], ['Klasse', 'L'], ['Filterreinigung', 'AFC automatisch'], ['Unterdruck', '254 mbar']],
    fr: 'Le décolmatage AFC secoue le filtre toutes les 15 secondes : la dépression ne s’effondre pas en fin de chantier.',
    de: 'Die AFC-Abreinigung rüttelt den Filter alle 15 Sekunden: Der Unterdruck bricht am Ende des Tages nicht ein.',
  },
  'DRV-030': {
    specs: [['Tension', '18 V'], ['Capacité', '8,0 Ah'], ['Technologie', 'ProCORE, cellules empilées'], ['Indicateur', 'Niveau de charge']],
    specsDe: [['Spannung', '18 V'], ['Kapazität', '8,0 Ah'], ['Technologie', 'ProCORE, gestapelte Zellen'], ['Anzeige', 'Ladezustand']],
    fr: "8 Ah en ProCORE : l'autonomie d'une batterie de 36 V sur les machines 18 V existantes.",
    de: '8 Ah als ProCORE: die Ausdauer eines 36-V-Akkus an vorhandenen 18-V-Maschinen.',
  },

  // ------------------------------------------------------------ DeWalt
  'DRV-031': {
    specs: [['Tension', '18 V'], ['Couple', '70 Nm'], ['Moteur', 'Sans charbon'], ['Livraison', 'Machine nue']],
    specsDe: [['Spannung', '18 V'], ['Drehmoment', '70 Nm'], ['Motor', 'Bürstenlos'], ['Lieferung', 'Solo-Gerät']],
    fr: '70 Nm pour 1,9 kg : le rapport couple/poids qui fait tenir une journée de pose.',
    de: '70 Nm bei 1,9 kg: das Drehmoment-Gewichts-Verhältnis für einen ganzen Montagetag.',
  },
  'DRV-032': {
    specs: [['Tension', '18 V'], ['Disque', 'Ø 125 mm'], ['Vitesse', '9 000 tr/min'], ['Livraison', 'Machine nue']],
    specsDe: [['Spannung', '18 V'], ['Scheibe', 'Ø 125 mm'], ['Drehzahl', '9 000 U/min'], ['Lieferung', 'Solo-Gerät']],
    fr: 'Meuleuse 18 V avec débrayage électronique : la machine se coupe au blocage du disque.',
    de: '18-V-Winkelschleifer mit elektronischer Abschaltung: Die Maschine stoppt, wenn die Scheibe klemmt.',
  },
  'DRV-033': {
    specs: [['Tension', '18 V'], ['Lame', 'Ø 184 mm'], ['Profondeur à 90°', '65 mm'], ['Livraison', 'Machine nue']],
    specsDe: [['Spannung', '18 V'], ['Sägeblatt', 'Ø 184 mm'], ['Schnitttiefe bei 90°', '65 mm'], ['Lieferung', 'Solo-Gerät']],
    fr: 'Lame de 184 mm sur batterie : 65 mm de profondeur sans cordon qui traîne sur le plancher.',
    de: '184-mm-Blatt am Akku: 65 mm Schnitttiefe, ohne Kabel über den Boden zu schleifen.',
  },
  'DRV-034': {
    specs: [['Tension', '18 V'], ['Course', '28,6 mm'], ['Changement de lame', 'Sans outil'], ['Livraison', 'Machine nue']],
    specsDe: [['Spannung', '18 V'], ['Hub', '28,6 mm'], ['Sägeblattwechsel', 'Werkzeuglos'], ['Lieferung', 'Solo-Gerät']],
    fr: 'Scie sabre compacte : elle passe entre deux montants là où une scie pleine taille reste dehors.',
    de: 'Kompakte Säbelsäge: Sie kommt zwischen zwei Ständer, wo eine große Säge draußen bleibt.',
  },
  'DRV-035': {
    specs: [['Cuve', '38 L'], ['Classe', 'L'], ['Nettoyage filtre', 'Automatique'], ['Prise outil', 'Démarrage synchronisé']],
    specsDe: [['Behälter', '38 L'], ['Klasse', 'L'], ['Filterreinigung', 'Automatisch'], ['Gerätesteckdose', 'Synchronstart']],
    fr: "Aspirateur de classe L avec prise synchronisée : le chantier reste propre sans y penser.",
    de: 'Sauger der Klasse L mit Synchronsteckdose: Die Baustelle bleibt sauber, ohne daran zu denken.',
  },
  'DRV-036': {
    specs: [['Tension', '18 V'], ['Capacité', '5,0 Ah'], ['Technologie', 'XR Li-Ion'], ['Indicateur', 'Niveau de charge']],
    specsDe: [['Spannung', '18 V'], ['Kapazität', '5,0 Ah'], ['Technologie', 'XR Li-Ion'], ['Anzeige', 'Ladezustand']],
    fr: 'Batterie XR 5 Ah : le format qui équilibre autonomie et poids sur les machines de la journée.',
    de: 'XR-Akku mit 5 Ah: das Format, das Ausdauer und Gewicht für den Arbeitstag ausbalanciert.',
  },

  // ------------------------------------------------------------ Metabo
  'DRV-037': {
    specs: [['Tension', '18 V'], ['Couple', '75 Nm'], ['Moteur', 'Brushless'], ['Mandrin', 'Quick, changement rapide']],
    specsDe: [['Spannung', '18 V'], ['Drehmoment', '75 Nm'], ['Motor', 'Brushless'], ['Bohrfutter', 'Quick-Wechsel']],
    fr: 'Mandrin Quick : on passe du foret au porte-embout sans outil, d’un geste.',
    de: 'Quick-Futter: Vom Bohrer zum Bithalter ohne Werkzeug, in einer Bewegung.',
  },
  'DRV-038': {
    specs: [['Tension', '18 V'], ['Disque', 'Ø 125 mm'], ['Vitesse', '9 000 tr/min'], ['Livraison', 'Machine nue']],
    specsDe: [['Spannung', '18 V'], ['Scheibe', 'Ø 125 mm'], ['Drehzahl', '9 000 U/min'], ['Lieferung', 'Solo-Gerät']],
    fr: 'Meuleuse 18 V avec protection anti-redémarrage : elle ne repart pas seule après une coupure.',
    de: '18-V-Winkelschleifer mit Wiederanlaufschutz: Er läuft nach einer Unterbrechung nicht von selbst an.',
  },
  'DRV-039': {
    specs: [['Puissance', '1 200 W'], ['Lame', 'Ø 160 mm'], ['Profondeur à 90°', '55 mm'], ['Rail', 'Compatible guidage']],
    specsDe: [['Leistung', '1 200 W'], ['Sägeblatt', 'Ø 160 mm'], ['Schnitttiefe bei 90°', '55 mm'], ['Schiene', 'Führungskompatibel']],
    fr: 'Scie circulaire compatible rail : la coupe guidée sans investir dans un système fermé.',
    de: 'Handkreissäge mit Schienenführung: geführter Schnitt, ohne sich an ein geschlossenes System zu binden.',
  },
  'DRV-040': {
    specs: [['Puissance', '880 W'], ['Énergie de frappe', '3,2 J'], ['Mandrin', 'SDS-Plus'], ['Modes', '3']],
    specsDe: [['Leistung', '880 W'], ['Schlagenergie', '3,2 J'], ['Aufnahme', 'SDS-Plus'], ['Betriebsarten', '3']],
    fr: '3,2 joules et arrêt de frappe : le même outil perce le bois et attaque le béton.',
    de: '3,2 Joule mit Schlagabschaltung: dasselbe Werkzeug bohrt Holz und geht in Beton.',
  },
  'DRV-041': {
    specs: [['Cuve', '30 L'], ['Classe', 'L'], ['Nettoyage filtre', 'Press Clean manuel'], ['Prise outil', 'Oui']],
    specsDe: [['Behälter', '30 L'], ['Klasse', 'L'], ['Filterreinigung', 'Press Clean manuell'], ['Gerätesteckdose', 'Ja']],
    fr: 'Décolmatage Press Clean : une pression du doigt et le filtre retrouve son débit, sans ouvrir la cuve.',
    de: 'Press-Clean-Abreinigung: ein Fingerdruck und der Filter hat seine Leistung zurück, ohne den Behälter zu öffnen.',
  },
  'DRV-042': {
    specs: [['Tension', '18 V'], ['Capacité', '5,5 Ah'], ['Technologie', 'LiHD'], ['Indicateur', 'Niveau de charge']],
    specsDe: [['Spannung', '18 V'], ['Kapazität', '5,5 Ah'], ['Technologie', 'LiHD'], ['Anzeige', 'Ladezustand']],
    fr: 'LiHD 5,5 Ah : plus de courant délivré, donc des machines 18 V qui tiennent la charge sous effort.',
    de: 'LiHD mit 5,5 Ah: mehr Stromabgabe, damit 18-V-Maschinen unter Last nicht einbrechen.',
  },

  // --------------------------------------------------------- Husqvarna
  'DRV-043': {
    specs: [['Cylindrée', '59,8 cm³'], ['Puissance', '3,5 kW'], ['Guide', '45 cm'], ['Poids à vide', '6,0 kg']],
    specsDe: [['Hubraum', '59,8 cm³'], ['Leistung', '3,5 kW'], ['Schiene', '45 cm'], ['Leergewicht', '6,0 kg']],
    fr: "La tronçonneuse d'abattage de Husqvarna : 3,5 kW avec AutoTune, qui se règle seul selon le carburant.",
    de: 'Die Fällsäge von Husqvarna: 3,5 kW mit AutoTune, das sich selbsttätig auf den Kraftstoff einstellt.',
  },
  'DRV-044': {
    specs: [['Alimentation', 'Batterie BLi (vendue à part)'], ['Harnais', 'Balance 35 inclus'], ['Coupe', 'Lame ou tête fil'], ['Poids', '6,2 kg']],
    specsDe: [['Versorgung', 'Akku BLi (separat)'], ['Traggurt', 'Balance 35 inbegriffen'], ['Schneidwerk', 'Messer oder Fadenkopf'], ['Gewicht', '6,2 kg']],
    fr: 'Débroussailleuse à batterie avec harnais : le silence permet de travailler près des habitations sans contrainte horaire.',
    de: 'Akku-Freischneider mit Traggurt: Die Lautstärke erlaubt Arbeiten nahe an Wohnhäusern ohne Zeitfenster.',
  },
  'DRV-045': {
    specs: [['Alimentation', 'Batterie BLi (vendue à part)'], ['Longueur de coupe', '60 cm'], ['Écartement', '26 mm'], ['Poids', '4,0 kg']],
    specsDe: [['Versorgung', 'Akku BLi (separat)'], ['Schnittlänge', '60 cm'], ['Zahnabstand', '26 mm'], ['Gewicht', '4,0 kg']],
    fr: 'Taille-haie à batterie de 60 cm : démarrage instantané, pas de vibration de moteur thermique dans les bras.',
    de: '60-cm-Akku-Heckenschere: sofortiger Start, keine Benzinmotor-Vibration in den Armen.',
  },
  'DRV-046': {
    specs: [['Alimentation', 'Batterie BLi (vendue à part)'], ['Vitesse d’air', '48 m/s'], ['Mode boost', 'Oui'], ['Poids', '3,0 kg']],
    specsDe: [['Versorgung', 'Akku BLi (separat)'], ['Luftgeschwindigkeit', '48 m/s'], ['Boost-Modus', 'Ja'], ['Gewicht', '3,0 kg']],
    fr: 'Souffleur à batterie avec mode boost : la réserve de puissance pour décoller les feuilles mouillées.',
    de: 'Akku-Blasgerät mit Boost-Modus: die Kraftreserve, um nasses Laub zu lösen.',
  },
  'DRV-047': {
    specs: [['Surface', 'Jusqu’à 600 m²'], ['Pente', 'Jusqu’à 40 %'], ['Pilotage', 'Automower Connect'], ['Largeur de coupe', '22 cm']],
    specsDe: [['Fläche', 'Bis 600 m²'], ['Steigung', 'Bis 40 %'], ['Steuerung', 'Automower Connect'], ['Schnittbreite', '22 cm']],
    fr: 'Robot tondeuse pour 600 m² et pentes à 40 % : il tond un peu chaque jour, la pelouse ne voit jamais la différence.',
    de: 'Mähroboter für 600 m² und 40 % Steigung: Er mäht täglich ein wenig, der Rasen merkt den Unterschied nie.',
  },
  'DRV-048': {
    specs: [['Moteur', 'Briggs & Stratton, 500 cm³'], ['Largeur de coupe', '97 cm'], ['Bac', '200 L'], ['Transmission', 'Hydrostatique']],
    specsDe: [['Motor', 'Briggs & Stratton, 500 cm³'], ['Schnittbreite', '97 cm'], ['Fangkorb', '200 L'], ['Getriebe', 'Hydrostatisch']],
    fr: 'Tracteur tondeuse à transmission hydrostatique : la vitesse se règle à la pédale, sans lâcher le volant.',
    de: 'Aufsitzmäher mit Hydrostat: Die Geschwindigkeit regelt das Pedal, ohne das Lenkrad loszulassen.',
  },
  // --------------------------------------- hors fichier d'identité (extras)
  'DRV-049': {
    specs: [['Cylindrée', '79,2 cm³'], ['Puissance', '5,0 kW (6,8 ch)'], ['Guide', '63 cm'], ['Poids à vide', '6,2 kg']],
    specsDe: [['Hubraum', '79,2 cm³'], ['Leistung', '5,0 kW (6,8 PS)'], ['Schiene', '63 cm'], ['Leergewicht', '6,2 kg']],
    fr: "Première tronçonneuse à injection électronique : ni starter ni valve de décompression, un coup de lanceur suffit, à froid comme en altitude. 5 kW pour 6,2 kg, soit 1,24 kg/kW.",
    de: 'Die erste Kettensäge mit elektronischer Kraftstoffeinspritzung: kein Choke, kein Dekompressionsventil, ein Zug am Starterseil genügt — kalt wie in Höhenlagen. 5 kW bei 6,2 kg, also 1,24 kg/kW.',
  },
};
