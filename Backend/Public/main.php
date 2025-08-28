<?php
$firebase_url = 'https://pokemondata-565f5-default-rtdb.europe-west1.firebasedatabase.app/pokemon';
$batch_size = 50;
$total_pokemon = 1164;
$cache_file = __DIR__ . '/pokemon_cache.json';

// === Firebase GET ===
function get_from_firebase($url, $key) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url . '/' . strtolower($key) . '.json');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    return $response ? json_decode($response, true) : null;
}

// === Firebase PUSH ===
function push_to_firebase($url, $batch) {
    if (empty($batch)) return;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url . '.json');
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($batch));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $resp = curl_exec($ch);
    curl_close($ch);
    return $resp;
}

// === Multi-cURL fetch ===
function fetch_json_multi($urls) {
    $multi_handle = curl_multi_init();
    $handles = $results = [];
    foreach ($urls as $key => $url) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FAILONERROR, true);
        curl_multi_add_handle($multi_handle, $ch);
        $handles[$key] = $ch;
    }
    $running = null;
    do { curl_multi_exec($multi_handle, $running); curl_multi_select($multi_handle); } while ($running > 0);
    foreach ($handles as $key => $ch) {
        $content = curl_multi_getcontent($ch);
        $results[$key] = $content ? json_decode($content, true) : null;
        curl_multi_remove_handle($multi_handle, $ch);
        curl_close($ch);
    }
    curl_multi_close($multi_handle);
    return $results;
}

// === Variant Builder ===
function build_variant_entry($var_data) {
    $abilities_v = $types_v = $stats_v = $forms_v = [];

    foreach ($var_data['abilities'] as $a)
        $abilities_v[$a['ability']['name']] = [
            'is_hidden'=>$a['is_hidden'],
            'slot'=>$a['slot'],
            'url'=>$a['ability']['url']
        ];

    foreach ($var_data['types'] as $t)
        $types_v[$t['type']['name']] = ['slot'=>$t['slot']];

    foreach ($var_data['stats'] as $s)
        $stats_v[$s['stat']['name']] = [
            'base_stat'=>$s['base_stat'],
            'effort'=>$s['effort'],
            'url'=>$s['stat']['url']
        ];

    foreach ($var_data['forms'] as $f)
        $forms_v[] = ['name'=>$f['name'],'url'=>$f['url']];

    return [
        'id'=>$var_data['id'],
        'name'=>$var_data['name'],
        'types'=>$types_v,
        'abilities'=>$abilities_v,
        'stats'=>$stats_v,
        'base_experience'=>$var_data['base_experience'],
        'forms'=>$forms_v,
        'species'=>['name'=>$var_data['species']['name'],'url'=>$var_data['species']['url']],
        'is_default'=>false,
        'height'=>$var_data['height']/10 . " m",
        'weight'=>$var_data['weight']/10 . " kg",
        'image'=>$var_data['sprites']['front_default'] ?? null,
        'cries'=>$var_data['species']['url'] . "audio"
    ];
}

// === Load Cache ===
$all_pokemon = [];
if (file_exists($cache_file)) {
    $all_pokemon = json_decode(file_get_contents($cache_file), true);
} else {
    $all_pokemon = [];

    for ($start = 1; $start <= $total_pokemon; $start += $batch_size) {
        $multi_handle = curl_multi_init();
        $curl_handles = [];

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
                    $name = $ability['ability']['name'];
                    $abilities_structured[$name] = [
                        'is_hidden' => $ability['is_hidden'],
                        'slot' => $ability['slot'],
                        'url' => $ability['ability']['url']
                    ];
                }

                $types_structured = [];
                foreach ($pokeapi_data['types'] as $type) {
                    $name = $type['type']['name'];
                    $types_structured[$name] = ['slot' => $type['slot']];
                }

                $stats_structured = [];
                foreach ($pokeapi_data['stats'] as $stat) {
                    $name = $stat['stat']['name'];
                    $stats_structured[$name] = [
                        'base_stat' => $stat['base_stat'],
                        'effort' => $stat['effort'],
                        'url' => $stat['stat']['url']
                    ];
                }

                $forms_structured = [];
                foreach ($pokeapi_data['forms'] as $form) {
                    $forms_structured[] = [
                        'name' => $form['name'],
                        'url' => $form['url']
                    ];
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

    file_put_contents($cache_file, json_encode($all_pokemon, JSON_PRETTY_PRINT));
}

// Update Firebase
$ch_firebase = curl_init();
curl_setopt($ch_firebase, CURLOPT_URL, $firebase_url . '.json');
curl_setopt($ch_firebase, CURLOPT_CUSTOMREQUEST, "PATCH");
curl_setopt($ch_firebase, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch_firebase, CURLOPT_POSTFIELDS, json_encode($all_pokemon));
curl_setopt($ch_firebase, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch_firebase);
curl_close($ch_firebase);

// Serve individual Pokémon if requested
header('Content-Type: application/json');
$id = $_GET['id'] ?? null;

if ($id) {
    $pokemon = null;
    foreach ($all_pokemon as $key => $data) {
        if ((string)$data['id'] === (string)$id || strtolower($data['name']) === strtolower($id)) {
            $pokemon = $data;
            break;
        }
    }

    if ($pokemon) {
        echo json_encode($pokemon);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Pokémon not found']);
    }
} else {
    echo json_encode(['message' => 'Cache loaded', 'total' => count($all_pokemon)]);
}
?>