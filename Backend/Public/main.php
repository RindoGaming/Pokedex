<?php
$firebase_url = 'https://pokemondata-565f5-default-rtdb.europe-west1.firebasedatabase.app/pokemon';
$total_pokemon = 1164;
$batch_size = 100;
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
        'height'=>$var_data['height']/10 . "m",
        'weight'=>$var_data['weight']/10 . "kg",
        'image'=>$var_data['sprites']['front_default'] ?? null,
        'cry'=>$var_data['species']['url'] . "audio"
    ];
}

// === Load Cache ===
$all_pokemon = [];
if (file_exists($cache_file)) {
    $all_pokemon = json_decode(file_get_contents($cache_file), true);
    echo "Loaded " . count($all_pokemon) . " Pokémon from cache<br>";
}

// === Fetch in Batches ===
for ($start = 1; $start <= $total_pokemon; $start += $batch_size) {
    $urls = $species_urls = [];
    for ($id = $start; $id < $start + $batch_size && $id <= $total_pokemon; $id++) {
        $urls[$id] = "https://pokeapi.co/api/v2/pokemon/$id";
        $species_urls[$id] = "https://pokeapi.co/api/v2/pokemon-species/$id";
    }

    $results = fetch_json_multi($urls);
    $species_results = fetch_json_multi($species_urls);
    $batch_data = [];

    foreach ($results as $id => $data) {
        if (!$data) continue;

        $poke_name = strtolower($data['name']);
        $species_data = $species_results[$id];
        $variants = [];

        // If already cached, keep base but reload variants
if (isset($all_pokemon[$poke_name])) {
    $base_entry = $all_pokemon[$poke_name];
    echo ucfirst($poke_name) . " already cached<br>";
} else {
    // Build base Pokémon entry
    $abilities = $types = $stats = $forms = [];
    foreach ($data['abilities'] as $a)
        $abilities[$a['ability']['name']] = [
            'is_hidden'=>$a['is_hidden'],
            'slot'=>$a['slot'],
            'url'=>$a['ability']['url']
        ];
    foreach ($data['types'] as $t)
        $types[$t['type']['name']] = ['slot'=>$t['slot']];
    foreach ($data['stats'] as $s)
        $stats[$s['stat']['name']] = [
            'base_stat'=>$s['base_stat'],
            'effort'=>$s['effort'],
            'url'=>$s['stat']['url']
        ];
    foreach ($data['forms'] as $f)
        $forms[] = ['name'=>$f['name'],'url'=>$f['url']];

    $base_entry = [
        'id'=>$data['id'],
        'name'=>$data['name'],
        'types'=>$types,
        'abilities'=>$abilities,
        'stats'=>$stats,
        'base_experience'=>$data['base_experience'],
        'forms'=>$forms,
        'species'=>['name'=>$data['species']['name'],'url'=>$data['species']['url']],
        'is_default'=>$data['is_default'],
        'height'=>$data['height']/10 . "m",
        'weight'=>$data['weight']/10 . "kg",
        'image'=>$data['sprites']['front_default'] ?? null,
        'cry'=>$data['species']['url'] . "audio",
        'variants'=>[]
    ];
}

// Always refresh variants, even if cached
if ($species_data && isset($species_data['varieties'])) {
    $variant_urls = [];
    foreach ($species_data['varieties'] as $var) {
        $var_name = $var['pokemon']['name'];
        if ($var_name !== $data['name']) {
            $variant_urls[$var_name] = "https://pokeapi.co/api/v2/pokemon/$var_name";
        }
    }
    $variant_results = fetch_json_multi($variant_urls);
    foreach ($variant_results as $var_name => $var_data) {
        if ($var_data) {
            $base_entry['variants'][$var_name] = build_variant_entry($var_data);
            echo "Prepared variant: " . ucfirst($var_name) . "<br>";
        }
    }
}

// Extra forms (Megas, Gmax, etc.)
$form_urls = [];
foreach ($data['forms'] as $f) {
    $form_name = $f['name'];
    if ($form_name !== $data['name']) {
        $form_urls[$form_name] = "https://pokeapi.co/api/v2/pokemon/$form_name";
    }
}
$form_results = fetch_json_multi($form_urls);
foreach ($form_results as $form_name => $form_data) {
    if ($form_data) {
        $base_entry['variants'][$form_name] = build_variant_entry($form_data);
        echo "Prepared variant: " . ucfirst($form_name) . "<br>";
    }
}

    // Add to batch
    $batch_data[$poke_name] = $base_entry;
}

if (!empty($batch_data)) {
    $all_pokemon = array_merge($all_pokemon, $batch_data);
    file_put_contents($cache_file, json_encode($all_pokemon, JSON_PRETTY_PRINT));
    push_to_firebase($firebase_url, $batch_data);
    echo "Pushed batch of " . count($batch_data) . " Pokémon (with variants)<br>";
}

sleep(10);
} // <-- this closes for ($start = 1; ...)

echo "All Pokémon + variants (including Megas/Gmax) processed.<br>";
?>
