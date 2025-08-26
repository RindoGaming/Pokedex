# Pokedex


Front-end
| Taak | Prioriteit | tijdsinschatting |
| --- | --- | --- |
| voor elke generatie een tablad maken | hoog | 2 uur |
| voor elke generatie een pokedex maken | medium | 4 uur |
| een main/world pokedex die je kan aan cliken op de home page | medium | 4 uur |
| info over de gymes in elke generatie | laag | 4 uur |
| voor elke geberatie een gym info tab maken | laag | 2 uur |
| ... | laag | 2 uur |
| ... | hoog | 4 uur |
| ... | medium | 4 uur |
| ... | laag | 2 uur |
| ... | hoog | 8 uur |

Planning

Back-end

| Taak                              | Prioriteit | tijdsinschatting |
| --------------------------------- | ---------- | ---------------- |
| Pokémon Species Documentation     | hoog       | 8 uur            |
| Pokémon Characteristics Database  | hoog       | 6 uur            |
| PokéAPI → Firebase Connection     | hoog       | 8 uur            |
| Database Structure Definition     | hoog       | 4 uur            |
| Data Delivery Contract (API Spec) | medium     | 6 uur            |
| Data Logging & Monitoring         | medium     | 4 uur            |
| Evolution Chain Analysis          | medium     | 6 uur            |
| Pokémon Habitat Study             | medium     | 4 uur            |
| Generation and Version Tracking   | medium     | 6 uur            |
| Firebase Security Rules & Auth    | hoog       | 4 uur            |

Planning

| Task                              | Priority | Time Estimate | What I Can Do (X)                                                                  | Need                                                           | Why                                                                           |
| --------------------------------- | -------- | ------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Pokémon Species Documentation     | High     | 8 hrs         | Fetch data from PokéAPI and store it in Firebase with consistent IDs               | Complete dataset of all gen 1 - gen 3 Pokémon species                        | The frontend can directly load species info without making separate API calls |
| Pokémon Characteristics Database  | High     | 6 hrs         | Create schema for abilities, growth rates, and natures, then link them to species  | Detailed characteristics per Pokémon                           | Needed for research features and analysis                    |
| PokéAPI → Firebase Connection     | High     | 8 hrs         | Build a sync function that pushes data from PokéAPI into Firebase                  | Reliable connection between external API and internal database | Without this connection, no base data is available                            |
| Database Structure Definition     | High     | 4 hrs         | Design Firestore collections and document the schema                               | Standardized data structure                                    | The frontend can query efficiently and display data correctly                 |
| Data Delivery Contract (via Firebase Schema & Rules) | Medium   | 6 hrs         | Define Firestore collections, fields, and security rules as the “source of truth” for data access | Clear agreements between backend and frontend                  | Ensures frontend knows exactly how to query data and prevents bugs by using Firebase as live documentation                   |
| Data Logging & Monitoring         | Medium   | 4 hrs         | Set up Firebase logging and configure error reporting                              | Visibility into data flow and errors                           | Important for debugging and ensuring system stability                         |
| Evolution Chain Analysis          | Medium   | 6 hrs         | Parse evolution data from PokéAPI and store it as nested structures in Firebase    | Insight into Pokémon evolution patterns                        | Needed to visualize Pokémon development and relationships                     |
| Pokémon Habitat Study             | Medium   | 4 hrs         | Link habitats from PokéAPI to Pokémon entries in the database                      | Ecological classification of species                           | Supports analysis and filtering based on environment                          |
| Generation and Version Tracking   | Medium   | 6 hrs         | Tag Pokémon data with generation and version information                           | Historical and game-context data                               | Useful for comparing across gens and filtering content                        |
| Firebase Security Rules & Auth    | High     | 4 hrs         | Write Firestore security rules and set up Firebase Authentication                  | Data security and access control                               | Ensures only the right users can update their own data                        |

| Persoon/Tijd | Di 9:00-11:00 | Di 11:00-13:00 | Di 13:00-15:00 | Di 15:00-17:00 | Wo 9:00-11:00 | Wo 11:00-13:00 | Wo 13:00-14:00 | Wo 15:00-17:00 | Do 9:00-11:00 | Do 11:00-13:00 | Do 13:00-15:00 | Do 15:00-17:00 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Alex | Story 10 (8u, hoog) | Story 10 (8u, hoog) | Story 10 (8u, hoog) | Story 10 (8u, hoog) | Story 2 (4u, medium) | Story 2 (4u, medium) | Story 8 (4u, medium) | Story 8 (4u, medium) | Story 5 (8u, medium) | Story 5 (8u, medium) | Story 5 (8u, medium) | Story 5 (8u, medium) |
| Jay | Story 3 (4u, hoog) | Story 3 (4u, hoog) | Story 7 (4u, hoog) | Story 7 (4u, hoog) | Story 1 (8u, hoog) | Story 1 (8u, hoog) | Story 1 (8u, hoog) | Story 1 (8u, hoog) | Story 4 (2u, laag) | Story 6 (2u, laag) | Story 9 (2u, laag) |  |
| Caspar | Story 3 (4u, hoog) | Story 3 (4u, hoog) | Story 7 (4u, hoog) | Story 7 (4u, hoog) | Story 1 (8u, hoog) | Story 1 (8u, hoog) | Story 1 (8u, hoog) | Story 1 (8u, hoog) | Story 4 (2u, laag) | Story 6 (2u, laag) | Story 9 (2u, laag) |  |