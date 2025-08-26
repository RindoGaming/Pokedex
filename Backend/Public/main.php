<?php
$firebase_url = 'https://pokemondata-565f5-default-rtdb.europe-west1.firebasedatabase.app/pokemon';
<<<<<<< HEAD
$batch_size = 10; 
$total_pokemon = 386; 
$cache_file = __DIR__ . '/pokemon_cache.json'; // <-- local cache JSON file
=======
$batch_size = 10; // Number of Pokémon per batch
$total_pokemon = 368; // Limit to Gen 3
>>>>>>> 34dfe80774eb169843b3e8b871593ca924b1c959

// Check if cache exists
if (file_exists($cache_file)) {
    $all_pokemon = json_decode(file_get_contents($cache_file), true);
    echo "Loaded data from cache: " . count($all_pokemon) . " Pokémon<br>";
} else {
    $all_pokemon = [];
    for ($start = 1; $start <= $total_pokemon; $start += $batch_size) {
        $multi_handle = curl_multi_init();
        $curl_handles = [];

<<<<<<< HEAD
        for ($i = 0; $i < $batch_size && ($start + $i) <= $total_pokemon; $i++) {
            $id = $start + $i;
            $pokeapi_url = "https://pokeapi.co/api/v2/pokemon/$id";
            $ch = curl_init($pokeapi_url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_multi_add_handle($multi_handle, $ch);
            $curl_handles[$id] = $ch;
=======
    for ($i = 0; $i < $batch_size && ($start + $i) <= $total_pokemon; $i++) {
        $id = $start + $i;
        $pokeapi_url = "https://pokeapi.co/api/v2/pokemon/$id";
        $ch = curl_init($pokeapi_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_multi_add_handle($multi_handle, $ch);
        $curl_handles[$id] = $ch;
    }

    $running = null;
    do {
        curl_multi_exec($multi_handle, $running);
        curl_multi_select($multi_handle);
    } while ($running > 0);

    $batch_data = [];
    foreach ($curl_handles as $id => $ch) {
        $pokeapi_response = curl_multi_getcontent($ch);
        $pokeapi_data = json_decode($pokeapi_response, true);

        if ($pokeapi_data) {
            $abilities_structured = [];
            foreach ($pokeapi_data['abilities'] as $ability) {
                $ability_name = $ability['ability']['name'];
                $abilities_structured[$ability_name] = [
                    'is_hidden' => $ability['is_hidden'],
                    'slot' => $ability['slot']
                ];
            }

            $types_structured = [];
            foreach ($pokeapi_data['types'] as $type) {
                $type_name = $type['type']['name'];
                $types_structured[$type_name] = [
                    'slot' => $type['slot']
                ];
            }

            $image_url = $pokeapi_data['sprites']['front_default'] ?? null;

            $filtered_data = [
                'id' => $pokeapi_data['id'],
                'name' => $pokeapi_data['name'],
                'types' => $types_structured,
                'abilities' => $abilities_structured,
                'height' => $pokeapi_data['height'] / 10 . "m",
                'weight' => $pokeapi_data['weight'] / 10 . "kg",
                'image' => $image_url
            ];

            $batch_data[$pokeapi_data['id']] = $filtered_data;
>>>>>>> 34dfe80774eb169843b3e8b871593ca924b1c959
        }

        $running = null;
        do {
            curl_multi_exec($multi_handle, $running);
            curl_multi_select($multi_handle);
        } while ($running > 0);

        $batch_data = [];
        foreach ($curl_handles as $id => $ch) {
            $pokeapi_response = curl_multi_getcontent($ch);
            $pokeapi_data = json_decode($pokeapi_response, true);

            if ($pokeapi_data) {
                $abilities_structured = [];
                foreach ($pokeapi_data['abilities'] as $ability) {
                    $ability_name = $ability['ability']['name'];
                    $abilities_structured[$ability_name] = [
                        'is_hidden' => $ability['is_hidden'],
                        'slot' => $ability['slot'],
                        'url' => $ability['ability']['url']
                    ];
                }

                $types_structured = [];
                foreach ($pokeapi_data['types'] as $type) {
                    $type_name = $type['type']['name'];
                    $types_structured[$type_name] = ['slot' => $type['slot']];
                }

                $stats_structured = [];
                foreach ($pokeapi_data['stats'] as $stat) {
                    $stat_name = $stat['stat']['name'];
                    $stats_structured[$stat_name] = [
                        'base_stat' => $stat['base_stat'],
                        'effort' => $stat['effort'],
                        'url' => $stat['stat']['url']
                    ];
                }

                $forms_structured = [];
                foreach ($pokeapi_data['forms'] as $form) {
                    $forms_structured[] = ['name' => $form['name'], 'url' => $form['url']];
                }

                $species_data = [
                    'name' => $pokeapi_data['species']['name'],
                    'url' => $pokeapi_data['species']['url']
                ];

                $image_url = $pokeapi_data['sprites']['front_default'] ?? null;
                $cry_url = "https://play.pokemonshowdown.com/audio/cries/" . strtolower($pokeapi_data['name']) . ".mp3";

                $filtered_data = [
                    'id' => $pokeapi_data['id'],
                    'name' => $pokeapi_data['name'],
                    'types' => $types_structured,
                    'abilities' => $abilities_structured,
                    'stats' => $stats_structured,
                    'base_experience' => $pokeapi_data['base_experience'],
                    'forms' => $forms_structured,
                    'species' => $species_data,
                    'is_default' => $pokeapi_data['is_default'],
                    'location_area_encounters' => $pokeapi_data['location_area_encounters'],
                    'game_indices' => $pokeapi_data['game_indices'],
                    'held_items' => $pokeapi_data['held_items'],
                    'height' => $pokeapi_data['height'] / 10 . "m",
                    'weight' => $pokeapi_data['weight'] / 10 . "kg",
                    'image' => $image_url,
                    'cry' => $cry_url
                ];

                $key = strtolower($pokeapi_data['name']);
                $batch_data[$key] = $filtered_data;
            }

            curl_multi_remove_handle($multi_handle, $ch);
            curl_close($ch);
        }

        $all_pokemon = array_merge($all_pokemon, $batch_data);

        curl_multi_close($multi_handle);
    }

<<<<<<< HEAD
    // Save all fetched data to cache JSON
    file_put_contents($cache_file, json_encode($all_pokemon, JSON_PRETTY_PRINT));
    echo "Saved data to cache: " . count($all_pokemon) . " Pokémon<br>";
=======
    $ids = array_keys($batch_data);

    if (!empty($batch_data)) {
        $ch_firebase = curl_init();
        curl_setopt($ch_firebase, CURLOPT_URL, $firebase_url . '.json');
        curl_setopt($ch_firebase, CURLOPT_CUSTOMREQUEST, "PATCH");
        curl_setopt($ch_firebase, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch_firebase, CURLOPT_POSTFIELDS, json_encode($batch_data));
        curl_setopt($ch_firebase, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        $response = curl_exec($ch_firebase);

        if ($response === false) {
            echo 'Curl error: ' . curl_error($ch_firebase);
        } else {
            echo "Batch added: IDs " . min($ids) . " - " . max($ids) . "<br>";
        }

        curl_close($ch_firebase);
    }

    curl_multi_close($multi_handle);
>>>>>>> 34dfe80774eb169843b3e8b871593ca924b1c959
}

$ch_firebase = curl_init();
curl_setopt($ch_firebase, CURLOPT_URL, $firebase_url . '.json');
curl_setopt($ch_firebase, CURLOPT_CUSTOMREQUEST, "PATCH");
curl_setopt($ch_firebase, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_firebase, CURLOPT_POSTFIELDS, json_encode($all_pokemon));
curl_setopt($ch_firebase, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch_firebase);

if ($response === false) {
    echo 'Curl error: ' . curl_error($ch_firebase);
} else {
    echo "Firebase updated with cached data.<br>";
}
curl_close($ch_firebase);
?>