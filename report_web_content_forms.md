# Report: Campi del Formulario Web (WebContentModal)

Di seguito è riportato l'elenco dei campi presenti nel modulo "Gestione Contenuti Web", utilizzato per configurare le informazioni pubbliche dei tour sul sito web.

## 🌐 1. Generale (Tab: Generale)
| Campo (Etichetta) | Nome Variabile | Tipo | Note |
| :--- | :--- | :--- | :--- |
| **Titolo del Tour** | `titulo` | Testo | Titolo principale visibile sul sito. |
| **Data Viaggio** | `fechaViaje` | Data | Data di inizio del tour. |
| **Data Fine** | `fechaFin` | Data | Data di fine del tour. |
| **Prezzo Adulto (€)** | `precioAdulto` | Numero | Prezzo base per adulti. |
| **Prezzo Bambino (€)** | `precioNino` | Numero | Prezzo ridotto per bambini. |
| **Slug URL** | `slug` | Testo | Indirizzo web unico (es: `gibravo.it/tour/mio-tour-fantastico`). |
| **Sottotitolo (Marketing)** | `subtitulo` | Testo | Frase breve e accattivante (es: "Un'avventura indimenticabile!"). |
| **Stato** | `isPublic` | Toggle | Determina se il tour è visibile online (PUBBLICO) o nascosto (BOZZA). |

## 📄 2. Dettagli (Tab: Dettagli)
| Campo (Etichetta) | Nome Variabile | Tipo | Note |
| :--- | :--- | :--- | :--- |
| **Durata (Testo)** | `duracionTexto` | Testo | Durata descrittiva (es: "5 Giorni / 4 Notti"). |
| **Documentazione Richiesta** | `requisitosDocumentacion` | Lista | Elenco dei documenti necessari (es: "Passaporto", "Visto"). |

## 🗺️ 3. Contenuto (Tab: Contenuto)
| Campo (Etichetta) | Nome Variabile | Tipo | Note |
| :--- | :--- | :--- | :--- |
| **Info Generali (Introduzione)** | `infoGeneral` | Testo Ricco | Descrizione generale e riepilogo del viaggio. |
| **Itinerario Giorno per Giorno** | `itinerario` | Lista (Oggetti) | Struttura per definire il programma giornaliero. |
| - *Titolo del Giorno* | `choice.title` | Testo | Titolo della giornata (es: "Giorno 1: Arrivo"). |
| - *Descrizione* | `choice.description` | Testo Ricco | Dettagli delle attività della giornata. |
| **Mappa Embed (SRC Iframe)** | `mapaEmbed` | Testo (Link) | Link `src` di un iframe di Google Maps per mostrare il percorso. |

## 🖼️ 4. Media (Tab: Media)
| Campo (Etichetta) | Nome Variabile | Tipo | Note |
| :--- | :--- | :--- | :--- |
| **Foto di Copertina WEB** | `webCoverImage` | File | Immagine principale ad alta risoluzione per la pagina web (1920x1080px). |
| **Galleria Immagini** | `galeria` | File (Multiplo) | Collezione di immagini aggiuntive per lo slider/galleria del tour. |

## ✅ 5. Liste (Tab: Liste)
| Campo (Etichetta) | Nome Variabile | Tipo | Note |
| :--- | :--- | :--- | :--- |
| **Include** | `incluye` | Lista | Servizi inclusi nel prezzo (es: "Volo", "Pranzi"). |
| **Non Include** | `noIncluye` | Lista | Servizi esclusi (es: "Mance", "Escursioni extra"). |
| **Perché viaggiare con noi** | `etiquetas` | Lista | Punti di forza (es: "Piccoli gruppi", "Guida esperta"). |

## 👤 6. Coordinatore (Tab: Coordinatore)
| Campo (Etichetta) | Nome Variabile | Tipo | Note |
| :--- | :--- | :--- | :--- |
| **Nome Coordinatore** | `coordinadorNombre` | Testo | Nome della persona che accompagnerà il gruppo. |
| **Foto Coordinatore** | `coordinadorFoto` | File | Foto profilo del coordinatore. |
| **Descrizione Breve** | `coordinadorDescripcion` | Testo Lungo | Breve biografia o presentazione del coordinatore. |

## ❓ 7. FAQ (Tab: FAQ)
| Campo (Etichetta) | Nome Variabile | Tipo | Note |
| :--- | :--- | :--- | :--- |
| **Domande Frequenti** | `faq` | Lista (Oggetti) | Elenco di domande e risposte frequenti. |
| - *Domanda* | `question` | Testo | Il testo della domanda. |
| - *Risposta* | `answer` | Testo Lungo | Il testo della risposta. |

---
**Generato il:** 14 Gennaio 2026
**Componente:** `src/components/tour/WebContentModal.tsx`
