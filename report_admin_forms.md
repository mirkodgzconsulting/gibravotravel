# Report: Campi del Formulario - Sistema Interno (Admin)

Di seguito è riportato l'elenco dei campi attualmente presenti nel sistema amministrativo per la creazione e la modifica di "Tour Aereo" e "Tour Bus".

## ✈️ Tour Aereo (Campi Attivi)

| Campo (Etichetta) | Nome Variabile | Tipo | Obbligatorio | Note |
| :--- | :--- | :--- | :--- | :--- |
| **Titolo del Tour** | `titulo` | Testo | Sì | |
| **Data di Partenza** | `fechaViaje` | Data | No | |
| **Data di Fine** | `fechaFin` | Data | No | |
| **Prezzo Adulto (€)** | `precioAdulto` | Numero (Decimal) | Sì | |
| **Prezzo Bambino (€)** | `precioNino` | Numero (Decimal) | No | |
| **Obiettivo (numero)** | `meta` | Numero | No | Numero target di partecipanti |
| **Coordinatore (ACC)** | `acc` | Testo | No | Nome/Riferimento coordinatore |
| **Guida Locale (€)** | `guidaLocale` | Numero (Decimal) | No | Costo |
| **Coordinatore (€)** | `coordinatore` | Numero (Decimal) | No | Costo |
| **Transfer (€)** | `transporte` | Numero (Decimal) | No | Costo |
| **Hotel (€)** | `hotel` | Numero (Decimal) | No | Costo |
| **Note del Tour** | `notas` | Testo (Area) | No | Note interne |
| **Note del Coordinatore** | `notasCoordinador` | Testo (Area) | No | Note specifiche per coord. |
| **Immagine di copertina** | `coverImage` | File (Immagine) | No | |
| **File PDF** | `pdfFile` | File (.pdf) | No | Programma del viaggio |
| **Descrizione** | `descripcion` | Testo (Area) | No | Descrizione estesa |


## 🚌 Tour Bus (Campi Attivi)

| Campo (Etichetta) | Nome Variabile | Tipo | Obbligatorio | Note |
| :--- | :--- | :--- | :--- | :--- |
| **Titolo del Tour** | `titulo` | Testo | Sì | |
| **Prezzo Adulto (€)** | `precioAdulto` | Numero (Decimal) | Sì | |
| **Prezzo Bambino (€)** | `precioNino` | Numero (Decimal) | Sì | |
| **Data di Viaggio** | `fechaViaje` | Data | No | |
| **Data di Fine** | `fechaFin` | Data | No | Nota: "Default 53 posti" |
| **ACC** | `acc` | Testo | No | Valore ACC |
| **AUTOSERVICIO** | `autoservicio` | Testo | No | Descrizione servizio |
| **BUS** | `bus` | Numero (Decimal) | No | Costo |
| **PASTI** | `pasti` | Numero (Decimal) | No | Costo |
| **PARKING** | `parking` | Numero (Decimal) | No | Costo |
| **COORDINATORE 1** | `coordinatore1` | Numero (Decimal) | No | Costo |
| **COORDINATORE 2** | `coordinatore2` | Numero (Decimal) | No | Costo |
| **ZTL** | `ztl` | Numero (Decimal) | No | Costo |
| **HOTEL** | `hotel` | Numero (Decimal) | No | Costo |
| **POLIZZA** | `polizza` | Numero (Decimal) | No | Costo |
| **TKT** | `tkt` | Numero (Decimal) | No | Costo |
| **Immagine di Copertina** | `coverImage` | File (Immagine) | No | |
| **File PDF/Documento** | `pdfFile` | File (.pdf, .doc) | No | |
| **Descrizione** | `descripcion` | Testo (Area) | No | |

---
**Generato il:** 14 Gennaio 2026
**Sistema:** GiBravo Travel Admin Panel
